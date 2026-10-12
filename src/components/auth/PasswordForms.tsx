'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { requestPasswordReset, updatePassword } from '@/actions/auth'

export function ForgotPasswordForm() {
  const { t } = useI18n()
  const [state, formAction] = useActionState(requestPasswordReset, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">{t('auth.forgot_title')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.forgot_subtitle')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        <FieldError state={state} name="email" />
      </div>
      <FormFeedback state={state} />
      <SubmitButton className="w-full">{t('auth.send_reset')}</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground underline-offset-4 hover:underline">
          {t('auth.back_to_login')}
        </Link>
      </p>
    </form>
  )
}

export function ResetPasswordForm() {
  const { t } = useI18n()
  const [state, formAction] = useActionState(updatePassword, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-center text-2xl font-bold">{t('auth.reset_title')}</h1>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.new_password')}</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">{t('auth.password_hint')}</p>
        <FieldError state={state} name="password" />
      </div>
      <FormFeedback state={state} />
      <SubmitButton className="w-full">{t('me.save')}</SubmitButton>
    </form>
  )
}
