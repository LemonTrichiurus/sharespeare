'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireViewer } from '@/lib/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { fieldErrorsFrom, isPermissionError, type ActionState } from './result'

// Only accept media that was uploaded to this project's public bucket.
const MEDIA_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`

const shareSchema = z.object({
  title: z.string().trim().min(1, 'errors.title_required').max(200, 'errors.title_too_long'),
  content: z.string().trim().max(20000, 'errors.content_too_long'),
  tagIds: z.array(z.coerce.number().int().positive()).max(3),
  media: z.array(z.string().startsWith(MEDIA_PREFIX, 'errors.bad_media')).max(9, 'errors.too_many_images'),
  publish: z.boolean(),
})

function parseForm(formData: FormData) {
  let media: unknown = []
  try {
    media = JSON.parse(String(formData.get('media') ?? '[]'))
  } catch {}
  return shareSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content') ?? '',
    tagIds: formData.getAll('tagIds'),
    media,
    publish: formData.get('intent') !== 'draft',
  })
}

export async function saveShare(id: number | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer()
  const parsed = parseForm(formData)
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const { title, content, tagIds, media, publish } = parsed.data
  if (!content && media.length === 0) return { fieldErrors: { content: 'errors.content_required' } }

  const values = {
    title,
    content_rich: content,
    tags: tagIds,
    media_urls: media,
    media_url: media[0] ?? null,
    status: publish ? ('PUBLISHED' as const) : ('DRAFT' as const),
  }

  const supabase = await createSupabaseServer()
  const { data, error } = id
    ? await supabase.from('sharespeare').update(values).eq('id', id).select('id').single()
    : await supabase.from('sharespeare').insert({ ...values, author_id: viewer.id }).select('id').single()

  if (error) return { error: isPermissionError(error) ? 'errors.forbidden' : 'errors.save_failed' }

  revalidatePath('/sharespeare')
  revalidatePath('/')
  redirect(publish ? `/sharespeare/${data.id}` : '/me')
}

export async function deleteShare(id: number): Promise<ActionState> {
  await requireViewer()
  const supabase = await createSupabaseServer()
  const { error, count } = await supabase.from('sharespeare').delete({ count: 'exact' }).eq('id', id)
  if (error || count === 0) return { error: 'errors.delete_failed' }

  revalidatePath('/sharespeare')
  revalidatePath('/')
  redirect('/me')
}
