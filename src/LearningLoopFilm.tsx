import { motion, useAnimationFrame, useSpring } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCopy, type LoopStep } from './content/copy'
import { useI18n } from './i18n-context'

type LoopScene = {
  currentStep: LoopStep
  nextStep: LoopStep
  progress: number
  segmentIndex: number
  transcript: string
  transcriptLength: number
}

export const FLOW_STEP_MS = 3200
const TRACK_SPACING = 196
const CARD_WIDTH = 184
const COMPACT_QUERY = '(max-width: 760px)'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  const progress = clamp01((value - inMin) / (inMax - inMin))
  return outMin + (outMax - outMin) * progress
}

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

const AbstractStageMark = ({
  step,
  progress,
  emphasis,
}: {
  step: LoopStep
  progress: number
  emphasis: number
}) => {
  const bars = step.flowTokens.slice(0, 4).map((token, index) => {
    const seed = token.length * 11 + index * 7 + Number(step.id)
    const height = 14 + (seed % 24)
    const offset = Math.sin(progress * Math.PI * 2 + index * 0.6) * 4 * emphasis

    return {
      x: 14 + index * 22,
      y: 52 - height - offset,
      height,
    }
  })

  const accent = step.palette.accent

  return (
    <svg viewBox="0 0 104 64" style={{ width: '100%', height: 64 }}>
      <defs>
        <linearGradient id={`mark-${step.id}`} x1="0%" x2="100%">
          <stop offset="0%" stopColor={withAlpha(accent, 0.12 + emphasis * 0.25)} />
          <stop offset="100%" stopColor={withAlpha(step.palette.glow, 0.24 + emphasis * 0.28)} />
        </linearGradient>
      </defs>

      <rect
        x="2"
        y="6"
        width="100"
        height="56"
        rx="18"
        fill={withAlpha('#ffffff', 0.03)}
        stroke={withAlpha('#ffffff', 0.08)}
      />

      <path
        d="M12 52 H92"
        stroke={withAlpha('#fff7ee', 0.18)}
        strokeLinecap="round"
        strokeWidth="1.5"
      />

      {bars.map((bar, index) => (
        <g key={`${step.id}-${index}`}>
          <rect
            x={bar.x}
            y={bar.y}
            width="12"
            height={bar.height}
            rx="6"
            fill={`url(#mark-${step.id})`}
            stroke={withAlpha(accent, 0.24 + emphasis * 0.36)}
          />
          <circle
            cx={bar.x + 6}
            cy={bar.y - 6}
            r={2.2 + emphasis * 1.2}
            fill={withAlpha(step.palette.glow, 0.48 + emphasis * 0.24)}
          />
        </g>
      ))}

      <path
        d={`M16 ${28 - progress * 2} C34 ${18 + progress * 4}, 56 ${32 - progress * 3}, 88 ${16 + progress * 4}`}
        fill="none"
        stroke={withAlpha(step.palette.glow, 0.18 + emphasis * 0.22)}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

const StageNode = ({
  index,
  scenePosition,
  currentIndex,
  nextIndex,
  progress,
  step,
  statusLabels,
}: {
  index: number
  scenePosition: number
  currentIndex: number
  nextIndex: number
  progress: number
  step: LoopStep
  statusLabels: { current: string; next: string; idle: string }
}) => {
  const distance = Math.abs(index - scenePosition)
  const emphasis = clamp01(1 - distance * 0.42)
  const isCurrent = index === currentIndex
  const isNext = index === nextIndex

  return (
    <motion.article
      animate={{
        opacity: 0.24 + emphasis * 0.82,
        scale: 0.82 + emphasis * 0.24,
        y: isCurrent ? -20 + progress * 12 : isNext ? -10 - (1 - progress) * 8 : 8 + distance * 6,
      }}
      style={{
        position: 'absolute',
        left: index * TRACK_SPACING,
        top: 12,
        width: CARD_WIDTH,
        padding: '0.95rem',
        borderRadius: '1.35rem',
        border: `1px solid ${withAlpha(step.palette.glow, 0.12 + emphasis * 0.28)}`,
        background: [
          `linear-gradient(180deg, ${withAlpha('#ffffff', 0.08)}, ${withAlpha('#7a7a7a', 0.06 + emphasis * 0.12)})`,
          withAlpha('#141414', 0.82 + emphasis * 0.06),
        ].join(','),
        boxShadow: isCurrent || isNext ? `0 18px 40px ${withAlpha('#000000', 0.16)}` : 'none',
        overflow: 'hidden',
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.8rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '1.8rem',
            padding: '0 0.65rem',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: withAlpha('#fff7ee', 0.72),
            background: withAlpha('#ffffff', 0.05),
            border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
          }}
        >
          {step.id}
        </span>

        <span
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.64rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: withAlpha('#fff7ee', isCurrent || isNext ? 0.58 : 0.34),
          }}
        >
          {isCurrent ? statusLabels.current : isNext ? statusLabels.next : statusLabels.idle}
        </span>
      </div>

      <div
        style={{
          marginBottom: '0.8rem',
          padding: '0.35rem',
          borderRadius: '1rem',
          background: withAlpha('#ffffff', 0.03),
          border: `1px solid ${withAlpha('#ffffff', 0.06)}`,
        }}
      >
        <AbstractStageMark emphasis={emphasis} progress={progress} step={step} />
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: '1.55rem',
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
          color: '#fff7ee',
          marginBottom: '0.5rem',
        }}
      >
        {step.flowStage}
      </div>

      <div
        style={{
          fontSize: '0.82rem',
          lineHeight: 1.45,
          color: withAlpha('#fff7ee', 0.64),
        }}
      >
        {step.title}
      </div>
    </motion.article>
  )
}

