export type Locale = 'zh-TW' | 'en'

export function pickLocale<T>(locale: Locale, values: { 'zh-TW': T; en: T }): T {
  return values[locale]
}
