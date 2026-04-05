import { pickLocale, type Locale } from '../locale'

export type InteractiveLabId = 'tokenizer' | 'forward' | 'training' | 'inference'

export type InteractiveLabChapter = {
  id: InteractiveLabId
  number: string
  title: string
  body: string
  detail: string
  prompts: string[]
}

export function getInteractiveLabCopy(locale: Locale) {
  return pickLocale(locale, {
    en: {
      heroEyebrow: 'Interactive track',
      heroTitle: 'Touch the model, not just the metaphor.',
      heroBody:
        'Borrowing the guided chapter rhythm from the reference sites, this project now lets you poke the tokenizer, forward pass, training loop, and sampler directly.',
      sectionTitle: 'Interactive lab',
      sectionDescription:
        'The narrative walk-through stays intact, but this section turns the explanation into something you can steer. Pick a chapter and the page swaps in the corresponding live instrument panel.',
      overviewEyebrow: 'Guided chapters',
      overviewTitle: 'Explore the same tiny model from four angles.',
      overviewBody:
        'The denser lab panels intentionally borrow the “tool cockpit” feel of the visualizer while keeping the cleaner chapter framing of the explorer homepage.',
      chapters: [
        {
          id: 'tokenizer',
          number: '01',
          title: 'Tokenizer',
          body: 'Type a name and watch it become ids, BOS boundaries, and teacher-forcing pairs.',
          detail:
            'This is the smallest useful interaction in the whole story: the model cannot learn letters until someone first turns them into tokens.',
          prompts: ['type a fresh sample', 'inspect BOS boundaries', 'click pair-by-pair targets'],
        },
        {
          id: 'forward',
          number: '02',
          title: 'Embeddings + forward pass',
          body: 'Replay a real probe and inspect how token state changes from embeddings to probabilities.',
          detail:
            'Instead of sketch math, this view is driven by exported evidence from the actual run, so every vector and attention bar is grounded in the trained file.',
          prompts: ['switch probe names', 'step through positions', 'compare attention heads'],
        },
        {
          id: 'training',
          number: '03',
          title: 'Training loop',
          body: 'Scrub through the loss trace and unfold the four hidden phases inside each update.',
          detail:
            'The goal here is pacing, not mystique. You can see exactly how one document becomes logits, loss, gradients, and an Adam update.',
          prompts: ['play the run', 'jump to checkpoints', 'compare against random baseline'],
        },
        {
          id: 'inference',
          number: '04',
          title: 'Inference',
          body: 'Turn the temperature knob and inspect how the browser-side sampler remixes output names.',
          detail:
            'Sampling is where the model finally feels alive, so this module exposes the same “current token -> next token” chain as an explicit trace instead of hiding it behind a single result.',
          prompts: ['raise the temperature', 'generate ten names', 'inspect the autoregressive trace'],
        },
      ] satisfies InteractiveLabChapter[],
    },
    'zh-TW': {
      heroEyebrow: '互動導覽',
      heroTitle: '不要只看比喻，直接去碰模型。',
      heroBody:
        '這一版把兩個參考站的章節節奏借過來，讓這個專案不只講 tokenizer、forward pass、training 跟 sampler，而是能直接玩。',
      sectionTitle: 'Interactive lab',
      sectionDescription:
        '原本的敘事拆解還在，但這一段把解說變成可以自己操控的實驗台。選一個章節，畫面就會切到對應的 live instrument panel。',
      overviewEyebrow: '導覽章節',
      overviewTitle: '從四個角度摸同一個 tiny model。',
      overviewBody:
        '這批資訊密度更高的實驗面板是刻意的：它借了 visualizer 那種工具艙感，同時保留 explorer 首頁比較清楚的章節導覽。',
      chapters: [
        {
          id: 'tokenizer',
          number: '01',
          title: 'Tokenizer',
          body: '輸入一個名字，直接看它怎麼被拆成 ids、BOS 邊界，還有 teacher-forcing 配對。',
          detail:
            '這是整個故事裡最小但最關鍵的互動：在有人先把字元轉成 token 之前，模型根本無從學起。',
          prompts: ['打一個新名字', '看 BOS 怎麼包邊界', '逐格點開訓練配對'],
        },
        {
          id: 'forward',
          number: '02',
          title: 'Embeddings + forward pass',
          body: '重播真實 probe，觀察 token 狀態怎麼從 embeddings 一路變成機率分佈。',
          detail:
            '這裡不是草圖數學，而是直接吃真實 run 匯出的證據，所以向量格子和 attention bar 都有根有據。',
          prompts: ['切不同 probe 名字', '逐位置前進', '比較各個 attention head'],
        },
        {
          id: 'training',
          number: '03',
          title: 'Training loop',
          body: '拖動 loss 軌跡，攤開每次更新裡藏著的四個 phase。',
          detail:
            '重點不是神祕感，而是節奏感。你可以直接看到一份文件怎麼變成 logits、loss、梯度，再變成一次 Adam update。',
          prompts: ['播放整段訓練', '跳到關鍵節點', '對照亂猜基線'],
        },
        {
          id: 'inference',
          number: '04',
          title: 'Inference',
          body: '轉動 temperature，檢查瀏覽器內 sampler 怎麼重混輸出名字。',
          detail:
            '抽樣是模型第一次看起來像活的，所以這個模組把「目前 token -> 下一個 token」那條鏈直接攤成可讀 trace，不再只給你一個結果。',
          prompts: ['把 temperature 拉高', '一次生成十個', '檢查自回歸 trace'],
        },
      ] satisfies InteractiveLabChapter[],
    },
  })
}
