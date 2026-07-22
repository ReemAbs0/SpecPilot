# Phase 0 Research: SpecPilot

## 1. Fetch.ai integration approach

**Decision**: The Node.js backend calls a Fetch.ai hosted inference endpoint (ASI:One /
Agentverse-hosted agent) directly over HTTP from each of the five agent-stage modules in
`backend/src/agents/`. There is no separately-run Python `uAgents` process.

**Rationale**: Fetch.ai's native agent framework (`uAgents`) is a Python library, but the
brief specifies a Node.js backend. Standing up a second Python microservice purely to host
`uAgents` and having the Node backend talk to it over an internal protocol would add a
whole extra runtime, deployment surface, and inter-process contract for a student MVP —
directly against constitution Principle II (Simplicity First). Calling Fetch.ai's hosted
HTTP inference endpoint from plain TypeScript keeps everything in one runtime while still
using Fetch.ai for the actual generation, and keeps the five responsibilities (understand
idea, requirements, user stories, milestones, formatting) cleanly separated as five
backend modules per Principle III — "agents" here means five distinct, independently
testable prompt/response modules, not five separately deployed processes.

**Alternatives considered**:
- Run a local Python `uAgents` Bureau as a sidecar process, with the Node backend
  communicating over a local HTTP/message bridge. Rejected: doubles the runtime/deployment
  footprint for no functional benefit at this scale.
- Implement the five stages as one giant single-prompt call. Rejected: breaks Principle III
  (separation of concerns) and makes independent stage progress (FR-009/FR-010) impossible
  to report accurately — the frontend needs to know when each discrete stage finishes.

## 2. Progress-streaming mechanism (frontend ⇄ backend)

**Decision**: Server-Sent Events (SSE). The backend exposes
`GET /api/specifications/:id/stream`, which emits one event per completed/active stage
(`stage-started`, `stage-completed`, `generation-succeeded`, `generation-failed`), and the
frontend consumes it with the browser's native `EventSource` API.

**Rationale**: The requirement is one-directional server → client progress push across
five known, ordered stages (FR-008–FR-010) with a bounded lifetime (FR-011a). SSE is
supported natively by Express (plain HTTP response, no extra dependency) and by every
target browser (native `EventSource`, no client library needed) — simpler than WebSockets,
which would add bidirectional-connection complexity this feature doesn't need (Principle
II).

**Alternatives considered**:
- WebSockets (e.g. `ws`/`socket.io`): rejected — no bidirectional messaging is needed, and
  it's an extra dependency plus reconnect/handshake logic for no added value here.
- Client polling a `GET /api/specifications/:id` status endpoint every N seconds: rejected —
  works, but adds polling-interval tuning and unnecessary request volume; SSE gives
  immediate, event-driven updates for the same one-directional need.

## 3. Maximum generation wait time (FR-011a)

**Decision**: 90 seconds, measured from request start to either a `generation-succeeded`
or `generation-failed` event. If neither arrives within 90s, the backend emits
`generation-failed` with a timeout reason and the frontend shows the standard FR-011
failure/retry state.

**Rationale**: Five sequential AI calls at typical hosted-LLM latency (a few seconds to
~15s each in the worst case) comfortably fit inside 90s while still failing fast enough
that a user isn't staring at a spinner for minutes. Documented in spec Assumptions as an
implementation detail, not a product requirement, so this value can be tuned later without
a spec change.

