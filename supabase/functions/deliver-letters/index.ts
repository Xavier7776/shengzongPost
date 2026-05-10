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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find letters that are due for delivery
    const { data: letters, error } = await supabaseClient
      .from('letters')
      .select('*')
      .eq('delivered', false)
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;

    if (!letters || letters.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No letters to deliver' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const letter of letters) {
      // Mark as delivered
      const { error: updateError } = await supabaseClient
        .from('letters')
        .update({ delivered: true })
        .eq('id', letter.id);

      if (updateError) {
        results.push({ id: letter.id, status: 'error', error: updateError.message });
        continue;
      }

      // Get receiver's push token
      const { data: receiver } = await supabaseClient
        .from('profiles')
        .select('push_token, nickname')
        .eq('id', letter.receiver_id)
        .single();

      if (receiver?.push_token) {
        // Send push notification via Expo
        const message = {
          to: receiver.push_token,
          sound: 'default',
          title: 'Love Letter Received!',
          body: `You have a new love letter waiting for you.`,
          data: { type: 'letter', letterId: letter.id },
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
      }

      results.push({ id: letter.id, status: 'delivered' });
    }

    return new Response(
      JSON.stringify({ message: `Delivered ${results.length} letters`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
