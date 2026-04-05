import { LocaleToggle } from '../components/LocaleToggle'
import type { getCopy } from '../content/copy'

type HeroSectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function HeroSection({ copy }: HeroSectionProps) {
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
    </section>
  )
}
