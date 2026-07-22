# Quickstart: SpecPilot

Validation guide for the feature described in `spec.md`, implemented per `plan.md`,
`data-model.md`, and `contracts/api.md`. This is a run/validate guide, not an
implementation reference.

## Prerequisites

- Node.js 20 LTS installed.
- A Fetch.ai (ASI:One / Agentverse) API key for the hosted inference endpoint used by
  `backend/src/services/fetchAiClient.ts` (research.md #1).

## Environment variables (backend/.env, never committed)

```
FETCH_AI_API_KEY=your-key-here
FETCH_AI_ENDPOINT_URL=https://...        # hosted inference endpoint base URL
PORT=4000
GENERATION_TIMEOUT_MS=90000              # research.md #3
IDEA_MIN_LENGTH=20                       # research.md #4
IDEA_MAX_LENGTH=2000                     # research.md #4
```

## Environment variables (frontend/.env)

```
VITE_API_BASE_URL=http://localhost:4000
```

## Setup & run

```sh
# backend
cd backend
npm install
npm run dev        # starts Express on PORT

# frontend (separate terminal)
cd frontend
npm install
npm run dev         # starts Vite dev server, proxies to VITE_API_BASE_URL
```

## Validation scenarios (map to spec User Stories)

### US2 — Understand SpecPilot before starting (P2)

1. Open the frontend dev server URL.
2. **Expect**: Landing page loads matching `design/landing-page.png` — hero headline,
   feature grid, "How SpecPilot Works" steps, one prominent "Generate Specification" CTA.
3. Tab through the page with keyboard only. **Expect**: every link/button is reachable and
   shows a visible focus state (FR-018).

### US1 — Generate a specification from a project idea (P1)

1. From the landing page, click "Generate Specification" (or navigate to `/generate`).
2. **Expect**: Generator page matching `design/generator.png` (form, writing tips, example
   prompts).
3. Try submitting with the field empty. **Expect**: blocked, explains the 20-character
   minimum (FR-005; see `contracts/api.md` `idea_too_short`).
4. Enter a real idea description (e.g. one of the example prompts) and submit.
5. **Expect**: navigates to the Generating page (`design/generating.png`); the five stages
   (`understanding-idea` → `generating-requirements` → `creating-user-stories` →
   `preparing-milestones` → `formatting-document`) light up in order via the SSE stream
   (FR-009/FR-010), each previous stage shown as done.
6. On success, **expect**: Result page (`design/result.png`) showing all eight sections
   from `data-model.md`'s `Specification` populated with idea-specific content, not
   placeholder text (FR-013/FR-014).
7. Click "Download Markdown". **Expect**: a `.md` file downloads client-side, no network
   request fires (FR-020).
8. Click "Copy to Clipboard". **Expect**: specification text is on the clipboard, no
   network request fires (FR-021).

### Failure/timeout path (FR-011/FR-011a)

1. Temporarily point `FETCH_AI_ENDPOINT_URL` at an invalid URL and restart the backend.
2. Submit a valid idea.
3. **Expect**: Generating page eventually shows the failure/retry state (either fast, via
   `generation-failed reason: upstream-error`, or after `GENERATION_TIMEOUT_MS`, via
   `reason: timeout`), and the original idea text is still available to retry without
   re-typing it.

### US3 — Review a result and generate another specification (P3)

1. From a completed Result page, click "Generate Again".
2. **Expect**: returns to the Generator page with a clean input (FR-015).
3. Submit a second, different idea through to completion.
4. **Expect**: only the newest specification is shown — no trace of the first result
   (FR-016).

## Automated checks

```sh
cd backend && npm test    # Vitest + Supertest: contract tests for POST/GET stream shapes
cd frontend && npm test   # Vitest + React Testing Library: page/component tests
```
