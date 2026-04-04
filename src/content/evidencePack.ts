import evidencePackEnJson from './evidence-pack.en.json'
import evidencePackZhTwJson from './evidence-pack.zh-TW.json'
import type { Locale } from '../i18n'

export type EvidenceLossPoint = {
  step: number
  loss: number
}

export type EvidencePack = {
  generatedAt: string
  locale?: string
  source: {
    gistId: string
    gistUrl: string
    rawGistUrl: string
    lineCount: number
    datasetUrl: string
  }
  quickRun: {
    numSteps: number
    patchNotes: string[]
    numDocs: number
    vocabSize: number
    numParams: number
    referenceRunPreview: string
    losses: Array<{
      step: number
      totalSteps: number
      loss: number
    }>
    lossChart: EvidenceLossPoint[]
    samples: string[]
    featuredSamples: string[]
  }
}

export const evidencePacks: Record<Locale, EvidencePack> = {
  'zh-TW': evidencePackZhTwJson as EvidencePack,
  en: evidencePackEnJson as EvidencePack,
}

export function getEvidencePack(locale: Locale): EvidencePack {
  return evidencePacks[locale]
}
