import Image from 'next/image'
import Link from 'next/link'
import { EyeOff, Play, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/UserAvatar'
import type { ShareSummary, Tag } from '@/lib/data/sharespeare'
import { formatDate, type Lang } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

const TAG_STYLES: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  3: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}
const DEFAULT_TAG_STYLE = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'

export function tagLabel(tag: Tag, lang: Lang) {
  return lang === 'zh' ? tag.nameZh : tag.nameEn
}

export function TagBadge({ tag, lang }: { tag: Tag; lang: Lang }) {
  return <Badge className={TAG_STYLES[tag.id] ?? DEFAULT_TAG_STYLE}>{tagLabel(tag, lang)}</Badge>
}

interface ShareCardProps {
  share: ShareSummary
  tags: Tag[]
  lang: Lang
  t: (key: string, params?: Record<string, string | number>) => string
  featured?: boolean
  large?: boolean
}

export function ShareCard({ share, tags, lang, t, featured, large }: ShareCardProps) {
  const shareTags = tags.filter((tag) => share.tagIds.includes(tag.id))
  const cover = share.media[0]
  const extra = share.media.length - 1

  return (
    <Link href={`/sharespeare/${share.id}`} className="group block h-full">
      <Card className={cn('h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-lg', featured && 'ring-2 ring-yellow-400/70')}>
        {cover && (
          <div className={cn('relative overflow-hidden bg-muted', large ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
            {cover.kind === 'image' ? (
              <Image
                src={cover.url}
                alt=""
                fill
                sizes={large ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Play className="h-10 w-10" />
              </div>
            )}
            {extra > 0 && (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">+{extra}</span>
            )}
          </div>
        )}
        <CardHeader className="gap-2 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {shareTags.length > 0 ? (
              shareTags.map((tag) => <TagBadge key={tag.id} tag={tag} lang={lang} />)
            ) : (
              <Badge className={DEFAULT_TAG_STYLE}>{t('share.untagged')}</Badge>
            )}
            {featured && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <Star className="h-3 w-3" /> {t('share.featured')}
              </Badge>
            )}
            {share.status === 'DRAFT' && <Badge variant="outline">{t('share.draft')}</Badge>}
            {share.isHidden && (
              <Badge variant="destructive">
                <EyeOff className="h-3 w-3" /> {t('share.hidden')}
              </Badge>
            )}
          </div>
          <CardTitle className={cn('line-clamp-2 leading-snug transition-colors group-hover:text-blue-600', large ? 'text-2xl' : 'text-lg')}>
            {share.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {share.excerpt && (
            <p className={cn('text-sm text-muted-foreground', large ? 'line-clamp-4' : 'line-clamp-3')}>{share.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <UserAvatar name={share.author?.displayName} url={share.author?.avatarUrl} className="h-7 w-7" />
            <span className="font-medium">{share.author?.displayName ?? t('common.deleted_user')}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(share.publishedAt ?? share.createdAt, lang)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
