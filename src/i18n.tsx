import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nContextValue } from './i18n-context'
import type { Locale } from './locale'

const STORAGE_KEY = 'microgpt-locale'

const normalizeLocale = (value?: string | null): Locale => {
  if (!value) return 'en'
  return value.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
}

const detectInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh-TW' || stored === 'en') return stored

  return normalizeLocale(window.navigator.language)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      toggleLabel: locale === 'zh-TW' ? '語言切換' : 'Language switch',
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
