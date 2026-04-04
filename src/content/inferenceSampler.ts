import { BOS_TOKEN, getLocaleModelData } from './microgptData'
import type { Locale } from '../locale'

const EOS = 'EOS'
const ORDER = 2

type CountRow = Map<string, number>

type SamplerModel = {
  rows: Map<string, CountRow>
  globalCounts: CountRow
  corpusSet: Set<string>
  corpusSize: number
}

export type InferenceTransition = {
  context: string
  from: string
  to: string
}

export type InferenceSample = {
  id: string
  name: string
  origin: 'reference' | 'generated'
  seenInCorpus: boolean
  transitions: InferenceTransition[]
}

const samplerConfig = (locale: Locale) => {
  const data = getLocaleModelData(locale)

  return {
    corpus: data.corpus,
    minLength: 2,
    maxLength: locale === 'zh-TW' ? 4 : 8,
  }
}

const modelCache = new Map<Locale, SamplerModel>()

const recordCount = (row: CountRow, token: string) => {
  row.set(token, (row.get(token) ?? 0) + 1)
}

const getHistoryKey = (history: string[], size: number) => history.slice(-size).join('\u0001')

const normalizeRow = (row: CountRow) => {
  const total = Array.from(row.values()).reduce((sum, count) => sum + count, 0)
  const normalized = new Map<string, number>()

  if (total === 0) return normalized

  row.forEach((count, token) => {
    normalized.set(token, count / total)
  })

  return normalized
}

const getModel = (locale: Locale) => {
  const cached = modelCache.get(locale)
  if (cached) return cached

  const { corpus } = samplerConfig(locale)
  const rows = new Map<string, CountRow>()
  const globalCounts = new Map<string, number>()

  corpus.forEach((name) => {
    const chars = Array.from(name)
    const tokens = [BOS_TOKEN, ...chars, EOS]

    for (let index = 1; index < tokens.length; index += 1) {
      for (let size = 0; size <= ORDER; size += 1) {
        const context = tokens.slice(Math.max(0, index - size), index)
        const key = context.join('\u0001')

        if (!rows.has(key)) rows.set(key, new Map())
        recordCount(rows.get(key)!, tokens[index]!)
      }

      recordCount(globalCounts, tokens[index]!)
    }
  })

  const model = {
    rows,
    globalCounts,
    corpusSet: new Set(corpus),
    corpusSize: corpus.length,
  }

  modelCache.set(locale, model)
  return model
}

const getRowForHistory = (model: SamplerModel, history: string[]) => {
  for (let size = Math.min(ORDER, history.length); size >= 0; size -= 1) {
    const key = getHistoryKey(history, size)
    const row = model.rows.get(key)
    if (row && row.size > 0) return row
  }

  return model.globalCounts
}

const buildCandidates = (row: CountRow, model: SamplerModel, temperature: number, minLength: number, currentLength: number) => {
  const localProb = normalizeRow(row)
  const globalProb = normalizeRow(model.globalCounts)
  const blend = Math.min(0.42, Math.max(0, temperature - 0.5) * 0.36)
  const tokens = new Set([...localProb.keys(), ...globalProb.keys()])

  const candidates = Array.from(tokens)
    .map((token) => {
      if (token === EOS && currentLength < minLength) return null

      const mixed = (1 - blend) * (localProb.get(token) ?? 0) + blend * (globalProb.get(token) ?? 0)
      if (mixed <= 0) return null

      return {
        token,
        weight: Math.pow(mixed, 1 / Math.max(0.18, temperature)),
      }
    })
    .filter((candidate): candidate is { token: string; weight: number } => Boolean(candidate))

  return candidates
}

const chooseToken = (candidates: Array<{ token: string; weight: number }>) => {
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
  if (total <= 0) return EOS

  let threshold = Math.random() * total

  for (const candidate of candidates) {
    threshold -= candidate.weight
    if (threshold <= 0) return candidate.token
  }

  return candidates[candidates.length - 1]?.token ?? EOS
}

const buildTrace = (name: string): InferenceTransition[] => {
  const tokens = [BOS_TOKEN, ...Array.from(name)]
  return tokens.slice(0, -1).map((token, index) => ({
    context: tokens.slice(0, index + 1).join(' -> '),
    from: token,
    to: tokens[index + 1] ?? BOS_TOKEN,
  }))
}

const sampleName = (locale: Locale, temperature: number) => {
  const model = getModel(locale)
  const config = samplerConfig(locale)
  const history: string[] = []
  const transitions: InferenceTransition[] = []

  while (history.length < config.maxLength) {
    const row = getRowForHistory(model, history)
    const candidates = buildCandidates(row, model, temperature, config.minLength, history.length)
    const nextToken = chooseToken(candidates)

    if (nextToken === EOS) break

    transitions.push({
      context: history.length === 0 ? BOS_TOKEN : history.slice(-ORDER).join(''),
      from: history.at(-1) ?? BOS_TOKEN,
      to: nextToken,
    })

    history.push(nextToken)
  }

  const name = history.join('')

  if (!name) {
    const fallback = model.corpusSet.values().next().value ?? ''
    return {
      name: fallback,
      transitions: buildTrace(fallback),
      seenInCorpus: model.corpusSet.has(fallback),
    }
  }

  return {
    name,
    transitions,
    seenInCorpus: model.corpusSet.has(name),
  }
}

export const createReferenceInferenceSamples = (locale: Locale, names: string[]): InferenceSample[] => {
  const model = getModel(locale)

  return names.map((name, index) => ({
    id: `reference-${index}`,
    name,
    origin: 'reference',
    seenInCorpus: model.corpusSet.has(name),
    transitions: buildTrace(name),
  }))
}

export const generateInferenceSamples = (locale: Locale, temperature: number, count: number): InferenceSample[] => {
  const seen = new Set<string>()
  const generated: InferenceSample[] = []
  const maxAttempts = Math.max(count * 10, 24)

  for (let attempt = 0; attempt < maxAttempts && generated.length < count; attempt += 1) {
    const sample = sampleName(locale, temperature)
    if (seen.has(sample.name)) continue

    seen.add(sample.name)
    generated.push({
      id: `generated-${temperature.toFixed(2)}-${attempt}`,
      name: sample.name,
      origin: 'generated',
      seenInCorpus: sample.seenInCorpus,
      transitions: sample.transitions,
    })
  }

  return generated
}

export const getInferenceSamplerMeta = (locale: Locale) => {
  const model = getModel(locale)

  return {
    corpusSize: model.corpusSize,
    sourceKind: locale === 'zh-TW' ? 'local-corpus' : 'reference-bank',
  } as const
}
