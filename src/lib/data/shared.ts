export interface Author {
  id: string
  displayName: string | null
  avatarUrl: string | null
}

export interface AuthorRow {
  id: string
  display_name: string | null
  avatar_url: string | null
}

/** Embedded-select fragment for an author, e.g. `author:profiles!x_author_id_fkey(${AUTHOR_FIELDS})`. */
export const AUTHOR_FIELDS = 'id, display_name, avatar_url'

export function toAuthor(row: AuthorRow | null): Author | null {
  return row && { id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url }
}

/** Escape a user search term for use inside a PostgREST ilike/or filter. */
export function toLikePattern(term: string): string {
  const cleaned = term.replace(/[,()"\\]/g, ' ').replace(/[%_]/g, (c) => `\\${c}`).trim()
  return `%${cleaned}%`
}

export type ContentType = 'sharespeare' | 'topic' | 'comment'
