'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, LogOut, Menu, PenLine, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { UserAvatar } from '@/components/UserAvatar'
import { useI18n } from '@/contexts/I18nContext'
import { signOut } from '@/actions/auth'
import { cn } from '@/lib/utils'

export interface HeaderViewer {
  displayName: string | null
  avatarUrl: string | null
  isMod: boolean
}

const NAV = [
  { key: 'nav.sharespeare', href: '/sharespeare' },
  { key: 'nav.topics', href: '/topics' },
]

export function Header({ viewer }: { viewer: HeaderViewer | null }) {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const linkClass = (href: string) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive(href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    )

  const links = [
    ...NAV,
    ...(viewer ? [{ key: 'nav.me', href: '/me' }] : []),
    ...(viewer?.isMod ? [{ key: 'nav.admin', href: '/admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="font-serif text-2xl font-bold italic text-muted-foreground">
          Sharespeare
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.key === 'nav.admin' && <Shield className="mr-1 inline h-4 w-4" />}
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {viewer && (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/sharespeare/new">
                <PenLine className="h-4 w-4" />
                {t('nav.write')}
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {t('common.language')}
          </Button>
          <ThemeToggle />
          {viewer ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/me" aria-label={t('nav.me')}>
                <UserAvatar name={viewer.displayName} url={viewer.avatarUrl} className="h-8 w-8" />
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm" aria-label={t('auth.sign_out')}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                <LogIn className="h-4 w-4" />
                {t('auth.sign_in')}
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="container mx-auto flex flex-col gap-1 border-t px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {t(l.key)}
            </Link>
          ))}
          {viewer ? (
            <>
              <Link href="/sharespeare/new" className={linkClass('/sharespeare/new')}>
                {t('nav.write')}
              </Link>
              <form action={signOut}>
                <button type="submit" className={cn(linkClass('#'), 'w-full text-left')}>
                  {t('auth.sign_out')}
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={linkClass('/login')}>
              {t('auth.sign_in')}
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
