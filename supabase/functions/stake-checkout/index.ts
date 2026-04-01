const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FALLBACK_USD_KES_RATE = 129;

async function getUsdToKesRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.KES;
      if (rate && rate > 50 && rate < 300) return rate;
    }
  } catch (e) {
    console.log('FX fallback:', e.message);
  }
  return FALLBACK_USD_KES_RATE;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, amount, poll_id, option_id, voter_fingerprint, phone, callback_url, user_id } = await req.json();

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
      console.error('No Paystack key found. Available env keys:', Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes('pay')));
      return new Response(JSON.stringify({ error: 'Payment configuration error. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert USD to KES
    const usdToKesRate = await getUsdToKesRate();
    const amountKes = Math.round(amount * usdToKesRate * 100) / 100;
    const amountInKobo = Math.round(amountKes * 100);

    console.log(`Stake: $${amount} USD → KES ${amountKes} (rate: ${usdToKesRate}), kobo: ${amountInKobo}`);

    const platformFee = Math.round(amount * 0.035 * 100) / 100;
    const reference = `stake_${poll_id.slice(0, 8)}_${Date.now()}`;

    // Create pending transaction
    const { error: txError } = await supabase.from('transactions').insert({
      voter_fingerprint,
      poll_id,
      option_id,
      amount,
      currency: 'USD',
      channel: 'paystack',
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
      user_id: user_id || null,
      amount_usd: amount,
      amount_kes: amountKes,
      fx_rate: usdToKesRate,
      platform_fee: platformFee,
    };

    // Initialize Paystack — allow all channels (Card, M-PESA, Airtel Money, etc.)
    const initBody: Record<string, unknown> = {
      email,
      amount: amountInKobo,
      currency: 'KES',
      reference,
      callback_url: callback_url || undefined,
      channels: ['card', 'mobile_money'],
      metadata,
    };

    console.log('Paystack init body:', JSON.stringify(initBody));

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initBody),
    });

    const data = await response.json();
    console.log('Paystack response:', response.status, JSON.stringify(data));

    if (!data.status) {
      return new Response(JSON.stringify({ error: data.message || 'Failed to initialize payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      amount_kes: amountKes,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Stake checkout error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
