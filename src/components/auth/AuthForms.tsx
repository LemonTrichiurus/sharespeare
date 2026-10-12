'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { signIn, signUp } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'

// Google sign-in needs an OAuth client configured in Supabase; off until then.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true'

function GoogleButton({ next }: { next: string }) {
  const { t } = useI18n()
  const [pending, setPending] = useState(false)

  async function start() {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={start} disabled={pending}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
      {t('auth.continue_google')}
    </Button>
  )
}

export function AuthForms({ next, initialError }: { next: string; initialError?: string }) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [signInState, signInAction] = useActionState(signIn, initialError ? { error: initialError } : undefined)
  const [signUpState, signUpAction] = useActionState(signUp, undefined)
  const state = mode === 'signin' ? signInState : signUpState

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">{t(mode === 'signin' ? 'auth.login_title' : 'auth.signup_title')}</h1>
        <p className="text-sm text-muted-foreground">{t(mode === 'signin' ? 'auth.login_subtitle' : 'auth.signup_subtitle')}</p>
      </div>

      {GOOGLE_ENABLED && (
        <>
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t('auth.or')}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form key={mode} action={mode === 'signin' ? signInAction : signUpAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('auth.display_name')}</Label>
            <Input id="displayName" name="displayName" maxLength={40} required autoComplete="nickname" />
            <FieldError state={state} name="displayName" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
          <FieldError state={state} name="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            aria-describedby="password-hint"
          />
          {mode === 'signup' && <p id="password-hint" className="text-xs text-muted-foreground">{t('auth.password_hint')}</p>}
          {mode === 'signin' && (
            <Link href="/forgot-password" className="block text-right text-xs text-muted-foreground underline-offset-4 hover:underline">
              {t('auth.forgot_link')}
            </Link>
          )}
          <FieldError state={state} name="password" />
        </div>
        <FormFeedback state={state} />
        <SubmitButton className="w-full">{t(mode === 'signin' ? 'auth.sign_in' : 'auth.sign_up')}</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t(mode === 'signin' ? 'auth.no_account' : 'auth.have_account')}{' '}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {t(mode === 'signin' ? 'auth.sign_up' : 'auth.sign_in')}
        </button>
      </p>
    </div>
  )
}
