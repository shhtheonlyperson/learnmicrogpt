import { Suspense, lazy, type CSSProperties } from 'react'
import { FLOW_STEP_MS, LearningLoopFilm } from '../LearningLoopFilm'
import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import { TokenizerPlayground } from '../components/TokenizerPlayground'
import type { getCopy, LoopStep } from '../content/copy'

const ForwardPassPlayground = lazy(async () => {
  const module = await import('../components/ForwardPassPlayground')
  return { default: module.ForwardPassPlayground }
})

type LearningLoopSectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function LearningLoopSection({ copy }: LearningLoopSectionProps) {
  const tokenizerStep = copy.loopSteps.find((step) => step.id === '02')
  const forwardPassStep = copy.loopSteps.find((step) => step.id === '05')
  const flowTotalMs = copy.loopSteps.length * FLOW_STEP_MS

  return (
    <section className="content-section" id="loop">
      <SectionIntro
        description={copy.ui.sectionDescriptions.loop}
        number="01"
        title={copy.ui.sectionTitles.loop}
      />

      <div className="loop-unified">
        <section className="loop-player-shell reveal" aria-label={copy.ui.sectionTitles.loop}>
          <div className="loop-player-copy">
            <p className="eyebrow">{copy.ui.labels.loopEyebrow}</p>
            <div className="loop-player-heading">
              <h3>{copy.ui.sectionTitles.loop}</h3>
              <span>{copy.ui.labels.executionTrace}</span>
            </div>
            <p>{copy.ui.labels.loopBody}</p>
          </div>

          <LearningLoopFilm />

          <div className="loop-player-footer">
            <span>{copy.ui.labels.start}：{copy.loopSteps[0]?.flowStage}</span>
            <strong>{copy.ui.labels.executionTrace}</strong>
            <span>
              {(flowTotalMs / 1000).toFixed(1)} 秒，{copy.ui.labels.across}
            </span>
          </div>
        </section>

        <div className="loop-inline-grid">
          {copy.loopSteps.map((step) => (
            <InlineLoopCard copy={copy} key={step.id} step={step} />
          ))}
        </div>

        {tokenizerStep ? (
          <TokenizerPlayground
            key={`tokenizer-static-${tokenizerStep.id}-${copy.ui.labels.loopBody}`}
            step={tokenizerStep}
          />
        ) : null}

        {forwardPassStep ? (
          <Suspense
            fallback={
              <article className="internals-playground reveal">
                <div className="internals-header">
                  <div>
                    <p className="eyebrow">{copy.ui.labels.loopEyebrow}</p>
                    <h3>{forwardPassStep.title}</h3>
                  </div>
                  <p>{copy.ui.labels.loopBody}</p>
                </div>
              </article>
            }
          >
            <ForwardPassPlayground
              key={`internals-static-${forwardPassStep.id}-${copy.ui.labels.loopBody}`}
              step={forwardPassStep}
            />
          </Suspense>
        ) : null}
      </div>
    </section>
  )
}

function InlineLoopCard({
  copy,
  step,
}: {
  copy: ReturnType<typeof getCopy>
  step: LoopStep
}) {
  const style = {
    '--loop-card-accent': step.palette.accent,
    '--loop-card-strong': step.palette.accentStrong,
    '--loop-card-glow': step.palette.glow,
  } as CSSProperties

  return (
    <article className="loop-inline-card reveal" style={style}>
      <div className="loop-inline-head">
        <div>
          <p className="eyebrow">
            {step.id} · {step.eyebrow}
          </p>
          <h3>{step.title}</h3>
        </div>
        <span className="loop-inline-pulse">{step.pulseLabel}</span>
      </div>

      <SourceMeta
        href={step.sourceHref}
        label={copy.ui.labels.openSource}
        lineLabel={copy.ui.labels.line}
        lineRange={step.lineRange}
      />

      <p className="spotlight-summary">{step.summary}</p>
      <p className="spotlight-detail">{step.detail}</p>

      <div className="signal-row">
        {step.signal.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="loop-inline-flow">
        {step.flowTokens.map((token) => (
          <span key={`${step.id}-${token}`}>{token}</span>
        ))}
      </div>

      <pre className="snippet-card loop-inline-snippet">{step.snippet}</pre>
    </article>
  )
}
