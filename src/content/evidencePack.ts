import evidencePackEnJson from './evidence-pack.en.json'
import evidencePackZhTwJson from './evidence-pack.zh-TW.json'
import type { Locale } from '../locale'

export type EvidenceLossPoint = {
  step: number
  loss: number
}

export type EvidenceTrainingStep = {
  step: number
  doc: string
  learningRate: number
  tokenIds: number[]
  numTargets: number
}

export type EvidenceForwardCandidate = {
  token: string
  tokenId: number
  logit: number
  probability: number
}

export type EvidenceForwardPosition = {
  posId: number
  currentToken: string
  currentTokenId: number
  targetToken: string
  targetTokenId: number
  historyTokens: string[]
  tokenEmbedding: number[]
  positionEmbedding: number[]
  combined: number[]
  inputRms: number[]
  attentionHeadWeights: number[][]
  attentionAverageWeights: number[]
  attentionResidual: number[]
  mlpActiveCount: number
  mlpResidual: number[]
  topCandidates: EvidenceForwardCandidate[]
}

export type EvidenceForwardProbe = {
  name: string
  sequenceTokens: string[]
  positions: EvidenceForwardPosition[]
}

export type ForwardPassEvidencePack = {
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
    forwardPass: {
      embeddingDim: number
      numHeads: number
      headDim: number
      probes: EvidenceForwardProbe[]
    }
  }
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
    trainingSteps: EvidenceTrainingStep[]
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
