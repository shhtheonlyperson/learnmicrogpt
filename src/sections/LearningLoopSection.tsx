import { useMemo, useState } from 'react'
import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import type { AtlasSection, LoopStep, getCopy } from '../content/copy'
import { useI18n } from '../i18n-context'
import { pickLocale } from '../locale'

type LearningLoopSectionProps = {
  copy: ReturnType<typeof getCopy>
}

type MacroStage = {
  id: string
  label: string
  title: string
  body: string
  stepIds: string[]
}

const getRangeStart = (lineRange: string) => {
  const match = lineRange.match(/\d+/)
  return match ? Number(match[0]) : 0
}

const getRangeEnd = (lineRange: string) => {
  const match = lineRange.match(/(\d+)(?!.*\d)/)
  return match ? Number(match[0]) : getRangeStart(lineRange)
}

const findRelatedAtlasSection = (step: LoopStep, atlasSections: AtlasSection[]) => {
  const line = getRangeStart(step.lineRange)

  return (
    atlasSections.find((section) => {
      const start = getRangeStart(section.lineRange)
      const end = getRangeEnd(section.lineRange)
      return line >= start && line <= end
    }) ?? atlasSections[0]
  )
}

export function LearningLoopSection({ copy }: LearningLoopSectionProps) {
  const { locale } = useI18n()
  const macroStages = useMemo<MacroStage[]>(
    () =>
      pickLocale(locale, {
        en: [
          {
            id: 'setup',
            label: '01',
            title: 'Corpus + tokenizer',
            body: 'First the file defines the tiny world it is allowed to learn from: a text corpus, a character set, and a BOS boundary token.',
            stepIds: ['01', '02'],
          },
          {
            id: 'mechanics',
            label: '02',
            title: 'Autograd + parameters',
            body: 'Then it builds the minimum machinery required to learn at all: scalar gradients plus a deliberately tiny parameter skeleton.',
            stepIds: ['03', '04'],
          },
          {
            id: 'forward',
            label: '03',
            title: 'Embeddings -> attention -> logits',
            body: 'This is the conceptual core of the Transformer: mix token and position, look back over history, then project the state into next-token guesses.',
            stepIds: ['05', '06', '07'],
          },
          {
            id: 'training',
            label: '04',
            title: 'Loss -> backprop -> Adam',
            body: 'Here the model gets corrected. Wrong predictions become a scalar objective, gradients move backward, and Adam nudges every weight.',
            stepIds: ['08', '09', '10'],
          },
          {
            id: 'sampling',
            label: '05',
            title: 'Sampling as proof',
            body: 'The final act is not about quality. It is about closure: the file can now generate names on its own, which proves the whole loop is real.',
            stepIds: ['11'],
          },
        ],
        'zh-TW': [
          {
            id: 'setup',
            label: '01',
            title: '語料 + tokenizer',
            body: '一開始先定義模型能學的世界到底有多小：一份純文字語料、一組字元集合，再加上一個 BOS 邊界 token。',
            stepIds: ['01', '02'],
          },
          {
            id: 'mechanics',
            label: '02',
            title: 'Autograd + 參數骨架',
            body: '接著才搭出最小可學習機械：純量梯度系統，加上一份刻意做小的參數骨架。',
            stepIds: ['03', '04'],
          },
          {
            id: 'forward',
            label: '03',
            title: 'Embeddings -> attention -> logits',
            body: '這裡就是 Transformer 的觀念核心：先把 token 與位置混起來，再回頭看歷史，最後投影成下一個 token 的猜測。',
            stepIds: ['05', '06', '07'],
          },
          {
            id: 'training',
            label: '04',
            title: 'Loss -> backprop -> Adam',
            body: '模型在這裡被糾正。錯誤預測先收斂成一個純量目標，再把梯度往回傳，最後由 Adam 去更新每個權重。',
            stepIds: ['08', '09', '10'],
          },
          {
            id: 'sampling',
            label: '05',
            title: '用 sampling 收尾當證據',
            body: '最後這一步不是在追求品質，而是在證明閉環：這個檔案已經可以自己噴出名字，整個 loop 真的跑通了。',
            stepIds: ['11'],
          },
        ],
      }),
    [locale],
  )

  const metaCopy = pickLocale(locale, {
    en: {
      overview: 'macro stages',
      fileSlice: 'single-file atlas',
      why: 'why this slice matters',
    },
    'zh-TW': {
      overview: '五個大段落',
      fileSlice: '單檔地圖',
      why: '這段為什麼重要',
    },
  })

  const [activeStageId, setActiveStageId] = useState('setup')
  const activeStage = macroStages.find((stage) => stage.id === activeStageId) ?? macroStages[0]!
  const stageSteps = copy.loopSteps.filter((step) => activeStage.stepIds.includes(step.id))

  const [activeStepId, setActiveStepId] = useState(copy.loopSteps[0]?.id ?? '')
  const activeStep = stageSteps.find((step) => step.id === activeStepId) ?? stageSteps[0] ?? copy.loopSteps[0]!
  const activeAtlas = findRelatedAtlasSection(activeStep, copy.atlasSections)

  return (
    <section className="content-section" id="loop">
      <SectionIntro
        description={copy.ui.sectionDescriptions.loop}
        number="01"
        title={copy.ui.sectionTitles.loop}
      />

      <div className="editorial-split">
        <aside className="loop-overview reveal">
          <p className="eyebrow">{metaCopy.overview}</p>

          <div className="loop-stage-list">
            {macroStages.map((stage) => (
              <button
                className={stage.id === activeStage.id ? 'loop-stage-button active' : 'loop-stage-button'}
                key={stage.id}
                onClick={() => {
                  setActiveStageId(stage.id)
                  setActiveStepId(stage.stepIds[0] ?? '')
                }}
                type="button"
              >
                <span>{stage.label}</span>
                <strong>{stage.title}</strong>
                <p>{stage.body}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="loop-narrative">
          <article className="loop-focus reveal">
            <div className="loop-focus-header">
              <div>
                <p className="eyebrow">{activeStage.label}</p>
                <h3>{activeStage.title}</h3>
              </div>
              <p>{activeStage.body}</p>
            </div>

            <div className="step-list-compact">
              {stageSteps.map((step) => (
                <button
                  className={step.id === activeStep.id ? 'step-button active' : 'step-button'}
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  type="button"
                >
                  <span>{step.id}</span>
                  <strong>{step.title}</strong>
                  <small>{step.flowStage}</small>
                </button>
              ))}
            </div>

            <div className="loop-step-detail">
              <div className="loop-step-heading">
                <div>
                  <p className="eyebrow">
                    {activeStep.id} · {activeStep.eyebrow}
                  </p>
                  <h4>{activeStep.title}</h4>
                </div>
                <SourceMeta
                  href={activeStep.sourceHref}
                  label={copy.ui.labels.openSource}
                  lineLabel={copy.ui.labels.line}
                  lineRange={activeStep.lineRange}
                />
              </div>

              <p className="spotlight-summary">{activeStep.summary}</p>
              <p className="spotlight-detail">{activeStep.detail}</p>

              <div className="detail-token-row">
                {activeStep.signal.map((item) => (
                  <span className="detail-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <pre className="editorial-code">{activeStep.snippet}</pre>
            </div>
          </article>

          <article className="atlas-inline reveal">
            <div className="atlas-inline-header">
              <div>
                <p className="eyebrow">{metaCopy.fileSlice}</p>
                <h3>{activeAtlas.title}</h3>
              </div>
              <p>{activeAtlas.summary}</p>
            </div>

            <div className="atlas-inline-copy">
              <p className="eyebrow">{metaCopy.why}</p>
              <p>{activeAtlas.why}</p>
            </div>

            <div className="detail-token-row">
              {activeAtlas.highlights.map((item) => (
                <span className="detail-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <pre className="editorial-code">{activeAtlas.snippet}</pre>
          </article>
        </div>
      </div>
    </section>
  )
}
