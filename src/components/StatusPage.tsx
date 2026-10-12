import Link from 'next/link'
import { Button } from '@/components/ui/button'

/** Full-page message for 403/404 states. */
export function StatusPage({ icon, title, body, backLabel }: { icon: React.ReactNode; title: string; body: string; backLabel: string }) {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <h1 className="mb-2 text-2xl font-bold">{title}</h1>
      <p className="mb-8 text-muted-foreground">{body}</p>
      <Button asChild variant="outline">
        <Link href="/">{backLabel}</Link>
      </Button>
    </div>
  )
}
