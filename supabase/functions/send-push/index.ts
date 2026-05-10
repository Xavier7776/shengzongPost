import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { receiverId, title, body, data } = await req.json();

    if (!receiverId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: receiverId, title, body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('push_token')
      .eq('id', receiverId)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ message: 'No push token for receiver' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = {
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const result = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    const pushResult = await result.json();

    return new Response(
      JSON.stringify({ message: 'Push sent', result: pushResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
