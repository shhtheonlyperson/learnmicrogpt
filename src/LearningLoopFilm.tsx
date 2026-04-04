import { motion, useAnimationFrame, useSpring } from 'motion/react'
import { useRef, useState } from 'react'
import { loopSteps, type LoopStep } from './content/loopSteps'

type LearningLoopFilmProps = {
  selectedStepId: string
}

type LoopScene = {
  currentStep: LoopStep
  nextStep: LoopStep
  progress: number
  segmentIndex: number
  transcript: string
  transcriptLength: number
}

export const FLOW_STEP_MS = 2800
export const FLOW_TOTAL_MS = loopSteps.length * FLOW_STEP_MS

const TRACK_SPACING = 188
const CARD_WIDTH = 168

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
}: {
  index: number
  scenePosition: number
  currentIndex: number
  nextIndex: number
  progress: number
  step: LoopStep
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
          `linear-gradient(180deg, ${withAlpha('#ffffff', 0.08)}, ${withAlpha(
            step.palette.accent,
            0.08 + emphasis * 0.14,
          )})`,
          withAlpha('#0f1217', 0.78 + emphasis * 0.08),
        ].join(','),
        boxShadow: isCurrent || isNext ? `0 20px 60px ${withAlpha(step.palette.accent, 0.18)}` : 'none',
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
          {isCurrent ? '進行中' : isNext ? '即將進入' : '待命'}
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

export const LearningLoopFilm = ({ selectedStepId }: LearningLoopFilmProps) => {
  const selectedIndex = Math.max(
    0,
    loopSteps.findIndex((item) => item.id === selectedStepId),
  )
  const initialOffset = selectedIndex * FLOW_STEP_MS
  const startOffsetRef = useRef(initialOffset)
  const animationStartRef = useRef<number | null>(null)
  const [scene, setScene] = useState<LoopScene>(() => getScene(initialOffset))

  const railX = useSpring(0, { stiffness: 170, damping: 26 })
  const packetX = useSpring(-44, { stiffness: 220, damping: 24 })
  const progressScale = useSpring(0, { stiffness: 190, damping: 28 })

  useAnimationFrame((time) => {
    if (animationStartRef.current === null) {
      animationStartRef.current = time
    }

    const elapsedMs = (startOffsetRef.current + (time - animationStartRef.current)) % FLOW_TOTAL_MS
    const nextScene = getScene(elapsedMs)
    const scenePosition = nextScene.segmentIndex + nextScene.progress

    railX.set(-(scenePosition * TRACK_SPACING) - CARD_WIDTH / 2)
    packetX.set(-44 + nextScene.progress * 88)
    progressScale.set(nextScene.progress)
    setScene(nextScene)
  })

  const scenePosition = scene.segmentIndex + scene.progress
  const typedTranscript = scene.transcript.slice(0, scene.transcriptLength)
  const railWidth = (loopSteps.length - 1) * TRACK_SPACING + CARD_WIDTH

  return (
    <section
      aria-label="動態學習迴圈"
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        width: '100%',
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
              執行軌跡
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
              {scene.currentStep.flowStage} 到 {scene.nextStep.flowStage}
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

          <div
            style={{
              display: 'grid',
              gap: '0.6rem',
              justifyItems: 'end',
            }}
          >
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
              交接進度 {Math.round(scene.progress * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '10.4rem 1.2rem 4.9rem',
          overflow: 'hidden',
          borderRadius: '1.2rem',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '13rem',
            height: '100%',
            transform: 'translate(-50%, -50%)',
            borderLeft: `1px solid ${withAlpha('#ffffff', 0.08)}`,
            borderRight: `1px solid ${withAlpha('#ffffff', 0.08)}`,
            background: `linear-gradient(180deg, ${withAlpha(
              scene.currentStep.palette.glow,
              0.06,
            )}, ${withAlpha(scene.nextStep.palette.glow, 0.02)})`,
            pointerEvents: 'none',
          }}
        />

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
              background: `linear-gradient(90deg, ${withAlpha('#ffffff', 0.08)}, ${withAlpha(
                '#ffffff',
                0.18,
              )}, ${withAlpha('#ffffff', 0.08)})`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: CARD_WIDTH / 2,
              right: CARD_WIDTH / 2,
              top: '9.6rem',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${withAlpha(
                scene.currentStep.palette.glow,
                0.42,
              )}, transparent)`,
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
                step={step}
              />

              <motion.div
                animate={{
                  opacity: index === scene.segmentIndex ? 1 : index === (scene.segmentIndex + 1) % loopSteps.length ? 0.72 : 0.28,
                  scale: index === scene.segmentIndex ? 1.25 : index === (scene.segmentIndex + 1) % loopSteps.length ? 1.05 : 0.82,
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
                      ? step.palette.accent
                      : withAlpha('#ffffff', 0.18),
                  border: `1px solid ${withAlpha('#ffffff', 0.16)}`,
                  boxShadow:
                    index === scene.segmentIndex
                      ? `0 0 20px ${withAlpha(step.palette.glow, 0.44)}`
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
            left: '50%',
            top: '50%',
            width: '9.5rem',
            height: '3.6rem',
            transform: 'translate(-50%, -6%)',
            borderRadius: '999px',
            border: `1px solid ${withAlpha('#ffffff', 0.1)}`,
            background: withAlpha('#06080b', 0.42),
            backdropFilter: 'blur(12px)',
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
                background: `linear-gradient(90deg, ${scene.currentStep.palette.accent}, ${scene.nextStep.palette.accent})`,
              }}
            />
          </div>

          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              x: packetX,
              y: '-50%',
              minWidth: '4.5rem',
              minHeight: '2.25rem',
              padding: '0 0.85rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.74rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff7ee',
              background: `linear-gradient(135deg, ${withAlpha(
                scene.currentStep.palette.glow,
                0.24,
              )}, ${withAlpha(scene.nextStep.palette.accent, 0.28)})`,
              border: `1px solid ${withAlpha('#ffffff', 0.12)}`,
              boxShadow: `0 0 32px ${withAlpha(scene.currentStep.palette.glow, 0.24)}`,
            }}
          >
            {scene.currentStep.targetLabel}
          </motion.div>
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
              即時轉換紀錄
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

          <div
            style={{
              display: 'grid',
              justifyItems: 'end',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: withAlpha('#fff7ee', 0.42),
              }}
            >
              目前原始碼行數
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${loopSteps.length}, minmax(0, 1fr))`,
            gap: '0.5rem',
          }}
        >
          {loopSteps.map((step, index) => {
            const isCurrent = index === scene.segmentIndex
            const isNext = index === (scene.segmentIndex + 1) % loopSteps.length

            return (
              <motion.div
                animate={{
                  opacity: isCurrent ? 1 : isNext ? 0.78 : 0.34,
                  y: isCurrent ? -4 : 0,
                }}
                key={step.id}
                style={{
                  display: 'grid',
                  justifyItems: 'center',
                  gap: '0.4rem',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '0.2rem',
                    borderRadius: '999px',
                    background: isCurrent
                      ? step.palette.accent
                      : isNext
                        ? withAlpha(step.palette.accent, 0.64)
                        : withAlpha('#ffffff', 0.14),
                  }}
                />
                <div
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.66rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: withAlpha('#fff7ee', isCurrent || isNext ? 0.72 : 0.34),
                  }}
                >
                  {step.id}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export type { LearningLoopFilmProps }
