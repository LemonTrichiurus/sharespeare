import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/** Browser-side client, used for OAuth redirects and direct image uploads to Storage. */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
