import Link from 'next/link'
import { Lock, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/UserAvatar'
import type { TopicSummary } from '@/lib/data/topics'
import { formatDate, type Lang } from '@/lib/i18n/dictionaries'

export function TopicCard({ topic, lang, t }: { topic: TopicSummary; lang: Lang; t: (k: string, p?: Record<string, string | number>) => string }) {
  return (
    <Link href={`/topics/${topic.id}`} className="group block">
      <Card className="gap-3 transition-shadow hover:shadow-md">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="leading-snug transition-colors group-hover:text-blue-600">{topic.title}</CardTitle>
            {topic.isLocked && (
              <Badge variant="secondary" className="shrink-0">
                <Lock className="h-3 w-3" /> {t('topics.locked')}
              </Badge>
            )}
          </div>
          {topic.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{topic.excerpt}</p>}
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <UserAvatar name={topic.author?.displayName} url={topic.author?.avatarUrl} className="h-5 w-5 text-[10px]" />
            <span>{topic.author?.displayName ?? t('common.deleted_user')}</span>
            <span>·</span>
            <span>{formatDate(topic.createdAt, lang)}</span>
            <span className="ml-auto flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {t('topics.comment_count', { count: topic.commentCount })}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
