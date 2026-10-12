import { notFound } from 'next/navigation'
import { ShareForm } from '@/components/sharespeare/ShareForm'
import { requireViewer } from '@/lib/auth'
import { getShare, listTags } from '@/lib/data/sharespeare'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('share.edit_title') }
}

export default async function EditSharePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const viewer = await requireViewer(`/sharespeare/${id}/edit`)
  const share = Number.isSafeInteger(id) ? await getShare(id) : null
  // Only the author edits; moderators hide instead. RLS would reject the update anyway.
  if (!share || share.author?.id !== viewer.id) notFound()

  const [{ t }, tags] = await Promise.all([getT(), listTags()])
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('share.edit_title')}</h1>
      <ShareForm
        userId={viewer.id}
        tags={tags}
        initial={{
          id: share.id,
          title: share.title,
          content: share.content,
          tagIds: share.tagIds,
          media: share.media.map((m) => m.url),
          isDraft: share.status === 'DRAFT',
        }}
      />
    </div>
  )
}
