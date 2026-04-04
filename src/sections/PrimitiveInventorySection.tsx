import { SectionIntro } from '../components/SectionIntro'
import { primitives } from '../content/primitives'

export function PrimitiveInventorySection() {
  return (
    <section className="content-section" id="primitives">
      <SectionIntro
        number="03"
        title="原語清單"
        description="這一區是在整理頁面真正想傳達的觀念：哪些東西仍然明顯是 GPT，哪些簡化讓它變得可教、可看、可拆。"
      />

      <div className="primitive-layout">
        <article className="loss-panel reveal primitive-panel">
          <div className="loss-copy">
            <p className="eyebrow">這個觀點必須被講清楚</p>
            <h3>它是玩具，是因為它小，不是因為它假</h3>
            <p>
              下方每個 primitive 都保留了一個核心 GPT 觀念，同時把平常會把它藏起來的工業級機械結構拿掉。這就是 `microgpt.py` 為什麼這麼適合教學。
            </p>
          </div>
        </article>

        <div className="primitive-grid reveal">
          {primitives.map((primitive) => (
            <article className="primitive-card" key={primitive.title}>
              <p className="primitive-label">原語</p>
              <h3>{primitive.title}</h3>
              <p className="primitive-role">{primitive.role}</p>
              <div className="primitive-note">
                <span>保留了</span>
                <p>{primitive.kept}</p>
              </div>
              <div className="primitive-note">
                <span>簡化了</span>
                <p>{primitive.simplified}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
