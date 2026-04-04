import { SectionIntro } from '../components/SectionIntro'
import type { getCopy } from '../content/copy'

type PrimitiveInventorySectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function PrimitiveInventorySection({ copy }: PrimitiveInventorySectionProps) {
  return (
    <section className="content-section" id="primitives">
      <SectionIntro
        description={copy.ui.sectionDescriptions.primitives}
        number="03"
        title={copy.ui.sectionTitles.primitives}
      />

      <div className="primitive-layout">
        <article className="loss-panel reveal primitive-panel">
          <div className="loss-copy">
            <p className="eyebrow">{copy.ui.labels.primitivesEyebrow}</p>
            <h3>{copy.ui.labels.primitivesTitle}</h3>
            <p>{copy.ui.labels.primitivesBody}</p>
          </div>
        </article>

        <div className="primitive-grid reveal">
          {copy.primitives.map((primitive) => (
            <article className="primitive-card" key={primitive.title}>
              <p className="primitive-label">{copy.ui.labels.primitiveTag}</p>
              <h3>{primitive.title}</h3>
              <p className="primitive-role">{primitive.role}</p>
              <div className="primitive-note">
                <span>{copy.ui.labels.kept}</span>
                <p>{primitive.kept}</p>
              </div>
              <div className="primitive-note">
                <span>{copy.ui.labels.stripped}</span>
                <p>{primitive.simplified}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
