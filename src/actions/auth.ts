'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireViewer } from '@/lib/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { fieldErrorsFrom, type ActionState } from './result'

const credentials = z.object({
  email: z.email('errors.email_invalid'),
  password: z.string().min(8, 'errors.password_too_short').max(72),
})

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { error: error.code === 'email_not_confirmed' ? 'auth.email_not_confirmed' : 'auth.invalid_credentials' }
  }

  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = credentials
    .extend({ displayName: z.string().trim().min(1, 'errors.name_required').max(40, 'errors.name_too_long') })
    .safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      displayName: formData.get('displayName'),
    })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const origin = (await headers()).get('origin') ?? ''
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // handle_new_user() copies display_name into the new profile row.
    options: { emailRedirectTo: `${origin}/auth/callback`, data: { display_name: parsed.data.displayName } },
  })
  if (error) return { error: error.code === 'user_already_exists' ? 'auth.email_taken' : 'auth.signup_failed' }

  // No session means the project requires email confirmation first.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/')
  }
  return { message: 'auth.check_email' }
}

/** Email a password-reset link that signs the user in and lands on /reset-password. */
export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = credentials.shape.email.safeParse(formData.get('email'))
  if (!email.success) return { fieldErrors: { email: 'errors.email_invalid' } }

  const origin = (await headers()).get('origin') ?? ''
  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  if (error?.code === 'over_email_send_rate_limit') return { error: 'auth.too_many_emails' }
  // Same message whether or not the address exists, so this can't be used to probe for accounts.
  return { message: 'auth.reset_sent' }
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer('/forgot-password')
  const password = credentials.shape.password.safeParse(formData.get('password'))
  if (!password.success) return { fieldErrors: { password: password.error.issues[0].message } }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.updateUser({ password: password.data })
  if (error?.code === 'same_password') return { fieldErrors: { password: 'auth.same_password' } }
  if (error) return { error: 'errors.save_failed' }

  redirect('/me')
}

export async function signOut() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'errors.name_required').max(40, 'errors.name_too_long'),
  // Our own uploads, or the Google profile picture set at sign-up.
  avatarUrl: z
    .string()
    .refine(
      (url) =>
        url === '' ||
        url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`) ||
        url.startsWith('https://lh3.googleusercontent.com/'),
      'errors.bad_media',
    ),
})

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer('/me')
  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName'),
    avatarUrl: formData.get('avatarUrl') ?? '',
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createSupabaseServer()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName, avatar_url: parsed.data.avatarUrl || null })
    .eq('id', viewer.id)
  if (error) return { error: 'errors.save_failed' }

  revalidatePath('/', 'layout')
  return { message: 'profile.saved' }
}
