import { Card, CardContent } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/auth/PasswordForms'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('auth.forgot_title') }
}

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex max-w-md px-4 py-16">
      <Card className="w-full">
        <CardContent className="p-6 sm:p-8">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
