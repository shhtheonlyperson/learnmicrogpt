import evidencePackEnJson from './evidence-pack.en.json'
import zhNamesRaw from '../../data/names_zh_tw.txt?raw'
import type { Locale } from '../locale'

export const BOS_TOKEN = 'BOS'
export const MICROGPT_EMBEDDING_DIM = 16

const ENGLISH_CHARS = Array.from('abcdefghijklmnopqrstuvwxyz')
const zhCorpus = zhNamesRaw.split(/\r?\n/).filter(Boolean)
const zhChars = Array.from(new Set(zhCorpus.join(''))).sort((left, right) =>
  left.localeCompare(right, 'zh-Hant'),
)

const englishSamplePool = Array.from(
  new Set(['emma', 'olivia', 'ava', 'mia', ...evidencePackEnJson.quickRun.samples.map((sample) => sample.trim())]),
).filter(Boolean)

export type LocaleModelData = {
  chars: string[]
  corpus: string[]
  exampleName: string
  maxNameLength: number
  previewNames: string[]
}

export const getLocaleModelData = (locale: Locale): LocaleModelData =>
  locale === 'zh-TW'
    ? {
        chars: zhChars,
        corpus: zhCorpus,
        exampleName: zhCorpus[0] ?? '陳冠宇',
        maxNameLength: 6,
        previewNames: zhCorpus.slice(0, 24),
      }
    : {
        chars: ENGLISH_CHARS,
        corpus: englishSamplePool,
        exampleName: 'emma',
        maxNameLength: 16,
        previewNames: englishSamplePool,
      }

export const buildCharToId = (chars: string[]) => new Map(chars.map((char, index) => [char, index]))

export const normalizeModelInput = (
  value: string,
  locale: Locale,
  allowedChars: Set<string>,
  maxLength: number,
) => {
  const base = locale === 'en' ? value.toLowerCase() : value.replace(/\s+/g, '')
  return Array.from(base)
    .filter((char) => allowedChars.has(char))
    .slice(0, maxLength)
    .join('')
}
