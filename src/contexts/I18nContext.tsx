'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDict, LANG_COOKIE, translate, type Lang } from '@/lib/i18n/dictionaries'

export type { Lang } from '@/lib/i18n/dictionaries'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// The language lives in a cookie so server components render in the same
// language; changing it refreshes the server-rendered parts of the page.
export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
    router.refresh()
  }, [router])

  const value = useMemo<I18nContextValue>(() => {
    const dict = getDict(lang)
    return { lang, setLang, t: (key, params) => translate(dict, key, params) }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
