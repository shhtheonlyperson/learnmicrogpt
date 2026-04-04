import { heroContent, heroMetrics } from '../content/heroContent'
import { proofArtifacts } from '../content/proofArtifacts'

export function HeroSection() {
  return (
    <section className="hero-panel" id="top">
      <div className="hero-copy reveal">
        <div className="hero-copy-stack">
          <p className="eyebrow">{heroContent.eyebrow}</p>
          <h1>{heroContent.headline}</h1>
          <p className="hero-lede">{heroContent.lede}</p>
          <p className="hero-thesis">{heroContent.thesis}</p>
        </div>

        <div className="hero-actions">
          <a className="action primary" href={heroContent.primaryCta.href}>
            {heroContent.primaryCta.label}
          </a>
          <a
            className="action secondary"
            href={heroContent.secondaryCta.href}
            rel="noreferrer"
            target="_blank"
          >
            {heroContent.secondaryCta.label}
          </a>
        </div>

        <div className="metric-grid">
          {heroMetrics.map((metric) => (
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
          <p className="terminal-label">{heroContent.terminalLabel}</p>
          <pre>{proofArtifacts.referenceRun}</pre>
        </div>

        <div className="terminal-block code">
          <p className="terminal-label">{heroContent.coreMoveLabel}</p>
          <pre>{heroContent.coreMoveSnippet}</pre>
        </div>

        <div className="sample-strip">
          {proofArtifacts.generatedNames.slice(0, 6).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </aside>
    </section>
  )
}
