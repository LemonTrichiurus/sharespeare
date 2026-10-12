import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AuthForms } from '@/components/auth/AuthForms'
import { getViewer } from '@/lib/auth'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('auth.sign_in') }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams
  const next = rawNext?.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'
  if (await getViewer()) redirect(next)

  return (
    <div className="container mx-auto flex max-w-md items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="p-6 sm:p-8">
          <AuthForms next={next} initialError={error === 'callback' ? 'auth.callback_failed' : undefined} />
        </CardContent>
      </Card>
    </div>
  )
}
