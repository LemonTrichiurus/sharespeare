'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireViewer } from '@/lib/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { fieldErrorsFrom, isPermissionError, type ActionState } from './result'

const topicSchema = z.object({
  title: z.string().trim().min(1, 'errors.title_required').max(200, 'errors.title_too_long'),
  body: z.string().trim().min(1, 'errors.content_required').max(10000, 'errors.content_too_long'),
})

const commentSchema = z.object({
  body: z.string().trim().min(1, 'errors.comment_required').max(2000, 'errors.content_too_long'),
})

export async function createTopic(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer('/topics')
  const parsed = topicSchema.safeParse({ title: formData.get('title'), body: formData.get('body') })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('topics')
    .insert({ title: parsed.data.title, body_rich: parsed.data.body, author_id: viewer.id })
    .select('id')
    .single()
  if (error) return { error: 'errors.save_failed' }

  revalidatePath('/topics')
  redirect(`/topics/${data.id}`)
}

export async function deleteTopic(id: number): Promise<ActionState> {
  await requireViewer()
  const supabase = await createSupabaseServer()
  const { error, count } = await supabase.from('topics').delete({ count: 'exact' }).eq('id', id)
  if (error || count === 0) return { error: 'errors.delete_failed' }

  revalidatePath('/topics')
  redirect('/topics')
}

export async function addComment(topicId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer(`/topics/${topicId}`)
  const parsed = commentSchema.safeParse({ body: formData.get('body') })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createSupabaseServer()
  const { error } = await supabase
    .from('comments')
    .insert({ topic_id: topicId, body_rich: parsed.data.body, author_id: viewer.id })
  // The insert policy rejects comments on locked or hidden topics.
  if (error) return { error: isPermissionError(error) ? 'errors.topic_locked' : 'errors.save_failed' }

  revalidatePath(`/topics/${topicId}`)
  return {}
}

export async function deleteComment(topicId: number, commentId: number): Promise<ActionState> {
  await requireViewer()
  const supabase = await createSupabaseServer()
  const { error, count } = await supabase.from('comments').delete({ count: 'exact' }).eq('id', commentId)
  if (error || count === 0) return { error: 'errors.delete_failed' }

  revalidatePath(`/topics/${topicId}`)
  return {}
}
