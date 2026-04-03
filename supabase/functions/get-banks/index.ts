const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { currency = 'KES' } = await req.json().catch(() => ({}));

    // Fetch regular banks for the given currency
    const res = await fetch(`https://api.paystack.co/bank?currency=${currency}&use_cursor=false&perPage=100`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch banks' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const banks = (data.data || []).map((b: any) => ({
      name: b.name,
      code: b.code,
      currency: b.currency,
    }));

    return new Response(JSON.stringify({ banks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('get-banks error:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Failed to fetch banks' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
