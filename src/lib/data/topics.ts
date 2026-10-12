import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { toExcerpt } from '@/lib/html'
import { AUTHOR_FIELDS, toAuthor, type Author, type AuthorRow } from './shared'

export interface TopicSummary {
  id: number
  title: string
  excerpt: string
  isLocked: boolean
  isHidden: boolean
  createdAt: string
  commentCount: number
  author: Author | null
}

export interface Topic extends TopicSummary {
  body: string
}

export interface Comment {
  id: number
  body: string
  isHidden: boolean
  createdAt: string
  author: Author | null
}

interface TopicRow {
  id: number
  title: string
  body_rich: string
  status: 'OPEN' | 'LOCKED'
  is_hidden: boolean
  created_at: string
  author: AuthorRow | null
  comments: { count: number }[]
}

const TOPIC_COLUMNS = `
  id, title, body_rich, status, is_hidden, created_at,
  author:profiles!topics_author_id_fkey(${AUTHOR_FIELDS}),
  comments(count)
`

function toSummary(row: TopicRow): TopicSummary {
  return {
    id: row.id,
    title: row.title,
    excerpt: toExcerpt(row.body_rich, 140),
    isLocked: row.status === 'LOCKED',
    isHidden: row.is_hidden,
    createdAt: row.created_at,
    // Counts only comments this viewer can see (RLS applies to the aggregate too).
    commentCount: row.comments[0]?.count ?? 0,
    author: toAuthor(row.author),
  }
}

/** Visible topics, newest first. */
export async function listTopics(limit = 50): Promise<TopicSummary[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('topics')
    .select(TOPIC_COLUMNS)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<TopicRow[], { merge: false }>()
  if (error) throw error
  return data.map(toSummary)
}

/** One topic as the viewer may see it (hidden topics only for author and moderators). */
export const getTopic = cache(async (id: number): Promise<Topic | null> => {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('topics')
    .select(TOPIC_COLUMNS)
    .eq('id', id)
    .overrideTypes<TopicRow[], { merge: false }>()
  if (error) throw error
  return data[0] ? { ...toSummary(data[0]), body: data[0].body_rich } : null
})

/** Comments on a topic, oldest first. Hidden ones are returned only to their author and moderators. */
export async function listComments(topicId: number): Promise<Comment[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('comments')
    .select(`id, body_rich, is_hidden, created_at, author:profiles!comments_author_id_fkey(${AUTHOR_FIELDS})`)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true })
    .overrideTypes<
      { id: number; body_rich: string; is_hidden: boolean; created_at: string; author: AuthorRow | null }[],
      { merge: false }
    >()
  if (error) throw error
  return data.map((c) => ({
    id: c.id,
    body: c.body_rich,
    isHidden: c.is_hidden,
    createdAt: c.created_at,
    author: toAuthor(c.author),
  }))
}
