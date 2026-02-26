# Unified Project Initialization Workflow

## What This Is

This project defines an end-to-end initialization flow that turns an idea into an executable delivery plan. It guides setup through questioning, optional domain research, scoped requirements, and a phased roadmap. It is for builders who want a repeatable way to move from concept to implementation-ready plans.

## Core Value

A project can move from idea to a clear, phase-based execution plan in one reliable flow.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Initialize projects through one unified flow: context capture, research, requirements, and roadmap
- [ ] Generate complete planning artifacts under `.planning/` for downstream planning and execution
- [ ] Support auto mode with upfront configuration and unattended progression after setup

### Out of Scope

- Executing implementation phases — handled after initialization via phase planning commands
- Production deployment setup — not required to define initial project scope and roadmap
- UI redesign of existing product surfaces — this workflow focuses on planning artifacts, not product UI changes

## Context

- The workflow is being initialized in an existing repository with source code already present.
- Auto mode is requested, so deep questioning is skipped and context is synthesized from provided command intent.
- The flow must preserve validation gates, commit checkpoints, and agent routing throughout initialization.

## Constraints

- **Workflow Integrity**: Follow the `new-project.md` stages and gates end-to-end — ensures consistency across projects
- **Mode**: Auto mode with minimal interaction after config — prioritizes throughput
- **Git Tracking**: Planning artifacts are committed — preserves project memory and auditability
- **Depth**: Quick planning depth — favors fast initial decomposition over exhaustive upfront detail

## Key Decisions

| Decision                                                     | Rationale                                                     | Outcome   |
| ------------------------------------------------------------ | ------------------------------------------------------------- | --------- |
| Use auto mode (`--auto`)                                     | User requested unattended initialization after config         | — Pending |
| Set planning depth to quick                                  | Optimize for speed to first executable roadmap                | — Pending |
| Enable parallel execution planning                           | Independent plans can run concurrently to reduce cycle time   | — Pending |
| Enable research, plan check, and verifier workflow agents    | Increase planning quality and reduce avoidable execution gaps | — Pending |
| Map custom Codex xhigh preference to `quality` model profile | Best match for quality-first model selection in config schema | — Pending |

---

_Last updated: 2026-02-26 after initialization_
