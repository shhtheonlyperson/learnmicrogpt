import type { AtlasSection } from './atlasSections'
import type { LoopStep } from './loopSteps'

export type SourceFocus = {
  origin: string
  eyebrow: string
  title: string
  lineRange: string
  sourceHref: string
  summary: string
  detail: string
  snippet: string
  chips: string[]
}

export const sourceFocusFromLoopStep = (step: LoopStep): SourceFocus => ({
  origin: `循環步驟 ${step.id}`,
  eyebrow: step.eyebrow,
  title: step.title,
  lineRange: step.lineRange,
  sourceHref: step.sourceHref,
  summary: step.summary,
  detail: step.detail,
  snippet: step.snippet,
  chips: step.signal,
})

export const sourceFocusFromAtlasSection = (section: AtlasSection): SourceFocus => ({
  origin: `地圖區段 ${section.lineRange}`,
  eyebrow: '單檔地圖',
  title: section.title,
  lineRange: section.lineRange,
  sourceHref: section.sourceHref,
  summary: section.summary,
  detail: section.why,
  snippet: section.snippet,
  chips: section.highlights,
})
