'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/contexts/I18nContext'
import type { ActionState } from '@/actions/result'

interface ActionButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  /** A server action with its arguments already bound. */
  action: () => Promise<ActionState>
  /** If set, ask for confirmation with this (already translated) text first. */
  confirm?: string
}

/** Runs a server action on click, optionally after a confirm dialog, and toasts the outcome. */
export function ActionButton({ action, confirm, children, ...props }: ActionButtonProps) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const run = () =>
    startTransition(async () => {
      const result = await action()
      if (result?.error) toast.error(t(result.error))
      else if (result?.message) toast.success(t(result.message))
    })

  const button = (
    <Button {...props} disabled={pending || props.disabled} onClick={() => (confirm ? setOpen(true) : run())}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )

  if (!confirm) return button
  return (
    <>
      {button}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={run}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
