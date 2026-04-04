import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { getEvidencePack } from '../content/evidencePack'
import { BOS_TOKEN, getLocaleModelData } from '../content/microgptData'
import { useI18n } from '../i18n-context'
import { pickLocale } from '../locale'

const PHASES = ['forward', 'loss', 'backward', 'update'] as const

type TrainingPlaygroundProps = {
  accentColor: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function TrainingPlayground({ accentColor }: TrainingPlaygroundProps) {
  const { locale } = useI18n()
  const evidence = getEvidencePack(locale)
  const modelData = getLocaleModelData(locale)
  const [stepIndex, setStepIndex] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(10)

  const losses = evidence.quickRun.losses
  const trainingSteps = evidence.quickRun.trainingSteps
  const totalSteps = losses.length
  const lossValues = losses.map((entry) => entry.loss)
  const lossMin = Math.min(...lossValues)
  const lossMax = Math.max(...lossValues)
  const lossSpan = lossMax - lossMin || 1
  const currentStep = losses[stepIndex] ?? losses[0]!
  const currentTrainingStep = trainingSteps[stepIndex] ?? trainingSteps[0]!
  const currentPhase = PHASES[phaseIndex] ?? PHASES[0]
  const bosId = modelData.chars.length
  const renderTokenId = (tokenId: number) => (tokenId === bosId ? BOS_TOKEN : modelData.chars[tokenId] ?? '?')
  const sequenceTokens = currentTrainingStep.tokenIds.map(renderTokenId)
  const teacherPairs = sequenceTokens.slice(0, -1).map((from, index) => `${from} -> ${sequenceTokens[index + 1] ?? BOS_TOKEN}`)
  const sequencePreview = sequenceTokens.join(' -> ')
  const pairPreview = teacherPairs.slice(0, 4).join(' | ')
  const randomBaseline = Math.log(evidence.quickRun.vocabSize)
  const learningRate = currentTrainingStep.learningRate
  const checkpoints = [0, Math.min(23, totalSteps - 1), Math.min(59, totalSteps - 1), totalSteps - 1]

  const phaseCopy = pickLocale(locale, {
    en: {
      forward: {
        title: 'Forward',
        body: 'Run the current name through embeddings, attention, the MLP, and the LM head to get logits.',
      },
      loss: {
        title: 'Loss',
        body: 'Compare those logits to the real next token and collapse the mistake into a scalar objective.',
      },
      backward: {
        title: 'Backward',
        body: 'Walk back through the scalar graph and accumulate gradients on every parameter.',
      },
      update: {
        title: 'Update',
        body: 'Use Adam plus linear decay to nudge the weights before the next name arrives.',
      },
    },
    'zh-TW': {
      forward: {
        title: 'Forward',
        body: '把目前這個名字一路送進 embeddings、attention、MLP 跟 LM head，吐出 logits。',
      },
      loss: {
        title: 'Loss',
        body: '拿 logits 跟真實下一個 token 比對，把誤差收斂成單一純量目標。',
      },
      backward: {
        title: 'Backward',
        body: '沿著 scalar 計算圖一路往回走，把梯度累積到每個參數身上。',
      },
      update: {
        title: 'Update',
        body: '再用 Adam 加上線性衰減，替下一個名字把權重往前推一步。',
      },
    },
  })

  const copy = pickLocale(locale, {
    en: {
      eyebrow: 'Interactive example',
      title: 'Training playground',
      body:
        'This panel replays the real 120-step loss trace while cycling the four phases hidden inside every training step.',
      play: 'play',
      pause: 'pause',
      speed: 'speed',
      jump: 'jump to',
      step: 'step',
      phase: 'phase',
      currentName: 'current name',
      loss: 'current loss',
      baseline: 'random baseline',
      learningRate: 'learning rate',
      teacherPairs: 'teacher pairs',
      phaseTitle: 'Training cycle',
      exactTrace: 'Exact step trace',
      chartTitle: 'Loss over the full run',
      chartBody: 'The active bar moves with the replay. Lower than the dashed random baseline means the model is already learning structure.',
      speedLabels: ['1x', '10x', '40x'],
      jumpLabels: ['1', '24', '60', '120'],
    },
    'zh-TW': {
      eyebrow: '互動例子',
      title: 'Training playground',
      body: '這個面板會重播真實的 120 步 loss 軌跡，同時把每一步裡那四個隱形 phase 輪流攤開。',
      play: '播放',
      pause: '暫停',
      speed: '速度',
      jump: '跳到',
      step: '步數',
      phase: 'phase',
      currentName: '目前名字',
      loss: '目前 loss',
      baseline: '亂猜基線',
      learningRate: 'learning rate',
      teacherPairs: 'teacher pairs',
      phaseTitle: '訓練循環',
      exactTrace: '精確步驟軌跡',
      chartTitle: '完整短跑的 loss 軌跡',
      chartBody: '亮起來的 bar 會跟著 replay 走。只要掉到亂猜基線以下，代表模型已經開始摸到結構。',
      speedLabels: ['1x', '10x', '40x'],
      jumpLabels: ['1', '24', '60', '120'],
    },
  })

  const exactPhaseBody = pickLocale(locale, {
    en: {
      forward: `Document "${currentTrainingStep.doc}" becomes ${sequencePreview}. That creates ${currentTrainingStep.numTargets} supervised positions for this step.`,
      loss: `This step compares ${currentTrainingStep.numTargets} exact teacher-forcing pairs. Preview: ${pairPreview}.`,
      backward: `The mean loss from these ${currentTrainingStep.numTargets} targets backprops through the full ${evidence.quickRun.numParams.toLocaleString('en-US')}-parameter scalar graph.`,
      update: `Adam now updates all ${evidence.quickRun.numParams.toLocaleString('en-US')} parameters with learning rate ${learningRate.toFixed(5)} on step ${currentTrainingStep.step}.`,
    },
    'zh-TW': {
      forward: `文件「${currentTrainingStep.doc}」會被展開成 ${sequencePreview}，因此這一步總共有 ${currentTrainingStep.numTargets} 個受監督位置。`,
      loss: `這一步會拿 ${currentTrainingStep.numTargets} 組精確 teacher forcing 配對來算 loss。預覽：${pairPreview}。`,
      backward: `這 ${currentTrainingStep.numTargets} 個 target 平均後的 loss，會一路穿過整張 ${evidence.quickRun.numParams.toLocaleString('zh-TW')}-參數純量計算圖往回傳。`,
      update: `Adam 會在第 ${currentTrainingStep.step} 步，用 learning rate ${learningRate.toFixed(5)} 更新全部 ${evidence.quickRun.numParams.toLocaleString('zh-TW')} 個參數。`,
    },
  })

  const phaseCards = useMemo(
    () =>
      PHASES.map((phase) => ({
        id: phase,
        title: phaseCopy[phase].title,
        body: phaseCopy[phase].body,
      })),
    [phaseCopy],
  )

  useEffect(() => {
    if (!isPlaying) return

    const delay = Math.max(80, 920 / speed)
    const timer = window.setInterval(() => {
      setPhaseIndex((current) => {
        const nextPhase = current + 1
        if (nextPhase < PHASES.length) return nextPhase

        setStepIndex((currentStepIndex) => (currentStepIndex + 1) % totalSteps)
        return 0
      })
    }, delay)

    return () => window.clearInterval(timer)
  }, [isPlaying, speed, totalSteps])

  return (
    <article
      className="training-playground reveal"
      style={{ '--training-accent': accentColor } as CSSProperties}
    >
      <div className="training-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="training-control-bar">
        <div className="training-actions">
          <button onClick={() => setIsPlaying((current) => !current)} type="button">
            {isPlaying ? copy.pause : copy.play}
          </button>
          {checkpoints.map((checkpoint, index) => (
            <button
              key={checkpoint}
              onClick={() => {
                setStepIndex(checkpoint)
                setPhaseIndex(0)
                setIsPlaying(false)
              }}
              type="button"
            >
              {copy.jump} {copy.jumpLabels[index]}
            </button>
          ))}
        </div>

        <div className="training-speed-wrap">
          <span>{copy.speed}</span>
          <div className="training-speed-row">
            {[1, 10, 40].map((value, index) => (
              <button
                aria-pressed={speed === value}
                className={speed === value ? 'training-speed-button active' : 'training-speed-button'}
                key={value}
                onClick={() => setSpeed(value)}
                type="button"
              >
                {copy.speedLabels[index]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="training-stat-strip">
        <div className="training-stat-card">
          <span>{copy.step}</span>
          <strong>
            {stepIndex + 1} / {totalSteps}
          </strong>
        </div>
        <div className="training-stat-card">
          <span>{copy.phase}</span>
          <strong>{phaseCopy[currentPhase].title}</strong>
        </div>
        <div className="training-stat-card">
          <span>{copy.currentName}</span>
          <strong>{currentTrainingStep.doc}</strong>
        </div>
        <div className="training-stat-card">
          <span>{copy.loss}</span>
          <strong>{currentStep.loss.toFixed(3)}</strong>
        </div>
        <div className="training-stat-card">
          <span>{copy.learningRate}</span>
          <strong>{learningRate.toFixed(5)}</strong>
        </div>
        <div className="training-stat-card">
          <span>{copy.teacherPairs}</span>
          <strong>{currentTrainingStep.numTargets}</strong>
        </div>
      </div>

      <div className="training-layout">
        <section className="training-chart-card">
          <div className="training-card-header">
            <p className="eyebrow">{copy.chartTitle}</p>
            <h4>{copy.chartTitle}</h4>
            <p>{copy.chartBody}</p>
          </div>

          <div className="training-chart-shell">
            <div
              className="training-chart-grid"
              style={{
                gridTemplateColumns: `repeat(${losses.length}, minmax(0, 1fr))`,
              }}
            >
              {losses.map((entry, index) => {
                const ratio = (entry.loss - lossMin) / lossSpan
                const height = `${28 + (1 - ratio) * 110}px`

                return (
                  <div className={index === stepIndex ? 'training-bar-wrap active' : 'training-bar-wrap'} key={`${entry.step}-${entry.loss}`}>
                    <div className="training-bar" style={{ height }} />
                  </div>
                )
              })}
            </div>

            <div
              className="training-baseline"
              style={{
                bottom: `${28 + (1 - clamp((randomBaseline - lossMin) / lossSpan, 0, 1)) * 110}px`,
              }}
            >
              <span>
                {copy.baseline}: {randomBaseline.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        <aside className="training-phase-card">
          <div className="training-card-header">
            <p className="eyebrow">{copy.phaseTitle}</p>
            <h4>{phaseCopy[currentPhase].title}</h4>
            <p>{phaseCopy[currentPhase].body}</p>
          </div>

          <div className="training-trace-note">
            <span>{copy.exactTrace}</span>
            <strong>{currentTrainingStep.doc}</strong>
            <p>{exactPhaseBody[currentPhase]}</p>
          </div>

          <div className="training-phase-grid">
            {phaseCards.map((phase, index) => (
              <article className={index === phaseIndex ? 'training-phase-step active' : 'training-phase-step'} key={phase.id}>
                <span>{index + 1}</span>
                <strong>{phase.title}</strong>
                <p>{phase.body}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <input
        aria-label={copy.step}
        className="training-scrubber"
        max={Math.max(0, totalSteps - 1)}
        min="0"
        onChange={(event) => {
          setStepIndex(clamp(Number(event.target.value), 0, totalSteps - 1))
          setPhaseIndex(0)
          setIsPlaying(false)
        }}
        step="1"
        type="range"
        value={stepIndex}
      />
    </article>
  )
}
