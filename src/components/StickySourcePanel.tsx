import { SourceMeta } from './SourceMeta'
import type { SourceFocus } from '../content/sourceFocus'

type StickySourcePanelProps = {
  focus: SourceFocus
}

export function StickySourcePanel({ focus }: StickySourcePanelProps) {
  return (
    <aside className="source-viewer reveal">
      <div className="source-viewer-header">
        <p className="eyebrow">同步原始碼面板</p>
        <span className="source-origin">{focus.origin}</span>
      </div>

      <div className="source-viewer-copy">
        <h3>{focus.title}</h3>
        <p className="source-viewer-eyebrow">{focus.eyebrow}</p>
        <SourceMeta href={focus.sourceHref} lineRange={focus.lineRange} label="開啟 gist 對應行數" />
        <p className="source-viewer-summary">{focus.summary}</p>
        <p className="source-viewer-detail">{focus.detail}</p>
      </div>

      <div className="signal-row source-viewer-signals">
        {focus.chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      <pre className="snippet-card source-viewer-snippet">{focus.snippet}</pre>
    </aside>
  )
}
