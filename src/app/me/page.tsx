import Link from 'next/link'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/me/ProfileForm'
import { ShareCard } from '@/components/sharespeare/ShareCard'
import { requireViewer } from '@/lib/auth'
import { listSharesByAuthor, listTags } from '@/lib/data/sharespeare'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('me.title') }
}

export default async function MePage() {
  const viewer = await requireViewer('/me')
  const [{ t, lang }, tags, shares] = await Promise.all([getT(), listTags(), listSharesByAuthor(viewer.id)])

  return (
    <div className="container mx-auto space-y-10 px-4 py-8">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('me.profile')}</CardTitle>
          {viewer.email && <p className="text-sm text-muted-foreground">{viewer.email}</p>}
        </CardHeader>
        <CardContent>
          <ProfileForm userId={viewer.id} displayName={viewer.displayName} avatarUrl={viewer.avatarUrl} />
        </CardContent>
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('me.my_posts')}</h2>
          <Button asChild size="sm">
            <Link href="/sharespeare/new">
              <PenLine className="h-4 w-4" />
              {t('share.new')}
            </Link>
          </Button>
        </div>
        {shares.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shares.map((share) => (
              <ShareCard key={share.id} share={share} tags={tags} lang={lang} t={t} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-muted-foreground">{t('me.no_posts')}</p>
        )}
      </section>
    </div>
  )
}