const CompactStageCard = ({
  label,
  step,
  progress,
  tone,
}: {
  label: string
  step: LoopStep
  progress: number
  tone: 'current' | 'next'
}) => {
  const active = tone === 'current'

  return (
    <motion.article
      animate={{ opacity: active ? 1 : 0.86, scale: active ? 1 : 0.98, y: active ? -2 : 2 }}
      style={{
        padding: '0.95rem',
        borderRadius: '1.2rem',
        border: `1px solid ${withAlpha(step.palette.glow, active ? 0.28 : 0.18)}`,
        background: [
          `linear-gradient(180deg, ${withAlpha('#ffffff', 0.08)}, ${withAlpha('#7a7a7a', active ? 0.14 : 0.08)})`,
          withAlpha('#141414', 0.84),
        ].join(','),
        boxShadow: active ? `0 14px 32px ${withAlpha('#000000', 0.14)}` : 'none',
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.8rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '1.85rem',
            padding: '0 0.7rem',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.68rem',
            letterSpacing: '0.06em',
            color: '#fff7ee',
            background: withAlpha('#ffffff', 0.06),
            border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            color: withAlpha('#fff7ee', 0.62),
          }}
        >
          {step.lineRange}
        </span>
      </div>

      <div
        style={{
          marginBottom: '0.75rem',
          padding: '0.3rem',
          borderRadius: '0.95rem',
          background: withAlpha('#ffffff', 0.03),
          border: `1px solid ${withAlpha('#ffffff', 0.06)}`,
        }}
      >
        <AbstractStageMark emphasis={active ? 1 : 0.64} progress={progress} step={step} />
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: '1.5rem',
          lineHeight: 1.04,
          letterSpacing: '-0.02em',
          color: '#fff7ee',
          marginBottom: '0.45rem',
        }}
      >
        {step.flowStage}
      </div>

      <div
        style={{
          fontSize: '0.9rem',
          lineHeight: 1.62,
          color: withAlpha('#fff7ee', 0.7),
        }}
      >
        {step.title}
      </div>
    </motion.article>
  )
}

