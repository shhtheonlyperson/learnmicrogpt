import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'zh-TW' | 'en'

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

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLabel: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

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

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

export function pickLocale<T>(locale: Locale, values: { 'zh-TW': T; en: T }): T {
  return values[locale]
}
