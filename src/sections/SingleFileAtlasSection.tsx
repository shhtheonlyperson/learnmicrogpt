import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import { atlasSections, type AtlasSection } from '../content/atlasSections'

type SingleFileAtlasSectionProps = {
  activeSection: AtlasSection
  onSelectSection: (section: AtlasSection) => void
}

export function SingleFileAtlasSection({
  activeSection,
  onSelectSection,
}: SingleFileAtlasSectionProps) {
  return (
    <section className="content-section" id="atlas">
      <SectionIntro
        number="02"
        title="單檔地圖"
        description="這份 gist 短到可以逐段畫成地圖。點選不同行範圍，右側共享原始碼面板就會切換到對應區段。"
      />

      <div className="atlas-layout">
        <div className="atlas-list reveal">
          {atlasSections.map((section) => (
            <button
              className={
                section.lineRange === activeSection.lineRange ? 'atlas-row active' : 'atlas-row'
              }
              key={section.lineRange}
              onClick={() => onSelectSection(section)}
              type="button"
            >
              <span>{section.lineRange}</span>
              <strong>{section.title}</strong>
              <p>{section.summary}</p>
            </button>
          ))}
        </div>

        <article className="atlas-detail reveal">
          <p className="eyebrow">第 {activeSection.lineRange} 行</p>
          <h3>{activeSection.title}</h3>
          <SourceMeta href={activeSection.sourceHref} lineRange={activeSection.lineRange} />
          <p className="spotlight-summary">{activeSection.summary}</p>
          <p className="atlas-why">{activeSection.why}</p>

          <div className="detail-list">
            {activeSection.highlights.map((item) => (
              <div className="detail-pill" key={item}>
                {item}
              </div>
            ))}
          </div>
          <p className="source-panel-hint">
            共享原始碼面板現在會承載這個 atlas 區段的完整 snippet。
          </p>
        </article>
      </div>
    </section>
  )
}
