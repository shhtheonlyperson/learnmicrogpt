import { useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import type { LoopStep } from '../content/copy'
import {
  BOS_TOKEN,
  buildCharToId,
  getLocaleModelData,
  normalizeModelInput,
} from '../content/microgptData'
import { pickLocale, type Locale } from '../locale'
import { useI18n } from '../i18n-context'

type Transition = {
  from: string
  to: string
  fromId: number
  toId: number
}

const formatToken = (token: string) => (token === BOS_TOKEN ? BOS_TOKEN : token)

export function TokenizerPlayground({ step }: { step: LoopStep }) {
  const { locale } = useI18n()
  const config = getLocaleModelData(locale)
  const charSet = useMemo(() => new Set(config.chars), [config.chars])
  const charToId = useMemo(() => buildCharToId(config.chars), [config.chars])
  const bosId = config.chars.length

  const copy = pickLocale(locale, {
    en: {
      eyebrow: 'Interactive example',
      title: 'Tokenizer playground',
      body:
        'Type a sample and watch MicroGPT turn a name into ids, then into next-token teaching pairs.',
      inputLabel: 'Type a name',
      helper: 'Only letters a-z are kept. Unsupported characters are ignored.',
      length: `Maximum ${config.maxNameLength} characters.`,
      reset: 'use example',
      vocabTitle: 'Character → token id',
      vocabBody: 'Highlighted tiles are active in the current sample.',
      sequenceTitle: 'Token sequence',
      sequenceBody: 'MicroGPT only sees ids, wrapped by BOS at both ends.',
      idsLabel: 'raw ids',
      pairTitle: 'Teacher-forcing pairs',
      pairBody: 'Each pair trains the model to predict the next token from the current one.',
      currentPair: 'Current teaching pair',
      currentPairBody: 'At position {index}, the model sees {from} (id {fromId}) and must predict {to} (id {toId}).',
      historyLabel: 'history so far',
      tokenCount: 'tokens in view',
      vocabCount: 'vocab size',
      bosLabel: 'BOS id',
    },
    'zh-TW': {
      eyebrow: '互動例子',
      title: 'Tokenizer playground',
      body: '輸入一個名字，直接看 MicroGPT 怎麼先把字元換成 ids，再拆成下一個 token 的訓練配對。',
      inputLabel: '輸入名字',
      helper: '只保留本地中文姓名語料裡出現過的字元；不支援的字會被忽略。',
      length: `最多 ${config.maxNameLength} 個字元。`,
      reset: '帶入範例',
      vocabTitle: '字元 → token id',
      vocabBody: '被點亮的格子，就是目前輸入真的會用到的 token。',
      sequenceTitle: 'Token 序列',
      sequenceBody: 'MicroGPT 真正看到的是 ids，而且頭尾都會補上一個 BOS。',
      idsLabel: '原始 ids',
      pairTitle: 'Teacher forcing 配對',
      pairBody: '每一組配對都在教模型：看到現在這個 token，下一個最該猜什麼。',
      currentPair: '目前訓練中的配對',
      currentPairBody: '在第 {index} 個位置，模型會看到 {from}（id {fromId}），然後被要求預測 {to}（id {toId}）。',
      historyLabel: '目前累積的上下文',
      tokenCount: '目前 token 數',
      vocabCount: '詞彙表大小',
      bosLabel: 'BOS id',
    },
  })

  const [inputValue, setInputValue] = useState(() => config.exampleName)
  const [activeTransitionIndex, setActiveTransitionIndex] = useState(0)

  const tokens = useMemo(() => [BOS_TOKEN, ...Array.from(inputValue), BOS_TOKEN], [inputValue])
  const tokenIds = useMemo(
    () =>
      tokens.map((token) => {
        if (token === BOS_TOKEN) return bosId
        return charToId.get(token) ?? bosId
      }),
    [bosId, charToId, tokens],
  )
  const activeChars = useMemo(() => new Set(Array.from(inputValue)), [inputValue])

  const transitions = useMemo<Transition[]>(
    () =>
      tokens.slice(0, -1).map((from, index) => ({
        from,
        to: tokens[index + 1] ?? BOS_TOKEN,
        fromId: tokenIds[index] ?? bosId,
        toId: tokenIds[index + 1] ?? bosId,
      })),
    [bosId, tokenIds, tokens],
  )

  const safeTransitionIndex = Math.min(activeTransitionIndex, Math.max(0, transitions.length - 1))
  const activeTransition = transitions[safeTransitionIndex]
  const activeHistory = tokens.slice(0, safeTransitionIndex + 1)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = normalizeModelInput(event.target.value, locale as Locale, charSet, config.maxNameLength)
    setInputValue(nextValue)
  }

  const style = {
    '--tokenizer-accent': step.palette.accent,
    '--tokenizer-accent-strong': step.palette.accentStrong,
    '--tokenizer-glow': step.palette.glow,
  } as CSSProperties

  return (
    <article className="tokenizer-playground reveal" style={style}>
      <div className="tokenizer-playground-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="tokenizer-stat-strip" aria-label={copy.title}>
        <div className="tokenizer-stat-card">
          <span>{copy.tokenCount}</span>
          <strong>{tokens.length}</strong>
        </div>
        <div className="tokenizer-stat-card">
          <span>{copy.vocabCount}</span>
          <strong>{config.chars.length + 1}</strong>
        </div>
        <div className="tokenizer-stat-card">
          <span>{copy.bosLabel}</span>
          <strong>{bosId}</strong>
        </div>
      </div>

      <div className="tokenizer-grid">
        <section className="tokenizer-card tokenizer-card-vocab">
          <div className="tokenizer-card-header">
            <div>
              <p className="eyebrow">{copy.vocabTitle}</p>
              <h4>{copy.vocabTitle}</h4>
            </div>
            <p>{copy.vocabBody}</p>
          </div>

          <div className="tokenizer-vocab-grid">
            {config.chars.map((char, index) => (
              <article
                className={activeChars.has(char) ? 'tokenizer-vocab-tile active' : 'tokenizer-vocab-tile'}
                key={`${char}-${index}`}
              >
                <strong>{char}</strong>
                <span>id {index}</span>
              </article>
            ))}
            <article className="tokenizer-vocab-tile bos active">
              <strong>{BOS_TOKEN}</strong>
              <span>id {bosId}</span>
            </article>
          </div>
        </section>

        <section className="tokenizer-card tokenizer-card-workbench">
          <div className="tokenizer-card-header">
            <div>
              <p className="eyebrow">{copy.sequenceTitle}</p>
              <h4>{copy.sequenceTitle}</h4>
            </div>
            <p>{copy.sequenceBody}</p>
          </div>

          <div className="tokenizer-input-row">
            <label className="tokenizer-input-wrap">
              <span>{copy.inputLabel}</span>
              <input
                onChange={handleInputChange}
                placeholder={config.exampleName}
                type="text"
                value={inputValue}
              />
            </label>
            <button
              className="tokenizer-reset"
              onClick={() => {
                setInputValue(config.exampleName)
                setActiveTransitionIndex(0)
              }}
              type="button"
            >
              {copy.reset}
            </button>
          </div>

          <p className="tokenizer-helper">
            {copy.helper} {copy.length}
          </p>

          <div className="tokenizer-sequence">
            {tokens.map((token, index) => (
              <div
                className={token === BOS_TOKEN ? 'tokenizer-token-chip bos' : 'tokenizer-token-chip'}
                key={`${token}-${index}`}
              >
                <strong>{formatToken(token)}</strong>
                <span>id {tokenIds[index] ?? bosId}</span>
              </div>
            ))}
          </div>

          <div className="tokenizer-id-strip">
            <span>{copy.idsLabel}</span>
            <code>[{tokenIds.join(', ')}]</code>
          </div>

          <div className="tokenizer-card-header compact">
            <div>
              <p className="eyebrow">{copy.pairTitle}</p>
              <h4>{copy.pairTitle}</h4>
            </div>
            <p>{copy.pairBody}</p>
          </div>

          <div className="tokenizer-pair-rail">
            {transitions.map((transition, index) => (
              <button
                aria-pressed={index === safeTransitionIndex}
                className={index === safeTransitionIndex ? 'tokenizer-pair-button active' : 'tokenizer-pair-button'}
                key={`${transition.from}-${transition.to}-${index}`}
                onClick={() => setActiveTransitionIndex(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>
                  {formatToken(transition.from)} → {formatToken(transition.to)}
                </strong>
              </button>
            ))}
          </div>

          {activeTransition ? (
            <div className="tokenizer-current-pair">
              <p className="eyebrow">{copy.currentPair}</p>
              <strong>
                {formatToken(activeTransition.from)} → {formatToken(activeTransition.to)}
              </strong>
              <p>
                {copy.currentPairBody
                  .replace('{index}', String(safeTransitionIndex + 1))
                  .replace('{from}', formatToken(activeTransition.from))
                  .replace('{fromId}', String(activeTransition.fromId))
                  .replace('{to}', formatToken(activeTransition.to))
                  .replace('{toId}', String(activeTransition.toId))}
              </p>

              <div className="tokenizer-history">
                <span>{copy.historyLabel}</span>
                <code>{activeHistory.map(formatToken).join(' → ')}</code>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </article>
  )
}
