import { createSupabaseServer } from '@/lib/supabase/server'
import { toExcerpt } from '@/lib/html'
import type { ContentType } from './shared'

export interface ModerationTarget {
  type: ContentType
  id: number
  title: string
  href: string
  isHidden: boolean
}

export interface ReportGroup {
  target: ModerationTarget
  reasons: { reason: string; createdAt: string }[]
}

type TargetRow = { id: number; is_hidden: boolean; label: string; topicId?: number }

// Load titles for a set of reported/hidden items, grouped by table.
async function loadTargets(keys: { type: ContentType; id: number }[]): Promise<Map<string, ModerationTarget>> {
  const supabase = await createSupabaseServer()
  const idsOf = (type: ContentType) => [...new Set(keys.filter((k) => k.type === type).map((k) => k.id))]
  const result = new Map<string, ModerationTarget>()

  const [shares, topics, comments] = await Promise.all([
    idsOf('sharespeare').length
      ? supabase.from('sharespeare').select('id, is_hidden, title').in('id', idsOf('sharespeare'))
      : { data: [] },
    idsOf('topic').length
      ? supabase.from('topics').select('id, is_hidden, title').in('id', idsOf('topic'))
      : { data: [] },
    idsOf('comment').length
      ? supabase.from('comments').select('id, is_hidden, body_rich, topic_id').in('id', idsOf('comment'))
      : { data: [] },
  ])

  const add = (type: ContentType, row: TargetRow, href: string) =>
    result.set(`${type}:${row.id}`, { type, id: row.id, title: row.label, href, isHidden: row.is_hidden })

  for (const r of shares.data ?? []) add('sharespeare', { ...r, label: r.title }, `/sharespeare/${r.id}`)
  for (const r of topics.data ?? []) add('topic', { ...r, label: r.title }, `/topics/${r.id}`)
  for (const r of comments.data ?? [])
    add('comment', { ...r, label: toExcerpt(r.body_rich, 80) }, `/topics/${r.topic_id}#comment-${r.id}`)
  return result
}

/** Unresolved reports, grouped by the item they're about, most-reported first. */
export async function listOpenReports(): Promise<ReportGroup[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('reports')
    .select('target_type, target_id, reason, created_at')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  const targets = await loadTargets(data.map((r) => ({ type: r.target_type as ContentType, id: r.target_id })))
  const groups = new Map<string, ReportGroup>()
  for (const r of data) {
    const key = `${r.target_type}:${r.target_id}`
    const target = targets.get(key)
    if (!target) continue // the item was deleted
    const group = groups.get(key) ?? { target, reasons: [] }
    group.reasons.push({ reason: r.reason, createdAt: r.created_at })
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.reasons.length - a.reasons.length)
}

/** Everything currently hidden by a moderator. */
export async function listHiddenContent(): Promise<ModerationTarget[]> {
  const supabase = await createSupabaseServer()
  const [shares, topics, comments] = await Promise.all([
    supabase.from('sharespeare').select('id').eq('is_hidden', true),
    supabase.from('topics').select('id').eq('is_hidden', true),
    supabase.from('comments').select('id').eq('is_hidden', true),
  ])
  const keys = [
    ...(shares.data ?? []).map((r) => ({ type: 'sharespeare' as const, id: r.id })),
    ...(topics.data ?? []).map((r) => ({ type: 'topic' as const, id: r.id })),
    ...(comments.data ?? []).map((r) => ({ type: 'comment' as const, id: r.id })),
  ]
  return [...(await loadTargets(keys)).values()]
}
