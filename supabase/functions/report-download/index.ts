import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map product files to storage paths in the "reports" bucket
const FILE_MAP: Record<string, string> = {
  // Country reports
  "kenya-oil-shortage-assessment-march-2026.pdf": "Kenya_2026_Economic_Outlook.pdf",
  // Sector briefs
  "Kenya_2026_Banking_Financial_Services_Brief.pdf": "Kenya_2026_Banking_Financial_Services_Brief.pdf",
  "Kenya_2026_Agriculture_Food_Security_Brief.pdf": "Kenya_2026_Agriculture_Food_Security_Brief.pdf",
  "Kenya_2026_Energy_Infrastructure_Brief.pdf": "Kenya_2026_Energy_Infrastructure_Brief.pdf",
  "Kenya_2026_Manufacturing_Industry_Brief.pdf": "Kenya_2026_Manufacturing_Industry_Brief.pdf",
  "Kenya_2026_Technology_Digital_Economy_Brief.pdf": "Kenya_2026_Technology_Digital_Economy_Brief.pdf",
  "Kenya_2026_Tourism_Hospitality_Brief.pdf": "Kenya_2026_Tourism_Hospitality_Brief.pdf",
  "Kenya_2026_Real_Estate_Construction_Brief.pdf": "Kenya_2026_Real_Estate_Construction_Brief.pdf",
  "Kenya_2026_Retail_Consumer_Brief.pdf": "Kenya_2026_Retail_Consumer_Brief.pdf",
  // Audience notes
  "Kenya_2026_Investor_Strategy_Note.pdf": "Kenya_2026_Investor_Strategy_Note.pdf",
  "Kenya_2026_Development_Partner_Brief.pdf": "Kenya_2026_Development_Partner_Brief.pdf",
  "Kenya_2026_Corporate_Strategy_Brief.pdf": "Kenya_2026_Corporate_Strategy_Brief.pdf",
  "Kenya_2026_Exporter_Importer_Trade_Brief.pdf": "Kenya_2026_Exporter_Importer_Trade_Brief.pdf",
  "Kenya_2026_Startup_SME_Scan.pdf": "Kenya_2026_Startup_SME_Scan.pdf",
  // Test report
  "TEST_REPORT.pdf": "TEST_REPORT.pdf",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference, file } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Payment reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PAYSTACK_SECRET_KEY = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verifying payment reference:', reference);

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const verifyData = await verifyRes.json();
    console.log('Paystack verification status:', verifyData.data?.status);

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not verified' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Determine which file to serve
    const metadata = verifyData.data?.metadata;
    const requestedFile = file || metadata?.file;
    const storagePath = requestedFile ? (FILE_MAP[requestedFile] || requestedFile) : 'Kenya_2026_Economic_Outlook.pdf';

    console.log('Generating signed URL for:', storagePath);

    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Storage error:', error?.message);
      return new Response(JSON.stringify({ error: 'Failed to generate download link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log purchase for funnel tracking
    const customerEmail = verifyData.data?.customer?.email;
    const productTitle = metadata?.product || storagePath;
    console.log('Purchase complete:', customerEmail, productTitle);

    return new Response(JSON.stringify({ 
      download_url: data.signedUrl,
      customer_email: customerEmail,
      product_title: productTitle,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Download error:', error.message);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
