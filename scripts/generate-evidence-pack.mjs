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
const forwardPassOutputPath = resolve(rootDir, `src/content/forward-pass.${locale}.json`)

const quickRunSteps = 120
const chartSteps = [1, 12, 24, 36, 48, 60, 72, 84, 96, 108, quickRunSteps]
const previewSteps = [1, 24, quickRunSteps]
const forwardProbeDocCount = 3
const forwardProbeTopCandidates = 12
const trainingTraceStartMarker = '__TRAINING_TRACE_START__'
const trainingTraceEndMarker = '__TRAINING_TRACE_END__'
const forwardPassStartMarker = '__FORWARD_PASS_PROBES_START__'
const forwardPassEndMarker = '__FORWARD_PASS_PROBES_END__'

const response = await fetch(rawGistUrl)
if (!response.ok) {
  throw new Error(`Failed to fetch raw microgpt gist: ${response.status} ${response.statusText}`)
}

const rawSource = await response.text()
const patchedSource = patchSource(rawSource, quickRunSteps, locale)
const output = runPatchedSource(patchedSource, locale)
const artifact = buildArtifact(rawSource, output, locale)
const { forwardPass, ...baseArtifact } = artifact
const { quickRun: forwardQuickRun, ...forwardMeta } = forwardPass
const { quickRun, ...baseMeta } = baseArtifact

