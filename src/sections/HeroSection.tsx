import { startTransition } from 'react'
import { LocaleToggle } from '../components/LocaleToggle'
import type { getCopy } from '../content/copy'
import type { InteractiveLabChapter, InteractiveLabId } from '../content/interactiveLab'

type HeroSectionProps = {
  activeLabId: InteractiveLabId
  copy: ReturnType<typeof getCopy>
  labChapters: InteractiveLabChapter[]
  labHeroBody: string
  labHeroEyebrow: string
  labHeroTitle: string
  onSelectLab: (id: InteractiveLabId) => void
}

export function HeroSection({
  activeLabId,
  copy,
  labChapters,
  labHeroBody,
  labHeroEyebrow,
  labHeroTitle,
  onSelectLab,
}: HeroSectionProps) {
  return (
    <section className="hero-panel" id="top">
      <div className="hero-topbar">
        <LocaleToggle />
      </div>

      <div className="hero-layout">
        <div className="hero-copy reveal">
          <div className="hero-copy-stack">
            <p className="eyebrow">{copy.heroContent.eyebrow}</p>
            <h1>{copy.heroContent.headline}</h1>
            <p className="hero-lede">{copy.heroContent.lede}</p>
            <p className="hero-thesis">{copy.heroContent.thesis}</p>
          </div>

          <div className="hero-actions">
            <a className="action primary" href={copy.heroContent.primaryCta.href}>
              {copy.heroContent.primaryCta.label}
            </a>
            <a
              className="action secondary"
              href={copy.heroContent.secondaryCta.href}
              rel="noreferrer"
              target="_blank"
            >
              {copy.heroContent.secondaryCta.label}
            </a>
          </div>

          <div className="metric-grid">
            {copy.heroMetrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.note}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="hero-evidence reveal" aria-label={copy.ui.sectionTitles.proof}>
          <article className="evidence-panel">
            <pre className="editorial-code">{copy.proofArtifacts.referenceRun}</pre>
          </article>

          <article className="evidence-panel">
            <pre className="editorial-code">{copy.heroContent.coreMoveSnippet}</pre>
          </article>
        </aside>
      </div>

      <div className="hero-explorer reveal">
        <div className="hero-explorer-copy">
          <p className="eyebrow">{labHeroEyebrow}</p>
          <h2>{labHeroTitle}</h2>
          <p>{labHeroBody}</p>
        </div>

        <div className="hero-explorer-list" aria-label={labHeroTitle}>
          {labChapters.map((chapter) => (
            <a
              className={chapter.id === activeLabId ? 'hero-explorer-link active' : 'hero-explorer-link'}
              href="#interactive-lab"
              key={chapter.id}
              onClick={() =>
                startTransition(() => {
                  onSelectLab(chapter.id)
                })
              }
            >
              <span>{chapter.number}</span>
              <strong>{chapter.title}</strong>
              <p>{chapter.body}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
