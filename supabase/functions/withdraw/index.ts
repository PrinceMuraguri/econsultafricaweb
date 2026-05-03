const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FALLBACK_RATES: Record<string, number> = { KES: 129, NGN: 1600, UGX: 3700, TZS: 2700, ZAR: 18, GHS: 15, RWF: 1350 };

async function getUsdRate(currency: string): Promise<number> {
  const cur = currency.toUpperCase();
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.[cur];
      if (rate && rate > 0) return rate;
    }
  } catch (e) {
    console.log('FX fallback:', (e as Error).message);
  }
  return FALLBACK_RATES[cur] || 129;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();

    // Verify JWT — extract user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, phone_number, method = 'mobile_money', bank_code, account_number, account_name, currency = 'KES' } = await req.json();

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 1) {
      return new Response(JSON.stringify({ error: 'Minimum withdrawal is $1.00' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate method-specific fields
    if (method === 'mobile_money') {
      if (!phone_number || typeof phone_number !== 'string' || phone_number.length < 9) {
        return new Response(JSON.stringify({ error: 'Valid phone number is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (method === 'bank') {
      if (!bank_code || !account_number || !account_name) {
        return new Response(JSON.stringify({ error: 'Bank code, account number and account name are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid withdrawal method' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const proMode = await getProMode(supabase);

    if (proMode === "demo") {
      return new Response(JSON.stringify({
        error: "Withdrawals are disabled in demo mode. Arena Coins have no cash value.",
        demo: true,
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_usd')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!wallet || Number(wallet.balance_usd) < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reference = 'withdraw_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const methodLabel = method === 'bank' ? 'Bank Transfer' : 'Mobile Money';

    // Deduct from wallet immediately
    await supabase.from('wallets').update({
      balance_usd: Number(wallet.balance_usd) - amount,
      updated_at: new Date().toISOString(),
    }).eq('id', wallet.id);

    // Log wallet transaction (negative amount)
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal via ${methodLabel} (${reference})`,
      reference,
      status: 'pending',
    });

    // Convert USD to target currency
    const fxRate = await getUsdRate(currency);
    const amountLocal = amount * fxRate;
    const amountInCents = Math.round(amountLocal * 100);
    console.log(`Withdrawal: $${amount} USD → ${currency} ${amountLocal.toFixed(2)} (rate: ${fxRate}), method: ${method}`);

    // Build recipient payload based on method
    let recipientPayload: Record<string, string>;

    if (method === 'mobile_money') {
      // Format phone for Paystack mobile money
      let phone = phone_number.replace(/\s+/g, '').replace(/^\+/, '');
      if (phone.startsWith('254')) phone = '0' + phone.slice(3);
      console.log('Formatted phone:', phone);

      // Discover mobile money bank code
      let mmBankCode = 'MPESA';
      try {
        const bankRes = await fetch(`https://api.paystack.co/bank?currency=${currency}&type=mobile_money`, {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        });
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.data?.length) mmBankCode = bankData.data[0].code;
          console.log('Mobile money bank code:', mmBankCode);
        }
      } catch (e) {
        console.log('Bank discovery fallback:', (e as Error).message);
      }

      recipientPayload = {
        type: 'mobile_money',
        name: user.email!,
        account_number: phone,
        bank_code: mmBankCode,
        currency,
      };
    } else {
      // Bank transfer
      recipientPayload = {
        type: 'nuban',
        name: account_name,
        account_number,
        bank_code,
        currency,
      };
    }

    // Create Paystack transfer recipient
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipientPayload),
    });
    const recipientData = await recipientRes.json();
    console.log('Recipient response:', JSON.stringify(recipientData));

    if (!recipientData.status || !recipientData.data?.recipient_code) {
      // Refund wallet
      await supabase.from('wallets').update({
        balance_usd: Number(wallet.balance_usd),
        updated_at: new Date().toISOString(),
      }).eq('id', wallet.id);
      await supabase.from('wallet_transactions').update({ status: 'failed' }).eq('reference', reference);

      return new Response(JSON.stringify({
        error: 'Could not create transfer recipient',
        detail: recipientData.message || 'Unknown error',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Initiate transfer
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountInCents,
        recipient: recipientData.data.recipient_code,
        reason: `Wallet withdrawal via ${methodLabel} (${reference})`,
        reference,
        currency,
      }),
    });
    const transferData = await transferRes.json();
    console.log('Transfer response:', JSON.stringify(transferData));

    if (!transferData.status) {
      // Refund wallet
      await supabase.from('wallets').update({
        balance_usd: Number(wallet.balance_usd),
        updated_at: new Date().toISOString(),
      }).eq('id', wallet.id);
      await supabase.from('wallet_transactions').update({ status: 'failed' }).eq('reference', reference);

      return new Response(JSON.stringify({
        error: 'Transfer initiation failed',
        detail: transferData.message || 'Unknown error',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update wallet transaction to processing
    await supabase.from('wallet_transactions').update({
      status: 'processing',
      description: `Withdrawal via ${methodLabel} (${reference}) — ${currency} ${amountLocal.toFixed(0)} @ ${fxRate}`,
      exchange_rate: fxRate,
    }).eq('reference', reference);

    console.log(`Withdrawal initiated: ${user.id} → ${currency} ${amountLocal.toFixed(2)}, method: ${method}, ref: ${reference}`);

    return new Response(JSON.stringify({
      success: true,
      reference,
      amount_usd: amount,
      amount_local: amountLocal,
      currency,
      exchange_rate: fxRate,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Withdrawal error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Withdrawal processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