mkdirSync(dirname(defaultOutputPath), { recursive: true })
writeFileSync(
  defaultOutputPath,
  `${JSON.stringify({ ...baseMeta, quickRun }, null, 2)}\n`,
)
writeFileSync(
  forwardPassOutputPath,
  `${JSON.stringify({ ...forwardMeta, quickRun: forwardQuickRun }, null, 2)}\n`,
)
console.log(`Wrote ${locale} evidence pack to ${defaultOutputPath}`)
console.log(`Wrote ${locale} forward-pass pack to ${forwardPassOutputPath}`)

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

  nextSource = nextSource
    .replace(
      'for step in range(num_steps):',
      `_training_trace = []\nfor step in range(num_steps):`,
    )
    .replace(
      '    lr_t = learning_rate * (1 - step / num_steps) # linear learning rate decay',
      `    lr_t = learning_rate * (1 - step / num_steps) # linear learning rate decay\n    _training_trace.append({'step': step + 1, 'doc': doc, 'learningRate': round(lr_t, 8), 'tokenIds': tokens[:n+1], 'numTargets': n})`,
    )

  nextSource += `

import json

def _round_data(value, digits=6):
    return round(value, digits)

def _vector_data(values):
    return [_round_data(value.data) for value in values]

def _token_label(token_id):
    return 'BOS' if token_id == BOS else uchars[token_id]

def _probe_forward_pass(doc):
    tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS]
    n = min(block_size, len(tokens) - 1)
    keys, values = [[] for _ in range(n_layer)], [[] for _ in range(n_layer)]
    positions = []

    for pos_id in range(n):
        token_id, target_id = tokens[pos_id], tokens[pos_id + 1]

        tok_emb = state_dict['wte'][token_id]
        pos_emb = state_dict['wpe'][pos_id]
        combined = [t + p for t, p in zip(tok_emb, pos_emb)]
        x = rmsnorm(combined)

        token_embedding = _vector_data(tok_emb)
        position_embedding = _vector_data(pos_emb)
        combined_data = _vector_data(combined)
        input_rms_data = _vector_data(x)
        attention_head_weights = []

        for li in range(n_layer):
            x_residual = x
            x = rmsnorm(x)
            q = linear(x, state_dict[f'layer{li}.attn_wq'])
            k = linear(x, state_dict[f'layer{li}.attn_wk'])
            v = linear(x, state_dict[f'layer{li}.attn_wv'])
            keys[li].append(k)
            values[li].append(v)
            x_attn = []
            layer_head_weights = []

            for h in range(n_head):
                hs = h * head_dim
                q_h = q[hs:hs+head_dim]
                k_h = [ki[hs:hs+head_dim] for ki in keys[li]]
                v_h = [vi[hs:hs+head_dim] for vi in values[li]]
                attn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 for t in range(len(k_h))]
                attn_weights = softmax(attn_logits)
                layer_head_weights.append([_round_data(weight.data) for weight in attn_weights])
                head_out = [sum(attn_weights[t] * v_h[t][j] for t in range(len(v_h))) for j in range(head_dim)]
                x_attn.extend(head_out)

            attention_head_weights = layer_head_weights
            x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])
            x = [a + b for a, b in zip(x, x_residual)]

            x_residual = x
            x = rmsnorm(x)
            x = linear(x, state_dict[f'layer{li}.mlp_fc1'])
            mlp_active_count = sum(1 for value in x if value.data > 0)
            x = [xi.relu() for xi in x]
            x = linear(x, state_dict[f'layer{li}.mlp_fc2'])
            x = [a + b for a, b in zip(x, x_residual)]

        logits = linear(x, state_dict['lm_head'])
        probs = softmax(logits)
        top_indices = sorted(range(len(probs)), key=lambda idx: probs[idx].data, reverse=True)[:${forwardProbeTopCandidates}]
        average_attention = [
            _round_data(sum(head[history_index] for head in attention_head_weights) / len(attention_head_weights))
            for history_index in range(len(attention_head_weights[0]))
        ]

        positions.append({
            'posId': pos_id,
            'currentToken': _token_label(token_id),
            'currentTokenId': token_id,
            'targetToken': _token_label(target_id),
            'targetTokenId': target_id,
            'historyTokens': [_token_label(history_token_id) for history_token_id in tokens[:pos_id + 1]],
            'tokenEmbedding': token_embedding,
            'positionEmbedding': position_embedding,
            'combined': combined_data,
            'inputRms': input_rms_data,
            'attentionHeadWeights': attention_head_weights,
            'attentionAverageWeights': average_attention,
            'attentionResidual': _vector_data(x_residual),
            'mlpActiveCount': mlp_active_count,
            'mlpResidual': _vector_data(x),
            'topCandidates': [
                {
                    'token': _token_label(index),
                    'tokenId': index,
                    'logit': _round_data(logits[index].data),
                    'probability': _round_data(probs[index].data),
                }
                for index in top_indices
            ],
        })

    return {
        'name': doc,
        'sequenceTokens': [_token_label(token_id) for token_id in tokens],
        'positions': positions,
    }

_forward_pass_bundle = {
    'embeddingDim': n_embd,
    'numHeads': n_head,
    'headDim': head_dim,
    'probes': [_probe_forward_pass(doc) for doc in docs[:${forwardProbeDocCount}]],
}
print('${trainingTraceStartMarker}')
print(json.dumps(_training_trace, ensure_ascii=False))
print('${trainingTraceEndMarker}')
print('\\n${forwardPassStartMarker}')
print(json.dumps(_forward_pass_bundle, ensure_ascii=False))
print('${forwardPassEndMarker}')
`

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
  const trainingSteps = captureJson(output, trainingTraceStartMarker, trainingTraceEndMarker, 'training trace')
  const forwardPass = captureJson(output, forwardPassStartMarker, forwardPassEndMarker, 'forward pass bundle')

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
      trainingSteps,
      samples,
      featuredSamples: samples.slice(0, 12),
    },
    forwardPass: {
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
        forwardPass,
      },
    },
  }
}

function captureNumber(output, pattern, label) {
  const match = output.match(pattern)
  if (!match) throw new Error(`Could not parse ${label} from generator output.`)
  return Number(match[1])
}

function captureJson(output, startMarker, endMarker, label) {
  const pattern = new RegExp(`${startMarker}\\n([\\s\\S]*?)\\n${endMarker}`)
  const match = output.match(pattern)

  if (!match) {
    throw new Error(`Could not parse ${label} from generator output.`)
  }

  return JSON.parse(match[1])
}
