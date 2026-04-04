import { useEffect, useState, type CSSProperties } from 'react'
import type { LoopStep } from '../content/copy'
import { loadForwardPassEvidence } from '../content/forwardPassEvidence'
import { BOS_TOKEN } from '../content/microgptData'
import { useI18n } from '../i18n-context'
import { pickLocale, type Locale } from '../locale'

type StageId = 'token' | 'position' | 'combined' | 'rms' | 'attention' | 'mlp' | 'output'

type StageInfo = {
  id: StageId
  title: string
  subtitle: string
  detail: string
}

const stageDefaultsByVisualKind: Record<LoopStep['visualKind'], StageId> = {
  corpus: 'token',
  chars: 'token',
  graph: 'token',
  weights: 'token',
  merge: 'combined',
  attention: 'attention',
  logits: 'output',
  loss: 'output',
  backprop: 'output',
  adam: 'output',
  names: 'output',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const renderToken = (token: string) => (token === BOS_TOKEN ? BOS_TOKEN : token)

const buildStageInfo = (locale: Locale): StageInfo[] =>
  pickLocale(locale, {
    en: [
      {
        id: 'token',
        title: 'Token embedding',
        subtitle: 'wte[token_id]',
        detail: 'Look up the current token in the trained token embedding table.',
      },
      {
        id: 'position',
        title: 'Position embedding',
        subtitle: 'wpe[pos_id]',
        detail: 'Add the learned position vector for this exact teacher-forcing step.',
      },
      {
        id: 'combined',
        title: 'tok + pos',
        subtitle: 'element-wise add',
        detail: 'This is the exact pre-norm state before the block touches it.',
      },
      {
        id: 'rms',
        title: 'RMSNorm',
        subtitle: 'line 112',
        detail: 'The first normalization pass stabilizes the merged state before attention begins.',
      },
      {
        id: 'attention',
        title: 'Attention residual',
        subtitle: 'line 134',
        detail: 'This vector is the real post-attention residual state emitted by the block.',
      },
      {
        id: 'mlp',
        title: 'MLP + residual',
        subtitle: 'line 141',
        detail: 'The ReLU MLP expands, compresses, then rejoins the residual stream here.',
      },
      {
        id: 'output',
        title: 'Logits → probabilities',
        subtitle: 'lm_head',
        detail: 'These are the exact top next-token probabilities from the trained lm_head.',
      },
    ],
    'zh-TW': [
      {
        id: 'token',
        title: 'Token embedding',
        subtitle: 'wte[token_id]',
        detail: '直接查訓練後的 token embedding table，把目前 token 換成真實向量。',
      },
      {
        id: 'position',
        title: 'Position embedding',
        subtitle: 'wpe[pos_id]',
        detail: '再補上這個 teacher forcing 步驟對應的 learned position 向量。',
      },
      {
        id: 'combined',
        title: 'tok + pos',
        subtitle: '逐維相加',
        detail: '這是 block 還沒碰它之前，真正的 pre-norm 狀態。',
      },
      {
        id: 'rms',
        title: 'RMSNorm',
        subtitle: '第 112 行',
        detail: '第一道正規化會先把合成後的狀態穩住，attention 才接著上場。',
      },
      {
        id: 'attention',
        title: 'Attention residual',
        subtitle: '第 134 行',
        detail: '這條向量就是 block 真正吐出的 post-attention residual 狀態。',
      },
      {
        id: 'mlp',
        title: 'MLP + residual',
        subtitle: '第 141 行',
        detail: 'ReLU MLP 先放大、再壓回來，最後在這裡重新接回 residual stream。',
      },
      {
        id: 'output',
        title: 'Logits → probabilities',
        subtitle: 'lm_head',
        detail: '這裡顯示的是訓練後 lm_head 真正吐出的高機率下一個 token。',
      },
    ],
  })

export function ForwardPassPlayground({ step }: { step: LoopStep }) {
  const { locale } = useI18n()
  const stageInfo = buildStageInfo(locale)
  const defaultStage = stageDefaultsByVisualKind[step.visualKind]

  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadForwardPassEvidence>> | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [selectedProbeIndex, setSelectedProbeIndex] = useState(0)
  const [selectedPosition, setSelectedPosition] = useState(0)
  const [selectedStageId, setSelectedStageId] = useState<StageId>(defaultStage)
  const [selectedAttentionView, setSelectedAttentionView] = useState<'average' | number>('average')

  useEffect(() => {
    let isMounted = true

    loadForwardPassEvidence(locale)
      .then((nextBundle) => {
        if (!isMounted) return
        setBundle(nextBundle)
        setLoadError(false)
      })
      .catch(() => {
        if (!isMounted) return
        setLoadError(true)
      })

    return () => {
      isMounted = false
    }
  }, [locale])

  const probes = bundle?.quickRun.forwardPass.probes ?? []
  const safeProbeIndex = clamp(selectedProbeIndex, 0, Math.max(0, probes.length - 1))
  const activeProbe = probes[safeProbeIndex] ?? probes[0]
  const positions = activeProbe?.positions ?? []
  const safePosition = clamp(selectedPosition, 0, Math.max(0, positions.length - 1))
  const activePosition = positions[safePosition] ?? positions[0]
  const displayCandidateCount = locale === 'zh-TW' ? 8 : 10
  const topCandidates = activePosition?.topCandidates.slice(0, displayCandidateCount) ?? []

  const vectorsByStage = {
    token: activePosition?.tokenEmbedding ?? [],
    position: activePosition?.positionEmbedding ?? [],
    combined: activePosition?.combined ?? [],
    rms: activePosition?.inputRms ?? [],
    attention: activePosition?.attentionResidual ?? [],
    mlp: activePosition?.mlpResidual ?? [],
    output: topCandidates.map((candidate) => candidate.probability),
  }

  const activeStage = stageInfo.find((item) => item.id === selectedStageId) ?? stageInfo[0]!
  const activeVector = vectorsByStage[selectedStageId]
  const activeVectorCells =
    selectedStageId === 'output'
      ? topCandidates.map((candidate) => ({
          label: renderToken(candidate.token),
          value: candidate.probability,
        }))
      : activeVector.map((value, index) => ({
          label: String(index + 1),
          value,
        }))

  const attentionWeights =
    selectedAttentionView === 'average'
      ? activePosition?.attentionAverageWeights ?? []
      : activePosition?.attentionHeadWeights[selectedAttentionView] ?? activePosition?.attentionAverageWeights ?? []

  const copy = pickLocale(locale, {
    en: {
      eyebrow: 'Interactive example',
      title: 'Embeddings + forward pass',
      body:
        'This panel uses exact post-training probes exported from the real 120-step run, not browser-side sketch math.',
      loadingTitle: 'Loading exact forward-pass probes',
      loadingBody: 'The large probe bundle is loaded on demand so it does not weigh down the first page load.',
      errorTitle: 'Forward-pass probes unavailable',
      errorBody: 'The exact probe bundle did not load, so this inspector cannot render the real run data right now.',
      sampleLabel: 'Exact probe set',
      sampleBody:
        'Each name below was replayed through the trained state_dict after the quick reference run finished.',
      reset: 'reset view',
      stepUnit: 'steps',
      position: 'training step',
      tokenId: 'current token',
      nextToken: 'target token',
      history: 'Visible history',
      vectorTitle: 'Exact stage values',
      vectorBody:
        'These numbers were exported from the actual run. What matters is how the state changes from stage to stage.',
      outputTitle: 'Top next-token probabilities',
      outputBody: 'These candidates come straight from the trained lm_head for this exact probe step.',
      attentionTitle: 'Attention over visible history',
      attentionBody:
        'The average view blends all 4 heads. You can also inspect each head from the exported probe separately.',
      mlpLabel: 'active hidden units',
      stageLabel: 'Stage focus',
      attentionView: 'attention view',
      averageAttention: 'avg of 4 heads',
      headShort: 'H',
    },
    'zh-TW': {
      eyebrow: '互動例子',
      title: 'Embeddings + forward pass',
      body: '這個面板改用真實 120 步訓練結果匯出的 probe，不再靠瀏覽器裡的草圖數學撐場。',
      loadingTitle: '正在載入精確 forward-pass probes',
      loadingBody: '這份 probe bundle 改成按需載入，避免第一次打開頁面就背太重。',
      errorTitle: 'Forward-pass probes 無法使用',
      errorBody: '精確 probe bundle 沒有成功載入，所以現在沒辦法畫出真實執行資料。',
      sampleLabel: '精確 probe 集',
      sampleBody: '下面每個名字都在快速參考跑完之後，被拿去重新穿過訓練完成的 state_dict。',
      reset: '重設視角',
      stepUnit: '步',
      position: '訓練步驟',
      tokenId: '目前 token',
      nextToken: '目標 token',
      history: '目前可見的歷史',
      vectorTitle: '精確階段數值',
      vectorBody: '這些數值直接來自真實執行。重點不是小數點崇拜，而是狀態怎麼一路變形。',
      outputTitle: '下一個 token 的高機率候選',
      outputBody: '這些候選直接來自這一步 probe 的訓練後 lm_head，不是 UI 在腦補。',
      attentionTitle: '對可見歷史的注意力',
      attentionBody: '平均檢視會把 4 個 head 混在一起，你也可以單獨翻每一個 head 的權重。',
      mlpLabel: '活著的 hidden units',
      stageLabel: '聚焦階段',
      attentionView: 'attention 檢視',
      averageAttention: '4 個 heads 平均',
      headShort: 'H',
    },
  })

  const style = {
    '--internals-accent': step.palette.accent,
    '--internals-accent-strong': step.palette.accentStrong,
    '--internals-glow': step.palette.glow,
  } as CSSProperties

  if (loadError) {
    return (
      <article className="internals-playground reveal" style={style}>
        <div className="internals-header">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h3>{copy.errorTitle}</h3>
          </div>
          <p>{copy.errorBody}</p>
        </div>
      </article>
    )
  }

  if (!bundle) {
    return (
      <article className="internals-playground reveal" style={style}>
        <div className="internals-header">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h3>{copy.loadingTitle}</h3>
          </div>
          <p>{copy.loadingBody}</p>
        </div>
      </article>
    )
  }

  if (!activeProbe || !activePosition) return null

  return (
    <article className="internals-playground reveal" style={style}>
      <div className="internals-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="internals-control-bar">
        <div className="internals-card-header compact">
          <p className="eyebrow">{copy.sampleLabel}</p>
          <p>{copy.sampleBody}</p>
        </div>

        <button
          className="internals-reset"
          onClick={() => {
            setSelectedProbeIndex(0)
            setSelectedPosition(0)
            setSelectedStageId(defaultStage)
            setSelectedAttentionView('average')
          }}
          type="button"
        >
          {copy.reset}
        </button>
      </div>

      <div className="internals-sample-rail">
        {probes.map((probe, index) => (
          <button
            aria-pressed={index === safeProbeIndex}
            className={index === safeProbeIndex ? 'internals-position-chip active' : 'internals-position-chip'}
            key={probe.name}
            onClick={() => {
              setSelectedProbeIndex(index)
              setSelectedPosition(0)
              setSelectedAttentionView('average')
            }}
            type="button"
          >
            <span>
              {probe.positions.length} {copy.stepUnit}
            </span>
            <strong>{probe.name}</strong>
          </button>
        ))}
      </div>

      <div className="internals-token-row">
        <div className="internals-stat-card">
          <span>{copy.position}</span>
          <strong>
            {activePosition.posId + 1} / {positions.length}
          </strong>
        </div>
        <div className="internals-stat-card">
          <span>{copy.tokenId}</span>
          <strong>
            {renderToken(activePosition.currentToken)} · {activePosition.currentTokenId}
          </strong>
        </div>
        <div className="internals-stat-card">
          <span>{copy.nextToken}</span>
          <strong>
            {renderToken(activePosition.targetToken)} · {activePosition.targetTokenId}
          </strong>
        </div>
        <div className="internals-stat-card">
          <span>{copy.mlpLabel}</span>
          <strong>{activePosition.mlpActiveCount} / 64</strong>
        </div>
      </div>

      <div className="internals-position-rail">
        {positions.map((position, index) => (
          <button
            aria-pressed={index === safePosition}
            className={index === safePosition ? 'internals-position-chip active' : 'internals-position-chip'}
            key={`${position.posId}-${position.currentToken}-${position.targetToken}`}
            onClick={() => setSelectedPosition(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{renderToken(position.currentToken)}</strong>
          </button>
        ))}
      </div>

      <div className="internals-layout">
        <section className="internals-stage-card">
          <div className="internals-card-header">
            <p className="eyebrow">{copy.stageLabel}</p>
            <h4>{activeStage.title}</h4>
            <p>{activeStage.detail}</p>
          </div>

          <div className="internals-stage-grid">
            {stageInfo.map((item) => (
              <button
                aria-pressed={item.id === selectedStageId}
                className={item.id === selectedStageId ? 'internals-stage-chip active' : 'internals-stage-chip'}
                key={item.id}
                onClick={() => setSelectedStageId(item.id)}
                type="button"
              >
                <span>{item.subtitle}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>

          <div className="internals-card-header compact">
            <p className="eyebrow">{copy.vectorTitle}</p>
            <p>{copy.vectorBody}</p>
          </div>

          <div className="internals-vector-grid">
            {activeVectorCells.map((cell) => (
              <article className="internals-vector-cell" key={`${selectedStageId}-${cell.label}`}>
                <span>{cell.label}</span>
                <strong>{cell.value.toFixed(3)}</strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="internals-context-card">
          <div className="internals-card-header">
            <p className="eyebrow">{copy.history}</p>
            <h4>{activePosition.historyTokens.map(renderToken).join(' → ')}</h4>
            <p>{copy.attentionBody}</p>
          </div>

          <div className="internals-attention-view">
            <span>{copy.attentionView}</span>
            <div className="internals-head-row">
              <button
                aria-pressed={selectedAttentionView === 'average'}
                className={selectedAttentionView === 'average' ? 'internals-head-chip active' : 'internals-head-chip'}
                onClick={() => setSelectedAttentionView('average')}
                type="button"
              >
                {copy.averageAttention}
              </button>
              {activePosition.attentionHeadWeights.map((_, index) => (
                <button
                  aria-pressed={selectedAttentionView === index}
                  className={selectedAttentionView === index ? 'internals-head-chip active' : 'internals-head-chip'}
                  key={index}
                  onClick={() => setSelectedAttentionView(index)}
                  type="button"
                >
                  {copy.headShort}
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="internals-card-header compact">
            <p className="eyebrow">{copy.attentionTitle}</p>
          </div>

          <div className="internals-attention-list">
            {activePosition.historyTokens.map((token, index) => (
              <article className="internals-attention-row" key={`${token}-${index}`}>
                <span>{renderToken(token)}</span>
                <div>
                  <div
                    className="internals-attention-bar"
                    style={{ width: `${Math.max(10, (attentionWeights[index] ?? 0) * 100)}%` }}
                  />
                </div>
                <strong>{((attentionWeights[index] ?? 0) * 100).toFixed(1)}%</strong>
              </article>
            ))}
          </div>

          <div className="internals-card-header compact">
            <p className="eyebrow">{copy.outputTitle}</p>
            <p>{copy.outputBody}</p>
          </div>

          <div className="internals-output-list">
            {topCandidates.map((entry) => (
              <article className="internals-output-row" key={`${entry.token}-${entry.tokenId}`}>
                <span>{renderToken(entry.token)}</span>
                <div>
                  <div
                    className="internals-output-bar"
                    style={{ width: `${Math.max(8, entry.probability * 100)}%` }}
                  />
                </div>
                <strong>{(entry.probability * 100).toFixed(1)}%</strong>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </article>
  )
}
