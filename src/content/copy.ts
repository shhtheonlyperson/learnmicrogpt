import { getEvidencePack, type EvidenceLossPoint } from './evidencePack'
import { sourceLinks, gistRangeHref } from './sources'
import type { Locale } from '../locale'

export type HeroMetric = {
  value: string
  label: string
  note: string
}

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

export type AtlasSection = {
  lineRange: string
  title: string
  summary: string
  why: string
  highlights: string[]
  snippet: string
  sourceHref: string
}

export type PrimitiveCard = {
  title: string
  role: string
  kept: string
  simplified: string
}

export type ReferenceLink = {
  label: string
  href: string
  detail: string
}

const sharedLoopSnippets = {
  load: `if not os.path.exists('input.txt'):\n    urllib.request.urlretrieve(names_url, 'input.txt')\ndocs = [line.strip() for line in open('input.txt') if line.strip()]\nrandom.shuffle(docs)`,
  tokenize: `uchars = sorted(set(''.join(docs)))\nBOS = len(uchars)\nvocab_size = len(uchars) + 1`,
  autograd: `class Value:\n    def backward(self):\n        topo = []\n        ...\n        for v in reversed(topo):\n            for child, local_grad in zip(v._children, v._local_grads):\n                child.grad += local_grad * v.grad`,
  init: `state_dict = {\n    'wte': matrix(vocab_size, n_embd),\n    'wpe': matrix(block_size, n_embd),\n    'lm_head': matrix(vocab_size, n_embd),\n}\nparams = [p for mat in state_dict.values() for row in mat for p in row]`,
  embed: `tok_emb = state_dict['wte'][token_id]\npos_emb = state_dict['wpe'][pos_id]\nx = [t + p for t, p in zip(tok_emb, pos_emb)]\nx = rmsnorm(x)`,
  attention: `q = linear(x, state_dict[f'layer{li}.attn_wq'])\nk = linear(x, state_dict[f'layer{li}.attn_wk'])\nv = linear(x, state_dict[f'layer{li}.attn_wv'])\nattn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 for t in range(len(k_h))]\nattn_weights = softmax(attn_logits)`,
  logits: `x = linear(x, state_dict[f'layer{li}.mlp_fc1'])\nx = [xi.relu() for xi in x]\nx = linear(x, state_dict[f'layer{li}.mlp_fc2'])\nx = [a + b for a, b in zip(x, x_residual)]\nlogits = linear(x, state_dict['lm_head'])`,
  loss: `logits = gpt(token_id, pos_id, keys, values)\nprobs = softmax(logits)\nloss_t = -probs[target_id].log()\nlosses.append(loss_t)\nloss = (1 / n) * sum(losses)`,
  backprop: `loss.backward()\nfor v in reversed(topo):\n    for child, local_grad in zip(v._children, v._local_grads):\n        child.grad += local_grad * v.grad`,
  adam: `lr_t = learning_rate * (1 - step / num_steps)\nm[i] = beta1 * m[i] + (1 - beta1) * p.grad\nv[i] = beta2 * v[i] + (1 - beta2) * p.grad ** 2\np.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)\np.grad = 0`,
  sample: `probs = softmax([l / temperature for l in logits])\ntoken_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]\nif token_id == BOS:\n    break\nsample.append(uchars[token_id])`,
  coreMove: `tok_emb = state_dict['wte'][token_id]\npos_emb = state_dict['wpe'][pos_id]\nx = [t + p for t, p in zip(tok_emb, pos_emb)]\nlogits = linear(x, state_dict['lm_head'])`,
}

