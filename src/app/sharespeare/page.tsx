import Link from 'next/link'
import { PenLine, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShareCard, tagLabel } from '@/components/sharespeare/ShareCard'
import { getViewer } from '@/lib/auth'
import { getFeaturedShareId, listShares, listTags } from '@/lib/data/sharespeare'
import { getT } from '@/lib/i18n/server'

export const metadata = { title: 'Sharespeare' }

export default async function SharespearePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() || undefined
  const [{ t, lang }, viewer, tags, featuredId] = await Promise.all([getT(), getViewer(), listTags(), getFeaturedShareId()])
  const tagId = tags.find((tag) => String(tag.id) === params.tag)?.id
  const shares = await listShares({ tagId, query })
  const isFiltered = Boolean(tagId || query)

  const hrefFor = (nextTag?: number) => {
    const sp = new URLSearchParams()
    if (nextTag) sp.set('tag', String(nextTag))
    if (query) sp.set('q', query)
    const qs = sp.toString()
    return qs ? `/sharespeare?${qs}` : '/sharespeare'
  }

  return (
    <>
      <section className="bg-[#0b1220] py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-3 text-4xl font-extrabold md:text-5xl">Sharespeare</h1>
          <p className="mx-auto max-w-3xl text-base text-gray-300 md:text-lg">{t('share.hero_subtitle')}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <form action="/sharespeare" className="flex flex-1 gap-2">
            {tagId && <input type="hidden" name="tag" value={tagId} />}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} placeholder={t('share.search_placeholder')} className="pl-10" />
            </div>
            <Button type="submit" variant="outline">{t('share.search')}</Button>
          </form>
          {viewer && (
            <Button asChild>
              <Link href="/sharespeare/new">
                <PenLine className="h-4 w-4" />
                {t('share.new')}
              </Link>
            </Button>
          )}
        </div>

        <nav className="mb-8 flex flex-wrap gap-2">
          <Button asChild size="sm" variant={tagId ? 'outline' : 'default'}>
            <Link href={hrefFor()}>{t('share.all')}</Link>
          </Button>
          {tags.map((tag) => (
            <Button key={tag.id} asChild size="sm" variant={tagId === tag.id ? 'default' : 'outline'} title={tag.description ?? undefined}>
              <Link href={hrefFor(tag.id)}>{tagLabel(tag, lang)}</Link>
            </Button>
          ))}
        </nav>

        {shares.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{t('share.count', { count: shares.length })}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shares.map((share) => (
                <ShareCard key={share.id} share={share} tags={tags} lang={lang} t={t} featured={share.id === featuredId} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="mb-4 text-muted-foreground">{isFiltered ? t('share.empty_filtered') : t('share.empty')}</p>
            {isFiltered && (
              <Button asChild variant="outline">
                <Link href="/sharespeare">{t('share.clear_filters')}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
