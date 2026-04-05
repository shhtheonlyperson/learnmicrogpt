import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
} from 'react'
import './App.css'
import './interactive.css'
import { ForwardPassPlayground } from './components/ForwardPassPlayground'
import { InferencePlayground } from './components/InferencePlayground'
import { TrainingPlayground } from './components/TrainingPlayground'
import { getCopy } from './content/copy'
import {
  BOS_TOKEN,
  buildCharToId,
  getLocaleModelData,
  normalizeModelInput,
} from './content/microgptData'
import { useI18n } from './i18n-context'

const pageLocale = 'zh-TW' as const

type NavItem = {
  id: string
  number: string
  label: string
}

const navigation: NavItem[] = [
  { id: 'tokenizer', number: '1', label: 'Tokenizer' },
  { id: 'embeddings', number: '2', label: 'Embeddings (wte/wpe)' },
  { id: 'forward-pass', number: '3', label: 'Forward Pass' },
  { id: 'training', number: '4', label: 'Training' },
  { id: 'inference', number: '5', label: 'Inference' },
]

const renderToken = (token: string) => token

function App() {
  const { locale, setLocale } = useI18n()

  useEffect(() => {
    if (locale !== pageLocale) {
      setLocale(pageLocale)
    }
  }, [locale, setLocale])

  const config = useMemo(() => getLocaleModelData(pageLocale), [])
  const copy = useMemo(() => getCopy(pageLocale), [])
  const allowedChars = useMemo(() => new Set(config.chars), [config.chars])
  const charToId = useMemo(() => buildCharToId(config.chars), [config.chars])
  const bosId = config.chars.length
  const exampleNames = useMemo(
    () => Array.from(new Set(config.previewNames.filter(Boolean))).slice(0, 10),
    [config.previewNames],
  )
  const stepsById = useMemo(
    () => new Map(copy.loopSteps.map((step) => [step.id, step])),
    [copy.loopSteps],
  )
  const forwardStep =
    stepsById.get('06') ??
    copy.loopSteps.find((step) => step.visualKind === 'attention') ??
    copy.loopSteps[0]!

  const [inputValue, setInputValue] = useState(config.exampleName)
  const [draftValue, setDraftValue] = useState(config.exampleName)
  const [isComposing, setIsComposing] = useState(false)
  const [activeSection, setActiveSection] = useState('tokenizer')

  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = navigation.map((item) => document.getElementById(item.id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    )
    for (const section of sections) {
      observer.observe(section!)
    }
    return () => observer.disconnect()
  }, [])

  const nameChars = useMemo(() => Array.from(inputValue), [inputValue])
  const activeChars = useMemo(() => new Set(nameChars), [nameChars])
  const tokens = useMemo(() => [BOS_TOKEN, ...nameChars, BOS_TOKEN], [nameChars])
  const tokenIds = useMemo(
    () =>
      tokens.map((token) => {
        if (token === BOS_TOKEN) return bosId
        return charToId.get(token) ?? bosId
      }),
    [bosId, charToId, tokens],
  )

  const transitions = useMemo(
    () =>
      tokens.slice(0, -1).map((from, index) => ({
        from,
        to: tokens[index + 1] ?? BOS_TOKEN,
        fromId: tokenIds[index] ?? bosId,
        toId: tokenIds[index + 1] ?? bosId,
      })),
    [bosId, tokenIds, tokens],
  )

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value
    setDraftValue(nextDraft)

    if (isComposing) return

    const normalized = normalizeModelInput(nextDraft, pageLocale, allowedChars, config.maxNameLength)
    setInputValue(normalized)
    setDraftValue(normalized)
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false)
    const normalized = normalizeModelInput(
      event.currentTarget.value,
      pageLocale,
      allowedChars,
      config.maxNameLength,
    )
    setInputValue(normalized)
    setDraftValue(normalized)
  }

  return (
    <div className="viz-layout">
      <aside className="viz-sidebar">
        <div className="viz-brand">
          <strong>MicroGPT</strong>
          <small>Visual Explorer — 中文名字</small>
        </div>

        <nav className="viz-nav" aria-label="Sections">
          {navigation.map((item) => (
            <a
              className={activeSection === item.id ? 'viz-nav-item active' : 'viz-nav-item'}
              href={`#${item.id}`}
              key={item.id}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="viz-nav-number">{item.number}</span>
              <span className="viz-nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <a
          className="viz-guide-btn"
          href="https://gist.github.com/karpathy/bda7b67e57ee4e55a80390c0e34260a8"
          rel="noreferrer"
          target="_blank"
        >
          Read Official Guide
        </a>

        <div className="viz-sidebar-footer">
          <p>
            Built with AI. Based on{' '}
            <a href="https://gist.github.com/karpathy/bda7b67e57ee4e55a80390c0e34260a8" rel="noreferrer" target="_blank">
              Karpathy's microgpt.py
            </a>
            .
          </p>
        </div>
      </aside>

      <main className="viz-main" ref={mainRef}>
        {/* ── 1. Tokenizer ── */}
        <section className="viz-section" id="tokenizer">
          <h2 className="viz-section-title">
            <span className="viz-section-number">1.</span> Tokenizer
          </h2>
          <p className="viz-section-intro">
            模型看不懂筆畫或姓名背景，它只認得整數。Tokenizer 把每個中文字元轉成一個數字
            id，並在名字前後各加一個 BOS（Begin/End of Sequence）標記邊界。
          </p>

          {/* Character → ID Mapping */}
          <div className="viz-card">
            <h3 className="viz-card-title">Character → ID Mapping</h3>
            <div className="viz-callout">
              語料裡的每個獨立字元都分配到一個 <strong>numeric ID</strong>。
              共有 <strong>{config.chars.length}</strong> 個中文字元加上一個特殊 <strong>BOS</strong> token
              (id={bosId})。詞彙表大小：<strong>{config.chars.length + 1}</strong>。
            </div>

            <div className="viz-vocab-grid">
              {config.chars.map((char, index) => (
                <div
                  className={activeChars.has(char) ? 'viz-vocab-tile active' : 'viz-vocab-tile'}
                  key={`${char}-${index}`}
                >
                  <strong>{char}</strong>
                  <span>{index}</span>
                </div>
              ))}
              <div className="viz-vocab-tile bos">
                <strong>{BOS_TOKEN}</strong>
                <span>{bosId}</span>
              </div>
            </div>
          </div>

          {/* Try It: Type a Name */}
          <div className="viz-card">
            <h3 className="viz-card-title">Try It: 輸入中文名字</h3>
            <div className="viz-callout">
              輸入任意中文名字，觀察它怎麼變成一串 token ID。模型就是從這樣的序列學會預測下一個 token。
            </div>

            <div className="viz-example-row">
              {exampleNames.map((name) => (
                <button
                  className={name === inputValue ? 'viz-example-chip active' : 'viz-example-chip'}
                  key={name}
                  onClick={() => {
                    setInputValue(name)
                    setDraftValue(name)
                  }}
                  type="button"
                >
                  {name}
                </button>
              ))}
            </div>

            <input
              className="viz-input"
              lang="zh-Hant"
              onChange={handleInputChange}
              onCompositionEnd={handleCompositionEnd}
              onCompositionStart={handleCompositionStart}
              placeholder={config.exampleName}
              type="text"
              value={draftValue}
            />

            <div className="viz-token-chain">
              {tokens.map((token, index) => (
                <span key={`${token}-${index}`}>
                  {index > 0 && <span className="viz-arrow">→</span>}
                  <span className={token === BOS_TOKEN ? 'viz-token bos' : 'viz-token'}>
                    <strong>{renderToken(token)}</strong>
                    <span>id: {tokenIds[index] ?? bosId}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* What the model must learn */}
          <div className="viz-card">
            <h3 className="viz-card-title">模型要學什麼：</h3>
            <div className="viz-callout">
              每個位置，模型看到 <strong>current token</strong> 必須預測 <strong>next token</strong>。
              這就是 <strong>next-token prediction</strong> — GPT 的核心運作方式。
            </div>

            <div className="viz-pair-row">
              {transitions.map((t, i) => (
                <span className="viz-pair-chip" key={i}>
                  {renderToken(t.from)}→{renderToken(t.to)}
                </span>
              ))}
            </div>
          </div>

          {/* How tokenization works in real GPTs */}
          <div className="viz-card">
            <h3 className="viz-card-title">真實 GPT 的 Tokenization</h3>
            <div className="viz-callout">
              這個 micro GPT 使用 <strong>character-level</strong> tokenization — 每個中文字就是一個 token。
            </div>
            <p className="viz-body">
              真實 GPT（如 GPT-4）使用 subword tokenization (BPE)，常見詞片段會合併成單一
              token。詞彙表更大（~50K-100K tokens），但序列更短、效率更高。
            </p>
            <p className="viz-body">
              我們 {config.chars.length + 1} 個 token 的 tiny vocab 已經足夠學會中文名字的模式。
            </p>
          </div>
        </section>

        {/* ── 2. Embeddings ── */}
        <section className="viz-section" id="embeddings">
          <h2 className="viz-section-title">
            <span className="viz-section-number">2.</span> Embeddings (wte/wpe)
          </h2>
          <p className="viz-section-intro">
            Token ID 只是一個整數，模型需要更豐富的表示。Embedding 層把每個 token id 查表成一個 16 維向量
            (wte)，同時再查出該位置的 position embedding (wpe)，兩者相加就是模型真正看到的輸入。
          </p>

          <div className="viz-card">
            <h3 className="viz-card-title">Token Embedding (wte)</h3>
            <div className="viz-callout">
              <strong>wte</strong> 是一張 {config.chars.length + 1} × 16 的矩陣。每個 token id
              查到一行 16 維向量，代表該字元在連續空間裡的位置。
            </div>
            <div className="viz-embed-example">
              <span className="viz-embed-label">wte[{charToId.get(nameChars[0] ?? '') ?? bosId}]</span>
              <span className="viz-embed-desc">← "{nameChars[0] ?? BOS_TOKEN}" 的 token embedding（16 維向量）</span>
            </div>
          </div>

          <div className="viz-card">
            <h3 className="viz-card-title">Position Embedding (wpe)</h3>
            <div className="viz-callout">
              <strong>wpe</strong> 是一張 block_size × 16 的矩陣。位置 0、1、2… 各有一組不同的 16
              維向量，讓模型知道每個 token 在序列裡的先後順序。
            </div>
          </div>

          <div className="viz-card">
            <h3 className="viz-card-title">Combined = wte + wpe</h3>
            <div className="viz-callout">
              最終輸入 = token embedding + position embedding，兩個向量逐元素相加後再過一層 RMSNorm。
              接著就進入 attention 和 MLP。
            </div>
            <pre className="viz-code">{`tok_emb = state_dict['wte'][token_id]
pos_emb = state_dict['wpe'][pos_id]
x = [t + p for t, p in zip(tok_emb, pos_emb)]
x = rmsnorm(x)`}</pre>
          </div>
        </section>

        {/* ── 3. Forward Pass ── */}
        <section className="viz-section" id="forward-pass">
          <h2 className="viz-section-title">
            <span className="viz-section-number">3.</span> Forward Pass
          </h2>
          <p className="viz-section-intro">
            Token embedding 經過 attention 和 MLP，最後變成下一個 token 的 logits。
            這裡沿用真實 reference run 的證據資料，向量和 attention 權重都是實際訓練出來的數字。
          </p>

          <div className="viz-card viz-card-lab">
            <ForwardPassPlayground step={forwardStep} />
          </div>
        </section>

        {/* ── 4. Training ── */}
        <section className="viz-section" id="training">
          <h2 className="viz-section-title">
            <span className="viz-section-number">4.</span> Training
          </h2>
          <p className="viz-section-intro">
            模型一次更新可以拆成四步：算 logits → 算 loss → 反向傳播梯度 → Adam update。
            拖動下方 loss 軌跡，直接看每一步的 loss 怎麼下降。
          </p>

          <div className="viz-card viz-card-lab">
            <TrainingPlayground accentColor="#6b5c4d" />
          </div>
        </section>

        {/* ── 5. Inference ── */}
        <section className="viz-section" id="inference">
          <h2 className="viz-section-title">
            <span className="viz-section-number">5.</span> Inference
          </h2>
          <p className="viz-section-intro">
            訓練完成後，模型可以從 BOS 開始自回歸地生成新名字。
            調整 temperature 觀察 sampler 怎麼重混機率分佈、產生不同風格的中文名字。
          </p>

          <div className="viz-card viz-card-lab">
            <InferencePlayground referenceNames={copy.proofArtifacts.generatedNames} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
