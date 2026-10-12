import { ShieldX } from 'lucide-react'
import { StatusPage } from '@/components/StatusPage'
import { getT } from '@/lib/i18n/server'

export default async function ForbiddenPage() {
  const { t } = await getT()
  return <StatusPage icon={<ShieldX className="h-8 w-8" />} title={t('forbidden.title')} body={t('forbidden.body')} backLabel={t('nav.home')} />
}
