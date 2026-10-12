import { cookies } from 'next/headers'
import { getDict, isLang, LANG_COOKIE, translate, type Lang } from './dictionaries'

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value
  return isLang(value) ? value : 'zh'
}

/** Server-side `t()` for the current request's language. */
export async function getT() {
  const lang = await getLang()
  const dict = getDict(lang)
  return {
    lang,
    t: (key: string, params?: Record<string, string | number>) => translate(dict, key, params),
  }
}
