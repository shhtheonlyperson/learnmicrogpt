import { FLOW_TOTAL_MS, LearningLoopFilm } from '../LearningLoopFilm'
import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import type { getCopy, LoopStep } from '../content/copy'

type LearningLoopSectionProps = {
  activeStep: LoopStep
  onSelectStep: (step: LoopStep) => void
  copy: ReturnType<typeof getCopy>
}

export function LearningLoopSection({
  activeStep,
  onSelectStep,
  copy,
}: LearningLoopSectionProps) {
  return (
    <section className="content-section" id="loop">
      <SectionIntro
        description={copy.ui.sectionDescriptions.loop}
        number="01"
        title={copy.ui.sectionTitles.loop}
      />

      <div className="loop-layout">
        <div className="step-rail reveal">
          {copy.loopSteps.map((step) => (
            <button
              className={step.id === activeStep.id ? 'step-chip active' : 'step-chip'}
              key={step.id}
              onClick={() => onSelectStep(step)}
              type="button"
            >
              <span>{step.id}</span>
              <strong>{step.title}</strong>
            </button>
          ))}
        </div>

        <div className="spotlight-stack">
          <section className="loop-player-shell reveal" aria-label={copy.ui.sectionTitles.loop}>
            <div className="loop-player-copy">
              <p className="eyebrow">{copy.ui.labels.loopEyebrow}</p>
              <div className="loop-player-heading">
                <h3>{activeStep.title}</h3>
                <span>{activeStep.pulseLabel}</span>
              </div>
              <p>{copy.ui.labels.loopBody}</p>
            </div>

            <LearningLoopFilm key={`${activeStep.id}-${copy.ui.sectionTitles.loop}`} selectedStepId={activeStep.id} />

            <div className="loop-player-footer">
              <span>
                {copy.ui.labels.start}：{activeStep.flowStage}
              </span>
              <strong>{copy.ui.labels.executionTrace}</strong>
              <span>
                {(FLOW_TOTAL_MS / 1000).toFixed(1)} 秒，{copy.ui.labels.across}
              </span>
            </div>
          </section>

          <article className="spotlight-card reveal">
            <div className="spotlight-header">
              <p className="eyebrow">{activeStep.eyebrow}</p>
              <h3>{activeStep.title}</h3>
            </div>
            <SourceMeta
              href={activeStep.sourceHref}
              label={copy.ui.labels.openSource}
              lineLabel={copy.ui.labels.line}
              lineRange={activeStep.lineRange}
            />
            <p className="spotlight-summary">{activeStep.summary}</p>
            <p className="spotlight-detail">{activeStep.detail}</p>

            <div className="signal-row">
              {activeStep.signal.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <p className="source-panel-hint">{copy.ui.labels.rightPanelHint}</p>
          </article>
        </div>
      </div>
    </section>
  )
}
