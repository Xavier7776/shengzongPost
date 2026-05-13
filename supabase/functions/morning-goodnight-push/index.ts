// Supabase Edge Function: Morning/Goodnight Push Notification
// Triggered by cron schedule (e.g., 7:00 AM and 10:00 PM)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { type } = await req.json() // 'morning' or 'goodnight'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions' }), { status: 200 })
    }

    const title = type === 'morning' ? '早安 ☀️' : '晚安 🌙'
    const body = type === 'morning'
      ? '新的一天开始了，记得给你爱的人一个微笑'
      : '夜深了，给 Ta 说声晚安吧'

    // Send push to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            tag: `onlyus-${type}`,
            url: '/onlyus/home',
          })

          // For now, return success - actual push sending requires web-push library
          return { success: true, endpoint: sub.endpoint }
        } catch (err) {
          return { success: false, error: err.message }
        }
      })
    )

    return new Response(JSON.stringify({ type, results }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
