'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireMod, requireViewer } from '@/lib/auth'
import { FEATURED_KEY } from '@/lib/data/sharespeare'
import type { ContentType } from '@/lib/data/shared'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isPermissionError, type ActionState } from './result'

const contentType = z.enum(['sharespeare', 'topic', 'comment'])
const reasonSchema = z.string().trim().min(1, 'errors.reason_required').max(500, 'errors.content_too_long')

/** Any signed-in user can report something; one report per user per item. */
export async function reportContent(type: ContentType, id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer()
  const reason = reasonSchema.safeParse(formData.get('reason'))
  if (!reason.success) return { fieldErrors: { reason: reason.error.issues[0].message } }

  const supabase = await createSupabaseServer()
  const { error } = await supabase
    .from('reports')
    .insert({ target_type: contentType.parse(type), target_id: id, reason: reason.data })
  if (error?.code === '23505') return { error: 'report.already_reported' }
  if (error) return { error: 'errors.save_failed' }

  revalidatePath('/admin')
  return { message: 'report.thanks' }
}

/** Hide or restore content. The set_content_hidden() function checks is_mod() itself. */
export async function setHidden(type: ContentType, id: number, hidden: boolean): Promise<ActionState> {
  await requireMod()
  const supabase = await createSupabaseServer()
  const { error } = await supabase.rpc('set_content_hidden', {
    p_target_type: contentType.parse(type),
    p_target_id: id,
    p_hidden: hidden,
  })
  if (error) return { error: isPermissionError(error) ? 'errors.forbidden' : 'errors.save_failed' }

  revalidatePath('/', 'layout')
  return {}
}

/** Dismiss reports on an item without hiding it. */
export async function dismissReports(type: ContentType, id: number): Promise<ActionState> {
  const viewer = await requireMod()
  const supabase = await createSupabaseServer()
  const { error } = await supabase
    .from('reports')
    .update({ resolved_at: new Date().toISOString(), resolved_by: viewer.id })
    .eq('target_type', contentType.parse(type))
    .eq('target_id', id)
    .is('resolved_at', null)
  if (error) return { error: 'errors.save_failed' }

  revalidatePath('/admin')
  return {}
}

export async function setTopicLocked(id: number, locked: boolean): Promise<ActionState> {
  await requireMod()
  const supabase = await createSupabaseServer()
  const { error } = await supabase.rpc('set_topic_locked', { p_topic_id: id, p_locked: locked })
  if (error) return { error: 'errors.save_failed' }

  revalidatePath(`/topics/${id}`)
  return {}
}

/** Pick the post shown at the top of the home page (null clears it). */
export async function setFeaturedShare(id: number | null): Promise<ActionState> {
  await requireMod()
  const supabase = await createSupabaseServer()
  const { error } = await supabase
    .from('homepage_config')
    .upsert({ config_key: FEATURED_KEY, config_value: id === null ? null : String(id) }, { onConflict: 'config_key' })
  if (error) return { error: 'errors.save_failed' }

  revalidatePath('/', 'layout')
  return {}
}
