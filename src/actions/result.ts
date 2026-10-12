/** Result of a form action. `error` and `message` are i18n keys shown to the user. */
export type ActionState = { error?: string; message?: string; fieldErrors?: Record<string, string> } | undefined

/** Turn a zod error into { field: i18nKey } using each issue's message as the key. */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form')
    out[field] ??= issue.message
  }
  return out
}

/**
 * The database refused the write: either a permission/RLS violation (42501),
 * or an update/delete whose row RLS filtered out, so `.single()` found
 * nothing (PGRST116).
 */
export function isPermissionError(error: { code?: string } | null): boolean {
  return error?.code === '42501' || error?.code === 'PGRST116'
}
