'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { addComment } from '@/actions/topics'

export function CommentForm({ topicId }: { topicId: number }) {
  const { t } = useI18n()
  const [state, formAction] = useActionState(addComment.bind(null, topicId), undefined)
  const form = useRef<HTMLFormElement>(null)

  // Clear the box after a successful post (no error returned).
  useEffect(() => {
    if (state && !state.error && !state.fieldErrors) form.current?.reset()
  }, [state])

  return (
    <form ref={form} action={formAction} className="space-y-3">
      <Textarea name="body" rows={3} maxLength={2000} placeholder={t('topics.comment_placeholder')} required aria-label={t('topics.comment_placeholder')} />
      <FieldError state={state} name="body" />
      <FormFeedback state={state} />
      <SubmitButton size="sm">{t('topics.comment_submit')}</SubmitButton>
    </form>
  )
}
