import {
  useEffect,
  useMemo,
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

const navigation = [
  { label: 'Home', href: '#top' },
  { label: 'Tokenizer', href: '#tokenizer', active: true },
  { label: '中文姓名語料', href: '#examples' },
  { label: 'Token Sequence', href: '#sequence' },
  { label: 'Forward Pass', href: '#forward-pass' },
  { label: 'Training', href: '#training' },
  { label: 'Inference', href: '#inference' },
  { label: 'Real GPTs', href: '#real-gpts' },
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
  const trainingStep =
    stepsById.get('08') ??
    copy.loopSteps.find((step) => step.visualKind === 'loss') ??
    copy.loopSteps[0]!

  const [inputValue, setInputValue] = useState(config.exampleName)
  const [draftValue, setDraftValue] = useState(config.exampleName)
  const [isComposing, setIsComposing] = useState(false)

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

  const characterPairs = useMemo(
    () =>
      nameChars.map((char) => ({
        char,
        id: charToId.get(char) ?? bosId,
      })),
    [bosId, charToId, nameChars],
  )

  const breakdown = characterPairs.map(({ char, id }) => `${char}→${id}`)
  const summary = characterPairs.length
    ? `你的輸入「${inputValue}」被轉成 ${tokens.length} 個 token：開頭 1 個 BOS、名字裡 ${characterPairs.length} 個字元 token（${breakdown.join('、')}），最後再補 1 個 BOS。模型實際看到的整數序列是 [${tokenIds.join(', ')}]。`
    : `目前輸入沒有落在語料字表內的字元，所以序列只剩下開頭和結尾的 BOS。模型看到的是 [${tokenIds.join(', ')}]。`

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
    <main className="tokenizer-page" id="top">
      <div className="page-orb page-orb-left" />
      <div className="page-orb page-orb-right" />

      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark">01</span>
          <span className="brand-copy">
            <strong>MicroGPT</strong>
            <small>中文名字 tokenizer</small>
          </span>
        </a>

        <nav aria-label="Tokenizer sections" className="chapter-nav">
          {navigation.map((item) => (
            <a
              aria-current={item.active ? 'page' : undefined}
              className={item.active ? 'chapter-link active' : 'chapter-link'}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero-panel" id="tokenizer">
        <div className="hero-copy">
          <p className="eyebrow">01</p>
          <h1>Tokenizer</h1>
          <p className="hero-lede">
            模型看不懂筆畫、聲調或姓名的文化背景，它只認得整數。這一頁把 reference tokenizer
            demo 改成中文姓名版本，讓每個字都直接映射成一個 token id，並在前後補上一個 BOS
            來標記邊界。
          </p>
          <div className="hero-metadata">
            <div className="meta-card">
              <span>姓名語料</span>
              <strong>{config.corpus.length}</strong>
              <p>直接來自本地中文姓名資料，互動範例全部用這份字表。</p>
            </div>
            <div className="meta-card">
              <span>字元詞彙表</span>
              <strong>{config.chars.length + 1}</strong>
              <p>所有中文姓名字元加上 1 個 BOS special token。</p>
            </div>
            <div className="meta-card">
              <span>名字長度上限</span>
              <strong>{config.maxNameLength}</strong>
              <p>輸入超過上限會被截掉，語料外字元會被忽略。</p>
            </div>
          </div>
        </div>

        <aside className="hero-note">
          <p className="eyebrow">Character → ID Mapping</p>
          <h2>每個字都先被壓成一個整數。</h2>
          <p>
            跟 reference 頁面一樣，最重要的第一步不是 attention，而是先把離散符號編碼成模型能吃的
            id。綠色標記的是你目前輸入名字裡實際用到的字。
          </p>
          <div className="note-chip-row">
            <span className="note-chip active">目前輸入：{inputValue || '尚未輸入'}</span>
            <span className="note-chip">BOS id：{bosId}</span>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <article className="surface-card mapping-card" id="vocab">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Character → ID Mapping</p>
              <h2>中文字元表</h2>
            </div>
            <p>字表比英文字母大得多，所以這裡保留同樣的 mapping 概念，但改成可捲動的字元牆。</p>
          </div>

          <div className="mapping-grid" aria-label="Chinese character to token id mapping">
            {config.chars.map((char, index) => (
              <article
                className={activeChars.has(char) ? 'mapping-tile active' : 'mapping-tile'}
                key={`${char}-${index}`}
              >
                <strong>{char}</strong>
                <span>id {index}</span>
              </article>
            ))}

            <article className="mapping-tile bos">
              <strong>{BOS_TOKEN}</strong>
              <span>id {bosId}</span>
            </article>
          </div>
        </article>

        <div className="interaction-stack">
          <article className="surface-card" id="examples">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Try it</p>
                <h2>輸入中文名字</h2>
              </div>
              <p>點一個範例，或直接輸入你想看的中文姓名。</p>
            </div>

            <div className="example-row" aria-label="Chinese name examples">
              {exampleNames.map((name) => (
                <button
                  className={name === inputValue ? 'example-chip active' : 'example-chip'}
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

            <label className="input-shell">
              <span>Type a Chinese name</span>
              <input
                lang="zh-Hant"
                onChange={handleInputChange}
                onCompositionEnd={handleCompositionEnd}
                onCompositionStart={handleCompositionStart}
                placeholder={config.exampleName}
                type="text"
                value={draftValue}
              />
            </label>

            <p className="helper-copy">
              只保留語料中存在的中文字，空白會被拿掉，最多 {config.maxNameLength} 個字。
            </p>
          </article>

          <article className="surface-card" id="sequence">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Token Sequence</p>
                <h2>名字變成怎樣的 token 序列</h2>
              </div>
              <p>名字前後各補一個 BOS，讓模型明確知道「從哪裡開始、在哪裡結束」。</p>
            </div>

            <div className="token-strip">
              {tokens.map((token, index) => (
                <article
                  className={token === BOS_TOKEN ? 'token-card bos' : 'token-card'}
                  key={`${token}-${index}`}
                >
                  <strong>{renderToken(token)}</strong>
                  <span>id {tokenIds[index] ?? bosId}</span>
                </article>
              ))}
            </div>

            <div className="id-readout">
              <span>raw ids</span>
              <code>[{tokenIds.join(', ')}]</code>
            </div>

            <div className="explanation-card">
              <p className="eyebrow">What just happened</p>
              <p>{summary}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-card lab-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MicroGPT journey</p>
            <h2>Tokenizer 後面那三段也直接攤開</h2>
          </div>
          <p>
            你要的 embeddings、forward pass、training、inference 我都留在同一頁了。上半段先把名字壓成
            ids，下半段接著把這些 ids 怎麼變成向量、loss 和新名字，一路接下去。
          </p>
        </div>

        <div className="lab-stack">
          <section className="lab-stage" id="forward-pass">
            <div className="lab-stage-copy">
              <div>
                <p className="eyebrow">02</p>
                <h3>Embeddings + forward pass</h3>
              </div>
              <p>
                這一段把 token ids 拉成 embedding 向量，經過 attention 和 MLP，再吐出每個位置的下一個
                token logits。它沿用專案裡已經整理好的證據資料，所以不是假數字。
              </p>
            </div>
            <div className="mono-frame">
              <ForwardPassPlayground step={forwardStep} />
            </div>
          </section>

          <section className="lab-stage" id="training">
            <div className="lab-stage-copy">
              <div>
                <p className="eyebrow">03</p>
                <h3>Training loop</h3>
              </div>
              <p>
                這裡把一次更新拆成 logits、loss、backprop 跟 Adam update。你可以直接看到一個中文名字序列
                怎麼被 teacher forcing 逼著學下一個 token。
              </p>
            </div>
            <div className="mono-frame">
              <TrainingPlayground accentColor="#111111" />
            </div>
          </section>

          <section className="lab-stage" id="inference">
            <div className="lab-stage-copy">
              <div>
                <p className="eyebrow">04</p>
                <h3>Inference</h3>
              </div>
              <p>
                最後一段把訓練好的分佈拿來抽樣。調整 temperature 後，瀏覽器端 sampler 會用同一套中文姓名
                風格去重組新名字，同時把自回歸 trace 攤給你看。
              </p>
            </div>
            <div className="mono-frame">
              <InferencePlayground referenceNames={copy.proofArtifacts.generatedNames} />
            </div>
          </section>
        </div>
      </section>

      <section className="surface-card theory-card" id="real-gpts">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How tokenization works in real GPTs</p>
            <h2>真實 GPT 為什麼不會一個字一個 token？</h2>
          </div>
          <p>
            這個 branch 刻意保留最透明的 character-level tokenizer，好讓名字如何進模型一眼就看懂。
            真實 GPT 通常會改用更大的 subword tokenizer，把常見詞片段、標點和空白模式一起打包，讓上下文利用率更高。
          </p>
        </div>

        <div className="theory-grid">
          <article>
            <span>這個 demo</span>
            <strong>character-level</strong>
            <p>每個中文字都是一個 token，規則直白，最適合教學與拆解。</p>
          </article>
          <article>
            <span>真實 GPT</span>
            <strong>subword / BPE</strong>
            <p>常見詞片段會合併成單一 token，詞彙表更大，但序列更短、效率更高。</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
