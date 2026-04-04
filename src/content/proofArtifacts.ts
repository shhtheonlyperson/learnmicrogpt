import { evidencePack, type EvidenceLossPoint } from './evidencePack'

export const proofArtifacts = {
  numSteps: evidencePack.quickRun.numSteps,
  referenceRun: evidencePack.quickRun.referenceRunPreview,
  lossTrace: evidencePack.quickRun.lossChart as EvidenceLossPoint[],
  generatedNames: evidencePack.quickRun.featuredSamples,
  checkpoints: [
    `這些數字來自 raw gist 的可重現 ${evidencePack.quickRun.numSteps} 步切片，不是手寫 demo 假資料。`,
    '前期 loss 下降得很快，因為模型只需要先變得「像名字」，不需要先變得「很聰明」。',
    '最後的樣本依然粗糙，而這正是這份證據誠實的地方。',
    '頁面應該把這些 artifact 當作 loop 閉合的證據，而不是模型品質的證據。',
  ],
}
