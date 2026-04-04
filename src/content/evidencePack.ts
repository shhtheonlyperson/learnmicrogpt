import evidencePackJson from './evidence-pack.json'

export type EvidenceLossPoint = {
  step: number
  loss: number
}

export type EvidencePack = {
  generatedAt: string
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

export const evidencePack = evidencePackJson as EvidencePack
