# MicroGPT Unpacked

An interactive editorial demo inspired by [Karpathy's `microgpt.py` gist](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) and the exploration flow of [ccunpacked.dev](https://ccunpacked.dev/).

The app turns the gist into a guided single-page experience with:

- a hero built from real stats observed from the script
- a clickable learning-loop walkthrough
- a single-file architecture atlas
- a compact spec deck and loss chart
- a generated-name gallery from a quick reference run

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

## Refresh the Evidence Pack

```bash
npm run generate:evidence
```

This fetches the raw `microgpt.py` gist, runs a deterministic 120-step reference pass,
and writes the app's committed evidence artifact to `src/content/evidence-pack.json`.
