'use client'

import { useI18n } from '@/contexts/I18nContext'
import type { ActionState } from '@/actions/result'
import { cn } from '@/lib/utils'

/** Form-level error or success message from an action. */
export function FormFeedback({ state, className }: { state: ActionState; className?: string }) {
  const { t } = useI18n()
  if (!state?.error && !state?.message) return null
  return (
    <p
      role={state.error ? 'alert' : 'status'}
      className={cn('text-sm', state.error ? 'text-destructive' : 'text-green-600 dark:text-green-400', className)}
    >
      {t(state.error ?? state.message!)}
    </p>
  )
}

/** Error under a single field, if the action reported one for it. */
export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const { t } = useI18n()
  const key = state?.fieldErrors?.[name]
  if (!key) return null
  return (
    <p id={`${name}-error`} className="text-sm text-destructive">
      {t(key)}
    </p>
  )
}
