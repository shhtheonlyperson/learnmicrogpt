export const tradeoffContent = {
  kept: [
    'next-token prediction',
    'token 與 position embedding',
    'multi-head self-attention',
    'residual connection 與 normalization',
    'block 內的 MLP 轉換',
    '負對數似然 loss',
    '穿過整張圖的 backpropagation',
    'Adam 最佳化',
    '自回歸 sampling',
  ],
  stripped: [
    'tensor library 與 GPU kernel',
    'batching 與 throughput 優化',
    '大型語料與長時間訓練',
    '更深層的 transformer block 疊加',
    '更大的 hidden size 與 head 維度',
    '更複雜的 tokenization 機制',
    'checkpoint 與訓練基礎設施',
    '會把執行順序藏起來的 framework abstraction',
    'production ML 大部分的人體工學封裝',
  ],
  conclusion:
    '這個取捨就是 `microgpt.py` 的核心價值：Transformer 在觀念上，比它的工業級實作看起來要小得多。那些讓人害怕的複雜度，大多來自規模、速度與工具鏈，而不是演算法本身。',
}
