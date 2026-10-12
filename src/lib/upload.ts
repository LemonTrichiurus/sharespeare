import { createClient } from '@/lib/supabase/client'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * Upload an image to the public `media` bucket as the signed-in user and
 * return its public URL. Errors are thrown as i18n keys.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('errors.upload_failed')
  if (file.size > MAX_BYTES) throw new Error('errors.file_too_large')

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${extension}`
  const supabase = createClient()
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
  if (error) throw new Error('errors.upload_failed')
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
