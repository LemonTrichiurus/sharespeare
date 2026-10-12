'use client'

import { useActionState, useEffect, useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { reportContent } from '@/actions/moderation'
import type { ContentType } from '@/lib/data/shared'

export function ReportButton({ type, id }: { type: ContentType; id: number }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(reportContent.bind(null, type, id), undefined)

  useEffect(() => {
    if (state?.message) {
      toast.success(t(state.message))
      setOpen(false)
    }
  }, [state, t])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="h-4 w-4" />
          {t('report.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('report.title')}</DialogTitle>
            <DialogDescription>{t('report.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`reason-${type}-${id}`}>{t('report.reason')}</Label>
            <Textarea
              id={`reason-${type}-${id}`}
              name="reason"
              maxLength={500}
              placeholder={t('report.reason_placeholder')}
              required
            />
            <FieldError state={state} name="reason" />
          </div>
          <FormFeedback state={state?.error ? state : undefined} />
          <DialogFooter>
            <SubmitButton>{t('report.submit')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
