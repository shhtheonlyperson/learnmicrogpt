export type PrimitiveCard = {
  title: string
  role: string
  kept: string
  simplified: string
}

export const primitives: PrimitiveCard[] = [
  {
    title: '字元 Tokenizer',
    role: '把每個名字轉成一小段整數 id 序列，再加上一個 BOS 邊界 token。',
    kept: '離散符號仍然會被轉成模型輸入。',
    simplified: '沒有 BPE、merge 規則或額外 tokenizer 工具鏈。',
  },
  {
    title: '純量 Autograd',
    role: '讓每個前向運算都進入一張可被鏈式法則反推的計算圖。',
    kept: '學習的核心機制仍然是同一套。',
    simplified: '所有東西都用純量做，而不是向量化 tensor。',
  },
  {
    title: '極小 State Dict',
    role: '用普通巢狀 list 存放 embedding、attention 權重、MLP 權重與 LM head。',
    kept: '你熟悉的參數解剖結構依然存在。',
    simplified: '沒有 module、buffer、registry 或 tensor class。',
  },
  {
    title: 'RMSNorm 與 Residual',
    role: '正規化隱狀態、穩定 block，同時保持訊號路徑可讀。',
    kept: 'normalization 與 skip connection 依然在塑造 block 行為。',
    simplified: '比起完整 GPT-2 式 LayerNorm stack，RMSNorm 在這裡更容易直接表達。',
  },
  {
    title: '單一 Block Attention',
    role: '建立 query、key、value，然後用逐 timestep 增長的 causal cache 混合先前 token。',
    kept: '多頭 self-attention 是完整保留的。',
    simplified: '只有一層、短 context window，加上極小的 head 維度。',
  },
  {
    title: 'ReLU MLP',
    role: '在 attention 之後先擴張再壓縮隱狀態，最後才投影成 logits。',
    kept: 'Transformer 在 attention 後面仍然保有 MLP block。',
    simplified: '用 ReLU 取代 GeLU，且維度刻意維持很小。',
  },
  {
    title: 'Adam Buffers',
    role: '在每次更新前，替每個純量參數追蹤一階與二階動量。',
    kept: '真正的 optimizer 與真正的訓練動態仍然可見。',
    simplified: 'buffer 只是簡單的 Python float 陣列。',
  },
  {
    title: 'Temperature Sampling',
    role: '把 logits 轉成機率，再一路抽樣下一個 token，直到 BOS 再次出現。',
    kept: '自回歸解碼依然是最終對外介面。',
    simplified: '名字很短、vocab 很小，而且一次只處理一份純量機率表。',
  },
]
