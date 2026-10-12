// Generated from the live schema (Supabase type generator, 2026-10-12) and
// trimmed to the tables this app uses. Regenerate after schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Enums = {
  comment_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  publish_status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'REJECTED'
  role: 'ADMIN' | 'MOD' | 'MEMBER'
  topic_status: 'OPEN' | 'LOCKED'
}

type Hideable = {
  is_hidden: boolean
  hidden_by: string | null
  hidden_at: string | null
  hidden_reason: string | null
}

type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: Enums['role']
  created_at: string
}

type SharespeareRow = Hideable & {
  id: number
  title: string
  content_rich: string
  media_url: string | null
  media_urls: Json | null
  tags: number[] | null
  status: Enums['publish_status']
  author_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

type TopicRow = Hideable & {
  id: number
  title: string
  body_rich: string
  status: Enums['topic_status']
  author_id: string | null
  created_at: string
  updated_at: string
}

type CommentRow = Hideable & {
  id: number
  topic_id: number
  author_id: string | null
  body_rich: string
  status: Enums['comment_status']
  moderated_by: string | null
  moderated_at: string | null
  reason: string | null
  created_at: string
}

type ReportRow = {
  id: number
  target_type: string
  target_id: number
  reporter_id: string
  reason: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

type HomepageConfigRow = {
  id: number
  config_key: string
  config_value: string | null
  created_at: string
  updated_at: string
}

type TagRow = {
  id: number
  name: string
  name_en: string
  description: string | null
  created_at: string
}

// Foreign-key metadata lets supabase-js type embedded selects such as
// `author:profiles!sharespeare_author_id_fkey(display_name)`.
type FK<Name extends string, Column extends string, Ref extends string> = {
  foreignKeyName: Name
  columns: [Column]
  isOneToOne: false
  referencedRelation: Ref
  referencedColumns: ['id']
}

type Table<Row, Insert, Relationships extends unknown[] = []> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: Relationships
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }>
      sharespeare: Table<
        SharespeareRow,
        Partial<SharespeareRow> & { title: string; content_rich: string },
        [FK<'sharespeare_author_id_fkey', 'author_id', 'profiles'>]
      >
      topics: Table<
        TopicRow,
        Partial<TopicRow> & { title: string; body_rich: string },
        [FK<'topics_author_id_fkey', 'author_id', 'profiles'>]
      >
      comments: Table<
        CommentRow,
        Partial<CommentRow> & { topic_id: number; body_rich: string },
        [FK<'comments_author_id_fkey', 'author_id', 'profiles'>, FK<'comments_topic_id_fkey', 'topic_id', 'topics'>]
      >
      reports: Table<
        ReportRow,
        { target_type: string; target_id: number; reason: string; reporter_id?: string; resolved_at?: string | null; resolved_by?: string | null },
        [FK<'reports_reporter_id_fkey', 'reporter_id', 'profiles'>]
      >
      homepage_config: Table<HomepageConfigRow, Partial<HomepageConfigRow> & { config_key: string }>
      tags: Table<TagRow, Partial<TagRow> & { id: number; name: string; name_en: string }>
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: { u?: string }; Returns: boolean }
      is_mod: { Args: { u?: string }; Returns: boolean }
      set_content_hidden: {
        Args: { p_target_type: string; p_target_id: number; p_hidden: boolean; p_reason?: string }
        Returns: undefined
      }
      set_topic_locked: { Args: { p_topic_id: number; p_locked: boolean }; Returns: undefined }
    }
    Enums: Enums
    CompositeTypes: { [_ in never]: never }
  }
}
