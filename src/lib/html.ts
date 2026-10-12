import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

// Everything users write passes through here before it reaches
// dangerouslySetInnerHTML. New posts are Markdown; a few older posts were
// saved as HTML. Both are rendered, then sanitized with the same allowlist.

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'figure', 'figcaption', 'u', 's', 'del', 'ins', 'mark', 'sup', 'sub',
  ],
  allowedAttributes: {
    // rel/target are always overwritten by transformTags below.
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
}

const LOOKS_LIKE_HTML = /<\/?(p|div|br|h[1-6]|ul|ol|li|b|i|strong|em|a|img|span|blockquote)\b[^>]*>/i

/** Safe HTML for rendering a post body. */
export function toSafeHtml(content: string | null | undefined): string {
  if (!content?.trim()) return ''
  const html = LOOKS_LIKE_HTML.test(content)
    ? content
    : (marked.parse(content, { async: false, gfm: true, breaks: true }) as string)
  return sanitizeHtml(html, ALLOWED)
}

/** Plain-text excerpt for cards and meta descriptions. */
export function toExcerpt(content: string | null | undefined, maxLength = 160): string {
  const html = toSafeHtml(content)
  // Break between block elements so "<h2>A</h2><p>B</p>" reads "A B", not "AB".
  const spaced = html.replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|blockquote|figcaption)>/gi, '$& ')
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text
}
