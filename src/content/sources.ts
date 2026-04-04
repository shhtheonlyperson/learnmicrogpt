const GIST_ID = '8627fe009c40f57531cb18360106ce95'

export const sourceLinks = {
  gist: `https://gist.github.com/karpathy/${GIST_ID}`,
  rawGist: `https://gist.githubusercontent.com/karpathy/${GIST_ID}/raw/microgpt.py`,
  namesDataset: 'https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt',
  inspiration: 'https://ccunpacked.dev/',
}

export const gistRangeHref = (start: number, end?: number) =>
  `${sourceLinks.gist}#file-microgpt-py-L${start}${end ? `-L${end}` : ''}`

export type ReferenceLink = {
  label: string
  href: string
  detail: string
}

export const references: ReferenceLink[] = [
  {
    label: 'Karpathy 的 gist',
    href: sourceLinks.gist,
    detail: '這個頁面正在拆解的原始來源。',
  },
  {
    label: '原始 gist',
    href: sourceLinks.rawGist,
    detail: '如果你想看沒有 GitHub 介面的乾淨 200 行版本，這個連結最直接。',
  },
  {
    label: 'makemore names.txt',
    href: sourceLinks.namesDataset,
    detail: '當 `input.txt` 缺失時，script 會下載的那份極小語料。',
  },
  {
    label: 'ccunpacked.dev',
    href: sourceLinks.inspiration,
    detail: '這個可探索 editorial 版型的結構靈感來源。',
  },
]
