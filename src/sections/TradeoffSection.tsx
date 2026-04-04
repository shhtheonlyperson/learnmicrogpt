import { SectionIntro } from '../components/SectionIntro'
import type { getCopy } from '../content/copy'

type TradeoffSectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function TradeoffSection({ copy }: TradeoffSectionProps) {
  return (
    <section className="content-section" id="tradeoffs">
      <SectionIntro
        description={copy.ui.sectionDescriptions.tradeoffs}
        number="04"
        title={copy.ui.sectionTitles.tradeoffs}
      />

      <div className="tradeoff-layout">
        <article className="tradeoff-card reveal">
          <p className="eyebrow">{copy.ui.labels.kept}</p>
          <h3>{copy.ui.labels.spine}</h3>
          <ul className="tradeoff-list">
            {copy.tradeoffContent.kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="tradeoff-card reveal tradeoff-card-contrast">
          <p className="eyebrow">{copy.ui.labels.stripped}</p>
          <h3>{copy.ui.labels.machinery}</h3>
          <ul className="tradeoff-list">
            {copy.tradeoffContent.stripped.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="tradeoff-conclusion reveal">{copy.tradeoffContent.conclusion}</p>
    </section>
  )
}
