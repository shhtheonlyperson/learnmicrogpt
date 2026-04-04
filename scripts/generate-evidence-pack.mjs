import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GIST_ID = '8627fe009c40f57531cb18360106ce95'
const gistUrl = `https://gist.github.com/karpathy/${GIST_ID}`
const rawGistUrl = `https://gist.githubusercontent.com/karpathy/${GIST_ID}/raw/microgpt.py`
const defaultOutputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/content/evidence-pack.json',
)

const quickRunSteps = 120
const chartSteps = [1, 12, 24, 36, 48, 60, 72, 84, 96, 108, quickRunSteps]
const previewSteps = [1, 24, quickRunSteps]

const response = await fetch(rawGistUrl)

if (!response.ok) {
  throw new Error(`Failed to fetch raw microgpt gist: ${response.status} ${response.statusText}`)
}

const rawSource = await response.text()

const patchedSource = patchSource(rawSource, quickRunSteps)
const output = runPatchedSource(patchedSource)
const artifact = buildArtifact(rawSource, output)

mkdirSync(dirname(defaultOutputPath), { recursive: true })
writeFileSync(defaultOutputPath, `${JSON.stringify(artifact, null, 2)}\n`)

console.log(`Wrote evidence pack to ${defaultOutputPath}`)

function patchSource(source, numSteps) {
  const nextSource = source
    .replace(
      'num_steps = 1000 # number of training steps',
      `num_steps = ${numSteps} # number of training steps`,
    )
    .replace(
      `print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}", end='\\r')`,
      `print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}")`,
    )

  if (nextSource === source) {
    throw new Error('Failed to patch microgpt source for quick-run evidence generation.')
  }

  return nextSource
}

function runPatchedSource(source) {
  const workingDir = mkdtempSync(join(tmpdir(), 'microgpt-evidence-'))

  try {
    writeFileSync(join(workingDir, 'microgpt.py'), source)

    return execFileSync('python3', ['microgpt.py'], {
      cwd: workingDir,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    })
  } finally {
    rmSync(workingDir, { force: true, recursive: true })
  }
}

function buildArtifact(source, output) {
  const lineCount = source.trimEnd().split(/\r?\n/).length
  const numDocs = captureNumber(output, /^num docs:\s+(\d+)$/m, 'num docs')
  const vocabSize = captureNumber(output, /^vocab size:\s+(\d+)$/m, 'vocab size')
  const numParams = captureNumber(output, /^num params:\s+(\d+)$/m, 'num params')

  const losses = [...output.matchAll(/^step\s+(\d+)\s+\/\s+(\d+)\s+\|\s+loss\s+([0-9.]+)$/gm)].map(
    ([, step, totalSteps, loss]) => ({
      step: Number(step),
      totalSteps: Number(totalSteps),
      loss: Number(loss),
    }),
  )

  if (losses.length !== quickRunSteps) {
    throw new Error(`Expected ${quickRunSteps} loss rows, got ${losses.length}.`)
  }

  const lossMap = new Map(losses.map((entry) => [entry.step, entry.loss]))
  const samples = [...output.matchAll(/^sample\s+\d+:\s*(.*)$/gm)].map(([, sample]) => sample)

  return {
    generatedAt: new Date().toISOString(),
    source: {
      gistId: GIST_ID,
      gistUrl,
      rawGistUrl,
      lineCount,
      datasetUrl: 'https://raw.githubusercontent.com/karpathy/makemore/988aa59/names.txt',
    },
    quickRun: {
      numSteps: quickRunSteps,
      patchNotes: [
        `Replaced the raw gist training horizon with ${quickRunSteps} steps for a fast reference pass.`,
        'Converted the training progress print from carriage-return updates to newline logs for parsable output.',
      ],
      numDocs,
      vocabSize,
      numParams,
      referenceRunPreview: [
        `num docs: ${numDocs}`,
        `vocab size: ${vocabSize}`,
        `num params: ${numParams}`,
        ...previewSteps.map((step) => {
          const loss = lossMap.get(step)

          if (loss === undefined) {
            throw new Error(`Missing preview loss for step ${step}.`)
          }

          return `step ${String(step).padStart(4, ' ')} / ${String(quickRunSteps).padStart(4, ' ')} | loss ${loss.toFixed(4)}`
        }),
      ].join('\n'),
      losses,
      lossChart: chartSteps.map((step) => {
        const loss = lossMap.get(step)

        if (loss === undefined) {
          throw new Error(`Missing chart loss for step ${step}.`)
        }

        return { step, loss }
      }),
      samples,
      featuredSamples: samples.slice(0, 12),
    },
  }
}

function captureNumber(output, pattern, label) {
  const match = output.match(pattern)

  if (!match) {
    throw new Error(`Could not parse ${label} from generator output.`)
  }

  return Number(match[1])
}
