import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const SITE_NAME = "Econsult Africa"
const SENDER_DOMAIN = "notify.econsult.africa"
const FROM_DOMAIN = "econsult.africa"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map product files to storage paths in the "reports" bucket
const FILE_MAP: Record<string, string> = {
  "kenya-oil-shortage-assessment-march-2026.pdf": "Kenya_2026_Economic_Outlook.pdf",
  "Kenya_2026_Banking_Financial_Services_Brief.pdf": "Kenya_2026_Banking_Financial_Services_Brief.pdf",
  "Kenya_2026_Agriculture_Food_Security_Brief.pdf": "Kenya_2026_Agriculture_Food_Security_Brief.pdf",
  "Kenya_2026_Energy_Infrastructure_Brief.pdf": "Kenya_2026_Energy_Infrastructure_Brief.pdf",
  "Kenya_2026_Manufacturing_Industry_Brief.pdf": "Kenya_2026_Manufacturing_Industry_Brief.pdf",
  "Kenya_2026_Technology_Digital_Economy_Brief.pdf": "Kenya_2026_Technology_Digital_Economy_Brief.pdf",
  "Kenya_2026_Tourism_Hospitality_Brief.pdf": "Kenya_2026_Tourism_Hospitality_Brief.pdf",
  "Kenya_2026_Real_Estate_Construction_Brief.pdf": "Kenya_2026_Real_Estate_Construction_Brief.pdf",
  "Kenya_2026_Retail_Consumer_Brief.pdf": "Kenya_2026_Retail_Consumer_Brief.pdf",
  "Kenya_2026_Investor_Strategy_Note.pdf": "Kenya_2026_Investor_Strategy_Note.pdf",
  "Kenya_2026_Development_Partner_Brief.pdf": "Kenya_2026_Development_Partner_Brief.pdf",
  "Kenya_2026_Corporate_Strategy_Brief.pdf": "Kenya_2026_Corporate_Strategy_Brief.pdf",
  "Kenya_2026_Exporter_Importer_Trade_Brief.pdf": "Kenya_2026_Exporter_Importer_Trade_Brief.pdf",
  "Kenya_2026_Startup_SME_Scan.pdf": "Kenya_2026_Startup_SME_Scan.pdf",
  "TEST_REPORT.pdf": "TEST_REPORT.pdf",
};

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sendPurchaseEmail(supabase: any, customerEmail: string, productTitle: string, downloadUrl: string, reference: string) {
  try {
    const templateName = 'purchase-confirmation'
    const template = TEMPLATES[templateName]
    if (!template) {
      console.error('Purchase confirmation template not found')
      return
    }

    const templateData = {
      productTitle,
      downloadUrl,
      reference,
      customerName: customerEmail.split('@')[0],
    }

    const messageId = crypto.randomUUID()
    const idempotencyKey = `purchase-confirm-${reference}`
    const normalizedEmail = customerEmail.toLowerCase()

    // Check suppression
    const { data: suppressed } = await supabase
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (suppressed) {
      console.log('Email suppressed for:', normalizedEmail)
      return
    }

    // Get or create unsubscribe token
    let unsubscribeToken: string
    const { data: existingToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingToken && !existingToken.used_at) {
      unsubscribeToken = existingToken.token
    } else if (!existingToken) {
      unsubscribeToken = generateToken()
      await supabase.from('email_unsubscribe_tokens').upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )
      const { data: storedToken } = await supabase
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalizedEmail)
        .maybeSingle()
      if (storedToken) unsubscribeToken = storedToken.token
    } else {
      console.log('Unsubscribe token already used for:', normalizedEmail)
      return
    }

    // Render email
    const html = await renderAsync(React.createElement(template.component, templateData))
    const plainText = await renderAsync(React.createElement(template.component, templateData), { plainText: true })
    const resolvedSubject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

    // Log pending
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: 'pending',
    })

    // Enqueue
    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: normalizedEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: resolvedSubject,
        html,
        text: plainText,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('Failed to enqueue purchase email:', enqueueError.message)
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: normalizedEmail,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
    } else {
      console.log('Purchase confirmation email enqueued for:', normalizedEmail)
    }
  } catch (err) {
    console.error('Email send error:', (err as Error).message)
  }
}

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

    const customerEmail = metadata?.customer_email || verifyData.data?.customer?.email;
    const productTitle = metadata?.product || storagePath;
    const productType = metadata?.type || 'report_purchase';

    console.log('Purchase complete:', customerEmail, productTitle, `($${verifyData.data?.amount / 100})`);

    // Log purchase for funnel tracking
    await supabase.from('sales_funnel_events').insert({
      event_type: 'purchase_complete',
      product_title: productTitle,
      product_type: productType,
      user_email: customerEmail || null,
      metadata: { reference, file: requestedFile || storagePath },
    });

    // Send purchase confirmation email server-side
    if (customerEmail && customerEmail !== "customer@placeholder.com") {
      await sendPurchaseEmail(supabase, customerEmail, productTitle, data.signedUrl, reference);
    }

    return new Response(JSON.stringify({ 
      download_url: data.signedUrl,
      customer_email: customerEmail,
      product_title: productTitle,
      product_type: productType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Download error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
