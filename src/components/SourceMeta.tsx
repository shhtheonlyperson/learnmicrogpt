type SourceMetaProps = {
  lineRange: string
  href: string
  label?: string
}

export function SourceMeta({
  lineRange,
  href,
  label = '開啟原始碼',
}: SourceMetaProps) {
  return (
    <div className="source-meta">
      <span>第 {lineRange} 行</span>
      <a href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    </div>
  )
}
