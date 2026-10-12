import { toSafeHtml } from '@/lib/html'
import { cn } from '@/lib/utils'

/** Renders stored post content (HTML or plain text) after sanitizing it. */
export function RichText({ content, className }: { content: string | null | undefined; className?: string }) {
  return (
    <div
      className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: toSafeHtml(content) }}
    />
  )
}