const LoopInlineContext = ({
  step,
  ui,
  compact = false,
}: {
  step: LoopStep
  ui: ReturnType<typeof getCopy>['ui']
  compact?: boolean
}) => (
  <article
    style={{
      display: 'grid',
      gap: compact ? '0.75rem' : '0.9rem',
      padding: compact ? '0.95rem' : '1rem',
      borderRadius: compact ? '1.15rem' : '1.25rem',
      border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
      background: withAlpha('#06080b', compact ? 0.3 : 0.34),
    }}
  >
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            color: withAlpha('#fff7ee', 0.44),
          }}
        >
          {step.eyebrow}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: compact ? '1.6rem' : '1.95rem',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: '#fff7ee',
          }}
        >
          {step.title}
        </div>
      </div>

      <a
        href={step.sourceHref}
        rel="noreferrer"
        target="_blank"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '2rem',
          padding: '0 0.8rem',
          borderRadius: '999px',
          textDecoration: 'none',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          color: '#fff7ee',
          background: withAlpha('#ffffff', 0.05),
          border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
        }}
      >
        {ui.labels.openSource} · {ui.labels.line.replace('{lineRange}', step.lineRange)}
      </a>
    </div>

    <div
      style={{
        display: 'grid',
        gap: '0.55rem',
        color: withAlpha('#fff7ee', 0.72),
      }}
    >
      <div style={{ fontSize: compact ? '0.92rem' : '0.98rem', lineHeight: 1.68 }}>{step.summary}</div>
      <div style={{ fontSize: compact ? '0.88rem' : '0.94rem', lineHeight: 1.72, color: withAlpha('#fff7ee', 0.58) }}>
        {step.detail}
      </div>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
      {step.signal.map((item) => (
        <span
          key={item}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '2rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.03em',
            color: withAlpha('#fff7ee', 0.72),
            background: withAlpha('#ffffff', 0.05),
            border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
          }}
        >
          {item}
        </span>
      ))}
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
      {step.flowTokens.map((token) => (
        <span
          key={`${step.id}-${token}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '2rem',
            padding: '0.35rem 0.8rem',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.03em',
            color: withAlpha('#fff7ee', 0.76),
            background: withAlpha(step.palette.accent, 0.16),
            border: `1px solid ${withAlpha(step.palette.glow, 0.18)}`,
          }}
        >
          {token}
        </span>
      ))}
    </div>

    <pre
      style={{
        margin: 0,
        padding: compact ? '0.85rem' : '0.95rem',
        borderRadius: '1rem',
        background: withAlpha('#ffffff', 0.04),
        border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: compact ? '0.82rem' : '0.88rem',
        lineHeight: 1.7,
        color: '#fff7ee',
      }}
    >
      {step.snippet}
    </pre>
  </article>
)

const renderCompactFilm = (
  scene: LoopScene,
  progressScale: ReturnType<typeof useSpring>,
  typedTranscript: string,
  ui: ReturnType<typeof getCopy>['ui'],
) => (
  <section
    aria-label={ui.sectionTitles.loop}
    style={{
      position: 'relative',
      width: '100%',
      minHeight: 'clamp(44rem, 82svh, 56rem)',
      overflow: 'hidden',
      borderRadius: '1.35rem',
      border: `1px solid ${withAlpha('#ffffff', 0.12)}`,
      backgroundImage: [
        `radial-gradient(circle at 18% 16%, ${withAlpha(scene.currentStep.palette.glow, 0.18)}, transparent 26%)`,
        `radial-gradient(circle at 82% 18%, ${withAlpha(scene.nextStep.palette.glow, 0.14)}, transparent 28%)`,
        'linear-gradient(160deg, #151218 0%, #0f1318 52%, #0a0f14 100%)',
      ].join(','),
      boxShadow: `inset 0 1px 0 ${withAlpha('#ffffff', 0.05)}`,
      padding: '1rem',
      display: 'grid',
      gap: '0.9rem',
    }}
  >
    <div style={{ display: 'grid', gap: '0.55rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            color: withAlpha('#fff7ee', 0.58),
          }}
        >
          {ui.labels.executionTrace}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '2rem',
            padding: '0 0.8rem',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            color: withAlpha('#fff7ee', 0.72),
            background: withAlpha(scene.currentStep.palette.accent, 0.16),
            border: `1px solid ${withAlpha(scene.currentStep.palette.glow, 0.18)}`,
          }}
        >
          {ui.labels.handoff} {Math.round(scene.progress * 100)}%
        </div>
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 'clamp(1.9rem, 7vw, 2.45rem)',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#fff7ee',
        }}
      >
        {scene.currentStep.flowStage} {ui.labels.to} {scene.nextStep.flowStage}
      </div>

      <div
        style={{
          fontSize: '0.95rem',
          lineHeight: 1.74,
          color: withAlpha('#fff7ee', 0.68),
        }}
      >
        {scene.currentStep.summary}
      </div>
    </div>

    <CompactStageCard label={ui.labels.currentStage} progress={scene.progress} step={scene.currentStep} tone="current" />

    <div
      style={{
        position: 'relative',
        height: '4rem',
        borderRadius: '1.2rem',
        border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
        background: withAlpha('#06080b', 0.34),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '1rem',
          right: '1rem',
          top: '50%',
          height: '2px',
          transform: 'translateY(-50%)',
          borderRadius: '999px',
          background: withAlpha('#ffffff', 0.08),
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            scaleX: progressScale,
            transformOrigin: 'left center',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${withAlpha('#6a6a6a', 0.95)}, ${withAlpha('#222222', 0.95)})`,
          }}
        />
      </div>
    </div>

    <CompactStageCard label={ui.labels.nextStage} progress={scene.progress + 0.18} step={scene.nextStep} tone="next" />

    <div
      style={{
        display: 'grid',
        gap: '0.7rem',
        padding: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '0.45rem',
          padding: '0.95rem',
          borderRadius: '1.2rem',
          border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
          background: withAlpha('#06080b', 0.24),
        }}
      >
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: withAlpha('#fff7ee', 0.44),
          }}
        >
          {ui.labels.liveTransitionLog}
        </div>

        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: '#fff7ee',
          }}
        >
          {typedTranscript}
          <motion.span
            animate={{ opacity: [1, 0.24, 1] }}
            style={{ color: scene.currentStep.palette.glow }}
            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
          >
            ▌
          </motion.span>
        </div>
      </div>

      <LoopInlineContext compact step={scene.currentStep} ui={ui} />
    </div>
  </section>
)

