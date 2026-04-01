const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FALLBACK_RATES: Record<string, number> = { KES: 129, NGN: 1600, UGX: 3700, TZS: 2700, ZAR: 18, GHS: 15, RWF: 1350 };

async function getUsdToLocalRate(currency: string): Promise<number> {
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
    const { email, amount, callback_url, metadata, currency: reqCurrency } = await req.json();

    if (!email && !metadata?.type) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const customerEmail = email || 'customer@placeholder.com';

    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      console.error('Paystack secret key is not configured');
      return new Response(JSON.stringify({ error: 'Payment configuration error. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // amount is in USD (e.g. 495 for $495, or 5 for $5 wallet deposit)
    const amountUsd = amount || 495;
    
    // Determine local currency — default KES, frontend can pass currency
    const localCurrency = (reqCurrency || 'KES').toUpperCase();
    
    // Convert USD to local currency for Paystack
    const fxRate = await getUsdToLocalRate(localCurrency);
    const amountLocal = Math.round(amountUsd * fxRate * 100) / 100;
    const chargeAmount = Math.round(amountLocal * 100); // kobo/pesewas/cents for Paystack
    
    console.log(`Checkout: $${amountUsd} USD → ${localCurrency} ${amountLocal} (rate: ${fxRate}), subunits: ${chargeAmount}`);
    
    const baseMetadata = metadata || {
      product: 'Kenya 2026 Economic Outlook',
      type: 'report_purchase',
    };
    const chargeMetadata = {
      ...baseMetadata,
      amount_usd: amountUsd,
      exchange_rate: fxRate,
      charge_currency: localCurrency,
      ...(email ? { customer_email: email } : {}),
    };

    console.log('Initializing Paystack transaction for:', customerEmail, 'amount:', chargeAmount, 'currency:', localCurrency);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: chargeAmount,
        currency: localCurrency,
        callback_url: callback_url || undefined,
        channels: ['card', 'mobile_money'],
        metadata: chargeMetadata,
      }),
    });

    const data = await response.json();
    console.log('Paystack response status:', response.status, 'success:', data.status);

    if (!data.status) {
      console.error('Paystack error:', data.message);
      return new Response(JSON.stringify({ error: data.message || 'Failed to initialize payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ authorization_url: data.data.authorization_url, reference: data.data.reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
