import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import { toExcerpt } from '@/lib/html'
import { AUTHOR_FIELDS, toAuthor, toLikePattern, type Author, type AuthorRow } from './shared'

export interface Tag {
  id: number
  nameZh: string
  nameEn: string
  description: string | null
}

export interface Media {
  url: string
  kind: 'image' | 'video'
}

export interface ShareSummary {
  id: number
  title: string
  excerpt: string
  media: Media[]
  tagIds: number[]
  publishedAt: string | null
  createdAt: string
  status: 'DRAFT' | 'PUBLISHED'
  isHidden: boolean
  author: Author | null
}

export interface ShareDetail extends ShareSummary {
  content: string
  updatedAt: string
}

const FEATURED_KEY = 'featured_sharespeare_id'

const SHARE_COLUMNS = `
  id, title, content_rich, media_url, media_urls, tags, status, is_hidden,
  published_at, created_at, updated_at,
  author:profiles!sharespeare_author_id_fkey(${AUTHOR_FIELDS})
`

interface ShareRow {
  id: number
  title: string
  content_rich: string
  media_url: string | null
  media_urls: Json | null
  tags: number[] | null
  status: string
  is_hidden: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  author: AuthorRow | null
}

// Older posts store one image in media_url, newer ones a JSON array in
// media_urls; some arrays contain empty strings.
function toMedia(row: Pick<ShareRow, 'media_url' | 'media_urls'>): Media[] {
  const urls = Array.isArray(row.media_urls)
    ? row.media_urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : []
  if (urls.length === 0 && row.media_url) urls.push(row.media_url)
  return urls.map((url) => ({ url, kind: /\.(mp4|webm)(\?|$)/i.test(url) ? 'video' : 'image' }))
}

function toSummary(row: ShareRow): ShareSummary {
  return {
    id: row.id,
    title: row.title,
    excerpt: toExcerpt(row.content_rich, 200),
    media: toMedia(row),
    tagIds: row.tags ?? [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
    status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    isHidden: row.is_hidden,
    author: toAuthor(row.author),
  }
}

function toDetail(row: ShareRow): ShareDetail {
  return { ...toSummary(row), content: row.content_rich, updatedAt: row.updated_at }
}

/** Published, visible posts, newest first. */
export async function listShares(filters: { tagId?: number; query?: string; limit?: number } = {}) {
  const supabase = await createSupabaseServer()
  let request = supabase
    .from('sharespeare')
    .select(SHARE_COLUMNS)
    .eq('status', 'PUBLISHED')
    .eq('is_hidden', false)
    .order('published_at', { ascending: false })
    .limit(filters.limit ?? 60)

  if (filters.tagId) request = request.contains('tags', [filters.tagId])
  if (filters.query) {
    const pattern = toLikePattern(filters.query)
    request = request.or(`title.ilike.${pattern},content_rich.ilike.${pattern}`)
  }

  const { data, error } = await request.overrideTypes<ShareRow[], { merge: false }>()
  if (error) throw error
  return data.map(toSummary)
}

/** All of one author's posts, drafts included (RLS only returns them to that author or a moderator). */
export async function listSharesByAuthor(authorId: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('sharespeare')
    .select(SHARE_COLUMNS)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .overrideTypes<ShareRow[], { merge: false }>()
  if (error) throw error
  return data.map(toSummary)
}

/**
 * One post as the current viewer is allowed to see it: published posts for
 * everyone, drafts and hidden posts only for their author and moderators.
 */
export const getShare = cache(async (id: number): Promise<ShareDetail | null> => {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('sharespeare')
    .select(SHARE_COLUMNS)
    .eq('id', id)
    .overrideTypes<ShareRow[], { merge: false }>()
  if (error) throw error
  return data[0] ? toDetail(data[0]) : null
})

export const listTags = cache(async (): Promise<Tag[]> => {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.from('tags').select('id, name, name_en, description').order('id')
  if (error) throw error
  // `name` holds the bilingual label "English（中文）"; show only the Chinese part in zh.
  return data.map((t) => ({
    id: t.id,
    nameEn: t.name_en,
    nameZh: t.name.match(/（(.+)）/)?.[1] ?? t.name,
    description: t.description,
  }))
})

export const getFeaturedShareId = cache(async (): Promise<number | null> => {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('homepage_config')
    .select('config_value')
    .eq('config_key', FEATURED_KEY)
    .maybeSingle()
  const id = Number(data?.config_value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
})

export { FEATURED_KEY }
