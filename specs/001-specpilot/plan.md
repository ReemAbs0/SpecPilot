# Implementation Plan: SpecPilot – AI-Powered Software Specification Generator

**Branch**: `001-specpilot` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-specpilot/spec.md`

## Summary

SpecPilot lets a visitor describe a software idea in free text and receive back a
structured, eight-section specification document. A React + TypeScript (Vite, Tailwind)
frontend collects the idea and renders four screens (landing, generator, generating,
result) matching the approved Figma designs. A Node.js/TypeScript backend accepts the
idea, runs it through five sequential AI-agent stages (understand idea → analyze
requirements → generate user stories → plan milestones → format document) backed by
Fetch.ai, and streams stage progress to the frontend in real time so the UI can show live
generation status (constitution Principle VII). No accounts, no persistent storage —
everything is scoped to a single browser session, with client-side-only Download
(Markdown) and Copy-to-Clipboard actions on the result view.

## Technical Context

**Language/Version**: TypeScript 5.x on both frontend and backend; Node.js 20 LTS runtime.

**Primary Dependencies**: React 18 + Vite (frontend build/dev server); Tailwind CSS
(styling); React Router (client-side routing across the 4 pages); Express (backend HTTP
framework); Fetch.ai (ASI:One hosted inference endpoint, called over HTTP from the
backend's agent-stage modules — see research.md for why a hosted call was chosen over
running a separate Python `uAgents` process).

**Storage**: N/A — no database. Generation state lives only in server memory for the
duration of one active request/session and in frontend memory for the active browser tab
(per spec Assumptions: no persistence, no accounts).

**Testing**: Vitest + React Testing Library (frontend unit/component tests); Vitest +
Supertest (backend unit/contract tests).

**Target Platform**: Modern desktop and mobile web browsers (frontend); any standard
Node.js 20 host (backend), configured entirely through environment variables (constitution
Environment requirement — no secrets in source).

**Project Type**: Web application (frontend + backend).

**Performance Goals**: Landing page interactive within ~2s on a typical broadband
connection; specification generation completes within the maximum wait time defined below,
after which it is treated as a failure per FR-011a.

**Constraints**:
- Maximum generation wait time: 90 seconds (research.md), after which the system shows the
  FR-011 failure/retry state per FR-011a.
- Idea description length: minimum 20 characters, maximum 2,000 characters (research.md),
  enforced client- and server-side per FR-005/FR-006.
- No server-side persistence of idea text or generated specifications (FR-017).
- Download/Copy actions (FR-020/FR-021) must be implemented client-side only — no new
  backend storage or sharing endpoints.
- Baseline accessibility: keyboard-operable, screen-reader-labeled (FR-018/FR-019).

**Scale/Scope**: Single-user browser session, no concurrency target (spec Assumptions).
4 pages, ~5 page-level component groups, no user accounts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| I. Design Fidelity | **Pass.** Page/component structure below is derived directly from the four approved Figma screens. The one real design/spec conflict found (export actions on the result page) was raised to the user and resolved explicitly (spec updated with FR-020/FR-021) rather than silently decided either way. |
| II. Simplicity First | **Pass.** Express (no heavyweight framework), React Context + `useReducer` for state (no Redux/Zustand), no database/ORM, a single hosted AI HTTP call instead of standing up a separate agent runtime process. |
| III. Clear Separation of Concerns | **Pass.** Backend splits into `api/` (HTTP layer), `agents/` (five stage modules = AI generation logic), `services/` (orchestration + Fetch.ai client), `models/` (data shapes). Frontend splits `pages/` (routing/composition) from `components/` (presentation) from `services/` + `state/` (data/business logic), matching the constitution's UI → orchestration → data dependency direction. |
| IV. Specification Quality | **Pass.** data-model.md and the agent contract (contracts/api.md) require all eight output sections on every successful generation; formatting is its own dedicated stage. |
| V. Incremental Delivery | **Pass.** Task breakdown (next phase) will sequence by the spec's prioritized user stories (P1 generate → P2 landing → P3 regenerate), each independently functional. |
| VI. Type Safety and Code Quality | **Pass.** TypeScript strict mode on both projects; shared request/response types defined once in contracts and mirrored into `frontend/src/types`. |
| VII. AI Transparency | **Pass.** Dedicated Generating page + SSE stage-event stream (research.md) drives the five-stage progress UI required by FR-008–FR-011a. |

No violations — Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-specpilot/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── specifications.route.ts   # POST /api/specifications, GET /api/specifications/:id/stream
│   ├── agents/
│   │   ├── ideaAnalysis.agent.ts     # Stage 1: understanding the project idea
│   │   ├── requirements.agent.ts     # Stage 2: generating requirements
│   │   ├── userStories.agent.ts      # Stage 3: creating user stories
│   │   ├── milestones.agent.ts       # Stage 4: preparing milestones
│   │   └── formatting.agent.ts       # Stage 5: formatting the final document
│   ├── services/
│   │   ├── fetchAiClient.ts          # Thin HTTP client for the Fetch.ai hosted endpoint
│   │   └── specificationOrchestrator.ts  # Runs the 5 agents in order, emits stage events
│   ├── models/
│   │   └── specification.types.ts    # ProjectIdea, GenerationSession, Specification shapes
│   └── server.ts
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── GeneratorPage.tsx
│   │   ├── GeneratingPage.tsx
│   │   └── ResultPage.tsx
│   ├── components/
│   │   ├── layout/        # Navbar, Footer
│   │   ├── landing/       # Hero, FeatureCard, HowItWorksStep, ContactCard, CtaBanner
│   │   ├── generator/     # IdeaForm, WritingTipsCard, ExamplePromptsCard
│   │   ├── generating/    # ProgressCard, StageListItem, ProgressBar
│   │   ├── result/        # ResultHeader, SpecificationSection, ActionsPanel
│   │   └── ui/            # Button, Badge, Card (shared primitives)
│   ├── services/
│   │   └── specificationApi.ts   # Calls backend, subscribes to the SSE stage stream
│   ├── state/
│   │   └── SpecificationContext.tsx  # useReducer: idle → submitting → generating → success/error
│   ├── types/
│   │   └── specification.types.ts    # Mirrors backend contract types
│   └── App.tsx                       # Route table across the 4 pages
└── tests/
```

