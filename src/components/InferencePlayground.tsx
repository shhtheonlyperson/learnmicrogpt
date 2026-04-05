import { useMemo, useState } from 'react'
import {
  createReferenceInferenceSamples,
  generateInferenceSamples,
  getInferenceSamplerMeta,
  type InferenceSample,
} from '../content/inferenceSampler'
import { useI18n } from '../i18n-context'
import { pickLocale } from '../locale'

type InferencePlaygroundProps = {
  referenceNames: string[]
}

const formatTraceToken = (token: string) => (token === 'BOS' ? 'BOS' : token)

const clampTemperature = (value: number) => Math.min(1.6, Math.max(0.2, value))
const DEFAULT_TEMPERATURE = 0.55

export function InferencePlayground({ referenceNames }: InferencePlaygroundProps) {
  const { locale } = useI18n()
  const samplerMeta = getInferenceSamplerMeta(locale)
  const initialSamples = useMemo(
    () => createReferenceInferenceSamples(locale, referenceNames),
    [locale, referenceNames],
  )
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE)
  const [samples, setSamples] = useState<InferenceSample[]>(initialSamples)
  const [selectedId, setSelectedId] = useState(initialSamples[0]?.id ?? '')
  const [lastGeneratedCount, setLastGeneratedCount] = useState(
    Math.max(1, Math.min(initialSamples.length, 10)),
  )
  const [sampleMode, setSampleMode] = useState<'reference' | 'generated'>('reference')

  const copy = pickLocale(locale, {
    en: {
      eyebrow: 'Interactive example',
      title: 'Inference playground',
      body:
        'This browser-side sampler remixes the project’s local artifacts so you can feel the temperature knob without rerunning the Python file.',
      temperature: 'Temperature',
      guide: 'Low temperature sharpens the probabilities. Higher temperature flattens them and lets stranger names sneak through.',
      generateOne: 'Generate 1',
      generateTen: 'Generate 10',
      reset: 'Show reference run',
      sourceBank: samplerMeta.sourceKind === 'local-corpus' ? 'local corpus' : 'reference bank',
      sourceCount: 'source names',
      selected: 'Selected sample',
      selectedBody: 'Click any generated card to inspect the autoregressive trace.',
      trace: 'Sampling trace',
      traceBody: 'Each hop is the current token and the next token the sampler decided to emit.',
      bos: 'BOS means Beginning of Sequence.',
      bosBody:
        'In this tiny script it marks the sequence boundary, so sampling starts at BOS and stops when BOS shows up again.',
      tagReference: 'reference run',
      tagGenerated: 'generated now',
      tagSeen: 'seen shape',
      tagNovel: 'new remix',
      empty: 'No names yet. Hit generate and the panel will refill.',
      mood: {
        cool: 'conservative',
        warm: 'balanced',
        hot: 'chaotic',
      },
    },
    'zh-TW': {
      eyebrow: '互動例子',
      title: 'Inference playground',
      body:
        '這個瀏覽器內的小 sampler 會重混專案裡的本地 artifact，讓你不用重跑 Python，也能直接摸到 temperature 旋鈕的手感。',
      temperature: 'Temperature',
      guide: '溫度越低，機率分佈越尖、越保守；溫度越高，分佈越平，奇怪但新鮮的名字就更容易冒出來。',
      generateOne: '生成 1 個',
      generateTen: '生成 10 個',
      reset: '回到 reference run',
      sourceBank: samplerMeta.sourceKind === 'local-corpus' ? '本地語料' : 'reference bank',
      sourceCount: '來源名字數',
      selected: '目前選中的名字',
      selectedBody: '點任一張卡片，就能看它在自回歸抽樣時經過哪些 token。',
      trace: '抽樣軌跡',
      traceBody: '每一步都代表：目前 token 是什麼，下一個 token 又被抽成了哪個字。',
      bos: 'BOS 指的是 Beginning of Sequence。',
      bosBody: '在這個小 script 裡，它是序列邊界 token，所以抽樣從 BOS 開始，再次抽到 BOS 就停下來。',
      tagReference: 'reference run',
      tagGenerated: '剛生成',
      tagSeen: '語料裡看過',
      tagNovel: '新重混',
      empty: '還沒有名字。按下生成，這塊就會重新洗牌。',
      mood: {
        cool: '保守',
        warm: '平衡',
        hot: '放飛',
      },
    },
  })

  const selectedSample = samples.find((sample) => sample.id === selectedId) ?? samples[0] ?? null
  const temperatureMood =
    temperature < 0.45 ? copy.mood.cool : temperature < 0.95 ? copy.mood.warm : copy.mood.hot

  const updateGeneratedSamples = (nextTemperature: number, count: number) => {
    const nextSamples = generateInferenceSamples(locale, nextTemperature, count)
    setSamples(nextSamples)
    setSelectedId(nextSamples[0]?.id ?? '')
    setLastGeneratedCount(count)
    setSampleMode('generated')
  }

  const handleTemperatureChange = (value: number) => {
    const nextTemperature = clampTemperature(value)
    setTemperature(nextTemperature)

    const count =
      sampleMode === 'generated'
        ? lastGeneratedCount
        : Math.max(1, samples.length || lastGeneratedCount)

    updateGeneratedSamples(nextTemperature, count)
  }

  const handleGenerate = (count: number) => {
    updateGeneratedSamples(temperature, count)
  }

  return (
    <article className="inference-playground reveal">
      <div className="inference-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="inference-control-bar">
        <div className="inference-slider-wrap">
          <div className="inference-slider-copy">
            <span>{copy.temperature}</span>
            <strong>
              {temperature.toFixed(2)} <em>{temperatureMood}</em>
            </strong>
          </div>
          <input
            aria-label={copy.temperature}
            className="inference-slider"
            max="1.6"
            min="0.2"
            onChange={(event) => handleTemperatureChange(Number(event.target.value))}
            step="0.05"
            type="range"
            value={temperature}
          />
          <p>{copy.guide}</p>
        </div>

        <div className="inference-actions">
          <button onClick={() => handleGenerate(1)} type="button">
            {copy.generateOne}
          </button>
          <button onClick={() => handleGenerate(10)} type="button">
            {copy.generateTen}
          </button>
          <button
            onClick={() => {
              setTemperature(DEFAULT_TEMPERATURE)
              setSamples(initialSamples)
              setSelectedId(initialSamples[0]?.id ?? '')
              setSampleMode('reference')
            }}
            type="button"
          >
            {copy.reset}
          </button>
        </div>
      </div>

      <div className="inference-stat-strip">
        <div className="inference-stat-card">
          <span>{copy.sourceBank}</span>
          <strong>{samplerMeta.sourceKind === 'local-corpus' ? 'local' : 'proof'}</strong>
        </div>
        <div className="inference-stat-card">
          <span>{copy.sourceCount}</span>
          <strong>{samplerMeta.corpusSize}</strong>
        </div>
        <div className="inference-stat-card">
          <span>{copy.temperature}</span>
          <strong>{temperatureMood}</strong>
        </div>
      </div>

      <div className="inference-layout">
        <section className="inference-card-grid">
          {samples.length === 0 ? <p className="inference-empty">{copy.empty}</p> : null}

          <div className="babble-grid reveal">
            {samples.map((sample) => (
              <button
                aria-pressed={sample.id === selectedSample?.id}
                className={sample.id === selectedSample?.id ? 'babble-card babble-card-button active' : 'babble-card babble-card-button'}
                key={sample.id}
                onClick={() => setSelectedId(sample.id)}
                type="button"
              >
                <span>{sample.origin === 'reference' ? copy.tagReference : copy.tagGenerated}</span>
                <strong>{sample.name}</strong>
                <small>{sample.seenInCorpus ? copy.tagSeen : copy.tagNovel}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className="inference-trace-card">
          <div className="inference-trace-header">
            <p className="eyebrow">{copy.selected}</p>
            <h4>{selectedSample?.name ?? '...'}</h4>
            <p>{copy.selectedBody}</p>
          </div>

          {selectedSample ? (
            <>
              <div className="inference-pill-row">
                <span>{selectedSample.origin === 'reference' ? copy.tagReference : copy.tagGenerated}</span>
                <span>{selectedSample.seenInCorpus ? copy.tagSeen : copy.tagNovel}</span>
              </div>

              <div className="inference-trace-copy">
                <p className="eyebrow">{copy.trace}</p>
                <p>{copy.traceBody}</p>
              </div>

              <div className="inference-bos-note">
                <strong>{copy.bos}</strong>
                <p>{copy.bosBody}</p>
              </div>

              <div className="inference-trace-rail">
                {selectedSample.transitions.map((step, index) => (
                  <article className="inference-trace-step" key={`${selectedSample.id}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>
                      {formatTraceToken(step.from)} → {formatTraceToken(step.to)}
                    </strong>
                    <small>{step.context}</small>
                  </article>
                ))}
                <article className="inference-trace-step terminal">
                  <span>{selectedSample.transitions.length + 1}</span>
                  <strong>{formatTraceToken(selectedSample.name.at(-1) ?? 'BOS')} → BOS</strong>
                  <small>{selectedSample.name}</small>
                </article>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </article>
  )
}
