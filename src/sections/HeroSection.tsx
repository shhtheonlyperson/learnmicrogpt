import { LocaleToggle } from '../components/LocaleToggle'
import type { getCopy } from '../content/copy'

type HeroSectionProps = {
  copy: ReturnType<typeof getCopy>
}

export function HeroSection({ copy }: HeroSectionProps) {
  return (
    <section className="hero-panel" id="top">
      <div className="hero-copy reveal">
        <div className="hero-topbar">
          <LocaleToggle />
        </div>

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
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <p>{metric.note}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="hero-terminal reveal">
        <div className="terminal-topbar">
          <span />
          <span />
          <span />
        </div>

        <div className="terminal-block">
          <p className="terminal-label">{copy.heroContent.terminalLabel}</p>
          <pre>{copy.proofArtifacts.referenceRun}</pre>
        </div>

        <div className="terminal-block code">
          <p className="terminal-label">{copy.heroContent.coreMoveLabel}</p>
          <pre>{copy.heroContent.coreMoveSnippet}</pre>
        </div>

        <div className="sample-strip">
          {copy.proofArtifacts.generatedNames.slice(0, 6).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </aside>
    </section>
  )
}
