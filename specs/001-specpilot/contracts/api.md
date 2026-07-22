# API Contract: SpecPilot Backend

Base path: `/api`. All request/response bodies are JSON except the SSE stream. Types
reference `data-model.md`.

## POST /api/specifications

Starts a new generation session for one project idea (US1: submit an idea).

**Request body**:

```json
{ "idea": "string, 20-2000 chars" }
```

**Validation** (FR-005/FR-006):
- `idea` missing, empty, or under 20 characters → `422 Unprocessable Entity`:
  ```json
  { "error": "idea_too_short", "message": "Tell us a bit more about your idea (at least 20 characters)." }
  ```
- `idea` over 2,000 characters → `422 Unprocessable Entity`:
  ```json
  { "error": "idea_too_long", "message": "Please shorten your description to 2000 characters or fewer." }
  ```

**Success response**: `202 Accepted`

```json
{ "sessionId": "string" }
```

The client immediately opens the SSE stream below using `sessionId`. This endpoint does
not itself return the specification — generation runs asynchronously and progress/result
are delivered exclusively via the stream (keeps the AI-transparency requirement (FR-008)
and the 90s timeout (FR-011a) driven by one single stream lifecycle rather than duplicated
across a polling endpoint).

## GET /api/specifications/:sessionId/stream

Server-Sent Events stream of stage progress and the terminal outcome for one session
(FR-008–FR-011a; research.md #2).

**Event types** (`event:` field) and payloads (`data:`, JSON):

- `stage-started`
  ```json
  { "stage": "understanding-idea" }
  ```
  One event per stage, in fixed order: `understanding-idea`, `generating-requirements`,
  `creating-user-stories`, `preparing-milestones`, `formatting-document` (FR-009).

- `stage-completed`
  ```json
  { "stage": "understanding-idea" }
  ```
  Emitted when a stage finishes successfully, before the next `stage-started`.

- `generation-succeeded` (terminal — connection closes after this event)
  ```json
  { "specification": { "...": "see data-model.md Specification" } }
  ```

- `generation-failed` (terminal — connection closes after this event)
  ```json
  { "reason": "upstream-error" }
  ```
  or
  ```json
  { "reason": "timeout" }
  ```
  `timeout` is emitted by the server itself if 90s elapse without a terminal event
  (research.md #3); `upstream-error` covers any AI-call failure at any stage.

**Client contract**: the frontend MUST treat any stream disconnect without a terminal
event (`generation-succeeded`/`generation-failed`) the same as `generation-failed` with
reason `upstream-error`, so a dropped connection never leaves the user stuck on the
Generating page indefinitely (FR-011).

## Retry semantics (FR-011)

There is no dedicated "retry" endpoint. Retrying means the frontend re-issues
`POST /api/specifications` with the same, still-held `idea` text (never re-typed by the
user) and opens a new stream for the new `sessionId`. This keeps the backend contract
stateless across retries — no session resumption logic is needed.

## Out of scope for this contract

- No `GET /api/specifications/:id` (fetch past result) — no persistence (FR-017).
- No `POST /api/specifications/:id/share` — Share Specification was explicitly omitted
  (spec Clarifications, 2026-07-22). Download/Copy (FR-020/FR-021) are pure client-side
  operations on data the frontend already has and require no backend endpoint.
