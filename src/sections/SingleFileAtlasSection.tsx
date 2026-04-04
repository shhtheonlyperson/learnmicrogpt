import { SourceMeta } from '../components/SourceMeta'
import { SectionIntro } from '../components/SectionIntro'
import type { AtlasSection, getCopy } from '../content/copy'

type SingleFileAtlasSectionProps = {
  activeSection: AtlasSection
  onSelectSection: (section: AtlasSection) => void
  copy: ReturnType<typeof getCopy>
}

export function SingleFileAtlasSection({
  activeSection,
  onSelectSection,
  copy,
}: SingleFileAtlasSectionProps) {
  return (
    <section className="content-section" id="atlas">
      <SectionIntro
        description={copy.ui.sectionDescriptions.atlas}
        number="02"
        title={copy.ui.sectionTitles.atlas}
      />

      <div className="atlas-layout">
        <div className="atlas-list reveal">
          {copy.atlasSections.map((section) => (
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
          <p className="eyebrow">{copy.ui.labels.atlasEyebrow.replace('{lineRange}', activeSection.lineRange)}</p>
          <h3>{activeSection.title}</h3>
          <SourceMeta
            href={activeSection.sourceHref}
            label={copy.ui.labels.openSource}
            lineLabel={copy.ui.labels.line}
            lineRange={activeSection.lineRange}
          />
          <p className="spotlight-summary">{activeSection.summary}</p>
          <p className="atlas-why">{activeSection.why}</p>

          <div className="detail-list">
            {activeSection.highlights.map((item) => (
              <div className="detail-pill" key={item}>
                {item}
              </div>
            ))}
          </div>
          <p className="source-panel-hint">{copy.ui.labels.sharedSourceHint}</p>
        </article>
      </div>
    </section>
  )
}
