import { Card, CardContent } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/PasswordForms'
import { requireViewer } from '@/lib/auth'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('auth.reset_title') }
}

// Reached from the reset email: /auth/callback has already signed the user in.
export default async function ResetPasswordPage() {
  await requireViewer('/forgot-password')
  return (
    <div className="container mx-auto flex max-w-md px-4 py-16">
      <Card className="w-full">
        <CardContent className="p-6 sm:p-8">
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
