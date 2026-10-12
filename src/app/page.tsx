import Link from 'next/link'
import { ArrowRight, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareCard } from '@/components/sharespeare/ShareCard'
import { TopicCard } from '@/components/topics/TopicCard'
import { getViewer } from '@/lib/auth'
import { getFeaturedShareId, getShare, listShares, listTags } from '@/lib/data/sharespeare'
import { listTopics } from '@/lib/data/topics'
import { getT } from '@/lib/i18n/server'

export default async function HomePage() {
  const [{ t, lang }, viewer, tags, featuredId, latest, topics] = await Promise.all([
    getT(),
    getViewer(),
    listTags(),
    getFeaturedShareId(),
    listShares({ limit: 7 }),
    listTopics(3),
  ])
  const featuredDetail = featuredId ? await getShare(featuredId) : null
  // Only feature a post every visitor can actually see.
  const featured = featuredDetail?.status === 'PUBLISHED' && !featuredDetail.isHidden ? featuredDetail : null
  const recent = latest.filter((s) => s.id !== featured?.id).slice(0, 6)

  return (
    <>
      <section className="bg-[#0b1220] py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-serif text-5xl font-extrabold italic md:text-6xl">{t('home.hero_title')}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">{t('home.hero_subtitle')}</p>
          <div className="flex justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/sharespeare">{t('home.cta_browse')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href={viewer ? '/sharespeare/new' : '/login?next=/sharespeare/new'}>
                <PenLine className="h-4 w-4" />
                {t('home.cta_write')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto space-y-14 px-4 py-12">
        {featured && (
          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('home.featured')}</h2>
            <div className="mx-auto max-w-4xl">
              <ShareCard share={featured} tags={tags} lang={lang} t={t} featured large />
            </div>
          </section>
        )}

        <section>
          <SectionHeading title={t('home.latest_shares')} href="/sharespeare" linkText={t('home.view_all')} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((share) => (
              <ShareCard key={share.id} share={share} tags={tags} lang={lang} t={t} />
            ))}
          </div>
        </section>

        {topics.length > 0 && (
          <section className="mx-auto max-w-3xl">
            <SectionHeading title={t('home.latest_topics')} href="/topics" linkText={t('home.view_all')} />
            <div className="space-y-4">
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} lang={lang} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function SectionHeading({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
