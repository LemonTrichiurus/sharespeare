import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, EyeOff, Pencil, Star, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ActionButton'
import { ReportButton } from '@/components/ReportButton'
import { RichText } from '@/components/RichText'
import { UserAvatar } from '@/components/UserAvatar'
import { MediaGallery } from '@/components/sharespeare/MediaGallery'
import { TagBadge } from '@/components/sharespeare/ShareCard'
import { deleteShare } from '@/actions/sharespeare'
import { setFeaturedShare, setHidden } from '@/actions/moderation'
import { getViewer } from '@/lib/auth'
import { getFeaturedShareId, getShare, listTags } from '@/lib/data/sharespeare'
import { formatDate } from '@/lib/i18n/dictionaries'
import { getT } from '@/lib/i18n/server'

type Props = { params: Promise<{ id: string }> }

async function load(params: Props['params']) {
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const share = await getShare(id)
  if (!share) notFound()
  return share
}

export async function generateMetadata({ params }: Props) {
  const share = await load(params)
  const image = share.media.find((m) => m.kind === 'image')?.url
  return {
    title: share.title,
    description: share.excerpt,
    openGraph: { title: share.title, description: share.excerpt, images: image ? [image] : [] },
  }
}

export default async function SharePage({ params }: Props) {
  const share = await load(params)
  const [{ t, lang }, viewer, tags, featuredId] = await Promise.all([getT(), getViewer(), listTags(), getFeaturedShareId()])
  const isAuthor = viewer?.id === share.author?.id
  const isFeatured = featuredId === share.id
  const shareTags = tags.filter((tag) => share.tagIds.includes(tag.id))

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link href="/sharespeare">
          <ArrowLeft className="h-4 w-4" />
          {t('share.back')}
        </Link>
      </Button>

      {share.isHidden && (
        <p className="mb-6 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <EyeOff className="h-4 w-4 shrink-0" />
          {t('mod.hidden_notice')}
        </p>
      )}

      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {shareTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} lang={lang} />
          ))}
          {isFeatured && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              <Star className="h-3 w-3" /> {t('share.featured')}
            </Badge>
          )}
          {share.status === 'DRAFT' && <Badge variant="outline">{t('share.draft')}</Badge>}
        </div>
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">{share.title}</h1>
        <div className="flex items-center gap-3">
          <UserAvatar name={share.author?.displayName} url={share.author?.avatarUrl} className="h-11 w-11" />
          <div>
            <p className="font-medium">{share.author?.displayName ?? t('common.deleted_user')}</p>
            <p className="text-sm text-muted-foreground">
              {share.publishedAt
                ? t('share.published_on', { date: formatDate(share.publishedAt, lang) })
                : t('share.created_on', { date: formatDate(share.createdAt, lang) })}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <RichText content={share.content} className="leading-relaxed" />
        <MediaGallery media={share.media} />
      </div>

      {viewer && (
        <footer className="mt-10 flex flex-wrap items-center gap-2 border-t pt-6">
          {isAuthor && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/sharespeare/${share.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  {t('share.edit')}
                </Link>
              </Button>
              <ActionButton
                variant="outline"
                size="sm"
                className="text-destructive"
                action={deleteShare.bind(null, share.id)}
                confirm={t('share.delete_confirm')}
              >
                <Trash2 className="h-4 w-4" />
                {t('share.delete')}
              </ActionButton>
            </>
          )}
          {viewer.isMod && (
            <>
              {share.status === 'PUBLISHED' && !share.isHidden && (
                <ActionButton variant="outline" size="sm" action={setFeaturedShare.bind(null, isFeatured ? null : share.id)}>
                  <Star className="h-4 w-4" />
                  {isFeatured ? t('mod.unfeature') : t('mod.feature')}
                </ActionButton>
              )}
              <ActionButton variant="outline" size="sm" action={setHidden.bind(null, 'sharespeare', share.id, !share.isHidden)}>
                <EyeOff className="h-4 w-4" />
                {share.isHidden ? t('mod.unhide') : t('mod.hide')}
              </ActionButton>
            </>
          )}
          {!isAuthor && (
            <div className="ml-auto">
              <ReportButton type="sharespeare" id={share.id} />
            </div>
          )}
        </footer>
      )}
    </article>
  )
}
