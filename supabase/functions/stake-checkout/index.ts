const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Fallback USD/KES rate — updated periodically
const FALLBACK_USD_KES_RATE = 129;

async function getUsdToKesRate(): Promise<number> {
  try {
    // Try to fetch a live rate (free API)
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.KES;
      if (rate && rate > 50 && rate < 300) {
        console.log('Live USD/KES rate:', rate);
        return rate;
      }
    }
  } catch (e) {
    console.log('Could not fetch live FX rate, using fallback:', e.message);
  }
  console.log('Using fallback USD/KES rate:', FALLBACK_USD_KES_RATE);
  return FALLBACK_USD_KES_RATE;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, amount, poll_id, option_id, voter_fingerprint, phone, callback_url } = await req.json();

    if (!email || !amount || !poll_id || !option_id || !voter_fingerprint) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount < 0.01) {
      return new Response(JSON.stringify({ error: 'Minimum stake is $0.01' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Payment configuration error. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already voted on this poll
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('voter_fingerprint', voter_fingerprint)
      .maybeSingle();

    if (existingVote) {
      return new Response(JSON.stringify({ error: 'You have already voted on this poll' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert USD amount to KES
    const usdToKesRate = await getUsdToKesRate();
    const amountKes = Math.round(amount * usdToKesRate * 100) / 100;
    const amountInKobo = Math.round(amountKes * 100); // Paystack uses lowest denomination

    console.log(`Amount: $${amount} USD → KES ${amountKes} (rate: ${usdToKesRate}), kobo: ${amountInKobo}`);

    // Calculate platform fee (3.5%) in USD for metadata
    const platformFee = Math.round(amount * 0.035 * 100) / 100;
    const netStake = Math.round((amount - platformFee) * 100) / 100;
    const totalVotes = await getTotalVotes(supabase, poll_id);
    const optionVotes = await getOptionVotes(supabase, option_id);
    const impliedProbability = totalVotes > 0 ? optionVotes / totalVotes : 0.5;

    const reference = `stake_${poll_id.slice(0, 8)}_${Date.now()}`;
    const useMpesa = !!phone;

    // Create pending transaction — store original USD amount
    const { error: txError } = await supabase.from('transactions').insert({
      voter_fingerprint,
      poll_id,
      option_id,
      amount, // Store in USD
      currency: 'USD',
      channel: useMpesa ? 'mpesa' : 'paystack',
      status: 'pending',
      reference,
    });

    if (txError) {
      console.error('Transaction insert error:', txError);
      return new Response(JSON.stringify({ error: 'Could not create transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = {
      type: 'forecast_stake',
      poll_id,
      option_id,
      voter_fingerprint,
      amount_usd: amount,
      amount_kes: amountKes,
      fx_rate: usdToKesRate,
      platform_fee: platformFee,
      net_stake: netStake,
      implied_probability: impliedProbability,
    };

    if (useMpesa) {
      // M-PESA STK Push via Paystack Charge API
      let formattedPhone = phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.slice(1);
      }
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;
      console.log('Formatted phone for M-PESA:', formattedPhone);

      const chargeResponse = await fetch('https://api.paystack.co/charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: 'KES',
          reference,
          mobile_money: {
            phone: formattedPhone,
            provider: 'mpesa',
          },
          metadata,
        }),
      });

      const chargeData = await chargeResponse.json();
      console.log('Paystack M-PESA charge response:', JSON.stringify(chargeData));

      if (!chargeData.status) {
        const errorMsg = chargeData.message || 'M-PESA charge failed';
        const hint = chargeData.data?.message || chargeData.meta?.nextStep || '';
        return new Response(JSON.stringify({ error: `${errorMsg}${hint ? ': ' + hint : ''}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        payment_method: 'mpesa',
        status: chargeData.data.status,
        reference: chargeData.data.reference,
        display_text: chargeData.data.display_text || `Check your phone for the M-PESA prompt (KES ${amountKes.toFixed(0)})`,
        amount_kes: amountKes,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Standard Paystack redirect checkout
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: 'KES',
          reference,
          callback_url: callback_url || undefined,
          metadata,
        }),
      });

      const data = await response.json();

      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message || 'Failed to initialize payment' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        payment_method: 'card',
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        amount_kes: amountKes,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Stake checkout error:', error.message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getTotalVotes(supabase: any, pollId: string): Promise<number> {
  const { data } = await supabase
    .from('poll_options')
    .select('total_votes_count')
    .eq('poll_id', pollId);
  return data?.reduce((s: number, o: any) => s + o.total_votes_count, 0) || 0;
}

async function getOptionVotes(supabase: any, optionId: string): Promise<number> {
  const { data } = await supabase
    .from('poll_options')
    .select('total_votes_count')
    .eq('id', optionId)
    .single();
  return data?.total_votes_count || 0;
}
