# Phase 1 Data Model: SpecPilot

These are in-memory/transient shapes only — there is no database (FR-017: no persistence).
Types are defined once conceptually here and mirrored literally into
`backend/src/models/specification.types.ts` and `frontend/src/types/specification.types.ts`
(kept in sync manually per Principle II — no shared package needed for a two-project MVP).

## ProjectIdea

The free-text description of a software idea submitted by the user (spec: Key Entities).

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | The idea description. Validated length: 20–2,000 characters (research.md #4). |

No identity/uniqueness — a `ProjectIdea` only exists for the lifetime of one generation
request; it is not stored or referenced afterward (FR-017).

## GenerationStage

Enum of the five fixed stages, in fixed order (FR-009, research.md — stage set/order is
not customized per idea).

```
type GenerationStage =
  | "understanding-idea"
  | "generating-requirements"
  | "creating-user-stories"
  | "preparing-milestones"
  | "formatting-document"
```

## GenerationSession

Tracks one in-progress (or just-finished) attempt to turn a `ProjectIdea` into a
`Specification` (spec: Key Entities).

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Session identifier, generated per request; used only to correlate the SSE stream to its POST request — not a persistent/reusable ID. |
| `idea` | `ProjectIdea` | The input being processed. |
| `status` | `"running" \| "succeeded" \| "failed" \| "cancelled"` | Overall session status. `"cancelled"` is set when the user clicks Cancel Generation (FR-011b) — distinct from `"failed"`, which is a system-detected error/timeout (FR-011/FR-011a). |
| `activeStage` | `GenerationStage \| null` | Which of the 5 stages is currently running; `null` once `status` is `"succeeded"`, `"failed"`, or `"cancelled"`. |
| `completedStages` | `GenerationStage[]` | Stages finished so far, in order — drives the done/active/pending UI state per stage (FR-010). |
| `failureReason` | `"upstream-error" \| "timeout" \| null` | Set only when `status === "failed"`; `"timeout"` corresponds to FR-011a (research.md #3, 90s), `"upstream-error"` to a generic AI-call failure (FR-011). |

**Lifecycle**: `running` (activeStage = stage 1) → ... → `running` (activeStage = stage 5)
→ `succeeded` (with a `Specification` produced) **or** `failed` (with a `failureReason`) at
any point along the way. `running` can also transition directly to `cancelled` at any point
if the user clicks Cancel Generation (FR-011b) — no `failureReason` is set for this path,
and no SSE event is emitted for it (the client already knows it cancelled; see
contracts/api.md). Once terminal (`succeeded`/`failed`/`cancelled`), the session is
discarded — nothing persists past that (FR-017).

## Specification

The structured output document for one `ProjectIdea` (spec: Key Entities, FR-013).

| Field | Type | Notes |
|---|---|---|
| `projectSummary` | `string` | Section 1. |
| `targetUsers` | `string` | Section 2. |
| `userRoles` | `string[]` | Section 3 — list of distinct roles identified from the idea. |
| `functionalRequirements` | `string[]` | Section 4 — each entry one discrete, testable requirement (mirrors the spec's own FR-xxx style). |
| `nonFunctionalRequirements` | `string[]` | Section 5. |
| `userStories` | `UserStory[]` | Section 6. |
| `milestones` | `Milestone[]` | Section 7. |
| `technicalConsiderations` | `string[]` | Section 8. |

All eight fields are required on every successful generation (FR-013/FR-014) — an agent
stage that cannot produce a non-empty value for its section(s) is treated as a stage
failure (`failureReason: "upstream-error"`), not a partially-empty success.

### UserStory (nested)

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Short title. |
| `narrative` | `string` | "As a ⟨role⟩, I want ⟨goal⟩, so that ⟨benefit⟩" style text. |
| `role` | `string` | Must reference one of `Specification.userRoles` for consistency. |

### Milestone (nested)

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Milestone name. |
| `description` | `string` | What's delivered at this milestone. |
| `order` | `number` | Sequence position — milestones are always rendered in this order. |

## Relationships

```
ProjectIdea (1) ──▶ (1) GenerationSession ──▶ (0..1) Specification
                                            └▶ (0..1) failureReason
Specification (1) ──▶ (0..*) UserStory
Specification (1) ──▶ (0..*) Milestone
```

One `GenerationSession` always corresponds to exactly one `ProjectIdea` and produces at
most one `Specification` (on success) — there is no history/list of past sessions or
specifications per user (out of scope, FR-016).
