import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, EyeOff, Lock, Trash2, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ActionButton'
import { ReportButton } from '@/components/ReportButton'
import { RichText } from '@/components/RichText'
import { UserAvatar } from '@/components/UserAvatar'
import { CommentForm } from '@/components/topics/CommentForm'
import { deleteComment, deleteTopic } from '@/actions/topics'
import { setHidden, setTopicLocked } from '@/actions/moderation'
import { getViewer } from '@/lib/auth'
import { getTopic, listComments } from '@/lib/data/topics'
import { formatDate } from '@/lib/i18n/dictionaries'
import { getT } from '@/lib/i18n/server'

type Props = { params: Promise<{ id: string }> }

async function load(params: Props['params']) {
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const topic = await getTopic(id)
  if (!topic) notFound()
  return topic
}

export async function generateMetadata({ params }: Props) {
  const topic = await load(params)
  return { title: topic.title, description: topic.excerpt }
}

export default async function TopicPage({ params }: Props) {
  const topic = await load(params)
  const [{ t, lang }, viewer, comments] = await Promise.all([getT(), getViewer(), listComments(topic.id)])
  const isAuthor = viewer?.id === topic.author?.id

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link href="/topics">
          <ArrowLeft className="h-4 w-4" />
          {t('topics.back')}
        </Link>
      </Button>

      {topic.isHidden && (
        <p className="mb-6 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <EyeOff className="h-4 w-4 shrink-0" />
          {t('mod.hidden_notice')}
        </p>
      )}

      <article className="mb-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-tight">{topic.title}</h1>
          {topic.isLocked && (
            <Badge variant="secondary" className="mt-2 shrink-0">
              <Lock className="h-3 w-3" /> {t('topics.locked')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar name={topic.author?.displayName} url={topic.author?.avatarUrl} className="h-7 w-7" />
          <span className="font-medium text-foreground">{topic.author?.displayName ?? t('common.deleted_user')}</span>
          <span>·</span>
          <span>{formatDate(topic.createdAt, lang)}</span>
        </div>
        <RichText content={topic.body} />

        {viewer && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            {(isAuthor || viewer.isMod) && (
              <ActionButton
                variant="outline"
                size="sm"
                className="text-destructive"
                action={deleteTopic.bind(null, topic.id)}
                confirm={t('topics.delete_confirm')}
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </ActionButton>
            )}
            {viewer.isMod && (
              <>
                <ActionButton variant="outline" size="sm" action={setTopicLocked.bind(null, topic.id, !topic.isLocked)}>
                  {topic.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {topic.isLocked ? t('mod.unlock') : t('mod.lock')}
                </ActionButton>
                <ActionButton variant="outline" size="sm" action={setHidden.bind(null, 'topic', topic.id, !topic.isHidden)}>
                  <EyeOff className="h-4 w-4" />
                  {topic.isHidden ? t('mod.unhide') : t('mod.hide')}
                </ActionButton>
              </>
            )}
            {!isAuthor && (
              <div className="ml-auto">
                <ReportButton type="topic" id={topic.id} />
              </div>
            )}
          </div>
        )}
      </article>

      <section aria-labelledby="comments-heading" className="space-y-6">
        <h2 id="comments-heading" className="text-xl font-semibold">
          {t('topics.comments')} ({comments.length})
        </h2>

        {comments.length === 0 && <p className="text-muted-foreground">{t('topics.no_comments')}</p>}

        <ul className="space-y-4">
          {comments.map((comment) => {
            const isCommentAuthor = viewer?.id === comment.author?.id
            return (
              <li key={comment.id} id={`comment-${comment.id}`} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <UserAvatar name={comment.author?.displayName} url={comment.author?.avatarUrl} className="h-7 w-7" />
                  <span className="font-medium">{comment.author?.displayName ?? t('common.deleted_user')}</span>
                  <span className="text-muted-foreground">{formatDate(comment.createdAt, lang)}</span>
                  {comment.isHidden && (
                    <Badge variant="destructive" className="ml-auto">
                      <EyeOff className="h-3 w-3" /> {t('share.hidden')}
                    </Badge>
                  )}
                </div>
                <RichText content={comment.body} className="prose-sm" />
                {viewer && (
                  <div className="mt-2 flex items-center gap-1">
                    {(isCommentAuthor || viewer.isMod) && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        action={deleteComment.bind(null, topic.id, comment.id)}
                        confirm={t('topics.delete_comment_confirm')}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('common.delete')}
                      </ActionButton>
                    )}
                    {viewer.isMod && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        action={setHidden.bind(null, 'comment', comment.id, !comment.isHidden)}
                      >
                        <EyeOff className="h-4 w-4" />
                        {comment.isHidden ? t('mod.unhide') : t('mod.hide')}
                      </ActionButton>
                    )}
                    {!isCommentAuthor && <ReportButton type="comment" id={comment.id} />}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {topic.isLocked ? (
          <p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">{t('topics.locked_notice')}</p>
        ) : viewer ? (
          <CommentForm topicId={topic.id} />
        ) : (
          <Button asChild variant="outline">
            <Link href={`/login?next=/topics/${topic.id}`}>{t('topics.sign_in_to_comment')}</Link>
          </Button>
        )}
      </section>
    </div>
  )
}
