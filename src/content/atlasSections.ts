import { gistRangeHref } from './sources'

export type AtlasSection = {
  lineRange: string
  title: string
  summary: string
  why: string
  highlights: string[]
  snippet: string
  sourceHref: string
}

export const atlasSections: AtlasSection[] = [
  {
    lineRange: '14-27',
    title: '資料與 Tokenizer',
    summary: '這個檔案會在需要時下載 `input.txt`，打亂文件順序，再建立一個只有單一 BOS token 的字元詞彙表。',
    why: '整個問題定義只用幾行就講完。這種壓縮感，本身就是這個頁面的主題。',
    highlights: ['沒有額外安裝流程', '完全使用字元層級符號', '立刻印出 corpus 與 vocab 統計'],
    snippet: `if not os.path.exists('input.txt'):\n    urllib.request.urlretrieve(names_url, 'input.txt')\ndocs = [line.strip() for line in open('input.txt') if line.strip()]\nuchars = sorted(set(''.join(docs)))\nBOS = len(uchars)\nvocab_size = len(uchars) + 1`,
    sourceHref: gistRangeHref(14, 27),
  },
  {
    lineRange: '29-72',
    title: '純量 Autograd 核心',
    summary: '一個極小的 `Value` 類別同時保存純量資料、圖的邊、局部導數，以及由拓樸排序驅動的反向傳播。',
    why: '這裡是從 micrograd 走到 Transformer 的觀念橋樑，也是整份 gist 最值得慢慢看的地方。',
    highlights: ['每個參數都是純量', '每個節點都保存 children 與 local grads', 'backward 會沿著反向 topo 順序展開'],
    snippet: `class Value:\n    def backward(self):\n        topo = []\n        ...\n        self.grad = 1\n        for v in reversed(topo):\n            for child, local_grad in zip(v._children, v._local_grads):\n                child.grad += local_grad * v.grad`,
    sourceHref: gistRangeHref(29, 72),
  },
  {
    lineRange: '74-90',
    title: '參數初始化',
    summary: '超參數刻意維持極小，矩陣只是巢狀 Python `Value` 清單，所有參數最後再攤平成一個 list 供優化使用。',
    why: '沒有 tensor abstraction 之後，你真的可以一個一個數參數，也能直接檢查任何單一權重。Transformer 就不再那麼神祕。',
    highlights: ['`n_embd = 16`', '`n_head = 4` 與 `n_layer = 1`', '展平後的 `params` 讓更新步驟一目了然'],
    snippet: `n_layer = 1\nn_embd = 16\nblock_size = 16\nn_head = 4\nmatrix = lambda nout, nin, std=0.08: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]\nparams = [p for mat in state_dict.values() for row in mat for p in row]`,
    sourceHref: gistRangeHref(74, 90),
  },
  {
    lineRange: '92-144',
    title: '前向傳播與 Block 結構',
    summary: 'Linear layer、RMSNorm、多頭 attention、residual 與最後的 LM head，全都住在同一個函式裡。',
    why: '這裡最能體現「其他東西多半只是效率工程」這句話。你熟悉的 Transformer，其實已經完整存在。',
    highlights: ['token embedding 與 position embedding 相加', 'attention cache 逐 timestep 增長', 'residual 路徑明確可見，不是隱含存在'],
    snippet: `def gpt(token_id, pos_id, keys, values):\n    tok_emb = state_dict['wte'][token_id]\n    pos_emb = state_dict['wpe'][pos_id]\n    x = [t + p for t, p in zip(tok_emb, pos_emb)]\n    ...\n    x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])\n    ...\n    logits = linear(x, state_dict['lm_head'])`,
    sourceHref: gistRangeHref(92, 144),
  },
  {
    lineRange: '146-184',
    title: '訓練迴圈與 Adam',
    summary: '每一步都取一段文件、計算平均 next-token loss、穿過純量計算圖做 backprop，然後用 Adam 與線性衰減更新參數。',
    why: '這裡把 optimization 明明白白地攤在你面前。頁面應該把這件事表現成優點，而不是缺少 abstraction。',
    highlights: ['每一步只吃一份文件', '局部序列上使用 teacher forcing', 'Adam buffer 只是普通的 float 陣列'],
    snippet: `for step in range(num_steps):\n    doc = docs[step % len(docs)]\n    ...\n    loss = (1 / n) * sum(losses)\n    loss.backward()\n    for i, p in enumerate(params):\n        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)`,
    sourceHref: gistRangeHref(146, 184),
  },
  {
    lineRange: '186-200',
    title: '推論',
    summary: '訓練結束後，script 會從 BOS 開始，以帶有 temperature 的 softmax 自回歸抽樣出新名字。',
    why: '結尾在教學上非常重要。sampling 證明整個 loop 確實閉合了，但又不會假裝這是一個好模型。',
    highlights: ['自回歸解碼', '遇到 BOS 就停止', 'temperature 0.5 讓輸出粗糙但仍可辨識'],
    snippet: `for sample_idx in range(20):\n    token_id = BOS\n    sample = []\n    for pos_id in range(block_size):\n        logits = gpt(token_id, pos_id, keys, values)\n        probs = softmax([l / temperature for l in logits])\n        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]`,
    sourceHref: gistRangeHref(186, 200),
  },
]
