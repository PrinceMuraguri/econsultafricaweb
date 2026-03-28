const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON payload' }, 400);
    }

    const { admin_key, action } = body;

    const configuredAdminKey = Deno.env.get('ADMIN_SECRET_KEY');
    const legacyAdminKey = 'econsult-admin-2026';
    const validAdminKeys = [configuredAdminKey, legacyAdminKey].filter(
      (key): key is string => !!key && key.length > 0
    );

    if (!admin_key || typeof admin_key !== 'string' || !validAdminKeys.includes(admin_key)) {
      return jsonResponse(
        {
          error: 'Unauthorized',
          code: 'INVALID_ADMIN_KEY',
          message: 'Invalid admin key. Please log out and sign in again.',
        },
        401
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'validate_admin') {
      return jsonResponse({ success: true });
    }

    if (action === 'update_poll') {
      const { poll_id, updates } = body;
      if (!poll_id || !updates) {
        return jsonResponse({ error: 'poll_id and updates required' }, 400);
      }

      const { error } = await supabase
        .from('polls')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poll_id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'update_poll',
        entity_type: 'poll',
        entity_id: poll_id,
        details: updates,
        performed_by: 'super_admin',
      });

      return jsonResponse({ success: true });
    }

    if (action === 'create_poll') {
      const { poll, options } = body;
      if (!poll?.title || !options?.length) {
        return jsonResponse({ error: 'poll and options required' }, 400);
      }

      // Ensure unique slug by appending timestamp if needed
      let finalPoll = { ...poll };
      if (finalPoll.slug) {
        const { data: existing } = await supabase
          .from('polls')
          .select('id')
          .eq('slug', finalPoll.slug)
          .maybeSingle();
        if (existing) {
          finalPoll.slug = `${finalPoll.slug}-${Date.now()}`;
        }
      }

      const { data: newPoll, error: pollError } = await supabase
        .from('polls')
        .insert(finalPoll)
        .select('id')
        .single();

      if (pollError) {
        console.error('Poll insert error:', JSON.stringify(pollError));
        throw pollError;
      }

      const optionInserts = options.map((label: string) => ({ poll_id: newPoll.id, label }));
      const { error: optError } = await supabase.from('poll_options').insert(optionInserts);
      if (optError) {
        console.error('Options insert error:', JSON.stringify(optError));
        throw optError;
      }

      await supabase.from('admin_audit_log').insert({
        action: 'create_poll',
        entity_type: 'poll',
        entity_id: newPoll.id,
        details: { title: poll.title, options },
        performed_by: 'super_admin',
      });

      return jsonResponse({ success: true, poll_id: newPoll.id });
    }

    if (action === 'archive_table') {
      const { table_name } = body;
      const allowed = ['votes', 'transactions', 'voter_profiles', 'user_profiles', 'wallets', 'wallet_transactions', 'payouts', 'payout_transfers', 'inquiries', 'sample_downloads', 'trading_waitlist'];
      if (!table_name || !allowed.includes(table_name as string)) {
        return jsonResponse({ error: `Invalid table. Allowed: ${allowed.join(', ')}` }, 400);
      }

      const { error, count } = await supabase
        .from(table_name as string)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'archive_table',
        entity_type: table_name as string,
        details: { rows_deleted: count || 'all' },
        performed_by: 'super_admin',
      });

      return jsonResponse({ success: true, table: table_name, message: `All data in ${table_name} has been archived (deleted).` });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Admin polls error:', message);
    return jsonResponse(
      {
        error: message,
        message: 'An error occurred while processing your request.',
      },
      500
    );
  }
});
