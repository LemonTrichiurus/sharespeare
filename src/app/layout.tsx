import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { I18nProvider } from '@/contexts/I18nContext'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'
import { getViewer } from '@/lib/auth'
import { getT } from '@/lib/i18n/server'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT()
  return {
    title: { default: 'Sharespeare', template: '%s · Sharespeare' },
    description: t('home.hero_subtitle'),
    openGraph: { title: 'Sharespeare', description: t('home.hero_subtitle'), type: 'website' },
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ lang, t }, viewer] = await Promise.all([getT(), getViewer()])
  return (
    <html lang={lang === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider initialLang={lang}>
            <div className="flex min-h-screen flex-col">
              <Header
                viewer={viewer && { displayName: viewer.displayName, avatarUrl: viewer.avatarUrl, isMod: viewer.isMod }}
              />
              <main className="flex-1">{children}</main>
              <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                {t('footer.about')} ·{' '}
                <a href="https://github.com/LemonTrichiurus/sharespeare" className="underline-offset-4 hover:underline">
                  GitHub
                </a>
              </footer>
            </div>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
