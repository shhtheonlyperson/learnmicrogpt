import { SectionIntro } from '../components/SectionIntro'
import type { getCopy } from '../content/copy'

type ReferenceRunSectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function ReferenceRunSection({ copy }: ReferenceRunSectionProps) {
  const lossMin = Math.min(...copy.proofArtifacts.lossTrace.map((point) => point.loss))
  const lossMax = Math.max(...copy.proofArtifacts.lossTrace.map((point) => point.loss))

  return (
    <section className="content-section" id="proof">
      <SectionIntro
        description={copy.ui.sectionDescriptions.proof}
        number="04"
        title={copy.ui.sectionTitles.proof}
      />

      <div className="proof-grid">
        <article className="proof-panel reveal">
          <div className="proof-panel-header">
            <div>
              <h3>{copy.ui.labels.lossTitle}</h3>
            </div>
            <p>{copy.ui.labels.lossBody}</p>
          </div>

          <div
            className="loss-chart"
            aria-label="Loss trace"
            style={{
              gridTemplateColumns: `repeat(${copy.proofArtifacts.lossTrace.length}, minmax(0, 1fr))`,
            }}
          >
            {copy.proofArtifacts.lossTrace.map((point) => {
              const ratio = (point.loss - lossMin) / (lossMax - lossMin || 1)
              const height = `${28 + (1 - ratio) * 108}px`

              return (
                <div className="loss-bar-wrap" key={`${point.step}-${point.loss}`}>
                  <div className="loss-bar" style={{ height }} />
                  <span>{point.step}</span>
                </div>
              )
            })}
          </div>

          <ul className="proof-checkpoints">
            {copy.proofArtifacts.checkpoints.map((checkpoint) => (
              <li key={checkpoint}>{checkpoint}</li>
            ))}
          </ul>
        </article>

        <article className="proof-panel reveal">
          <div className="proof-panel-header">
            <div>
              <p className="eyebrow">{copy.ui.labels.readProof}</p>
            </div>
            <p>{copy.tradeoffContent.conclusion}</p>
          </div>

          <pre className="editorial-code">{copy.proofArtifacts.referenceRun}</pre>

          <div className="name-board">
            {copy.proofArtifacts.generatedNames.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>

          <div className="reference-list">
            {copy.references.map((reference) => (
              <a href={reference.href} key={reference.label} rel="noreferrer" target="_blank">
                <strong>{reference.label}</strong>
                <span>{reference.detail}</span>
              </a>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
