import { ShareForm } from '@/components/sharespeare/ShareForm'
import { requireViewer } from '@/lib/auth'
import { listTags } from '@/lib/data/sharespeare'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('share.new_title') }
}

export default async function NewSharePage() {
  const viewer = await requireViewer('/sharespeare/new')
  const [{ t }, tags] = await Promise.all([getT(), listTags()])
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('share.new_title')}</h1>
      <ShareForm userId={viewer.id} tags={tags} />
    </div>
  )
}
