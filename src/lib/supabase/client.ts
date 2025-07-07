import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Keep false for client-side access
    }
  })
}