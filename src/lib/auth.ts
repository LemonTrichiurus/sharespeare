import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

export type Role = 'ADMIN' | 'MOD' | 'MEMBER'

export interface Viewer {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  role: Role
  /** Editors and admins: can write news, hide content, manage the calendar. */
  isMod: boolean
  isAdmin: boolean
}

/** The signed-in user and their profile, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()

  const role: Role = profile?.role ?? 'MEMBER'
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    isMod: role === 'ADMIN' || role === 'MOD',
    isAdmin: role === 'ADMIN',
  }
})

export async function requireViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  return viewer
}

export async function requireMod(): Promise<Viewer> {
  const viewer = await requireViewer()
  if (!viewer.isMod) redirect('/403')
  return viewer
}
