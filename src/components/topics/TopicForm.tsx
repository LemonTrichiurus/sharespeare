'use client'

import { useActionState, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { createTopic } from '@/actions/topics'

/** Collapsed "New topic" button that expands into the form. */
export function TopicForm() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(createTopic, undefined)

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t('topics.new')}
      </Button>
    )
  }

  return (
    <form action={formAction} className="w-full space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="topic-title">{t('topics.form.title')}</Label>
        <Input id="topic-title" name="title" maxLength={200} required autoFocus />
        <FieldError state={state} name="title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic-body">{t('topics.form.body')}</Label>
        <Textarea id="topic-body" name="body" rows={5} required />
        <FieldError state={state} name="body" />
      </div>
      <FormFeedback state={state} />
      <div className="flex gap-2">
        <SubmitButton>{t('topics.form.submit')}</SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