**Alternatives considered**: 30s (too tight — risks false-positive timeouts under normal
hosted-LLM latency variance across 5 sequential calls); 5 minutes (too generous — user
research and SC-focused products generally expect sub-2-minute feedback for a "few
seconds" framed interaction per the landing page copy itself, "seconds").

## 4. Idea description length bounds (FR-005/FR-006)

**Decision**: Minimum 20 characters, maximum 2,000 characters, validated identically on
both the frontend form and the backend request handler.

**Rationale**: 20 characters is enough to rule out trivially empty/placeholder input (e.g.
"app", "idea") while not being so strict it rejects a genuinely short-but-valid one-liner.
2,000 characters (roughly 300–400 words) comfortably covers the example prompts shown in
the Generator design (a few sentences) while capping worst-case prompt size sent to the AI
stages, keeping generation time and cost predictable per the spec Assumptions.

**Alternatives considered**: No maximum — rejected, spec Edge Cases explicitly requires a
maximum with user-facing feedback (FR-006). A much larger max (e.g. 10,000 chars) —
rejected as unnecessary for an idea-description field per the Generator design's own
framing ("Describe your idea..."), and increases AI cost/latency risk.

## 5. Frontend state management

**Decision**: React Context + `useReducer`, scoped to a single `SpecificationContext`
covering the states `idle → submitting → generating → success | error`, with the current
idea text, active stage, and result (or error) held in that reducer's state.

**Rationale**: The spec explicitly calls for "simple client-side state management suitable
for an MVP" with no accounts/persistence. A single reducer covering one linear flow across
4 pages is simplest possible solution (Principle II) — no external state library (Redux,
Zustand, React Query) is justified for one request/response flow with no caching or
server-state synchronization needs beyond the SSE stream itself.

**Alternatives considered**: Redux Toolkit — rejected, unjustified boilerplate for one
linear flow. Prop-drilling without Context — rejected, the same session state (idea text,
stage, result) is needed across 3 route-separated pages (Generator → Generating → Result),
so a shared context avoids re-fetching/re-deriving state on navigation.

## 6. Client-side Download / Copy actions (FR-020/FR-021)

**Decision**: "Download Markdown" builds a `Blob` from the already-rendered specification
(converted to Markdown text) and triggers a download via a temporary object URL + anchor
click — no backend endpoint. "Copy to Clipboard" uses the browser `navigator.clipboard
.writeText()` API on the same Markdown text.

**Rationale**: Both actions operate purely on data the frontend already has after a
successful generation; adding a backend round-trip (e.g. a "generate file" endpoint) would
violate Principle II and re-introduce a server-side artifact the spec explicitly excludes
(FR-017 ephemeral data). This is exactly the reconciliation approved by the user for the
design/spec conflict on the Result page.

**Alternatives considered**: Backend-rendered download endpoint (`GET
/api/specifications/:id/markdown`) — rejected, requires the backend to retain the result
past the request lifecycle, contradicting FR-017.

## 7. Testing stack

**Decision**: Vitest as the single test runner for both projects (fast, native ESM/Vite
integration for the frontend; works standalone for the backend too), with React Testing
Library for frontend component tests and Supertest for backend HTTP/contract tests.

**Rationale**: One runner across both projects reduces tooling surface (Principle II);
Vitest's Vite-native config avoids a second bundler/transform pipeline for tests.

**Alternatives considered**: Jest — rejected only because Vitest reuses the same Vite
config already needed for the frontend build, avoiding a second, subtly different
transform pipeline.

## 8. Accessibility approach (FR-018/FR-019)

**Decision**: Semantic HTML landmarks (`nav`, `main`, `footer`), visible focus states on
all interactive elements, `aria-label`s on icon-only controls (mic, edit, download, copy
icons), and an `aria-live="polite"` region on the Generating page's stage list so
screen-reader users hear stage changes without needing to poll focus manually. Stage state
(done/active/pending) is exposed via `aria-current="step"` on the active item, not color
alone.

**Rationale**: Directly satisfies FR-018 (keyboard navigation — achieved by using native
focusable elements and visible `:focus-visible` styles rather than custom non-focusable
widgets) and FR-019 (screen-reader labels) with standard web-platform features, no extra
accessibility library needed (Principle II).

**Alternatives considered**: A dedicated accessibility library (e.g. Reach UI) — rejected
as unnecessary; the interaction patterns here (buttons, links, a linear stage list) don't
need pre-built complex widgets like comboboxes or modals-with-focus-trapping.
