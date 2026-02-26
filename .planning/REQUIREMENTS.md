# Requirements: Unified Project Initialization Workflow

**Defined:** 2026-02-26
**Core Value:** A project can move from idea to a clear, phase-based execution plan in one reliable flow.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Intake

- [ ] **INTK-01**: User can start initialization by providing an idea as an `@file` reference or inline text
- [ ] **INTK-02**: User can set workflow preferences (depth, execution mode, git tracking, workflow agents) through structured prompts
- [ ] **INTK-03**: User can persist project context and scope decisions to `.planning/PROJECT.md`

### Research

- [ ] **RSCH-01**: User can run domain research before requirements to reduce planning blind spots
- [ ] **RSCH-02**: User receives structured research outputs for stack, features, architecture, and pitfalls in `.planning/research/`
- [ ] **RSCH-03**: User receives a synthesized research summary with key findings and confidence notes

### Requirements

- [ ] **REQS-01**: User can get a complete v1 requirements list derived from project context and research findings
- [ ] **REQS-02**: User receives requirements grouped by category with testable REQ-IDs in `[CATEGORY]-[NUMBER]` format
- [ ] **REQS-03**: User can see v1, v2, and out-of-scope capability boundaries in `.planning/REQUIREMENTS.md`

### Roadmap

- [ ] **RMAP-01**: User can get a phased roadmap where each v1 requirement maps to exactly one phase
- [ ] **RMAP-02**: User can see 2-5 observable success criteria for each roadmap phase
- [ ] **RMAP-03**: User can persist roadmap, state memory, and updated requirement traceability after roadmap creation

### Governance

- [ ] **GOVR-01**: User can rely on stage gates that enforce required validations and approvals by workflow mode
- [ ] **GOVR-02**: User can rely on atomic commits of planning artifacts after each major stage
- [ ] **GOVR-03**: User can audit planning decisions through committed artifacts and workflow traceability

### Integration

- [ ] **INTG-01**: User can run specialist agents (researchers, synthesizer, roadmapper) to produce stage artifacts
- [ ] **INTG-02**: User can keep planning synchronized with git-backed project history

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Differentiators

- **PARA-01**: User can run dependency-aware parallel sub-agent orchestration for faster planning on large scopes
- **CSTM-01**: User can apply team-specific agent profiles, hooks, and reusable skills to planning output
- **GRPH-01**: User can enrich planning context from a cross-system graph of repo, docs, tickets, and chat sources
- **AUTO-01**: User can use adaptive mode handoff between interactive planning and autonomous execution with cost guardrails
- **ANLY-01**: User can view quality and outcome analytics for continuous workflow improvement

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                                   | Reason                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| One-click full implementation from planning               | Blurs planning and delivery boundaries, reduces trust, and increases failure risk |
| Unrestricted always-on write access to repositories/tools | Violates safety and compliance expectations for shared environments               |
| Continuous real-time auto-replanning and file rewrites    | Creates unstable outputs and noisy diffs instead of controlled checkpoints        |
| Launching with broad connector surface area               | Increases complexity before core planning quality is proven                       |
| Opaque recommendations without rationale or evidence      | Prevents reviewability, debugging, and accountable decision making                |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| INTK-01     | Phase 1 | Pending |
| INTK-02     | Phase 1 | Pending |
| INTK-03     | Phase 1 | Pending |
| RSCH-01     | Phase 2 | Pending |
| RSCH-02     | Phase 2 | Pending |
| RSCH-03     | Phase 2 | Pending |
| REQS-01     | Phase 3 | Pending |
| REQS-02     | Phase 3 | Pending |
| REQS-03     | Phase 3 | Pending |
| RMAP-01     | Phase 4 | Pending |
| RMAP-02     | Phase 4 | Pending |
| RMAP-03     | Phase 4 | Pending |
| GOVR-01     | Phase 1 | Pending |
| GOVR-02     | Phase 4 | Pending |
| GOVR-03     | Phase 4 | Pending |
| INTG-01     | Phase 2 | Pending |
| INTG-02     | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---

_Requirements defined: 2026-02-26_
_Last updated: 2026-02-26 after roadmap creation_
