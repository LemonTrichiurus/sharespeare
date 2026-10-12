import { FileQuestion } from 'lucide-react'
import { StatusPage } from '@/components/StatusPage'
import { getT } from '@/lib/i18n/server'

export default async function NotFound() {
  const { t } = await getT()
  return <StatusPage icon={<FileQuestion className="h-8 w-8" />} title={t('notfound.title')} body={t('notfound.body')} backLabel={t('nav.home')} />
}
