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
        number="05"
        title={copy.ui.sectionTitles.proof}
      />

      <div className="reference-layout">
        <article className="loss-panel reveal">
          <div className="loss-copy">
            <p className="eyebrow">{copy.ui.labels.quickSlice}</p>
            <h3>{copy.ui.labels.lossTitle}</h3>
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
              const height = `${36 + (1 - ratio) * 84}px`

              return (
                <div className="loss-bar-wrap" key={`${point.step}-${point.loss}`}>
                  <div className="loss-bar" style={{ height }} />
                  <span>{point.step}</span>
                </div>
              )
            })}
          </div>
        </article>

        <div className="reference-stack">
          <div className="babble-grid reveal">
            {copy.proofArtifacts.generatedNames.map((name) => (
              <article className="babble-card" key={name}>
                <span>sample</span>
                <strong>{name}</strong>
              </article>
            ))}
          </div>

          <aside className="notes-card reveal">
            <p className="eyebrow">{copy.ui.labels.readProof}</p>
            <h3>{copy.ui.labels.proofTitle}</h3>
            <ul>
              {copy.proofArtifacts.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>{checkpoint}</li>
              ))}
            </ul>

            <div className="reference-list">
              {copy.references.map((reference) => (
                <a href={reference.href} key={reference.label} rel="noreferrer" target="_blank">
                  <strong>{reference.label}</strong>
                  <span>{reference.detail}</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