export function getCopy(locale: Locale) {
  const isZh = locale === 'zh-TW'
  const evidencePack = getEvidencePack(locale)
  const { source, quickRun } = evidencePack

  const heroMetrics: HeroMetric[] = isZh
    ? [
        { value: String(source.lineCount), label: '原始 gist 行數', note: '一個零依賴 Python 檔，直接包下完整訓練與推論流程。' },
        { value: quickRun.numDocs.toLocaleString('zh-TW'), label: 'training docs', note: '只靠一份打亂後的中文姓名清單，就夠把整個 loop 拆到見骨。' },
        { value: String(quickRun.vocabSize), label: 'vocab size', note: '這版 evidence 直接改用台灣常見中文姓名資料，因此 vocab 也跟著換成中文字符集合。' },
        { value: quickRun.numParams.toLocaleString('zh-TW'), label: 'scalar params', note: 'embedding、attention、MLP、LM head，全部攤在檯面上。' },
        { value: '1', label: 'Transformer blocks', note: '只留一層，不是偷工減料，是不想讓你被規模分心。' },
        { value: '4', label: 'attention heads', note: '每個 head 只有四維。寒酸得剛剛好，也因此超好教。' },
      ]
    : [
        { value: String(source.lineCount), label: 'raw gist lines', note: 'One dependency-free Python file, and the whole training/inference loop is right there.' },
        { value: quickRun.numDocs.toLocaleString('en-US'), label: 'training docs', note: 'A shuffled list of names is enough to expose the whole loop without the usual smoke machine.' },
        { value: String(quickRun.vocabSize), label: 'vocab size', note: '26 lowercase letters plus one BOS token. Tiny on purpose.' },
        { value: quickRun.numParams.toLocaleString('en-US'), label: 'scalar params', note: 'embeddings, attention, MLP, LM head — all sitting in plain sight.' },
        { value: '1', label: 'Transformer blocks', note: 'One block only. Not because it is weak, because distraction is.' },
        { value: '4', label: 'attention heads', note: 'Each head is four dimensions wide. Cheap, cheerful, and absurdly teachable.' },
      ]

  const heroContent = isZh
    ? {
        eyebrow: 'MICROGPT 拆解',
        headline: '一個檔案，一個玩具 Transformer，拿來學台灣人的名字。',
        lede:
          "Karpathy 的 `microgpt.py` 把 GPT 的骨架整個攤在桌上，順手把 tensor library、batching 跟大規模訓練那些煙霧彈先踢出去。中文版案例現在改成台灣常見中文姓名：資料載入、char tokenizer、scalar autograd、attention、Adam 和 sampling，全部還是塞在同一個 Python 檔裡，乾淨得有點囂張。",
        thesis: '模型很小，演算法可沒在縮水。把語料從英文名字換成中文姓名之後，你更容易看出：模型學到的不是文化理解，是字元分佈。別把它想得太玄。',
        primaryCta: { label: '看它怎麼運作', href: '#loop' },
        secondaryCta: { label: '直接看 code', href: sourceLinks.gist },
        terminalLabel: 'Reference run',
        coreMoveLabel: 'Core move',
        coreMoveSnippet: sharedLoopSnippets.coreMove,
      }
    : {
        eyebrow: 'MICROGPT, UNPACKED',
        headline: 'One file. One toy Transformer. No smug hand-waving.',
        lede:
          "Karpathy’s `microgpt.py` throws the GPT skeleton straight onto the table and kicks tensor libraries, batching, and large-scale training theatrics out of frame. Data loading, a char tokenizer, scalar autograd, attention, Adam, and sampling all live in one Python file. Clean enough to feel a little rude.",
        thesis: 'The model is tiny. The algorithm is not. Most of the scary-looking complexity is just what happens when you make things faster, bigger, and more corporate-looking.',
        primaryCta: { label: 'See how it runs', href: '#loop' },
        secondaryCta: { label: 'Read the code', href: sourceLinks.gist },
        terminalLabel: 'Reference run',
        coreMoveLabel: 'Core move',
        coreMoveSnippet: sharedLoopSnippets.coreMove,
      }

  const loopSteps: LoopStep[] = isZh
    ? [
        {
          id: '01',
          title: '載入 tiny corpus',
          eyebrow: '資料啟動',
          summary: '如果 `input.txt` 不存在，script 就會抓下一份純文字中文姓名清單、去掉空白列，再打亂順序。',
          detail: '整個設定小到近乎誇張：一個文字檔、一個 Python 檔、加上一個資料假設。頁面應該把這種壓縮感表現成刻意的設計。',
          snippet: sharedLoopSnippets.load,
          signal: ['沒有額外安裝流程', '只有中文姓名資料集', '隨機種子固定為 42'],
          lineRange: '14-21', sourceHref: gistRangeHref(14, 21), flowStage: '原始語料', visualKind: 'corpus',
          palette: { accent: '#d96c43', accentStrong: '#8f331a', glow: '#f2c39d' }, flowTokens: ['input.txt', 'names.txt', 'shuffle()'], sourceLabel: '原始語料', targetLabel: 'docs[]', pulseLabel: '冷啟動',
        },
        {
          id: '02', title: 'Char tokenize', eyebrow: '詞彙表', summary: '每個唯一字元都會被映射成 token id，而 BOS 會被加入成邊界 token。', detail: 'MicroGPT 沒把 tokenization 外包出去。留在字元層級，才能讓每個零件都可檢查，也讓詞彙表維持夠小。', snippet: sharedLoopSnippets.tokenize, signal: ['字元層級模型', 'BOS 標記序列邊界', '小 vocab 讓直覺更清楚'], lineRange: '23-27', sourceHref: gistRangeHref(23, 27), flowStage: '字元', visualKind: 'chars', palette: { accent: '#bb6af7', accentStrong: '#6b38a6', glow: '#dec1fb' }, flowTokens: ['a', 'b', 'c', 'BOS'], sourceLabel: '字元', targetLabel: 'token ids', pulseLabel: '符號映射',
        },
        {
          id: '03', title: '建立 scalar autograd', eyebrow: '梯度', summary: '一個 `Value` 物件同時保存純量資料、圖的邊、局部導數，以及遞迴式的 backward pass。', detail: '這是整份 gist 最強的教學捷徑：attention 與 optimization 都站在第一原理 autograd 之上，而不是藏在 tensor op 裡。', snippet: sharedLoopSnippets.autograd, signal: ['每個參數都是純量', '沒有 NumPy 或 PyTorch', '鏈式法則被直接看見'], lineRange: '29-72', sourceHref: gistRangeHref(29, 72), flowStage: '純量計算圖', visualKind: 'graph', palette: { accent: '#40916c', accentStrong: '#1c5c41', glow: '#a5d6bf' }, flowTokens: ['Value', 'grad', 'topo'], sourceLabel: '圖節點', targetLabel: 'backward()', pulseLabel: '鏈式法則',
        },
        {
          id: '04', title: '初始化模型', eyebrow: '權重', summary: 'embedding、attention 矩陣、MLP 權重與 LM head 都會被抽樣進一個普通的 `state_dict`。', detail: '這些維度是刻意做小的：`n_embd=16`、`n_head=4`、`n_layer=1`、`block_size=16`。小不是限制，而是特性。', snippet: sharedLoopSnippets.init, signal: ['單一 Transformer block', '矩陣 helper 產出 `Value`', '參數被攤平成單一 list'], lineRange: '74-90', sourceHref: gistRangeHref(74, 90), flowStage: '狀態字典', visualKind: 'weights', palette: { accent: '#ff7b00', accentStrong: '#9d4500', glow: '#ffd4a3' }, flowTokens: ['wte', 'wpe', 'attn', 'mlp'], sourceLabel: '矩陣', targetLabel: 'state_dict', pulseLabel: '參數鑄造',
        },
        {
          id: '05', title: '合成 token + position', eyebrow: 'Embedding', summary: '每個 timestep 都從 token embedding 與 position embedding 相加開始，然後對結果做 RMS 正規化。', detail: '這個動作把離散符號與時間位置轉成 attention 可以操作的隱狀態。雖然很小，但它就是 Transformer 真正的入口。', snippet: sharedLoopSnippets.embed, signal: ['無狀態輸入混合', '用 RMSNorm 取代 LayerNorm', '整份模型沒有 bias'], lineRange: '108-112', sourceHref: gistRangeHref(108, 112), flowStage: '隱狀態', visualKind: 'merge', palette: { accent: '#468faf', accentStrong: '#1a4c60', glow: '#afd6e6' }, flowTokens: ['tok_emb', '+', 'pos_emb', 'rms'], sourceLabel: 'token 串流', targetLabel: '隱狀態', pulseLabel: '嵌入融合',
        },
        {
          id: '06', title: '對歷史做 attention', eyebrow: 'Attention', summary: 'query、key、value 都從當前狀態算出，而每個 head 都會對先前所有 token 做 softmax。', detail: '因為 `keys` 與 `values` 是依照位置逐步 append 的，所以 causal history 是用普通 Python list 一個 token 一個 token 長出來的，不是黑盒 cache。', snippet: sharedLoopSnippets.attention, signal: ['4 heads × 4 dims', '歷史逐步增長', 'residual 連接把 attention block 閉合起來'], lineRange: '114-135', sourceHref: gistRangeHref(114, 135), flowStage: '上下文混合', visualKind: 'attention', palette: { accent: '#ef476f', accentStrong: '#a51e44', glow: '#f7b5c6' }, flowTokens: ['q', 'k', 'v', 'softmax'], sourceLabel: '上下文快取', targetLabel: 'attn mix', pulseLabel: '記憶聚焦',
        },
        {
          id: '07', title: '投影到下一個 token 的 logits', eyebrow: '解碼器', summary: '經過 attention 路徑與 ReLU MLP 之後，最終隱狀態會再透過 `lm_head` 投影出去。', detail: '模型不會全域存放 activations。`gpt()` 就只是從 token、position 與 cache 映射到 logits 的函式，這也是它容易教學的原因。', snippet: sharedLoopSnippets.logits, signal: ['形狀接近 GPT-2', '用 ReLU 取代 GeLU', '函式式、無狀態設計'], lineRange: '136-144', sourceHref: gistRangeHref(136, 144), flowStage: 'logits', visualKind: 'logits', palette: { accent: '#fb5607', accentStrong: '#9a2d00', glow: '#ffc4a1' }, flowTokens: ['mlp', 'relu', 'lm_head'], sourceLabel: '隱狀態', targetLabel: 'logits', pulseLabel: '解碼頭',
        },
        {
          id: '08', title: '平均 NLL loss', eyebrow: 'Loss', summary: '對每個 token 位置，程式會先對 logits 做 softmax，選出正確的下一個 token，再取 `-log(p)` 並平均。', detail: 'teacher forcing 在這裡完全攤開。模型的訓練方式，就是把每一步預測的 next token 和當前名字中的真實 next token 直接比較。', snippet: sharedLoopSnippets.loss, signal: ['Teacher forcing', '純量計算圖', '整段序列最後只收斂成一個 scalar objective'], lineRange: '163-169', sourceHref: gistRangeHref(163, 169), flowStage: 'loss 純量', visualKind: 'loss', palette: { accent: '#7b2cbf', accentStrong: '#4d1481', glow: '#d1b0ec' }, flowTokens: ['probs', 'target', '-log(p)'], sourceLabel: '預測', targetLabel: 'loss 純量', pulseLabel: '目標函數',
        },
        {
          id: '09', title: '對整個圖做 backprop', eyebrow: '反向傳播', summary: '呼叫 `loss.backward()` 之後，純量計算圖會沿著反向拓樸順序展開並累積梯度。', detail: '這正是這個 demo 好教的原因：Transformer 訓練的每一段都可見，而不是交給編譯好的 kernel。', snippet: sharedLoopSnippets.backprop, signal: ['反向 topo 掃描', '梯度原地累積', '可讀性高到能現場講解'], lineRange: '59-72, 171-172', sourceHref: gistRangeHref(59, 72), flowStage: '梯度', visualKind: 'backprop', palette: { accent: '#2a9d8f', accentStrong: '#165b53', glow: '#abdcd6' }, flowTokens: ['loss', 'topo', 'grad +='], sourceLabel: '目標函數', targetLabel: '梯度', pulseLabel: '反向掃描',
        },
        {
          id: '10', title: '用衰減 learning rate 跑 Adam', eyebrow: '最佳化', summary: 'Adam buffer 只是普通 float 陣列，而 learning rate 會在整段訓練過程中線性衰減。', detail: '每個純量參數都有自己的 `m` 與 `v` 項目，更新完後立刻把梯度清零。optimizer state 沒有被 framework call 隱藏起來。', snippet: sharedLoopSnippets.adam, signal: ['beta1 = 0.85', 'beta2 = 0.99', '每一步更新後都重設梯度'], lineRange: '175-182', sourceHref: gistRangeHref(175, 182), flowStage: '新參數', visualKind: 'adam', palette: { accent: '#e76f51', accentStrong: '#8e3420', glow: '#f6c2b6' }, flowTokens: ['m', 'v', 'lr_t', 'update'], sourceLabel: '梯度', targetLabel: '新參數', pulseLabel: '最佳化步驟',
        },
        {
          id: '11', title: '亂數噴出新名字', eyebrow: '推論', summary: '訓練完成後，script 會用 temperature 0.5 自回歸地抽樣出 20 個中文名字。', detail: '這些輸出本來就該粗糙，甚至有點欠揍。它們的任務是證明整個 loop 真的有跑通，不是假裝自己已經懂台灣姓名學。', snippet: sharedLoopSnippets.sample, signal: ['自回歸解碼', '碰到 BOS 就停止', '模型幻想出來的中文名字'], lineRange: '186-200', sourceHref: gistRangeHref(186, 200), flowStage: '新名字', visualKind: 'names', palette: { accent: '#3a86ff', accentStrong: '#1e4d91', glow: '#b8d2fb' }, flowTokens: ['BOS', 'sample', 'temperature'], sourceLabel: 'BOS', targetLabel: '抽樣名字', pulseLabel: '閉環證明',
        },
      ]
    : [
        {
          id: '01', title: 'Load the tiny corpus', eyebrow: 'data boot', summary: 'If `input.txt` is missing, the script grabs a plaintext list of names, strips empty lines, then shuffles the deck.', detail: 'The whole setup is almost aggressively small: one text file, one Python file, one data assumption. That compression is the point, not a side effect.', snippet: sharedLoopSnippets.load, signal: ['no extra install ritual', 'names dataset only', 'random seed fixed at 42'], lineRange: '14-21', sourceHref: gistRangeHref(14, 21), flowStage: 'raw corpus', visualKind: 'corpus', palette: { accent: '#d96c43', accentStrong: '#8f331a', glow: '#f2c39d' }, flowTokens: ['input.txt', 'names.txt', 'shuffle()'], sourceLabel: 'raw corpus', targetLabel: 'docs[]', pulseLabel: 'cold start',
        },
        {
          id: '02', title: 'Char tokenize', eyebrow: 'vocab', summary: 'Every distinct character becomes a token id, and BOS gets bolted on as the boundary token.', detail: 'MicroGPT does not outsource tokenization. Keeping it at the character level makes every moving part inspectable and keeps the vocab blessedly small.', snippet: sharedLoopSnippets.tokenize, signal: ['character-level model', 'BOS marks sequence boundaries', 'small vocab, cleaner intuition'], lineRange: '23-27', sourceHref: gistRangeHref(23, 27), flowStage: 'chars', visualKind: 'chars', palette: { accent: '#bb6af7', accentStrong: '#6b38a6', glow: '#dec1fb' }, flowTokens: ['a', 'b', 'c', 'BOS'], sourceLabel: 'chars', targetLabel: 'token ids', pulseLabel: 'symbol mapping',
        },
        {
          id: '03', title: 'Build scalar autograd', eyebrow: 'gradients', summary: 'A single `Value` object stores scalar data, graph edges, local derivatives, and a recursive backward pass.', detail: 'This is the best teaching shortcut in the whole gist: attention and optimization sit directly on first-principles autograd instead of hiding inside tensor ops.', snippet: sharedLoopSnippets.autograd, signal: ['every parameter is scalar', 'no NumPy, no PyTorch', 'chain rule fully visible'], lineRange: '29-72', sourceHref: gistRangeHref(29, 72), flowStage: 'scalar graph', visualKind: 'graph', palette: { accent: '#40916c', accentStrong: '#1c5c41', glow: '#a5d6bf' }, flowTokens: ['Value', 'grad', 'topo'], sourceLabel: 'graph nodes', targetLabel: 'backward()', pulseLabel: 'chain rule',
        },
        {
          id: '04', title: 'Initialize the model', eyebrow: 'weights', summary: 'embeddings, attention matrices, MLP weights, and the LM head all get sampled into a plain old `state_dict`.', detail: 'The dimensions are intentionally tiny: `n_embd=16`, `n_head=4`, `n_layer=1`, `block_size=16`. Small is not a compromise here. It is the whole trick.', snippet: sharedLoopSnippets.init, signal: ['single Transformer block', '`Value` objects all the way down', 'params flattened into one list'], lineRange: '74-90', sourceHref: gistRangeHref(74, 90), flowStage: 'state dict', visualKind: 'weights', palette: { accent: '#ff7b00', accentStrong: '#9d4500', glow: '#ffd4a3' }, flowTokens: ['wte', 'wpe', 'attn', 'mlp'], sourceLabel: 'matrices', targetLabel: 'state_dict', pulseLabel: 'parameter casting',
        },
        {
          id: '05', title: 'Fuse token + position', eyebrow: 'embeddings', summary: 'Each timestep starts by adding token embeddings and position embeddings, then running RMSNorm over the result.', detail: 'This is where discrete symbols and time positions become a hidden state attention can actually touch. Tiny, yes. Still the real front door of a Transformer.', snippet: sharedLoopSnippets.embed, signal: ['stateless input mix', 'RMSNorm instead of LayerNorm', 'the whole model runs without bias terms'], lineRange: '108-112', sourceHref: gistRangeHref(108, 112), flowStage: 'hidden state', visualKind: 'merge', palette: { accent: '#468faf', accentStrong: '#1a4c60', glow: '#afd6e6' }, flowTokens: ['tok_emb', '+', 'pos_emb', 'rms'], sourceLabel: 'token stream', targetLabel: 'hidden state', pulseLabel: 'embedding merge',
        },
        {
          id: '06', title: 'Run attention over history', eyebrow: 'attention', summary: 'query, key, and value all come from the current state, and each head softmaxes over every previous token.', detail: 'Because `keys` and `values` are appended position by position, causal history grows one token at a time in plain Python lists. No mystical cache, just receipts.', snippet: sharedLoopSnippets.attention, signal: ['4 heads × 4 dims', 'history grows step by step', 'residual path closes the attention block cleanly'], lineRange: '114-135', sourceHref: gistRangeHref(114, 135), flowStage: 'context mix', visualKind: 'attention', palette: { accent: '#ef476f', accentStrong: '#a51e44', glow: '#f7b5c6' }, flowTokens: ['q', 'k', 'v', 'softmax'], sourceLabel: 'context cache', targetLabel: 'attn mix', pulseLabel: 'memory focus',
        },
        {
          id: '07', title: 'Project to next-token logits', eyebrow: 'decoder', summary: 'After the attention path and ReLU MLP, the final hidden state gets pushed through `lm_head` and turned into logits.', detail: '`gpt()` does not hoard activations globally. It is just a function from token, position, and cache to logits. One more reason this thing teaches so well.', snippet: sharedLoopSnippets.logits, signal: ['shape rhymes with GPT-2', 'ReLU instead of GeLU', 'functional, stateless design'], lineRange: '136-144', sourceHref: gistRangeHref(136, 144), flowStage: 'logits', visualKind: 'logits', palette: { accent: '#fb5607', accentStrong: '#9a2d00', glow: '#ffc4a1' }, flowTokens: ['mlp', 'relu', 'lm_head'], sourceLabel: 'hidden state', targetLabel: 'logits', pulseLabel: 'decode head',
        },
        {
          id: '08', title: 'Average NLL loss', eyebrow: 'loss', summary: 'For each token position, the code softmaxes the logits, selects the correct next token, takes `-log(p)`, and averages the lot.', detail: 'Teacher forcing is completely out in the open here. Training means comparing every predicted next token against the real next token in the current name. No incense, no curtains.', snippet: sharedLoopSnippets.loss, signal: ['teacher forcing', 'scalar computation graph', 'the whole sequence collapses into one scalar objective'], lineRange: '163-169', sourceHref: gistRangeHref(163, 169), flowStage: 'loss scalar', visualKind: 'loss', palette: { accent: '#7b2cbf', accentStrong: '#4d1481', glow: '#d1b0ec' }, flowTokens: ['probs', 'target', '-log(p)'], sourceLabel: 'predictions', targetLabel: 'loss scalar', pulseLabel: 'objective',
        },
        {
          id: '09', title: 'Backprop through the whole graph', eyebrow: 'backprop', summary: 'Call `loss.backward()` and the scalar graph unwinds in reverse topological order, accumulating gradients on the way.', detail: 'That is exactly why this demo teaches so well: every part of Transformer training stays visible instead of getting outsourced to compiled kernels and vibes.', snippet: sharedLoopSnippets.backprop, signal: ['reverse topo scan', 'in-place gradient accumulation', 'readable enough to explain live'], lineRange: '59-72, 171-172', sourceHref: gistRangeHref(59, 72), flowStage: 'gradients', visualKind: 'backprop', palette: { accent: '#2a9d8f', accentStrong: '#165b53', glow: '#abdcd6' }, flowTokens: ['loss', 'topo', 'grad +='], sourceLabel: 'objective', targetLabel: 'gradients', pulseLabel: 'reverse sweep',
        },
        {
          id: '10', title: 'Run Adam with a decaying learning rate', eyebrow: 'optimization', summary: 'The Adam buffers are just plain float arrays, and the learning rate decays linearly over training.', detail: 'Every scalar parameter gets its own `m` and `v`. After each update, the gradients are zeroed immediately. Optimizer state is not hidden behind a framework bedtime story.', snippet: sharedLoopSnippets.adam, signal: ['beta1 = 0.85', 'beta2 = 0.99', 'gradients reset after every step'], lineRange: '175-182', sourceHref: gistRangeHref(175, 182), flowStage: 'new params', visualKind: 'adam', palette: { accent: '#e76f51', accentStrong: '#8e3420', glow: '#f6c2b6' }, flowTokens: ['m', 'v', 'lr_t', 'update'], sourceLabel: 'gradients', targetLabel: 'new params', pulseLabel: 'optimizer step',
        },
        {
          id: '11', title: 'Spit out new names', eyebrow: 'sampling', summary: 'Once training ends, the script autoregressively samples 20 new names with temperature 0.5.', detail: 'These outputs should be rough. Maybe even a little obnoxious. Their job is to prove the loop closes, not to cosplay as a production model.', snippet: sharedLoopSnippets.sample, signal: ['autoregressive decoding', 'stop when BOS appears again', 'names the model hallucinated itself'], lineRange: '186-200', sourceHref: gistRangeHref(186, 200), flowStage: 'new names', visualKind: 'names', palette: { accent: '#3a86ff', accentStrong: '#1e4d91', glow: '#b8d2fb' }, flowTokens: ['BOS', 'sample', 'temperature'], sourceLabel: 'BOS', targetLabel: 'sampled names', pulseLabel: 'closed-loop proof',
        },
      ]

  const atlasSections: AtlasSection[] = isZh
    ? [
        { lineRange: '14-27', title: '資料與 tokenizer', summary: '這個檔案會在需要時下載 `input.txt`，打亂文件順序，再建立一個只有單一 BOS token 的 char vocab。', why: '整個問題定義只用幾行就講完。這種壓縮感，本身就是這個頁面的主題。', highlights: ['沒有額外安裝流程', '完全使用字元層級符號', '立刻印出 corpus 與 vocab 統計'], snippet: `if not os.path.exists('input.txt'):\n    urllib.request.urlretrieve(names_url, 'input.txt')\ndocs = [line.strip() for line in open('input.txt') if line.strip()]\nuchars = sorted(set(''.join(docs)))\nBOS = len(uchars)\nvocab_size = len(uchars) + 1`, sourceHref: gistRangeHref(14, 27) },
        { lineRange: '29-72', title: 'Scalar autograd 核心', summary: '一個極小的 `Value` 類別同時保存純量資料、圖的邊、局部導數，以及由拓樸排序驅動的反向傳播。', why: '這裡是從 micrograd 走到 Transformer 的觀念橋樑，也是整份 gist 最值得慢慢看的地方。', highlights: ['每個參數都是純量', '每個節點都保存 children 與 local grads', 'backward 會沿著反向 topo 順序展開'], snippet: `class Value:\n    def backward(self):\n        topo = []\n        ...\n        self.grad = 1\n        for v in reversed(topo):\n            for child, local_grad in zip(v._children, v._local_grads):\n                child.grad += local_grad * v.grad`, sourceHref: gistRangeHref(29, 72) },
        { lineRange: '74-90', title: '參數初始化', summary: '超參數刻意維持極小，矩陣只是巢狀 Python `Value` 清單，所有參數最後再攤平成一個 list 給 optimizer 使用。', why: '沒有 tensor abstraction 之後，你真的可以一個一個數參數，也能直接檢查任何單一權重。Transformer 就不再那麼神祕。', highlights: ['`n_embd = 16`', '`n_head = 4` 與 `n_layer = 1`', '展平後的 `params` 讓更新步驟一目了然'], snippet: `n_layer = 1\nn_embd = 16\nblock_size = 16\nn_head = 4\nmatrix = lambda nout, nin, std=0.08: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]\nparams = [p for mat in state_dict.values() for row in mat for p in row]`, sourceHref: gistRangeHref(74, 90) },
        { lineRange: '92-144', title: '前向傳播與 Block 結構', summary: 'Linear layer、RMSNorm、multi-head attention、residual 與最後的 LM head，全都住在同一個函式裡。', why: '這裡最能體現「其他東西多半只是效率工程」這句話。你熟悉的 Transformer，其實已經完整存在。', highlights: ['token embedding 與 position embedding 相加', 'attention cache 逐 timestep 增長', 'residual 路徑明確可見，不是隱含存在'], snippet: `def gpt(token_id, pos_id, keys, values):\n    tok_emb = state_dict['wte'][token_id]\n    pos_emb = state_dict['wpe'][pos_id]\n    x = [t + p for t, p in zip(tok_emb, pos_emb)]\n    ...\n    x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])\n    ...\n    logits = linear(x, state_dict['lm_head'])`, sourceHref: gistRangeHref(92, 144) },
        { lineRange: '146-184', title: '訓練迴圈與 Adam', summary: '每一步都取一段文件、計算平均 next-token loss、穿過 scalar 計算圖做 backprop，然後用 Adam 與線性衰減更新參數。', why: '這裡把 optimization 明明白白地攤在你面前。頁面應該把這件事表現成優點，而不是缺少 abstraction。', highlights: ['每一步只吃一份文件', '局部序列上使用 teacher forcing', 'Adam buffer 只是普通的 float 陣列'], snippet: `for step in range(num_steps):\n    doc = docs[step % len(docs)]\n    ...\n    loss = (1 / n) * sum(losses)\n    loss.backward()\n    for i, p in enumerate(params):\n        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)`, sourceHref: gistRangeHref(146, 184) },
        { lineRange: '186-200', title: 'Sampling', summary: '訓練結束後，script 會從 BOS 開始，用帶有 temperature 的 softmax autoregressively 抽樣出新名字。', why: '結尾在教學上非常重要。sampling 證明整個 loop 確實閉合了，也順便提醒你：能跑通，不等於已經很強。別搞混。', highlights: ['自回歸解碼', '遇到 BOS 就停止', 'temperature 0.5 讓輸出粗糙但仍可辨識'], snippet: `for sample_idx in range(20):\n    token_id = BOS\n    sample = []\n    for pos_id in range(block_size):\n        logits = gpt(token_id, pos_id, keys, values)\n        probs = softmax([l / temperature for l in logits])\n        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]`, sourceHref: gistRangeHref(186, 200) },
      ]
    : [
        { lineRange: '14-27', title: 'Data + tokenizer', summary: 'This file downloads `input.txt` when needed, shuffles the document order, then builds a char vocab with exactly one BOS token.', why: 'The problem definition is over in a handful of lines. That compression is part of the page’s whole argument.', highlights: ['no extra install ceremony', 'pure character-level symbols', 'prints corpus and vocab stats immediately'], snippet: `if not os.path.exists('input.txt'):\n    urllib.request.urlretrieve(names_url, 'input.txt')\ndocs = [line.strip() for line in open('input.txt') if line.strip()]\nuchars = sorted(set(''.join(docs)))\nBOS = len(uchars)\nvocab_size = len(uchars) + 1`, sourceHref: gistRangeHref(14, 27) },
        { lineRange: '29-72', title: 'Scalar autograd core', summary: 'A tiny `Value` class stores scalar data, graph edges, local derivatives, and a backward pass driven by topological order.', why: 'This is the conceptual bridge from micrograd to Transformer land, and one of the few parts of the gist genuinely worth lingering on.', highlights: ['every parameter is scalar', 'each node keeps children and local grads', 'backward unwinds in reverse topo order'], snippet: `class Value:\n    def backward(self):\n        topo = []\n        ...\n        self.grad = 1\n        for v in reversed(topo):\n            for child, local_grad in zip(v._children, v._local_grads):\n                child.grad += local_grad * v.grad`, sourceHref: gistRangeHref(29, 72) },
        { lineRange: '74-90', title: 'Parameter init', summary: 'The hyperparameters stay deliberately tiny, matrices are just nested Python `Value` lists, and every parameter gets flattened into one list for the optimizer.', why: 'Once the tensor abstraction is gone, you can literally count parameters one by one and inspect a single weight without filing paperwork. Suddenly Transformer feels less mythical.', highlights: ['`n_embd = 16`', '`n_head = 4` and `n_layer = 1`', 'flattened `params` makes updates painfully clear'], snippet: `n_layer = 1\nn_embd = 16\nblock_size = 16\nn_head = 4\nmatrix = lambda nout, nin, std=0.08: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]\nparams = [p for mat in state_dict.values() for row in mat for p in row]`, sourceHref: gistRangeHref(74, 90) },
        { lineRange: '92-144', title: 'Forward pass + block structure', summary: 'Linear layers, RMSNorm, multi-head attention, residual paths, and the final LM head all live inside one function.', why: 'This section proves the line “the rest is mostly efficiency engineering” was not just a smug slogan. The recognizable Transformer is already here.', highlights: ['token embeddings added to position embeddings', 'attention cache grows one timestep at a time', 'the residual path is explicit, not implied'], snippet: `def gpt(token_id, pos_id, keys, values):\n    tok_emb = state_dict['wte'][token_id]\n    pos_emb = state_dict['wpe'][pos_id]\n    x = [t + p for t, p in zip(tok_emb, pos_emb)]\n    ...\n    x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])\n    ...\n    logits = linear(x, state_dict['lm_head'])`, sourceHref: gistRangeHref(92, 144) },
        { lineRange: '146-184', title: 'Training loop + Adam', summary: 'Each step takes one document, computes average next-token loss, backprops through the scalar graph, then updates parameters with Adam and linear decay.', why: 'Optimization is laid out in the open instead of hidden behind framework manners. That is a feature, not a missing luxury trim.', highlights: ['one document per step', 'teacher forcing on local sequences', 'Adam buffers are plain float arrays'], snippet: `for step in range(num_steps):\n    doc = docs[step % len(docs)]\n    ...\n    loss = (1 / n) * sum(losses)\n    loss.backward()\n    for i, p in enumerate(params):\n        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)`, sourceHref: gistRangeHref(146, 184) },
        { lineRange: '186-200', title: 'Sampling', summary: 'After training, the script starts at BOS and autoregressively samples new names with temperature-softmax.', why: 'The ending matters. Sampling proves the loop actually closes, while also reminding you that “it runs” and “it is good” are wildly different claims.', highlights: ['autoregressive decoding', 'stops when BOS shows up again', 'temperature 0.5 keeps outputs rough but readable'], snippet: `for sample_idx in range(20):\n    token_id = BOS\n    sample = []\n    for pos_id in range(block_size):\n        logits = gpt(token_id, pos_id, keys, values)\n        probs = softmax([l / temperature for l in logits])\n        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]`, sourceHref: gistRangeHref(186, 200) },
      ]

  const primitives: PrimitiveCard[] = isZh
    ? [
        { title: 'Char Tokenizer', role: '把每個名字拆成一小段整數 id，再補上一個 BOS token。沒什麼花招，故意的。', kept: '離散符號照樣要先進模型。', simplified: '沒有 BPE、merge 規則，沒有外掛 tokenizer 管線。' },
        { title: 'Scalar Autograd', role: '每個 forward 運算都會留下可被鏈式法則一路追回去的計算圖。', kept: '學習的核心機制一點都沒少。', simplified: '全部都用 scalar 算，不靠向量化 tensor 幫你遮醜。' },
        { title: 'Tiny State Dict', role: '普通巢狀 list 裝著 embedding、attention 權重、MLP 權重和 LM head。陽春到很誠實。', kept: '你熟悉的參數骨架還是完整在場。', simplified: '沒有 module、buffer、registry，也沒有一堆裝神弄鬼的 class。' },
        { title: 'RMSNorm + Residual', role: '把 hidden state 拉回穩定範圍，順手把訊號路徑留得清清楚楚。', kept: 'normalization 跟 skip connection 還是在決定 block 怎麼活。', simplified: '比起整套 GPT-2 式 LayerNorm stack，這裡直接得多，也比較不囉嗦。' },
        { title: 'Single-Block Attention', role: '先做 q/k/v，再用逐 timestep 長出來的 causal cache 混合前面的 token。', kept: 'multi-head self-attention 是原封不動留下來的。', simplified: '只有一層、短 context window，head dimension 也小到幾乎是在挑釁。' },
        { title: 'ReLU MLP', role: 'attention 後面先擴張、再壓回來，最後才丟去吐 logits。', kept: 'Transformer 在 attention 後面的 MLP block 沒消失。', simplified: '拿 ReLU 代替 GeLU，維度也刻意壓小，不跟你演豪華版。' },
        { title: 'Adam Buffers', role: '每次更新前，替每個 scalar 參數各自追蹤一階和二階動量。', kept: '真的 optimizer、真的訓練動態，都還看得到。', simplified: 'buffer 就只是樸素的 Python float 陣列，沒打算包裝成高科技。' },
        { title: 'Temperature Sampling', role: '把 logits 變成機率，接著一路抽下一個 token，直到 BOS 再次出現。', kept: 'autoregressive decoding 還是最後的輸出介面。', simplified: '名字很短、vocab 很小，而且一次只處理一張可憐但誠實的 scalar 機率表。' },
      ]
    : [
        { title: 'Char Tokenizer', role: 'Break each name into integer ids, then slap on a BOS token. No tricks. Very much on purpose.', kept: 'Discrete symbols still have to enter the model somehow.', simplified: 'No BPE, no merge rules, no tokenizer side quest.' },
        { title: 'Scalar Autograd', role: 'Every forward op leaves behind a computation graph the chain rule can crawl back through.', kept: 'The core learning mechanism is fully intact.', simplified: 'Everything is scalar math. No vectorized tensor glam squad.' },
        { title: 'Tiny State Dict', role: 'Plain nested lists hold embeddings, attention weights, MLP weights, and the LM head. Barebones in a refreshingly honest way.', kept: 'The parameter skeleton you know is still all there.', simplified: 'No modules, no buffers, no registries, no ceremonial class hierarchy.' },
        { title: 'RMSNorm + Residual', role: 'Pull the hidden state back into a stable range and keep the signal path embarrassingly readable.', kept: 'Normalization and skip connections still shape how the block behaves.', simplified: 'Far less fussy than the full GPT-2 LayerNorm stack, and frankly better for teaching.' },
        { title: 'Single-Block Attention', role: 'Compute q/k/v, then mix earlier tokens through a causal cache that grows one timestep at a time.', kept: 'Multi-head self-attention stays exactly where it should.', simplified: 'One layer, short context, tiny head dimension. Almost insultingly compact.' },
        { title: 'ReLU MLP', role: 'Expand after attention, squeeze back down, then spit out logits.', kept: 'The post-attention MLP block is still very much alive.', simplified: 'ReLU replaces GeLU, and the dimensions stay deliberately puny.' },
        { title: 'Adam Buffers', role: 'Before each update, every scalar parameter tracks first- and second-moment estimates.', kept: 'A real optimizer with real training dynamics is still in the room.', simplified: 'The buffers are just humble Python float arrays, not some luxury abstraction.' },
        { title: 'Temperature Sampling', role: 'Turn logits into probabilities, then keep sampling the next token until BOS shows up again.', kept: 'Autoregressive decoding remains the final interface to the model.', simplified: 'Short names, tiny vocab, and one sad-but-honest scalar probability table at a time.' },
      ]

  const tradeoffContent = isZh
    ? {
        kept: ['next-token prediction', 'token + position embeddings', 'multi-head self-attention', 'residual connection + normalization', 'block 裡的 MLP transform', 'negative log-likelihood loss', '穿過整張圖的 backpropagation', 'Adam optimization', 'autoregressive sampling'],
        stripped: ['tensor library 與 GPU kernel', 'batching 與 throughput 優化', '大型語料與長時間訓練', '更深層的 transformer block 疊加', '更大的 hidden size 跟 head dimension', '更複雜的 tokenization 機制', 'checkpoint 與訓練基礎設施', '會把執行順序藏起來的 framework abstraction', 'production ML 大部分的人體工學封裝'],
        conclusion: '這就是 `microgpt.py` 最漂亮、也最不客氣的地方：Transformer 在觀念上根本沒很多人講得那麼玄。真正把事情搞得像黑魔法的，通常不是演算法本身，而是規模、速度，還有那整車專門把因果關係藏起來的工具鏈。很多時候你怕的不是模型，你怕的是包裝。',
      }
    : {
        kept: ['next-token prediction', 'token + position embeddings', 'multi-head self-attention', 'residual connection + normalization', 'the block-level MLP transform', 'negative log-likelihood loss', 'full-graph backpropagation', 'Adam optimization', 'autoregressive sampling'],
        stripped: ['tensor libraries and GPU kernels', 'batching and throughput tricks', 'large corpora and long training runs', 'deeper transformer block stacks', 'larger hidden sizes and head dimensions', 'more elaborate tokenization schemes', 'checkpoints and training infrastructure', 'framework abstractions that hide execution order', 'most of production ML’s ergonomic padding'],
        conclusion: 'This is the prettiest and rudest thing about `microgpt.py`: conceptually, a Transformer is nowhere near as mystical as people love pretending. The black-magic feeling usually comes from scale, speed, and an entire convoy of tools designed to hide cause and effect. A lot of the time, you are not scared of the model. You are scared of the packaging.',
      }

  const proofArtifacts = {
    numSteps: evidencePack.quickRun.numSteps,
    referenceRun: evidencePack.quickRun.referenceRunPreview,
    lossTrace: evidencePack.quickRun.lossChart as EvidenceLossPoint[],
    generatedNames: evidencePack.quickRun.featuredSamples,
    checkpoints: isZh
      ? [
          `這些數字來自 raw gist 的可重現 ${evidencePack.quickRun.numSteps} 步切片，不是手寫 demo，也不是 UI 想像力。`,
          '前期 loss 掉得快，是因為模型只需要先學會「長得像中文姓名」，不是突然頓悟宇宙真理，也不是突然讀懂姓氏文化。',
          '最後的樣本依然粗糙，這很好；太滑順反而該先懷疑是不是在演。',
          '頁面應該把這些 artifact 當作 loop 閉合的證據，不是拿來假裝模型突然無所不能。',
        ]
      : [
          `These numbers come from a reproducible ${evidencePack.quickRun.numSteps}-step slice of the raw gist, not handwritten demo confetti and not UI fan fiction.`,
          'Early loss drops fast because the model only needs to learn “looks like a name” before it learns anything remotely clever.',
          'The final samples are still rough. Good. If they looked too polished, you should probably get suspicious.',
          'These artifacts are evidence that the loop closes, not evidence that the model has ascended to godhood.',
        ],
  }

  const references: ReferenceLink[] = isZh
    ? [
        { label: 'Karpathy 的 gist', href: sourceLinks.gist, detail: '這個頁面正在拆解的原始來源。' },
        { label: '原始 gist', href: sourceLinks.rawGist, detail: '如果你想看沒有 GitHub 介面的乾淨 200 行版本，這個連結最直接。' },
        { label: '中文姓名 dataset（本地）', href: '#top', detail: '中文版案例目前直接使用本地整理的台灣常見中文姓名清單，並重跑了對應 evidence。' },
        { label: 'ccunpacked.dev', href: sourceLinks.inspiration, detail: '這個可探索 editorial 版型的結構靈感來源。' },
      ]
    : [
        { label: 'Karpathy gist', href: sourceLinks.gist, detail: 'The original source this page is dissecting.' },
        { label: 'raw gist', href: sourceLinks.rawGist, detail: 'If you want the clean 200-line version without the GitHub furniture, this is the bluntest link.' },
        { label: 'makemore names.txt', href: sourceLinks.namesDataset, detail: 'The tiny corpus the script downloads when `input.txt` is missing.' },
        { label: 'ccunpacked.dev', href: sourceLinks.inspiration, detail: 'The structural inspiration for this explorable editorial layout.' },
      ]

  const ui = isZh
    ? {
        sectionTitles: {
          loop: 'Learning loop', atlas: '單檔地圖', primitives: 'Primitive inventory', tradeoffs: '保留了什麼 / 拿掉了什麼', proof: 'Reference run',
        },
        sectionDescriptions: {
          loop: '照 gist 真正執行的順序，從文字檔一路走到模型亂數噴出來的中文名字。右側 source panel 會跟著目前步驟同步更新。',
          atlas: '這份 gist 短到可以逐段畫成地圖。點選不同行範圍，右側共享原始碼面板就會切換到對應區段。',
          primitives: '這一區把話講白：哪些零件貨真價實是 GPT，哪些地方只是先把工程包袱扔出去，好讓你終於看懂它。',
          tradeoffs: '這是使用者在看完這份程式後，頁面最該留下來的核心理解。',
          proof: '樣本有點粗，loss 曲線也不優雅。很好。你看到的不是打過臘的 demo 屍體。',
        },
        labels: {
          line: '第 {lineRange} 行', openSource: '打開原始碼', openGistRange: '打開 gist 對應行數', liveSourcePanel: 'Live source panel', sharedSourceHint: '共享原始碼面板現在會承載這個 atlas 區段的完整 snippet。', rightPanelHint: '右側固定的 source panel 會一路同步你現在看到的 loop 步驟。', primitivesEyebrow: '這句話最好講清楚', primitivesTitle: '它是玩具，是因為它小；麻雀雖小，五臟俱全。', primitivesBody: '下方每個 primitive 都保留了一個核心 GPT 觀念，同時把平常最愛喧賓奪主的工業級機械結構拿掉。把語料換成台灣常見中文姓名之後，這個 demo 反而更接近日常，也更容易看出模型到底只是怎麼學字元分佈。', primitiveTag: 'Primitive', kept: '保留下來的', stripped: '被剝掉的', spine: '演算法的骨幹', machinery: '規模化機械', quickSlice: '快速參考切片', lossTitle: 'Loss 掉得很吵，沒有神蹟，只有訓練', lossBody: `在一個快速的 ${proofArtifacts.numSteps} 步執行中，script 就已經開始長出像樣的中文姓名輪廓。下方圖表用的就是那次短跑的真實數值，不是為了簡報好看才畫出來的假高潮。`, readProof: '怎麼讀這份證據', proofTitle: '它不夠完美，這反而是重點。', loopEyebrow: '核心演算法，照順序拆開', loopBody: '你可以從任何一步開始，看它怎麼把狀態丟給下一步。重點不是炫技，而是把一個真的 GPT training loop 按照實際執行順序攤開，免得一堆 abstraction 又開始裝神祕。', sourcePanelOriginLoop: 'Loop step', sourcePanelOriginAtlas: 'Atlas section', sourcePanelEyebrowAtlas: 'Single-file atlas', start: '起點', executionTrace: '執行軌跡', across: `跨越 ${11} 次轉換`, atlasEyebrow: '第 {lineRange} 行', handoff: '交接', to: '到', currentStage: '目前階段', nextStage: '下一步', liveTransitionLog: '即時轉換紀錄', currentSource: '目前原始碼行數', stageStatus: { current: '進行中', next: '即將進入', idle: '待命' },
        },
      }
    : {
        sectionTitles: {
          loop: 'Learning loop', atlas: 'Single-file atlas', primitives: 'Primitive inventory', tradeoffs: 'What stayed / what got stripped', proof: 'Reference run',
        },
        sectionDescriptions: {
          loop: 'Follow the gist in the order it actually runs, from a text file to the model blurting out new names. The source panel on the right tracks the current step.',
          atlas: 'This gist is short enough to map section by section. Click a line range and the shared source panel jumps to the corresponding chunk.',
          primitives: 'This section says the quiet part out loud: which pieces are unmistakably GPT, and which parts were stripped down so you can finally see the damn thing.',
          tradeoffs: 'If the page leaves you with one durable idea, it should be this.',
          proof: 'The samples are rough and the loss curve is a little ugly. Good. You are not looking at a waxed-up demo corpse.',
        },
        labels: {
          line: 'lines {lineRange}', openSource: 'open source', openGistRange: 'open gist range', liveSourcePanel: 'Live source panel', sharedSourceHint: 'The shared source panel is now carrying the full snippet for this atlas section.', rightPanelHint: 'The fixed source panel on the right stays in sync with the loop step you are looking at.', primitivesEyebrow: 'This part deserves blunt language', primitivesTitle: 'It is a toy because it is small, not because it is fake', primitivesBody: 'Each primitive below keeps one core GPT idea intact while removing the industrial machinery that usually hogs the spotlight. That is why `microgpt.py` teaches so well: you get the algorithm itself, not the entourage.', primitiveTag: 'Primitive', kept: 'kept', stripped: 'stripped', spine: 'the algorithmic spine', machinery: 'scaling machinery', quickSlice: 'quick reference slice', lossTitle: 'Loss drops noisily. No miracles. Just training.', lossBody: `In a quick ${proofArtifacts.numSteps}-step run, the script already starts producing shapes that look suspiciously like names. The chart below uses the real numbers from that sprint, not presentation-friendly fake drama.`, readProof: 'how to read this evidence', proofTitle: 'The lack of perfection is the point.', loopEyebrow: 'Core algorithm, unfolded in order', loopBody: 'You can start from any step and watch how state gets handed to the next one. The point is not to show off. The point is to unfold a real GPT training loop in the order it actually executes, before abstraction starts doing its usual vanishing act.', sourcePanelOriginLoop: 'Loop step', sourcePanelOriginAtlas: 'Atlas section', sourcePanelEyebrowAtlas: 'Single-file atlas', start: 'start', executionTrace: 'execution trace', across: `across ${11} transitions`, atlasEyebrow: 'lines {lineRange}', handoff: 'handoff', to: 'to', currentStage: 'current stage', nextStage: 'next stage', liveTransitionLog: 'live transition log', currentSource: 'current source lines', stageStatus: { current: 'in progress', next: 'up next', idle: 'idle' },
        },
      }

  return { heroMetrics, heroContent, loopSteps, atlasSections, primitives, tradeoffContent, proofArtifacts, references, ui }
}
