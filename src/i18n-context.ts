import { createContext, useContext } from 'react'
import type { Locale } from './locale'

export type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLabel: string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
