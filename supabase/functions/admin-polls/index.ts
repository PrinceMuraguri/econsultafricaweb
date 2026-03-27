const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body = await req.json();
    const { admin_key, action } = body;

    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY') || 'econsult-admin-2026';
    if (admin_key !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'update_poll') {
      const { poll_id, updates } = body;
      if (!poll_id || !updates) {
        return new Response(JSON.stringify({ error: 'poll_id and updates required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_poll') {
      const { poll, options } = body;
      if (!poll?.title || !options?.length) {
        return new Response(JSON.stringify({ error: 'poll and options required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

      return new Response(JSON.stringify({ success: true, poll_id: newPoll.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin polls error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
