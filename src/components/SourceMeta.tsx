type SourceMetaProps = {
  lineRange: string
  href: string
  lineLabel: string
  label?: string
}

export function SourceMeta({ lineRange, href, lineLabel, label }: SourceMetaProps) {
  return (
    <div className="source-meta">
      <span>{lineLabel.replace('{lineRange}', lineRange)}</span>
      <a href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    </div>
  )
}
