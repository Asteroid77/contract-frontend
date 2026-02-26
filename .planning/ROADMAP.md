# Roadmap: Unified Project Initialization Workflow

## Overview

This roadmap delivers a complete initialization journey from idea intake to an auditable, phase-based execution plan. It follows the natural workflow boundaries (intake, research, requirements, roadmap) while embedding governance and git-backed traceability so outputs are reliable and ready for downstream phase planning.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Workflow Intake and Guardrails** - Capture project intent and workflow settings with required validation gates.
- [ ] **Phase 2: Research Evidence Pipeline** - Produce structured research artifacts and synthesized findings via specialist agents.
- [ ] **Phase 3: Requirements Contract** - Convert context and research into scoped, categorized, testable requirements.
- [ ] **Phase 4: Roadmap and Auditable Handoff** - Generate phase roadmap, state memory, and git-traceable planning handoff artifacts.

## Phase Details

### Phase 1: Workflow Intake and Guardrails

**Goal**: Users can start initialization with structured inputs, set workflow preferences, and proceed through enforced stage gates.
**Depends on**: Nothing (first phase)
**Requirements**: INTK-01, INTK-02, INTK-03, GOVR-01
**Success Criteria** (what must be TRUE):

1. User can start initialization with either inline idea text or an `@file` reference.
2. User can configure depth, execution mode, git tracking, and workflow-agent preferences through structured prompts.
3. User can persist project context and scope decisions to `.planning/PROJECT.md`.
4. Workflow enforces required stage validations and approvals before advancing.

**Plans**: TBD

### Phase 2: Research Evidence Pipeline

**Goal**: Users can run domain research and receive structured, confidence-labeled outputs that reduce planning blind spots.
**Depends on**: Phase 1
**Requirements**: RSCH-01, RSCH-02, RSCH-03, INTG-01
**Success Criteria** (what must be TRUE):

1. User can run research before requirements generation.
2. User receives structured research artifacts for stack, features, architecture, and pitfalls under `.planning/research/`.
3. User receives a synthesized research summary with key findings and confidence notes.
4. Specialist agents can be run for research-stage artifact production.

**Plans**: TBD

### Phase 3: Requirements Contract

**Goal**: Users can obtain a complete and scoped v1 requirements contract derived from project context and research.
**Depends on**: Phase 2
**Requirements**: REQS-01, REQS-02, REQS-03
**Success Criteria** (what must be TRUE):

1. User receives a complete v1 requirements list derived from project context and research findings.
2. User sees requirements grouped by category with testable IDs in `[CATEGORY]-[NUMBER]` format.
3. User can clearly distinguish v1, v2, and out-of-scope capability boundaries in `.planning/REQUIREMENTS.md`.

**Plans**: TBD

### Phase 4: Roadmap and Auditable Handoff

**Goal**: Users can produce a fully traceable roadmap package with phase success criteria, state memory, and git-backed auditability.
**Depends on**: Phase 3
**Requirements**: RMAP-01, RMAP-02, RMAP-03, GOVR-02, GOVR-03, INTG-02
**Success Criteria** (what must be TRUE):

1. User receives a phased roadmap where every v1 requirement maps to exactly one phase.
2. User can see 2-5 observable success criteria for each phase.
3. User can persist `.planning/ROADMAP.md`, `.planning/STATE.md`, and updated requirement traceability after roadmap creation.
4. User can rely on atomic commits for major planning stages.
5. User can audit planning decisions and traceability through git-backed artifacts.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase                             | Plans Complete | Status      | Completed |
| --------------------------------- | -------------- | ----------- | --------- |
| 1. Workflow Intake and Guardrails | 0/TBD          | Not started | -         |
| 2. Research Evidence Pipeline     | 0/TBD          | Not started | -         |
| 3. Requirements Contract          | 0/TBD          | Not started | -         |
| 4. Roadmap and Auditable Handoff  | 0/TBD          | Not started | -         |
