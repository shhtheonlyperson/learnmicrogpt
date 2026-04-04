import { FLOW_TOTAL_MS, LearningLoopFilm } from '../LearningLoopFilm'
import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import { loopSteps, type LoopStep } from '../content/loopSteps'

type LearningLoopSectionProps = {
  activeStep: LoopStep
  onSelectStep: (step: LoopStep) => void
}

export function LearningLoopSection({
  activeStep,
  onSelectStep,
}: LearningLoopSectionProps) {
  return (
    <section className="content-section" id="loop">
      <SectionIntro
        number="01"
        title="學習迴圈"
        description="依照 gist 真正執行的順序，從文字檔一路走到模型胡亂生成的新名字。右側同步原始碼面板會跟著目前步驟更新。"
      />

      <div className="loop-layout">
        <div className="step-rail reveal">
          {loopSteps.map((step) => (
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
          <section className="loop-player-shell reveal" aria-label="學習迴圈動畫">
            <div className="loop-player-copy">
              <p className="eyebrow">核心演算法，依序展開</p>
              <div className="loop-player-heading">
                <h3>{activeStep.title}</h3>
                <span>{activeStep.pulseLabel}</span>
              </div>
              <p>
                你可以從任何一步開始，看它如何把狀態交接給下一步。重點不是炫技，而是把一個真實的 GPT 訓練 loop，按它真正執行的順序攤開來看。
              </p>
            </div>

            <LearningLoopFilm key={activeStep.id} selectedStepId={activeStep.id} />

              <div className="loop-player-footer">
                <span>起點：{activeStep.flowStage}</span>
                <strong>執行軌跡</strong>
                <span>
                  {(FLOW_TOTAL_MS / 1000).toFixed(1)} 秒，跨越 {loopSteps.length} 次轉換
                </span>
              </div>
          </section>

          <article className="spotlight-card reveal">
            <div className="spotlight-header">
              <p className="eyebrow">{activeStep.eyebrow}</p>
              <h3>{activeStep.title}</h3>
            </div>
            <SourceMeta href={activeStep.sourceHref} lineRange={activeStep.lineRange} />
            <p className="spotlight-summary">{activeStep.summary}</p>
            <p className="spotlight-detail">{activeStep.detail}</p>

            <div className="signal-row">
              {activeStep.signal.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <p className="source-panel-hint">
              右側固定的原始碼面板會持續同步目前的 loop 步驟。
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
