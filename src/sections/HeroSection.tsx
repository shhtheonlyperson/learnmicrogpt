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

        <aside className="hero-evidence reveal" aria-label={copy.heroContent.terminalLabel}>
          <article className="evidence-panel">
            <div className="evidence-panel-header">
              <p className="eyebrow">{copy.heroContent.terminalLabel}</p>
              <h2>{copy.ui.sectionTitles.proof}</h2>
            </div>
            <pre className="editorial-code">{copy.proofArtifacts.referenceRun}</pre>
          </article>

          <article className="evidence-panel">
            <div className="evidence-panel-header">
              <p className="eyebrow">{copy.heroContent.coreMoveLabel}</p>
              <h2>{copy.ui.sectionTitles.loop}</h2>
            </div>
            <pre className="editorial-code">{copy.heroContent.coreMoveSnippet}</pre>
          </article>

          <article className="evidence-panel hero-sample-panel">
            <div className="evidence-panel-header">
              <p className="eyebrow">{copy.ui.labels.proofTitle}</p>
              <h2>{copy.ui.labels.quickSlice}</h2>
            </div>

            <div className="sample-strip">
              {copy.proofArtifacts.generatedNames.slice(0, 8).map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}
