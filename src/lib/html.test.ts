import { describe, expect, it } from 'vitest'
import { toExcerpt, toSafeHtml } from './html'

describe('toSafeHtml', () => {
  it('renders Markdown', () => {
    const html = toSafeHtml('## Title\n\n- **bold** item')
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('keeps single line breaks from plain-text posts', () => {
    expect(toSafeHtml('line one\nline two')).toBe('<p>line one<br />line two</p>\n')
  })

  it.each([
    ['<script>alert(1)</script><p>hi</p>', '<script'],
    ['<img src="https://x.test/a.png" onerror="alert(1)">', 'onerror'],
    ['<a href="javascript:alert(1)">x</a>', 'javascript:'],
    ['<p style="position:fixed">x</p>', 'style='],
    ['<iframe src="https://evil.test"></iframe>', '<iframe'],
    ['[click](javascript:alert(1))', 'javascript:'],
    ['<img src="http://insecure.test/a.png">', 'http://insecure'],
  ])('strips dangerous markup: %s', (input, forbidden) => {
    expect(toSafeHtml(input)).not.toContain(forbidden)
  })

  it('makes links open safely in a new tab', () => {
    expect(toSafeHtml('[site](https://example.com)')).toContain('rel="noopener noreferrer nofollow"')
  })

  it('overrides rel/target supplied by the author', () => {
    const html = toSafeHtml('<a href="https://example.com" rel="opener" target="_self">x</a>')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
    expect(html).toContain('target="_blank"')
    expect(html).not.toContain('opener"')
  })

  it('passes through stored HTML posts after sanitizing', () => {
    expect(toSafeHtml('<h2>A</h2><p><b>B</b></p>')).toBe('<h2>A</h2><p><b>B</b></p>')
  })

  it('returns an empty string for blank content', () => {
    expect(toSafeHtml('   ')).toBe('')
    expect(toSafeHtml(null)).toBe('')
  })
})

describe('toExcerpt', () => {
  it('separates block elements with spaces', () => {
    expect(toExcerpt('<h2>Heading</h2><p>Body</p>')).toBe('Heading Body')
  })

  it('strips Markdown syntax and decodes entities', () => {
    expect(toExcerpt('## Q&A\n\n**Tom & Jerry**')).toBe('Q&A Tom & Jerry')
  })

  it('truncates with an ellipsis', () => {
    expect(toExcerpt('a'.repeat(50), 10)).toBe(`${'a'.repeat(10)}…`)
  })
})
