import { useI18n, type Locale } from '../i18n'

const locales: Locale[] = ['zh-TW', 'en']

export function LocaleToggle() {
  const { locale, setLocale, toggleLabel } = useI18n()

  return (
    <div aria-label={toggleLabel} className="locale-toggle" role="group">
      {locales.map((option) => (
        <button
          aria-pressed={locale === option}
          className={locale === option ? 'locale-chip active' : 'locale-chip'}
          key={option}
          onClick={() => setLocale(option)}
          type="button"
        >
          {option === 'zh-TW' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  )
}
