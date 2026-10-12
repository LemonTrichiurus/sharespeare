import Link from 'next/link'
import { Eye, EyeOff, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionButton } from '@/components/ActionButton'
import { dismissReports, setHidden } from '@/actions/moderation'
import { requireMod } from '@/lib/auth'
import { listHiddenContent, listOpenReports, type ModerationTarget } from '@/lib/data/moderation'
import { formatDate } from '@/lib/i18n/dictionaries'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = await getT()
  return { title: t('admin.title') }
}

export default async function AdminPage() {
  await requireMod()
  const [{ t, lang }, reports, hidden] = await Promise.all([getT(), listOpenReports(), listHiddenContent()])

  const targetLabel = (target: ModerationTarget) => (
    <div className="flex min-w-0 items-center gap-2">
      <Badge variant="outline" className="shrink-0">{t(`admin.type.${target.type}`)}</Badge>
      <Link href={target.href} className="truncate font-medium hover:underline">
        {target.title || '—'}
      </Link>
    </div>
  )

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">{t('admin.title')}</h1>
        <p className="text-muted-foreground">{t('admin.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.reports')} ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.no_reports')}</p>
          ) : (
            <ul className="divide-y">
              {reports.map(({ target, reasons }) => (
                <li key={`${target.type}:${target.id}`} className="space-y-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {targetLabel(target)}
                    <Badge variant="secondary">{t('admin.report_count', { count: reasons.length })}</Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {reasons.map((r, i) => (
                      <li key={i}>
                        “{r.reason}” · {formatDate(r.createdAt, lang)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    {!target.isHidden && (
                      <ActionButton size="sm" variant="destructive" action={setHidden.bind(null, target.type, target.id, true)}>
                        <EyeOff className="h-4 w-4" />
                        {t('mod.hide')}
                      </ActionButton>
                    )}
                    <ActionButton size="sm" variant="outline" action={dismissReports.bind(null, target.type, target.id)}>
                      <X className="h-4 w-4" />
                      {t('admin.dismiss')}
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.hidden')} ({hidden.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hidden.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.no_hidden')}</p>
          ) : (
            <ul className="divide-y">
              {hidden.map((target) => (
                <li key={`${target.type}:${target.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  {targetLabel(target)}
                  <div className="flex shrink-0 gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={target.href}>{t('admin.view')}</Link>
                    </Button>
                    <ActionButton size="sm" variant="outline" action={setHidden.bind(null, target.type, target.id, false)}>
                      <Eye className="h-4 w-4" />
                      {t('mod.unhide')}
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
