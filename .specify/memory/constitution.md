<!--
Sync Impact Report
==================
Version change: [TEMPLATE] → 1.0.0
Rationale: Initial ratification. Constitution was previously an unfilled template with
no concrete principles; this is the first substantive version, so MAJOR (1.0.0) applies.

Modified principles: N/A (initial adoption, no prior named principles)

Principles established:
  I.   Design Fidelity
  II.  Simplicity First
  III. Clear Separation of Concerns
  IV.  Specification Quality
  V.   Incremental Delivery
  VI.  Type Safety and Code Quality
  VII. AI Transparency

Added sections:
  - Technology & Architecture Constraints
  - Development Workflow & Quality Gates
  - Governance

Removed sections: None (template placeholders only)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — generic "Constitution Check" gate, no
     principle-specific references to update; compatible as-is.
  ✅ .specify/templates/spec-template.md — no constitution-specific references found.
  ✅ .specify/templates/tasks-template.md — no constitution-specific references found.
  ✅ .specify/templates/checklist-template.md — no constitution-specific references found.
  ⚠ No speckit.* / speckit-* command or skill files under .claude/skills were found to
     reference outdated agent-specific principle names; none required updates.

Follow-up TODOs: None. All placeholders resolved.
-->

# SpecPilot Constitution

## Core Principles

### I. Design Fidelity
The implementation MUST closely follow the provided Figma designs. Components, layouts,
spacing, typography, and user interactions MUST match the approved design before any
improvements, embellishments, or deviations are introduced. Discrepancies between a
design file and its implementation MUST be resolved by updating the implementation to
match the design, or by explicitly raising the deviation for design approval first —
never by silently diverging.
**Rationale**: SpecPilot's UI credibility depends on delivering what was designed and
approved; unreviewed visual or interaction drift undermines trust in the deliverable and
creates rework.

### II. Simplicity First
Always prefer the smallest solution that satisfies the current specification. Avoid
unnecessary abstractions, speculative extensibility, and features not required for the
MVP. Do not build for hypothetical future requirements; three similar lines of code are
better than a premature abstraction.
**Rationale**: As a student-built project with limited time and team size, complexity
budget must be spent only where the spec demands it — over-engineering slows learning
and delivery alike.

### III. Clear Separation of Concerns
User interface components, AI generation logic, data handling, and business rules MUST
be kept in clearly separated layers/modules. UI code MUST NOT embed AI prompt/generation
logic or persistence logic directly; business rules MUST NOT depend on UI framework
details.
**Rationale**: A clean boundary between these concerns keeps the AI generation pipeline
testable and swappable (e.g. changing models or prompts) without destabilizing the UI or
data layer, and keeps the codebase approachable for a student team.

### IV. Specification Quality
Every specification SpecPilot generates MUST be structured, understandable, and directly
usable for software development. At minimum, generated output MUST include: clear
functional requirements, user stories, milestones, and relevant technical details. Vague,
unstructured, or incomplete output is treated as a defect, not an acceptable variance.
**Rationale**: The generated specification is SpecPilot's core product; quality here is
the entire value proposition, not a secondary concern.

### V. Incremental Delivery
The application MUST remain functional after every implementation phase. Each feature
MUST be completed and verified working before starting the next. Partial, half-finished
features MUST NOT be merged or left in a state that breaks existing functionality.
**Rationale**: Incremental, always-working delivery lets the team demo progress at any
point and catches integration issues early rather than in a single risky final push.

### VI. Type Safety and Code Quality
Code MUST use consistent coding standards and strong typing wherever the language/tooling
supports it (e.g. TypeScript types over `any`, typed API contracts, typed data models).
Code MUST remain readable: clear naming, no dead code, no unexplained magic values.
**Rationale**: Strong typing and consistent style catch integration bugs before runtime
and make the codebase maintainable by multiple student contributors over time.

### VII. AI Transparency
The AI generation process MUST clearly communicate progress and stage to the user in
real time — what is currently being analyzed, what stage of generation is active, and
what is being produced. Silent, opaque, long-running AI calls with no user-facing status
are not acceptable.
**Rationale**: Specification generation can take noticeable time; users must trust and
understand what the AI agents are doing rather than facing an unexplained wait.

## Technology & Architecture Constraints

The codebase MUST maintain the layering implied by Principle III: a UI layer, an AI
generation/orchestration layer, and a data/business-rules layer, with dependencies
flowing from UI → orchestration → data, not the reverse. Any new third-party dependency
or architectural pattern MUST be justified against Principle II (Simplicity First) before
adoption — prefer the standard library or an existing project dependency over adding a
new one.

## Development Workflow & Quality Gates

Each feature branch/phase MUST be verified functional (Principle V) before the next phase
begins; this includes confirming the UI still matches the approved Figma design
(Principle I) and that any AI-generation output still meets the specification-quality bar
(Principle IV). Code review MUST check for type safety and adherence to coding standards
(Principle VI) and MUST confirm any AI-facing UI still surfaces progress/status
(Principle VII) before merge.

## Governance

This constitution supersedes all other informal practices for SpecPilot development. Any
amendment MUST: (1) be documented in this file with an updated Sync Impact Report, (2) be
approved by the project's maintainer(s) before merge, and (3) include a migration note if
existing code or specs no longer comply. Versioning follows semantic versioning:
- **MAJOR**: Backward-incompatible governance changes or removal/redefinition of a
  principle.
- **MINOR**: A new principle or materially expanded section is added.
- **PATCH**: Clarifications, wording fixes, or non-semantic refinements.

All pull requests and reviews MUST verify compliance with this constitution. Any
complexity or deviation from a principle MUST be explicitly justified in the PR
description; unjustified deviations MUST be rejected. Use this constitution as the
runtime source of truth for development guidance during planning, task generation, and
implementation.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