**Structure Decision**: Web application split into sibling `backend/` and `frontend/`
projects (Option 2). The backend's `agents/` directory gives each of the five FR-009
stages its own module (Principle III); the frontend's `pages/` vs `components/` vs
`services/`+`state/` split keeps UI, data-fetching, and AI-facing logic from mixing
(Principle III), while `components/ui/` holds the small set of primitives reused across
all four Figma screens (buttons, badges, cards) to avoid duplicating design-system styling.

## UI Architecture (from Figma designs)

**Pages** (map 1:1 to the 4 provided screens):

| Page | Route | Figma source | Purpose |
|---|---|---|---|
| Landing | `/` | `design/landing-page.png` | Introduces SpecPilot, features, how-it-works, contact, CTA (US2) |
| Generator | `/generate` | `design/generator.png` | Idea input form + writing tips + examples (US1 entry point) |
| Generating | `/generate/progress` | `design/generating.png` | 5-stage live progress (US1, FR-008–011a) |
| Result | `/result` | `design/result.png` | Structured specification + actions (US1 completion, US3 regenerate) |

**Reusable components** (shared across pages, `components/ui/`):
- `Button` (primary filled / secondary outline variants seen in nav CTA, hero, form actions)
- `Badge` (e.g. "AI Powered" pill, "Generated Successfully" status pill)
- `Card` (base surface used by feature cards, tip cards, progress card, result sections)
- `Navbar` / `Footer` (identical across all 4 pages)

**Page-specific components**:
- Landing: `Hero`, `FeatureCard` (×6 grid), `HowItWorksStep` (×4), `ContactCard`, `CtaBanner`
- Generator: `IdeaForm` (textarea + mic icon + Clear/Generate buttons), `WritingTipsCard`,
  `ExamplePromptsCard` (clickable prompt chips that prefill the textarea)
- Generating: `ProgressCard` (icon, title, subtitle), `StageListItem` (×5, check/spinner/
  empty-circle states matching FR-010), `ProgressBar`, cancel action (maps to a user-facing
  interrupt of FR-011/FR-011a)
- Result: `ResultHeader` (status badge + timestamp + title + edit affordance),
  `SpecificationSection` (collapsible, one per required section from FR-013),
  `ActionsPanel` (Download Markdown, Copy to Clipboard, Generate Again — Share Specification
  intentionally omitted per the resolved design/spec conflict)

**Layout structure**: Fixed top `Navbar` (logo left, nav links + primary CTA right) on
every page; single-column centered content (`max-w` container) on Generator/Generating;
two-column content + sidebar (`Actions` panel) on Result; full-width sectioned layout on
Landing. Consistent `Footer` on Landing only (matches design; other pages are task-focused
and omit it).

**Design system considerations**:
- Color: indigo/violet primary (`#4F46E5`-family) for CTAs, links, active states; near-white
  and light-lavender backgrounds; slate grays for body text — implement as Tailwind theme
  tokens, not ad hoc hex values, so every component pulls from the same palette.
- Typography: bold, large sans-serif headings; regular-weight body copy; consistent scale
  reused across landing hero, section headings, and result title.
- Spacing/shape: consistently rounded corners (`rounded-xl`/`rounded-2xl`) and soft shadows
  on cards; generous section padding on the landing page, denser padding on task screens.
  Encode as shared Tailwind utility groupings on the `Card`/`Button` primitives so spacing
  stays consistent without per-page overrides.
- Icons: small line icons throughout (feature cards, writing tips, stage list, actions) —
  use a single icon library (e.g. `lucide-react`) rather than mixing icon sets.
- Interaction states: stage list shows three visual states (done/active/pending) that must
  be implemented as explicit component states, not just color changes, to satisfy the
  accessibility requirement (FR-018/FR-019) via `aria-current`/`aria-live` rather than color
  alone.

## Complexity Tracking

*No entries — no Constitution Check violations were identified.*
