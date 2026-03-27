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
    const body = await req.json();
    const { admin_key, action } = body;

    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY') || 'econsult-admin-2026';
    if (admin_key !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

      const { data: newPoll, error: pollError } = await supabase
        .from('polls')
        .insert(poll)
        .select('id')
        .single();

      if (pollError) throw pollError;

      for (const label of options) {
        await supabase.from('poll_options').insert({ poll_id: newPoll.id, label });
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
