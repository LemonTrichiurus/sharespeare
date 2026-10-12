import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TopicCard } from '@/components/topics/TopicCard'
import { TopicForm } from '@/components/topics/TopicForm'
import { getViewer } from '@/lib/auth'
import { listTopics } from '@/lib/data/topics'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('topics.title') }
}

export default async function TopicsPage() {
  const [{ t, lang }, viewer, topics] = await Promise.all([getT(), getViewer(), listTopics()])

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{t('topics.title')}</h1>
          <p className="text-muted-foreground">{t('topics.subtitle')}</p>
        </div>
        {viewer ? (
          <TopicForm />
        ) : (
          <Button asChild variant="outline">
            <Link href="/login?next=/topics">{t('topics.sign_in_to_comment')}</Link>
          </Button>
        )}
      </div>

      {topics.length > 0 ? (
        <div className="space-y-4">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} lang={lang} t={t} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">{t('topics.empty')}</p>
      )}
    </div>
  )
}
