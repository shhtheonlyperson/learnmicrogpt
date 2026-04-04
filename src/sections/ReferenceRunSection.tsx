import { SectionIntro } from '../components/SectionIntro'
import { proofArtifacts } from '../content/proofArtifacts'
import { references } from '../content/sources'

export function ReferenceRunSection() {
  const lossMin = Math.min(...proofArtifacts.lossTrace.map((point) => point.loss))
  const lossMax = Math.max(...proofArtifacts.lossTrace.map((point) => point.loss))

  return (
    <section className="content-section" id="proof">
      <SectionIntro
        number="05"
        title="參考執行"
        description="樣本很粗糙，loss 曲線也很吵，但正是這份誠實讓這個 artifact 變得有說服力。"
      />

      <div className="reference-layout">
        <article className="loss-panel reveal">
          <div className="loss-copy">
            <p className="eyebrow">快速參考切片</p>
            <h3>Loss 下降得很吵，不是很神</h3>
            <p>
              在一個快速的 {proofArtifacts.numSteps} 步執行中，script 就已經會開始長出像樣的人名形狀。下方圖表使用的就是那次短跑的真實數值。
            </p>
          </div>

          <div
            className="loss-chart"
            aria-label="Loss 軌跡"
            style={{
              gridTemplateColumns: `repeat(${proofArtifacts.lossTrace.length}, minmax(0, 1fr))`,
            }}
          >
            {proofArtifacts.lossTrace.map((point) => {
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
            {proofArtifacts.generatedNames.map((name) => (
              <article className="babble-card" key={name}>
                <span>樣本</span>
                <strong>{name}</strong>
              </article>
            ))}
          </div>

          <aside className="notes-card reveal">
            <p className="eyebrow">怎麼閱讀這份證據</p>
            <h3>輸出夠粗糙，反而才是重點。</h3>
            <ul>
              {proofArtifacts.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>{checkpoint}</li>
              ))}
            </ul>

            <div className="reference-list">
              {references.map((reference) => (
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
