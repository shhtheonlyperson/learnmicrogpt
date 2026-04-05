import { SectionIntro } from '../components/SectionIntro'
import type { getCopy } from '../content/copy'
import { useI18n } from '../i18n-context'
import { pickLocale } from '../locale'

type PrimitiveInventorySectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function PrimitiveInventorySection({ copy }: PrimitiveInventorySectionProps) {
  const { locale } = useI18n()
  const sectionCopy = pickLocale(locale, {
    en: {
      title: 'Core ideas',
      description: 'Strip away the styling, and this is what the page should still leave behind: the real algorithmic spine, the teaching simplifications, and the handful of primitives worth remembering.',
    },
    'zh-TW': {
      title: '核心理解',
      description: '把所有版面效果都拿掉之後，這頁最該留下來的是這些：真正的演算法骨架、為了教學做的小型化取捨，還有那幾個值得記住的 primitive。',
    },
  })

  return (
    <section className="content-section" id="core-ideas">
      <SectionIntro
        description={sectionCopy.description}
        number="02"
        title={sectionCopy.title}
      />

      <article className="core-idea-intro reveal">
        <p className="eyebrow">{copy.ui.labels.primitivesEyebrow}</p>
        <h3>{copy.ui.labels.primitivesTitle}</h3>
        <p>{copy.ui.labels.primitivesBody}</p>
      </article>

      <div className="tradeoff-band reveal">
        <article className="tradeoff-column">
          <p className="eyebrow">{copy.ui.labels.kept}</p>
          <h3>{copy.ui.labels.spine}</h3>
          <ul className="tradeoff-list">
            {copy.tradeoffContent.kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="tradeoff-column contrast">
          <p className="eyebrow">{copy.ui.labels.stripped}</p>
          <h3>{copy.ui.labels.machinery}</h3>
          <ul className="tradeoff-list">
            {copy.tradeoffContent.stripped.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="primitive-table reveal">
        {copy.primitives.map((primitive) => (
          <article className="primitive-row" key={primitive.title}>
            <div className="primitive-row-title">
              <p className="primitive-label">{copy.ui.labels.primitiveTag}</p>
              <h3>{primitive.title}</h3>
            </div>

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

      <p className="tradeoff-conclusion reveal">{copy.tradeoffContent.conclusion}</p>
    </section>
  )
}
