---

description: "Task list for feature implementation"
---

# Tasks: SpecPilot – AI-Powered Software Specification Generator

**Input**: Design documents from `/specs/001-specpilot/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md (all present)

**Tests**: Not explicitly requested in the feature specification, so no test-first (TDD)
subsections are included per story. Lightweight contract/component tests are included in
the Polish phase instead, matching the Testing stack chosen in plan.md.

**Organization**: Tasks are grouped by user story (from spec.md, in priority order) to
enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Web application (per plan.md): `backend/src/`, `backend/tests/`, `frontend/src/`,
`frontend/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic tooling for both projects

- [X] T001 Create the `backend/` and `frontend/` directory skeletons per plan.md's Project Structure
- [X] T002 Initialize backend TypeScript project with `strict: true` in `backend/tsconfig.json`: `backend/package.json`, Express + `dotenv` dependencies
- [X] T003 [P] Initialize frontend Vite + React + TypeScript project with `strict: true` in `frontend/tsconfig.json` and Tailwind CSS in `frontend/` (`frontend/package.json`, `frontend/tailwind.config.ts`)
- [X] T004 [P] Configure ESLint + Prettier for `backend/` and `frontend/` (shared style rules, TypeScript strict mode per constitution Principle VI)
- [X] T005 [P] Configure Vitest in `backend/vitest.config.ts` (+ Supertest dependency) and `frontend/vitest.config.ts` (+ React Testing Library dependency), per research.md #7
- [X] T006 Create `backend/.env.example` and `frontend/.env.example` documenting all variables from quickstart.md (`FETCH_AI_API_KEY`, `FETCH_AI_ENDPOINT_URL`, `PORT`, `GENERATION_TIMEOUT_MS`, `IDEA_MIN_LENGTH`, `IDEA_MAX_LENGTH`, `VITE_API_BASE_URL`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define shared types (`ProjectIdea`, `GenerationStage`, `GenerationSession` — with `status: "running" | "succeeded" | "failed" | "cancelled"` — `Specification`, `UserStory`, `Milestone`) in `backend/src/models/specification.types.ts` per data-model.md
- [X] T008 [P] Mirror the same types (including the 4-value `status` union) in `frontend/src/types/specification.types.ts` per data-model.md
- [X] T009 Implement the Fetch.ai hosted-endpoint HTTP client in `backend/src/services/fetchAiClient.ts`, reading `FETCH_AI_API_KEY`/`FETCH_AI_ENDPOINT_URL` from env (research.md #1) — no secrets hardcoded
- [X] T010 Implement the Express app + server bootstrap (reads `PORT` from env, JSON body parsing, centralized error-handling middleware that MUST NOT log request/response bodies — idea text and specification content are never written to any log per FR-017) in `backend/src/server.ts`
- [X] T011 Implement the React Router route table for the 4 pages (`/`, `/generate`, `/generate/progress`, `/result`) in `frontend/src/App.tsx` per plan.md's UI Architecture
- [X] T012 Implement `SpecificationContext` (reducer states `idle → submitting → generating → success | error`, holding idea text, active stage, result/error) in `frontend/src/state/SpecificationContext.tsx` per research.md #5
- [X] T013 [P] Build shared UI primitives — `Button` (primary/secondary), `Badge`, `Card` — with visible keyboard focus states in `frontend/src/components/ui/`
- [X] T014 [P] Build shared `Navbar` and `Footer` components (logo, nav links, primary CTA) in `frontend/src/components/layout/`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Generate a specification from a project idea (Priority: P1) 🎯 MVP

**Goal**: A user submits an idea, watches the 5-stage generation progress, and receives a
complete 8-section structured specification.

**Independent Test**: Enter a project idea, submit it, watch generation complete, and
confirm a structured specification document (all required sections) is displayed.

### Implementation for User Story 1

- [X] T015 [US1] Implement stage 1 in `backend/src/agents/ideaAnalysis.agent.ts` — calls `fetchAiClient` to extract project summary, target users, user roles from the idea text (data-model.md)
- [X] T016 [P] [US1] Implement stage 2 in `backend/src/agents/requirements.agent.ts` — generates functional + non-functional requirements
- [X] T017 [P] [US1] Implement stage 3 in `backend/src/agents/userStories.agent.ts` — generates `UserStory[]` referencing the roles from stage 1
- [X] T018 [P] [US1] Implement stage 4 in `backend/src/agents/milestones.agent.ts` — generates ordered `Milestone[]`
- [X] T019 [US1] Implement stage 5 in `backend/src/agents/formatting.agent.ts` — assembles all prior stage outputs into one complete `Specification` (fails the session if any of the 8 sections would be empty, per data-model.md)
- [X] T020 [US1] Implement `specificationOrchestrator` in `backend/src/services/specificationOrchestrator.ts` — runs the 5 agents (T015–T019) in fixed order, emits `stage-started`/`stage-completed` events, enforces `GENERATION_TIMEOUT_MS` and emits `generation-failed` with `reason: "timeout"` or `"upstream-error"` on failure, and supports cancellation via an `AbortController` that sets `session.status = "cancelled"`, stops calling further agent stages, and discards any partial result (no `failureReason` set, no SSE event emitted — FR-011b; research.md #3, depends on T015-T019)
- [X] T021 [US1] Implement `POST /api/specifications` in `backend/src/api/specifications.route.ts` with idea length validation (`IDEA_MIN_LENGTH`/`IDEA_MAX_LENGTH`) returning `422` with the exact error shapes from contracts/api.md, or `202 { sessionId }`; reject a second concurrent `POST` for a session that is still `running` with a `409 Conflict` so the frontend cannot accidentally start overlapping generations for one browser tab (FR-007, depends on T007)
- [X] T022 [US1] Implement `GET /api/specifications/:sessionId/stream` SSE route in `backend/src/api/specifications.route.ts` streaming events from `specificationOrchestrator` per contracts/api.md; on client disconnect (including an explicit cancel), call the orchestrator's `AbortController` for that session (FR-011b, depends on T020, T021)
- [X] T023 [P] [US1] Build `IdeaForm` (textarea, mic icon with an `aria-label` per FR-019, Clear/Generate buttons, client-side min/max validation matching T021, and disabling the form — not just navigating away — while a submission is in flight) in `frontend/src/components/generator/IdeaForm.tsx`
- [X] T024 [P] [US1] Build `WritingTipsCard` and `ExamplePromptsCard` (clickable prompts that prefill the textarea) in `frontend/src/components/generator/`
- [X] T025 [US1] Assemble `GeneratorPage` composing `IdeaForm` + `WritingTipsCard` + `ExamplePromptsCard`, wired to `SpecificationContext`, in `frontend/src/pages/GeneratorPage.tsx` (depends on T012, T023, T024)
- [X] T026 [US1] Implement `specificationApi` service (POST call + `EventSource` subscription, treating any stream disconnect without a terminal event as `generation-failed`) in `frontend/src/services/specificationApi.ts` (depends on T021, T022)
- [X] T027 [US1] Build `GeneratingPage` with `ProgressCard`, `StageListItem` (×5, using `aria-current="step"` for the active stage and an `aria-live="polite"` region per FR-018/FR-019), `ProgressBar`, and a "Cancel Generation" action that closes the SSE connection, resets `SpecificationContext` to `idle` (keeping the original idea text), and navigates back to `/generate` with no result saved (FR-011b — distinct from the FR-011/FR-011a system-detected failure path), in `frontend/src/pages/GeneratingPage.tsx` + `frontend/src/components/generating/` (depends on T012, T026)
- [X] T028 [US1] Build `ResultPage` with `ResultHeader` (including the title-adjacent edit icon rendered as decorative/non-interactive — no editing behavior in this version) and 8 `SpecificationSection` components (one per data-model.md field), in `frontend/src/pages/ResultPage.tsx` + `frontend/src/components/result/SpecificationSection.tsx` (depends on T012)
- [X] T029 [US1] Wire Generator → Generating → Result navigation through `SpecificationContext`, including the FR-011/FR-011a failure/retry state (original idea text preserved, no re-typing needed) (depends on T025, T027, T028)

**Checkpoint**: User Story 1 is fully functional and independently testable end to end.

---

## Phase 4: User Story 2 - Understand SpecPilot before starting (Priority: P2)

**Goal**: A first-time visitor understands SpecPilot's purpose and capabilities from the
landing page and finds one clear way to start.

**Independent Test**: Load the landing page in isolation; confirm it explains SpecPilot's
purpose, highlights capabilities, and presents a clear call to action — no generation
required.

### Implementation for User Story 2

- [X] T030 [P] [US2] Build `Hero` component (headline, subtext, primary "Generate Specification" + secondary "Learn More" buttons) in `frontend/src/components/landing/Hero.tsx`
- [X] T031 [P] [US2] Build `FeatureCard` and the 6-card capability grid in `frontend/src/components/landing/FeatureCard.tsx`
- [X] T032 [P] [US2] Build `HowItWorksStep` and the 4-step sequence in `frontend/src/components/landing/HowItWorksStep.tsx`
- [X] T033 [P] [US2] Build `ContactCard` and `CtaBanner` in `frontend/src/components/landing/`
- [X] T034 [US2] Assemble `LandingPage` composing `Hero` + `FeatureCard` grid + `HowItWorksStep` sequence + `ContactCard` + `CtaBanner`, with the primary CTA routing to `/generate`, in `frontend/src/pages/LandingPage.tsx` (depends on T030–T033)

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Review a result and generate another specification (Priority: P3)

**Goal**: From a completed result, a user can download/copy it and start a fresh
generation with a clean slate.

**Independent Test**: Complete one generation, use Download/Copy, then trigger "Generate
Again" and confirm the user returns to idea-entry with no trace of the previous result.

### Implementation for User Story 3

- [X] T035 [P] [US3] Implement client-side "Download Markdown" action, with an `aria-label` on its icon button per FR-019 (Blob + object-URL anchor click, no network request) in `frontend/src/components/result/ActionsPanel.tsx` per research.md #6 (FR-020)
- [X] T036 [P] [US3] Implement client-side "Copy to Clipboard" action, with an `aria-label` on its icon button per FR-019 (`navigator.clipboard.writeText`) in `frontend/src/components/result/ActionsPanel.tsx` (FR-021)
- [X] T037 [US3] Implement "Generate Again" action resetting `SpecificationContext` to `idle` and routing to `/generate`, in `frontend/src/components/result/ActionsPanel.tsx` (depends on T012, T028)
- [X] T038 [US3] Assemble `ActionsPanel` (Generate Again, Download Markdown, Copy to Clipboard — no Share button, per the resolved design/spec conflict) into `ResultPage`, and verify a new generation fully replaces the prior result with no leftover content (FR-016) (depends on T035, T036, T037)

**Checkpoint**: All 3 user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T039 [P] Write backend contract tests for `POST /api/specifications` and the SSE stream event shapes in `backend/tests/contract/specifications.contract.test.ts` per contracts/api.md
- [ ] T040 [P] Write frontend component tests for `IdeaForm` validation and `ResultPage` section rendering in `frontend/tests/`
- [ ] T041 [P] Add a root `README.md` summarizing setup, pointing to quickstart.md for environment variables and run/validation steps
- [ ] T042 Manually verify the `GENERATION_TIMEOUT_MS` timeout path (research.md #3) surfaces the FR-011 failure/retry state as described in quickstart.md's "Failure/timeout path"
- [ ] T043 Run all quickstart.md validation scenarios end-to-end (US1, US2, US3, failure path, and the new Cancel Generation path) and record results — as part of this, manually submit 2-3 varied idea descriptions and confirm each generated section is genuinely idea-specific, not generic/templated text (FR-014), since this isn't practically unit-testable
- [ ] T044 [P] Add a backend test asserting no request/response body content (idea text or specification content) appears in log output, in `backend/tests/unit/logging.test.ts` (FR-017)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of US1 (shares only `Navbar`/`Footer` from Phase 2)
- **User Story 3 (Phase 5)**: Depends on Foundational (T012) and on US1's `ResultPage` existing (T028) — it extends the same page, so treat as sequenced after US1 in practice even though it targets a different requirement set
- **Polish (Phase 6)**: Depends on the user stories it tests (T039 depends on Phase 3's API tasks; T040 on Phases 3–5; T043 on all of Phases 3–5; T044 depends on T007 and T010)

### Parallel Opportunities

- T003, T004, T005 (Setup) can run in parallel with T002 once directories exist
- T008, T013, T014 (Foundational) can run in parallel with T007/T009/T010/T011 where files don't overlap
- Within US1: T016, T017, T018 can run in parallel (separate agent files); T023, T024 can run in parallel (separate component files)
- US2's entire phase (T030–T033) can run in parallel with US1, once Phase 2 is done, since it only touches `frontend/src/components/landing/` and `frontend/src/pages/LandingPage.tsx`
- Within US3: T035, T036 can run in parallel (independent action handlers) before T037/T038 combine them
- T039, T040, T041, T044 (Polish) can all run in parallel — each touches a different test/doc file

---

## Parallel Example: User Story 1

```bash
# Launch the 3 independent agent-stage tasks together:
Task: "Implement stage 2 in backend/src/agents/requirements.agent.ts"
Task: "Implement stage 3 in backend/src/agents/userStories.agent.ts"
Task: "Implement stage 4 in backend/src/agents/milestones.agent.ts"

# Launch the 2 independent Generator-page components together:
Task: "Build IdeaForm in frontend/src/components/generator/IdeaForm.tsx"
Task: "Build WritingTipsCard and ExamplePromptsCard in frontend/src/components/generator/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything else)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md's US1 scenario independently
5. Demo if ready — this alone is a working idea → specification generator

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → demo (MVP!)
3. Add User Story 2 (can be built in parallel with US1 by a second contributor) → validate → demo
4. Add User Story 3 → validate → demo
5. Polish phase → final quality pass

---

## Notes

- [P] tasks touch different files with no unmet dependencies
- Each user story is independently completable and testable per its Independent Test above
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Total: 44 tasks across Setup, Foundational, 3 user stories, and Polish
