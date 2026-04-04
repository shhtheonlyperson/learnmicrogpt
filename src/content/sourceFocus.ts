import type { AtlasSection, LoopStep } from './copy'

type UiCopy = {
  labels: {
    sourcePanelOriginLoop: string
    sourcePanelOriginAtlas: string
    sourcePanelEyebrowAtlas: string
  }
}

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

export const sourceFocusFromLoopStep = (step: LoopStep, ui: UiCopy): SourceFocus => ({
  origin: `${ui.labels.sourcePanelOriginLoop} ${step.id}`,
  eyebrow: step.eyebrow,
  title: step.title,
  lineRange: step.lineRange,
  sourceHref: step.sourceHref,
  summary: step.summary,
  detail: step.detail,
  snippet: step.snippet,
  chips: step.signal,
})

export const sourceFocusFromAtlasSection = (section: AtlasSection, ui: UiCopy): SourceFocus => ({
  origin: `${ui.labels.sourcePanelOriginAtlas} ${section.lineRange}`,
  eyebrow: ui.labels.sourcePanelEyebrowAtlas,
  title: section.title,
  lineRange: section.lineRange,
  sourceHref: section.sourceHref,
  summary: section.summary,
  detail: section.why,
  snippet: section.snippet,
  chips: section.highlights,
})
