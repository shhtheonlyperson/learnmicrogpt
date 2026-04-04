import type { ForwardPassEvidencePack } from './evidencePack'
import type { Locale } from '../locale'

const loaders: Record<Locale, () => Promise<{ default: ForwardPassEvidencePack }>> = {
  en: () => import('./forward-pass.en.json'),
  'zh-TW': () => import('./forward-pass.zh-TW.json'),
}

const cache = new Map<Locale, Promise<ForwardPassEvidencePack>>()

export function loadForwardPassEvidence(locale: Locale): Promise<ForwardPassEvidencePack> {
  if (!cache.has(locale)) {
    cache.set(locale, loaders[locale]().then((module) => module.default))
  }

  return cache.get(locale)!
}
