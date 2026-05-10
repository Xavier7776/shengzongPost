import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() must be called on the client side.')
  }
  if (!_client) _client = createClient()
  return _client
}
