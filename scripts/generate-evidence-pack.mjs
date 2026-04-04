import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GIST_ID = '8627fe009c40f57531cb18360106ce95'
const gistUrl = `https://gist.github.com/karpathy/${GIST_ID}`
const rawGistUrl = `https://gist.githubusercontent.com/karpathy/${GIST_ID}/raw/microgpt.py`
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const locale = process.argv[2] === 'zh-TW' ? 'zh-TW' : 'en'
const defaultOutputPath = resolve(rootDir, `src/content/evidence-pack.${locale}.json`)

const quickRunSteps = 120
const chartSteps = [1, 12, 24, 36, 48, 60, 72, 84, 96, 108, quickRunSteps]
const previewSteps = [1, 24, quickRunSteps]

const response = await fetch(rawGistUrl)
if (!response.ok) {
  throw new Error(`Failed to fetch raw microgpt gist: ${response.status} ${response.statusText}`)
}

const rawSource = await response.text()
const patchedSource = patchSource(rawSource, quickRunSteps, locale)
const output = runPatchedSource(patchedSource, locale)
const artifact = buildArtifact(rawSource, output, locale)

mkdirSync(dirname(defaultOutputPath), { recursive: true })
writeFileSync(defaultOutputPath, `${JSON.stringify(artifact, null, 2)}\n`)
console.log(`Wrote ${locale} evidence pack to ${defaultOutputPath}`)

function patchSource(source, numSteps, locale) {
  let nextSource = source
    .replace(
      'num_steps = 1000 # number of training steps',
      `num_steps = ${numSteps} # number of training steps`,
    )
    .replace(
      `print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}", end='\\r')`,
      `print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}")`,
    )

  if (locale === 'zh-TW') {
    const datasetPath = resolve(rootDir, 'data/names_zh_tw.txt').replaceAll('\\', '\\\\')
    const dataset = readFileSync(resolve(rootDir, 'data/names_zh_tw.txt'), 'utf8').trimEnd()
    const escaped = JSON.stringify(dataset)

    nextSource = nextSource
      .replace(
        /names_url\s*=\s*'[^']+'/,
        'names_url = None',
      )
      .replace(
        /urllib\.request\.urlretrieve\(names_url, 'input\.txt'\)/,
        `with open('input.txt', 'w', encoding='utf-8') as f:\n        f.write(${escaped})`,
      )
  }

  if (nextSource === source) {
    throw new Error('Failed to patch microgpt source for evidence generation.')
  }

  return nextSource
}

function runPatchedSource(source, locale) {
  const workingDir = mkdtempSync(join(tmpdir(), `microgpt-evidence-${locale}-`))

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

function buildArtifact(source, output, locale) {
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
    locale,
    source: {
      gistId: GIST_ID,
      gistUrl,
      rawGistUrl,
      lineCount,
      datasetUrl:
        locale === 'zh-TW'
          ? 'data/names_zh_tw.txt'
          : 'https://raw.githubusercontent.com/karpathy/makemore/988aa59/names.txt',
    },
    quickRun: {
      numSteps: quickRunSteps,
      patchNotes:
        locale === 'zh-TW'
          ? [
              `Replaced the raw gist training horizon with ${quickRunSteps} steps for a fast reference pass.`,
              'Converted the training progress print from carriage-return updates to newline logs for parsable output.',
              'Patched the corpus bootstrap so the run uses the local zh-TW Chinese-name dataset instead of the default English names file.',
            ]
          : [
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
          if (loss === undefined) throw new Error(`Missing preview loss for step ${step}.`)
          return `step ${String(step).padStart(4, ' ')} / ${String(quickRunSteps).padStart(4, ' ')} | loss ${loss.toFixed(4)}`
        }),
      ].join('\n'),
      losses,
      lossChart: chartSteps.map((step) => {
        const loss = lossMap.get(step)
        if (loss === undefined) throw new Error(`Missing chart loss for step ${step}.`)
        return { step, loss }
      }),
      samples,
      featuredSamples: samples.slice(0, 12),
    },
  }
}

function captureNumber(output, pattern, label) {
  const match = output.match(pattern)
  if (!match) throw new Error(`Could not parse ${label} from generator output.`)
  return Number(match[1])
}
