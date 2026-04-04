import { evidencePack } from './evidencePack'
import { sourceLinks } from './sources'

export type HeroMetric = {
  value: string
  label: string
  note: string
}

const { source, quickRun } = evidencePack

export const heroMetrics: HeroMetric[] = [
  { value: String(source.lineCount), label: '原始 gist 行數', note: '一個零依賴 Python 檔，就包含完整訓練與推論流程。' },
  { value: quickRun.numDocs.toLocaleString('zh-TW'), label: '訓練文件', note: '只靠一份打亂後的人名清單，就足以把整個 loop 說清楚。' },
  { value: String(quickRun.vocabSize), label: '詞元數', note: '26 個小寫字母，再加上一個 BOS 邊界 token。' },
  { value: quickRun.numParams.toLocaleString('zh-TW'), label: '純量參數', note: '包含 embedding、attention、MLP 與 LM head。' },
  { value: '1', label: 'Transformer 層數', note: '只留一個 block，重點是把結構看清，不是把規模做大。' },
  { value: '4', label: '注意力頭數', note: '每個 head 只有四維，這正是它好教學的原因之一。' },
]

export const heroContent = {
  eyebrow: 'MICROGPT 拆解',
  headline: '一個檔案，一個玩具 Transformer，整個 loop 全部攤開。',
  lede:
    "Karpathy 的 `microgpt.py` 保留了 GPT 演算法的骨架，同時把 tensor library、batching 與大規模訓練都拿掉。資料載入、字元 tokenizer、純量 autograd、attention、Adam 和 sampling，全都在同一個 Python 檔裡。",
  thesis: '模型很小，但演算法是完整的。剩下那些龐大複雜度，多半只是效率工程。',
  primaryCta: {
    label: '開始探索',
    href: '#loop',
  },
  secondaryCta: {
    label: '閱讀 gist',
    href: sourceLinks.gist,
  },
  terminalLabel: '參考執行',
  coreMoveLabel: '核心動作',
  coreMoveSnippet: `tok_emb = state_dict['wte'][token_id]\npos_emb = state_dict['wpe'][pos_id]\nx = [t + p for t, p in zip(tok_emb, pos_emb)]\nlogits = linear(x, state_dict['lm_head'])`,
}
