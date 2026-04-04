import { gistRangeHref } from './sources'

export type LoopStep = {
  id: string
  title: string
  eyebrow: string
  summary: string
  detail: string
  snippet: string
  signal: string[]
  lineRange: string
  sourceHref: string
  flowStage: string
  visualKind:
    | 'corpus'
    | 'chars'
    | 'graph'
    | 'weights'
    | 'merge'
    | 'attention'
    | 'logits'
    | 'loss'
    | 'backprop'
    | 'adam'
    | 'names'
  palette: {
    accent: string
    accentStrong: string
    glow: string
  }
  flowTokens: string[]
  sourceLabel: string
  targetLabel: string
  pulseLabel: string
}

export const loopSteps: LoopStep[] = [
  {
    id: '01',
    title: '載入極小語料',
    eyebrow: '資料啟動',
    summary: '如果 `input.txt` 不存在，script 就會抓下一份純文字人名清單、去掉空白列，再打亂順序。',
    detail:
      '整個設定小到近乎誇張：一個文字檔、一個 Python 檔、加上一個資料假設。頁面應該把這種壓縮感表現成刻意的設計。',
    snippet: `if not os.path.exists('input.txt'):\n    urllib.request.urlretrieve(names_url, 'input.txt')\ndocs = [line.strip() for line in open('input.txt') if line.strip()]\nrandom.shuffle(docs)`,
    signal: ['沒有額外安裝流程', '只有人名資料集', '隨機種子固定為 42'],
    lineRange: '14-21',
    sourceHref: gistRangeHref(14, 21),
    flowStage: '原始語料',
    visualKind: 'corpus',
    palette: {
      accent: '#d96c43',
      accentStrong: '#8f331a',
      glow: '#f2c39d',
    },
    flowTokens: ['input.txt', 'names.txt', 'shuffle()'],
    sourceLabel: '原始語料',
    targetLabel: 'docs[]',
    pulseLabel: '冷啟動',
  },
  {
    id: '02',
    title: '字元 Tokenize',
    eyebrow: '詞彙表',
    summary: '每個唯一字元都會被映射成 token id，而 BOS 會被加入成邊界 token。',
    detail:
      'MicroGPT 沒把 tokenization 外包出去。留在字元層級，才能讓每個零件都可檢查，也讓詞彙表維持夠小。',
    snippet: `uchars = sorted(set(''.join(docs)))\nBOS = len(uchars)\nvocab_size = len(uchars) + 1`,
    signal: ['字元層級模型', 'BOS 標記序列邊界', '小 vocab 讓直覺更清楚'],
    lineRange: '23-27',
    sourceHref: gistRangeHref(23, 27),
    flowStage: '字元',
    visualKind: 'chars',
    palette: {
      accent: '#bb6af7',
      accentStrong: '#6b38a6',
      glow: '#dec1fb',
    },
    flowTokens: ['a', 'b', 'c', 'BOS'],
    sourceLabel: '字元',
    targetLabel: 'token ids',
    pulseLabel: '符號映射',
  },
  {
    id: '03',
    title: '建立純量 Autograd',
    eyebrow: '梯度',
    summary: '一個 `Value` 物件同時保存純量資料、圖的邊、局部導數，以及遞迴式的 backward pass。',
    detail:
      '這是整份 gist 最強的教學捷徑：attention 與 optimization 都站在第一原理 autograd 之上，而不是藏在 tensor op 裡。',
    snippet: `class Value:\n    def backward(self):\n        topo = []\n        ...\n        for v in reversed(topo):\n            for child, local_grad in zip(v._children, v._local_grads):\n                child.grad += local_grad * v.grad`,
    signal: ['每個參數都是純量', '沒有 NumPy 或 PyTorch', '鏈式法則被直接看見'],
    lineRange: '29-72',
    sourceHref: gistRangeHref(29, 72),
    flowStage: '純量計算圖',
    visualKind: 'graph',
    palette: {
      accent: '#40916c',
      accentStrong: '#1c5c41',
      glow: '#a5d6bf',
    },
    flowTokens: ['Value', 'grad', 'topo'],
    sourceLabel: '圖節點',
    targetLabel: 'backward()',
    pulseLabel: '鏈式法則',
  },
  {
    id: '04',
    title: '初始化模型',
    eyebrow: '權重',
    summary: 'embedding、attention 矩陣、MLP 權重與 LM head 都會被抽樣進一個普通的 `state_dict`。',
    detail:
      '這些維度是刻意做小的：`n_embd=16`、`n_head=4`、`n_layer=1`、`block_size=16`。小不是限制，而是特性。',
    snippet: `state_dict = {\n    'wte': matrix(vocab_size, n_embd),\n    'wpe': matrix(block_size, n_embd),\n    'lm_head': matrix(vocab_size, n_embd),\n}\nparams = [p for mat in state_dict.values() for row in mat for p in row]`,
    signal: ['單一 Transformer block', '矩陣 helper 產出 `Value`', '參數被攤平成單一 list'],
    lineRange: '74-90',
    sourceHref: gistRangeHref(74, 90),
    flowStage: '狀態字典',
    visualKind: 'weights',
    palette: {
      accent: '#ff7b00',
      accentStrong: '#9d4500',
      glow: '#ffd4a3',
    },
    flowTokens: ['wte', 'wpe', 'attn', 'mlp'],
    sourceLabel: '矩陣',
    targetLabel: 'state_dict',
    pulseLabel: '參數鑄造',
  },
  {
    id: '05',
    title: '合成 Token 與 Position',
    eyebrow: 'Embedding',
    summary: '每個 timestep 都從 token embedding 與 position embedding 相加開始，然後對結果做 RMS 正規化。',
    detail:
      '這個動作把離散符號與時間位置轉成 attention 可以操作的隱狀態。雖然很小，但它就是 Transformer 真正的入口。',
    snippet: `tok_emb = state_dict['wte'][token_id]\npos_emb = state_dict['wpe'][pos_id]\nx = [t + p for t, p in zip(tok_emb, pos_emb)]\nx = rmsnorm(x)`,
    signal: ['無狀態輸入混合', '用 RMSNorm 取代 LayerNorm', '整份模型沒有 bias'],
    lineRange: '108-112',
    sourceHref: gistRangeHref(108, 112),
    flowStage: '隱狀態',
    visualKind: 'merge',
    palette: {
      accent: '#468faf',
      accentStrong: '#1a4c60',
      glow: '#afd6e6',
    },
    flowTokens: ['tok_emb', '+', 'pos_emb', 'rms'],
    sourceLabel: 'token 串流',
    targetLabel: '隱狀態',
    pulseLabel: '嵌入融合',
  },
  {
    id: '06',
    title: '對歷史做 Attention',
    eyebrow: 'Attention',
    summary: 'query、key、value 都從當前狀態算出，而每個 head 都會對先前所有 token 做 softmax。',
    detail:
      '因為 `keys` 與 `values` 是依照位置逐步 append 的，所以 causal history 是用普通 Python list 一個 token 一個 token 長出來的，不是黑盒 cache。',
    snippet: `q = linear(x, state_dict[f'layer{li}.attn_wq'])\nk = linear(x, state_dict[f'layer{li}.attn_wk'])\nv = linear(x, state_dict[f'layer{li}.attn_wv'])\nattn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 for t in range(len(k_h))]\nattn_weights = softmax(attn_logits)`,
    signal: ['4 個 head x 4 維', '歷史逐步增長', 'residual 連接把 attention block 閉合起來'],
    lineRange: '114-135',
    sourceHref: gistRangeHref(114, 135),
    flowStage: '上下文混合',
    visualKind: 'attention',
    palette: {
      accent: '#ef476f',
      accentStrong: '#a51e44',
      glow: '#f7b5c6',
    },
    flowTokens: ['q', 'k', 'v', 'softmax'],
    sourceLabel: '上下文快取',
    targetLabel: 'attn mix',
    pulseLabel: '記憶聚焦',
  },
  {
    id: '07',
    title: '投影到下一個 Token 的 Logits',
    eyebrow: '解碼器',
    summary: '經過 attention 路徑與 ReLU MLP 之後，最終隱狀態會再透過 `lm_head` 投影出去。',
    detail:
      '模型不會全域存放 activations。`gpt()` 就只是從 token、position 與 cache 映射到 logits 的函式，這也是它容易教學的原因。',
    snippet: `x = linear(x, state_dict[f'layer{li}.mlp_fc1'])\nx = [xi.relu() for xi in x]\nx = linear(x, state_dict[f'layer{li}.mlp_fc2'])\nx = [a + b for a, b in zip(x, x_residual)]\nlogits = linear(x, state_dict['lm_head'])`,
    signal: ['形狀接近 GPT-2', '用 ReLU 取代 GeLU', '函式式、無狀態設計'],
    lineRange: '136-144',
    sourceHref: gistRangeHref(136, 144),
    flowStage: 'logits',
    visualKind: 'logits',
    palette: {
      accent: '#fb5607',
      accentStrong: '#9a2d00',
      glow: '#ffc4a1',
    },
    flowTokens: ['mlp', 'relu', 'lm_head'],
    sourceLabel: '隱狀態',
    targetLabel: 'logits',
    pulseLabel: '解碼頭',
  },
  {
    id: '08',
    title: '平均負對數似然',
    eyebrow: 'Loss',
    summary: '對每個 token 位置，程式會先對 logits 做 softmax，選出正確的下一個 token，再取 `-log(p)` 並平均。',
    detail:
      'teacher forcing 在這裡完全攤開。模型的訓練方式，就是把每一步預測的 next token 和當前名字中的真實 next token 直接比較。',
    snippet: `logits = gpt(token_id, pos_id, keys, values)\nprobs = softmax(logits)\nloss_t = -probs[target_id].log()\nlosses.append(loss_t)\nloss = (1 / n) * sum(losses)`,
    signal: ['Teacher forcing', '純量計算圖', '整段序列最後只收斂成一個 scalar objective'],
    lineRange: '163-169',
    sourceHref: gistRangeHref(163, 169),
    flowStage: 'loss 純量',
    visualKind: 'loss',
    palette: {
      accent: '#7b2cbf',
      accentStrong: '#4d1481',
      glow: '#d1b0ec',
    },
    flowTokens: ['probs', 'target', '-log(p)'],
    sourceLabel: '預測',
    targetLabel: 'loss 純量',
    pulseLabel: '目標函數',
  },
  {
    id: '09',
    title: '對整個圖做 Backprop',
    eyebrow: '反向傳播',
    summary: '呼叫 `loss.backward()` 之後，純量計算圖會沿著反向拓樸順序展開並累積梯度。',
    detail:
      '這正是這個 demo 好教的原因：Transformer 訓練的每一段都可見，而不是交給編譯好的 kernel。',
    snippet: `loss.backward()\nfor v in reversed(topo):\n    for child, local_grad in zip(v._children, v._local_grads):\n        child.grad += local_grad * v.grad`,
    signal: ['反向 topo 掃描', '梯度原地累積', '可讀性高到能現場講解'],
    lineRange: '59-72, 171-172',
    sourceHref: gistRangeHref(59, 72),
    flowStage: '梯度',
    visualKind: 'backprop',
    palette: {
      accent: '#2a9d8f',
      accentStrong: '#165b53',
      glow: '#abdcd6',
    },
    flowTokens: ['loss', 'topo', 'grad +='],
    sourceLabel: '目標函數',
    targetLabel: '梯度',
    pulseLabel: '反向掃描',
  },
  {
    id: '10',
    title: '用衰減學習率執行 Adam',
    eyebrow: '最佳化',
    summary: 'Adam buffer 只是普通 float 陣列，而 learning rate 會在整段訓練過程中線性衰減。',
    detail:
      '每個純量參數都有自己的 `m` 與 `v` 項目，更新完後立刻把梯度清零。optimizer state 沒有被 framework call 隱藏起來。',
    snippet: `lr_t = learning_rate * (1 - step / num_steps)\nm[i] = beta1 * m[i] + (1 - beta1) * p.grad\nv[i] = beta2 * v[i] + (1 - beta2) * p.grad ** 2\np.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)\np.grad = 0`,
    signal: ['beta1 = 0.85', 'beta2 = 0.99', '每一步更新後都重設梯度'],
    lineRange: '175-182',
    sourceHref: gistRangeHref(175, 182),
    flowStage: '新參數',
    visualKind: 'adam',
    palette: {
      accent: '#e76f51',
      accentStrong: '#8e3420',
      glow: '#f6c2b6',
    },
    flowTokens: ['m', 'v', 'lr_t', 'update'],
    sourceLabel: '梯度',
    targetLabel: '新參數',
    pulseLabel: '最佳化步驟',
  },
  {
    id: '11',
    title: '胡言亂語出新名字',
    eyebrow: '推論',
    summary: '訓練完成後，script 會用 temperature 0.5 自回歸地抽樣出 20 個新名字。',
    detail:
      '這些輸出本來就應該粗糙又有點可愛。它們的任務是證明整個 loop 能運作，不是假裝自己是 production model。',
    snippet: `probs = softmax([l / temperature for l in logits])\ntoken_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]\nif token_id == BOS:\n    break\nsample.append(uchars[token_id])`,
    signal: ['自回歸解碼', '碰到 BOS 就停止', '模型幻想出來的名字'],
    lineRange: '186-200',
    sourceHref: gistRangeHref(186, 200),
    flowStage: '新名字',
    visualKind: 'names',
    palette: {
      accent: '#3a86ff',
      accentStrong: '#1e4d91',
      glow: '#b8d2fb',
    },
    flowTokens: ['BOS', 'sample', 'temperature'],
    sourceLabel: 'BOS',
    targetLabel: '抽樣名字',
    pulseLabel: '閉環證明',
  },
]
