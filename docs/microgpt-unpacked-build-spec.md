# MicroGPT Unpacked Build Spec

## Goal

Build a single-page, source-backed editorial experience inspired by [ccunpacked.dev](https://ccunpacked.dev/) for [Karpathy's `microgpt.py` gist](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95).

The page should make one idea land clearly:

> A real GPT training loop can be reduced to a tiny, inspectable program.
> The architecture is not simple because it is fake.
> It is simple because scale and efficiency have been stripped away.

The site should feel like an "unpacked source" experience, not a generic landing page for AI.

## Audience

- Engineers who know what GPTs are but have never traced one end to end
- Students who understand pieces of transformers but not how the whole loop closes
- Curious builders who want to see what remains when frameworks and kernels disappear

## Product Thesis

`ccunpacked.dev` succeeds because it does four things in order:

- proves the system is real
- animates the central loop
- maps the source into digestible chunks
- ends with interpretation instead of just exposition

This version should do the same for `microgpt.py`, but with a smaller and more intimate tone. The reference site explains a sprawling tool. This one should explain a tiny machine with surprising depth.

## Core Message

The page should repeatedly reinforce these points:

- `microgpt.py` is a complete training and inference loop, not pseudocode
- the file still contains the irreducible GPT primitives: tokenization, embeddings, attention, loss, backprop, optimization, sampling
- the educational trick is scalar autograd and tiny dimensions, which make every step inspectable
- "everything else is just efficiency" is the organizing lens for the whole experience

## Experience Principles

- Source-backed: every major claim should trace to a real gist line range or a real reference run.
- Prove first, explain second: lead with real stats, real code, real samples.
- One page, many entry points: users should be able to start with the loop, atlas, or proof artifacts.
- Small-machine tone: the visuals should feel like a lab notebook or annotated printout, not enterprise product marketing.
- Editorial confidence: the page should interpret why each section matters, not just restate the code.

## Information Architecture

### 0. Hero: The Compression

Purpose: establish the thesis in under 10 seconds.

Content:

- eyebrow: `MICROGPT UNPACKED`
- headline: `One file. One toy transformer. The whole loop exposed.`
- short lede explaining that dataset loading, tokenizer, scalar autograd, attention, Adam, and sampling all live in the same Python file
- proof metrics pulled from the gist and a reference run:
  - `199` lines in the raw gist
  - `32,033` docs
  - `27` tokens
  - `4,192` params
  - `1` transformer layer
  - `4` heads
- hero terminal showing:
  - `num docs`
  - `vocab size`
  - `num params`
  - a few loss checkpoints
  - a few generated names
- one strong "start exploring" CTA
- one source CTA linking to the gist

What should be memorable:

- the shock that a GPT training loop fits in a tiny file
- the phrase "everything else is just efficiency"

### 1. The Learning Loop

Purpose: create the `ccunpacked` equivalent of the agent loop.

Structure:

- a horizontal or vertical sequence of stages
- a synced spotlight panel with explanation and source snippet
- a motion layer that makes the handoff between steps feel alive
- a sticky or adjacent code panel that updates with the active step

Canonical steps:

1. Fetch corpus
2. Tokenize characters
3. Build `Value` graph
4. Initialize parameters
5. Compose token plus position
6. Attend over history
7. Project to logits
8. Compute loss
9. Backprop
10. Adam update
11. Sample names

Each step needs:

- title
- one-sentence summary
- one paragraph for "why this matters"
- exact code snippet
- line range
- 2-3 callout chips
- a visual metaphor or small animated glyph

The section should answer:

- what happens from raw text to generated output
- what order the operations happen in
- what pieces are standard GPT ideas versus simplifications

### 2. Single-File Atlas

Purpose: let people explore the gist as a map instead of a wall of code.

Use the real source boundaries:

- `14-27`: data + tokenizer
- `29-72`: scalar autograd
- `74-90`: parameter initialization
- `92-144`: forward pass and block anatomy
- `146-184`: training loop + Adam
- `186-200`: inference

Interaction:

- clickable ranges on the left
- detailed explanation on the right
- source link for each range
- optional inline "what to notice" annotations

Each atlas card should explain:

- what this span is doing mechanically
- why it matters educationally
- what simplification makes it teachable

### 3. Primitive Inventory

Purpose: replace `ccunpacked`'s "tool catalog" with a `microgpt`-specific concept catalog.

Cards:

- Character tokenizer
- Scalar autograd
- Tiny `state_dict`
- RMSNorm instead of LayerNorm
- One-block attention
- ReLU MLP
- Adam buffers
- Temperature sampling

Each card should have:

- name
- role in the system
- "kept from real GPTs" note
- "simplified for teaching" note

This section should make the core educational point explicit:

- the file is not a toy because it removes the important parts
- it is a toy because it keeps the important parts but makes them small

### 4. What Stayed / What Got Stripped Away

Purpose: articulate the core idea of `microgpt` directly.

Layout:

- two-column comparison or paired cards

What stayed:

- next-token prediction
- embeddings
- positional information
- multi-head attention
- residual connections
- MLP
- loss and backprop
- Adam
- autoregressive sampling

What got stripped away:

- tensor libraries
- GPU kernels
- batching
- large datasets
- multiple layers
- large hidden sizes
- tokenizer complexity
- production training infrastructure

Closing interpretation:

- the transformer is conceptually smaller than its industrial implementations suggest
- most complexity in production systems comes from scale, speed, and ergonomics

### 5. Reference Run

Purpose: close the loop with evidence.

Content:

- compact loss trace
- selected training checkpoints
- a board of generated names
- one note explaining why the outputs are crude but convincing

Tone:

- charming, honest, and slightly playful
- do not oversell quality
- position the samples as proof of a complete loop, not proof of a good model

### 6. Footer Sources

Purpose: preserve credibility.

Include:

- gist
- raw gist
- names dataset
- reference note pointing to `ccunpacked.dev` as layout inspiration

## Narrative Copy Direction

The page copy should sound like a technically literate editor, not a hype page.

Voice:

- calm
- precise
- impressed by the compression, not by "AI magic"
- comfortable naming tradeoffs directly

Avoid:

- startup language
- "revolutionary" framing
- vague claims like "learn transformers visually"
- long textbook explanations

Preferred framing:

- "This line is the trick."
- "This is where the abstraction budget disappears."
- "The model is tiny, but the algorithm is intact."
- "The point is not performance. The point is inspectability."

## Visual Direction

Target aesthetic: editorial lab notebook.

Ingredients:

- warm paper-like background
- sharp mono labels and line-range chips
- elegant display type with restraint
- diagrams that feel annotated, not overly glossy
- motion that tracks state transitions, not decorative spinning
- dense but breathable layout

Do not imitate `ccunpacked.dev` literally. Clone the structure, not the surface.

## Motion Direction

Motion should help users understand sequence and causality.

Use motion for:

- handoff between loop steps
- active source range changes
- chart reveal
- staggered section entrances
- subtle terminal or cursor pulses

Avoid:

- constant ambient motion
- floating ornaments unrelated to learning
- flashy parallax that competes with code

## Data Model

Move the page content into structured data so the UI can stay composable.

Suggested modules:

- `src/content/heroMetrics.ts`
- `src/content/loopSteps.ts`
- `src/content/atlasSections.ts`
- `src/content/primitives.ts`
- `src/content/proofArtifacts.ts`
- `src/content/sources.ts`

Each source-backed record should support:

- `title`
- `summary`
- `detail`
- `lineRange`
- `snippet`
- `sourceUrl`
- optional visual metadata

## Repo-Specific Implementation Plan

### Keep

- current Vite + React + Motion stack
- single-page structure in `src/App.tsx`
- existing animated learning loop foundation in `src/LearningLoopFilm.tsx`
- existing warm editorial CSS direction in `src/index.css` and `src/App.css`

### Change

- replace broad section copy with a sharper thesis around "complete algorithm / everything else is efficiency"
- tighten all source ranges to the real raw gist line spans
- add a new "What Stayed / What Got Stripped Away" section
- turn the current spec deck into a concept inventory, not just a stats grid
- make the loop section feel more like the main event by syncing explanation, motion, and code
- make the proof artifacts more obviously sourced from a reproducible reference run

### Add

- a small utility or script to collect deterministic reference-run artifacts
- sticky code viewer for the active step or active atlas range
- deep links from section cards to gist lines
- stronger section anchors and section numbering

## Reference Run Requirements

We should generate and store a reproducible "evidence pack" instead of hand-authoring the numbers.

Needed artifacts:

- line count of raw gist
- observed `num docs`
- observed `vocab size`
- observed `num params`
- a short loss trace from a fast run
- a stable subset of generated names

Implementation options:

- precompute and commit a small JSON artifact
- or run a script during development and copy the results into typed data

Recommendation:

- precompute once and commit the result so the app stays static and fast

## Component Breakdown

Suggested components:

- `HeroPanel`
- `LearningLoopSection`
- `StickyCodePanel`
- `SingleFileAtlas`
- `PrimitiveInventory`
- `TradeoffSection`
- `ReferenceRunSection`
- `SourceFooter`

Suggested composition:

- `App.tsx` owns section order and high-level state
- section-level components own local rendering
- content files own text and source metadata
- animation logic stays isolated from copy data

## Implementation Phases

### Phase 1: Content and Structure

- extract all page content into typed data
- correct source ranges and source links
- rewrite hero and section copy around the core thesis
- add the new tradeoff section

Outcome:

- the page says the right thing even before visual polish

### Phase 2: Interaction and Code Sync

- add sticky code panel behavior
- sync active loop step to snippet, line range, and explanation
- improve atlas interactions and transitions

Outcome:

- the site feels truly "unpacked" instead of just illustrated

### Phase 3: Proof Artifacts

- generate a deterministic evidence pack
- replace placeholder stats and samples with sourced values
- refine the loss trace and terminal view

Outcome:

- every headline claim is backed by real output

### Phase 4: Visual Polish

- tighten spacing and section pacing
- increase contrast and hierarchy in chips, labels, and cards
- refine mobile layout
- tune motion timing and reveal order

Outcome:

- the experience feels deliberate and memorable

## Acceptance Criteria

The page is successful if a first-time visitor can answer these questions after 2-3 minutes:

- Why is `microgpt.py` interesting?
- What are the main steps from text to generated output?
- Which parts are "real GPT" ideas and which parts were simplified?
- Why does "everything else is just efficiency" make sense here?

The implementation is successful if:

- all section claims are source-backed
- mobile layout remains legible and navigable
- the learning loop is the strongest interaction on the page
- the tradeoff section lands the main educational thesis clearly
- the page feels like an editorial explanation of a code artifact, not a generic AI microsite

## Nice-to-Have Extensions

- line-highlighted embedded source viewer
- toggles for "mechanics" vs "why it matters"
- a "trace one token" mini-simulation
- an alternate view that compares `micrograd` to `microgpt`

## Recommended Immediate Next Step

Implement Phase 1 first:

- reorganize `App.tsx` into section components
- extract content into typed files
- add the tradeoff section
- update the hero and atlas ranges to match the raw gist exactly

That is the smallest slice that materially improves the product without committing to a full visual rewrite first.
