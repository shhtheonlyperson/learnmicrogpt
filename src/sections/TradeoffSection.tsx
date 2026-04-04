import { SectionIntro } from '../components/SectionIntro'
import { tradeoffContent } from '../content/tradeoffContent'

export function TradeoffSection() {
  return (
    <section className="content-section" id="tradeoffs">
      <SectionIntro
        number="04"
        title="保留了什麼 / 拿掉了什麼"
        description="這是使用者在看完這份程式後，頁面最該留下來的核心理解。"
      />

      <div className="tradeoff-layout">
        <article className="tradeoff-card reveal">
          <p className="eyebrow">保留下來的</p>
          <h3>演算法的脊椎</h3>
          <ul className="tradeoff-list">
            {tradeoffContent.kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="tradeoff-card reveal tradeoff-card-contrast">
          <p className="eyebrow">被剝掉的</p>
          <h3>規模化機械</h3>
          <ul className="tradeoff-list">
            {tradeoffContent.stripped.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="tradeoff-conclusion reveal">{tradeoffContent.conclusion}</p>
    </section>
  )
}
