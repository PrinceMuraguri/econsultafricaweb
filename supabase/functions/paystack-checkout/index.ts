const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const { email, amount, callback_url, metadata } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    
    // Convert USD to KES for Paystack
    const usdToKesRate = await getUsdToKesRate();
    const amountKes = Math.round(amountUsd * usdToKesRate * 100) / 100;
    const chargeAmount = Math.round(amountKes * 100); // kobo/cents for Paystack
    
    console.log(`Checkout: $${amountUsd} USD → KES ${amountKes} (rate: ${usdToKesRate}), kobo: ${chargeAmount}`);
    
    const chargeMetadata = metadata || {
      product: 'Kenya 2026 Economic Outlook',
      type: 'report_purchase',
    };

    console.log('Initializing Paystack transaction for:', email, 'amount:', chargeAmount);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: chargeAmount,
        currency: 'KES',
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
    console.error('Checkout error:', error.message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
