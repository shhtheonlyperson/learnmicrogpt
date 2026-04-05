import { startTransition, useMemo } from 'react'
import { ForwardPassPlayground } from '../components/ForwardPassPlayground'
import { InferencePlayground } from '../components/InferencePlayground'
import { TokenizerPlayground } from '../components/TokenizerPlayground'
import { TrainingPlayground } from '../components/TrainingPlayground'
import { SectionIntro } from '../components/SectionIntro'
import type { getCopy } from '../content/copy'
import {
  getInteractiveLabCopy,
  type InteractiveLabChapter,
  type InteractiveLabId,
} from '../content/interactiveLab'
import { useI18n } from '../i18n-context'

type InteractiveLabSectionProps = {
  activeLabId: InteractiveLabId
  copy: ReturnType<typeof getCopy>
  onSelectLab: (id: InteractiveLabId) => void
}

export function InteractiveLabSection({
  activeLabId,
  copy,
  onSelectLab,
}: InteractiveLabSectionProps) {
  const { locale } = useI18n()
  const sectionCopy = getInteractiveLabCopy(locale)

  const stepsById = useMemo(
    () => new Map(copy.loopSteps.map((step) => [step.id, step])),
    [copy.loopSteps],
  )

  const tokenizerStep = stepsById.get('02') ?? copy.loopSteps[0]!
  const forwardStep =
    stepsById.get('06') ??
    copy.loopSteps.find((step) => step.visualKind === 'attention') ??
    copy.loopSteps[0]!
  const trainingStep =
    stepsById.get('08') ??
    copy.loopSteps.find((step) => step.visualKind === 'loss') ??
    copy.loopSteps[0]!
  const activeChapter =
    sectionCopy.chapters.find((chapter) => chapter.id === activeLabId) ??
    sectionCopy.chapters[0]!

  const renderLab = (chapter: InteractiveLabChapter) => {
    switch (chapter.id) {
      case 'tokenizer':
        return <TokenizerPlayground step={tokenizerStep} />
      case 'forward':
        return <ForwardPassPlayground step={forwardStep} />
      case 'training':
        return <TrainingPlayground accentColor={trainingStep.palette.accentStrong} />
      case 'inference':
        return <InferencePlayground referenceNames={copy.proofArtifacts.generatedNames} />
      default:
        return null
    }
  }

  const activeAnchorId = `${activeChapter.id}-lab`

  return (
    <section className="content-section interactive-lab-section" id="interactive-lab">
      <SectionIntro
        description={sectionCopy.sectionDescription}
        number="02"
        title={sectionCopy.sectionTitle}
      />

      <div className="lab-overview reveal">
        <div className="lab-overview-copy">
          <p className="eyebrow">{sectionCopy.overviewEyebrow}</p>
          <h3>{sectionCopy.overviewTitle}</h3>
          <p>{sectionCopy.overviewBody}</p>
        </div>

        <div className="lab-overview-list" aria-label={sectionCopy.sectionTitle}>
          {sectionCopy.chapters.map((chapter) => (
            <button
              className={
                chapter.id === activeChapter.id ? 'lab-overview-button active' : 'lab-overview-button'
              }
              key={chapter.id}
              onClick={() =>
                startTransition(() => {
                  onSelectLab(chapter.id)
                })
              }
              type="button"
            >
              <span>{chapter.number}</span>
              <strong>{chapter.title}</strong>
              <p>{chapter.body}</p>
            </button>
          ))}
        </div>
      </div>

      <article className="lab-active-shell reveal" id={activeAnchorId}>
        <div className="lab-active-header">
          <div>
            <p className="eyebrow">{activeChapter.number}</p>
            <h3>{activeChapter.title}</h3>
          </div>
          <p>{activeChapter.detail}</p>
        </div>

        <div className="lab-prompt-row">
          {activeChapter.prompts.map((prompt) => (
            <span className="detail-chip" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>

        {renderLab(activeChapter)}
      </article>

      <div className="lab-anchor-strip" aria-label={sectionCopy.overviewEyebrow}>
        {sectionCopy.chapters.map((chapter) => (
          <a
            className={chapter.id === activeChapter.id ? 'lab-anchor active' : 'lab-anchor'}
            href="#interactive-lab"
            key={chapter.id}
            onClick={() =>
              startTransition(() => {
                onSelectLab(chapter.id)
              })
            }
          >
            <span>{chapter.number}</span>
            <strong>{chapter.title}</strong>
          </a>
        ))}
      </div>

      <div className="lab-evidence-note reveal">
        <p className="eyebrow">{copy.heroContent.terminalLabel}</p>
        <pre className="editorial-code">{copy.proofArtifacts.referenceRun}</pre>
      </div>
    </section>
  )
}