export const LearningLoopFilm = () => {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])
  const loopSteps = copy.loopSteps
  const totalDurationMs = loopSteps.length * FLOW_STEP_MS

  const getScene = (elapsedMs: number): LoopScene => {
    const segmentIndex = Math.floor(elapsedMs / FLOW_STEP_MS)
    const localMs = elapsedMs % FLOW_STEP_MS
    const currentStep = loopSteps[segmentIndex]!
    const nextStep = loopSteps[(segmentIndex + 1) % loopSteps.length]!
    const transition = `${currentStep.flowStage} => ${currentStep.targetLabel} => ${nextStep.flowStage}`

    return {
      currentStep,
      nextStep,
      progress: mapRange(localMs, 0, FLOW_STEP_MS, 0, 1),
      segmentIndex,
      transcript: transition,
      transcriptLength: Math.floor(mapRange(localMs, 180, 1680, 0, transition.length)),
    }
  }

  const startOffsetRef = useRef(0)
  const animationStartRef = useRef<number | null>(null)
  const [scene, setScene] = useState<LoopScene>(() => getScene(0))
  const isCompact = useMediaQuery(COMPACT_QUERY)

  const railX = useSpring(0, { stiffness: 170, damping: 26 })
  const progressScale = useSpring(0, { stiffness: 190, damping: 28 })

  useAnimationFrame((time) => {
    if (animationStartRef.current === null) {
      animationStartRef.current = time
    }

    const elapsedMs = (startOffsetRef.current + (time - animationStartRef.current)) % totalDurationMs
    const nextScene = getScene(elapsedMs)
    const scenePosition = nextScene.segmentIndex + nextScene.progress

    railX.set(-(scenePosition * TRACK_SPACING) - CARD_WIDTH / 2)
    progressScale.set(nextScene.progress)
    setScene(nextScene)
  })

  const scenePosition = scene.segmentIndex + scene.progress
  const typedTranscript = scene.transcript.slice(0, scene.transcriptLength)
  const railWidth = (loopSteps.length - 1) * TRACK_SPACING + CARD_WIDTH

  if (isCompact) {
    return renderCompactFilm(scene, progressScale, typedTranscript, copy.ui)
  }

  return (
    <section
      aria-label={copy.ui.sectionTitles.loop}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'clamp(50rem, 88svh, 66rem)',
        overflow: 'hidden',
        borderRadius: '1.55rem',
        border: `1px solid ${withAlpha('#ffffff', 0.12)}`,
        backgroundImage: [
          `radial-gradient(circle at 20% 18%, ${withAlpha(scene.currentStep.palette.glow, 0.18)}, transparent 24%)`,
          `radial-gradient(circle at 82% 20%, ${withAlpha(scene.nextStep.palette.glow, 0.16)}, transparent 28%)`,
          'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 64px)',
          'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 56px)',
          'linear-gradient(160deg, #151218 0%, #0f1318 50%, #0a0f14 100%)',
        ].join(','),
        boxShadow: `inset 0 1px 0 ${withAlpha('#ffffff', 0.05)}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '1.4rem 1.4rem auto',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.56),
              }}
            >
              {copy.ui.labels.executionTrace}
            </div>

            <div
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 'clamp(2.25rem, 3.4vw, 3.15rem)',
                lineHeight: 0.92,
                letterSpacing: '-0.06em',
                color: '#fff7ee',
              }}
            >
              {scene.currentStep.flowStage} {copy.ui.labels.to} {scene.nextStep.flowStage}
            </div>

            <div
              style={{
                maxWidth: '34rem',
                fontSize: '0.98rem',
                lineHeight: 1.55,
                color: withAlpha('#fff7ee', 0.68),
              }}
            >
              {scene.currentStep.summary}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.6rem', justifyItems: 'end' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '2.15rem',
                padding: '0 0.85rem',
                borderRadius: '999px',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#fff7ee',
                background: withAlpha('#ffffff', 0.06),
                border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
              }}
            >
              {scene.currentStep.id} / {scene.nextStep.id}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '2.15rem',
                padding: '0 0.85rem',
                borderRadius: '999px',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.68),
                background: withAlpha(scene.currentStep.palette.accent, 0.14),
                border: `1px solid ${withAlpha(scene.currentStep.palette.glow, 0.18)}`,
              }}
            >
              {copy.ui.labels.handoff} {Math.round(scene.progress * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '10.4rem 1.2rem 18.4rem',
          overflow: 'hidden',
          borderRadius: '1.2rem',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '1rem',
            width: railWidth,
            height: '100%',
            x: railX,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: CARD_WIDTH / 2,
              right: CARD_WIDTH / 2,
              top: '9.6rem',
              height: '1px',
              background: `linear-gradient(90deg, ${withAlpha('#ffffff', 0.08)}, ${withAlpha('#ffffff', 0.18)}, ${withAlpha('#ffffff', 0.08)})`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: CARD_WIDTH / 2,
              right: CARD_WIDTH / 2,
              top: '9.6rem',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${withAlpha(scene.currentStep.palette.glow, 0.42)}, transparent)`,
              filter: 'blur(6px)',
            }}
          />

          {loopSteps.map((step, index) => (
            <div key={step.id}>
              <StageNode
                currentIndex={scene.segmentIndex}
                index={index}
                nextIndex={(scene.segmentIndex + 1) % loopSteps.length}
                progress={scene.progress}
                scenePosition={scenePosition}
                statusLabels={copy.ui.labels.stageStatus}
                step={step}
              />

              <motion.div
                animate={{
                  opacity:
                    index === scene.segmentIndex
                      ? 1
                      : index === (scene.segmentIndex + 1) % loopSteps.length
                        ? 0.72
                        : 0.28,
                  scale:
                    index === scene.segmentIndex
                      ? 1.25
                      : index === (scene.segmentIndex + 1) % loopSteps.length
                        ? 1.05
                        : 0.82,
                }}
                style={{
                  position: 'absolute',
                  left: index * TRACK_SPACING + CARD_WIDTH / 2 - 8,
                  top: '9.15rem',
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '50%',
                  background:
                    index === scene.segmentIndex || index === (scene.segmentIndex + 1) % loopSteps.length
                      ? '#3f3f3f'
                      : withAlpha('#ffffff', 0.18),
                  border: `1px solid ${withAlpha('#ffffff', 0.16)}`,
                  boxShadow:
                    index === scene.segmentIndex
                      ? `0 0 14px ${withAlpha('#000000', 0.22)}`
                      : 'none',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              />
            </div>
          ))}
        </motion.div>

        <div
          style={{
            position: 'absolute',
            left: '1rem',
            right: '1rem',
            top: '50%',
            height: '2px',
            transform: 'translateY(-50%)',
            borderRadius: '999px',
            background: withAlpha('#ffffff', 0.08),
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              width: '100%',
              height: '100%',
              scaleX: progressScale,
              transformOrigin: 'left center',
              borderRadius: '999px',
              background: `linear-gradient(90deg, ${withAlpha('#6a6a6a', 0.95)}, ${withAlpha('#222222', 0.95)})`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '1.5rem',
          right: '1.5rem',
          bottom: '1.4rem',
          display: 'grid',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.95rem 1rem',
            borderRadius: '1.15rem',
            border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
            background: withAlpha('#06080b', 0.3),
          }}
        >
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.42),
              }}
            >
              {copy.ui.labels.liveTransitionLog}
            </div>

            <div
              style={{
                minHeight: '1.6rem',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.98rem',
                lineHeight: 1.55,
                color: '#fff7ee',
              }}
            >
              {typedTranscript}
              <motion.span
                animate={{ opacity: [1, 0.24, 1] }}
                style={{ color: scene.currentStep.palette.glow }}
                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
              >
                ▌
              </motion.span>
            </div>
          </div>

          <div style={{ display: 'grid', justifyItems: 'end', gap: '0.35rem' }}>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.42),
              }}
            >
              {copy.ui.labels.currentSource}
            </div>

            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.82rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.76),
              }}
            >
              {scene.currentStep.lineRange}
            </div>
          </div>
        </div>

        <LoopInlineContext step={scene.currentStep} ui={copy.ui} />
      </div>
    </section>
  )
}
