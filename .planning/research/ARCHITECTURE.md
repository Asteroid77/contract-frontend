# Architecture Research

**Domain:** AI-assisted project initialization and orchestration workflow tooling  
**Researched:** 2026-02-26  
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Interface and Control Layer                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ CLI/API Entry    │  │ Session Manager  │  │ Human Approval Console   │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────────┘   │
│           │                     │                        │                   │
├───────────┴─────────────────────┴────────────────────────┴───────────────────┤
│                          Orchestration Layer                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │ Stage Orchestrator (state machine + gates + retries + routing)       │   │
│  └──────────┬──────────────────────┬──────────────────────┬──────────────┘   │
│             │                      │                      │                   │
│  ┌──────────▼─────────┐  ┌─────────▼──────────┐  ┌───────▼──────────────┐    │
│  │ Agent Runtime      │  │ Policy Engine      │  │ Artifact Compiler     │    │
│  │ (planner/workers)  │  │ (quality + safety) │  │ (.planning/* output)  │    │
│  └──────────┬─────────┘  └─────────┬──────────┘  └────────┬──────────────┘    │
├─────────────┴──────────────────────┴──────────────────────┴───────────────────┤
│                         Tool and Data Layer                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ LLM Gateway   │  │ Tool Adapters  │  │ Context Store  │  │ Event/Trace  │  │
│  │ (models)      │  │ (git, web, mcp)│  │ (project state)│  │ Store        │  │
│  └──────┬────────┘  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│         │                    │                   │                 │          │
│  ┌──────▼────────────────────▼───────────────────▼─────────────────▼────────┐ │
│  │ Durable Workflow State + Artifact Storage (files + checkpoints)          │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component           | Responsibility                                           | Typical Implementation                                  |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| CLI/API Entry       | Accept initialization command, mode, and scope           | CLI command parser or REST endpoint                     |
| Session Manager     | Maintain run identity, user preferences, and resumes     | Session ID + persisted run metadata                     |
| Stage Orchestrator  | Execute ordered stages and enforce gates                 | Explicit state machine graph (stage enum + transitions) |
| Agent Runtime       | Run specialist agents (research, planning, verification) | Planner-worker loop with bounded retries                |
| Policy Engine       | Enforce quality rules, permissions, and stop conditions  | Guardrails + pre/post step checks                       |
| Artifact Compiler   | Produce canonical files in `.planning/`                  | Deterministic template renderer + schema validation     |
| Tool Adapters       | Isolate external operations (git, web fetch, MCP, files) | Adapter interfaces with timeout/retry wrappers          |
| Durable State Store | Persist execution state for resume/replay                | SQLite/Postgres + append-only event log                 |
| Trace Store         | Record spans, decisions, tool calls, and failures        | OpenTelemetry-compatible trace backend                  |

## Recommended Project Structure

```
src/
├── app/                         # Entry points (CLI/API bootstrap)
├── orchestration/               # Stage graph, transitions, retry policy
│   ├── stages/                  # Context, research, requirements, roadmap
│   └── gates/                   # Validation gates and completion criteria
├── agents/                      # Specialist agents and prompts
│   ├── planner/                 # Stage planning and decomposition
│   ├── researcher/              # Domain investigation workers
│   └── verifier/                # Plan checks and quality controls
├── tools/                       # External adapter layer
│   ├── git/                     # Git status, checkpoint, commit helpers
│   ├── web/                     # Fetch/search wrappers
│   └── mcp/                     # MCP client adapters
├── state/                       # Durable run state and event history
├── artifacts/                   # File templates and artifact schemas
└── observability/               # Tracing, metrics, run reports
```

### Structure Rationale

- **orchestration/** keeps stage sequencing and gate logic independent from agent prompts and tools.
- **agents/** isolates model-facing behavior so prompts and routing can evolve without breaking workflow control.
- **tools/** creates a stable boundary for side effects and permissions.
- **state/** centralizes resumability, replay, and audit trails.
- **artifacts/** ensures deterministic output contracts for downstream roadmap consumers.

## Architectural Patterns

### Pattern 1: Stage-Gated State Machine

**What:** Represent project initialization as explicit stages (`context -> research -> requirements -> roadmap`) with hard gate checks between stages.  
**When to use:** Always for initialization workflows that must be auditable and resumable.  
**Trade-offs:** Less flexible than free-form agent loops, but much more reliable and debuggable.

**Example:**

```typescript
type Stage = 'context' | 'research' | 'requirements' | 'roadmap' | 'done'

async function runStage(stage: Stage, runId: string): Promise<Stage> {
  const output = await executeStageWorker(stage, runId)
  await validateGate(stage, output) // blocks progression on failed quality gate
  return nextStage(stage)
}
```

### Pattern 2: Orchestrator-Workers with Specialist Agents

**What:** One coordinator decomposes work and dispatches specialist agents (researcher, planner, verifier), then synthesizes outputs.  
**When to use:** Tasks where required subtasks vary by domain and cannot be fully hardcoded.  
**Trade-offs:** Better coverage and quality than one monolithic agent, but requires stronger contracts between workers.

**Example:**

```typescript
const tasks = await planner.decompose(projectIntent)
const workerOutputs = await Promise.all(tasks.map((task) => routeToSpecialist(task)))
const merged = await planner.synthesize(workerOutputs)
await verifier.check(merged)
```

### Pattern 3: Durable Execution for Long-Running Runs

**What:** Persist state at each transition/tool call so runs can resume after failure or interruption.  
**When to use:** Any system with multi-step agent loops, network calls, or human approvals.  
**Trade-offs:** Additional storage and serialization complexity, but avoids full reruns and state loss.

**Example:**

```typescript
await stateStore.append(runId, { stage, status: 'started' })
const result = await invokeWorker(stage, input)
await stateStore.append(runId, { stage, status: 'completed', resultRef: result.id })
```

## Data Flow

### Request Flow

```
[User Command: /new-project --auto]
    ↓
[CLI/API Entry]
    ↓
[Session Manager: run_id + config]
    ↓
[Stage Orchestrator]
    ↓ routes work
[Agent Runtime] ──calls──> [Tool Adapters/LLM Gateway]
    ↓ emits outputs
[Policy Engine + Gates]
    ↓ pass/fail
[Artifact Compiler] ──writes──> [.planning/*]
    ↓
[Checkpoint + Trace Store]
    ↓
[Final roadmap-ready artifact set]
```

### State Management

```
[Event Log / State Store]
    ↓ restore on resume
[Stage Orchestrator]
    ↓ dispatch
[Agents + Tools]
    ↓ append events (tool_call, gate_result, artifact_written)
[Event Log / State Store]
```

### Key Data Flows

1. **Intent-to-stage flow:** command intent and project context move from intake into a normalized run-state object consumed by orchestrator stages.
2. **Worker-to-artifact flow:** specialist outputs are validated, merged, and transformed into deterministic `.planning` documents.
3. **Gate-to-control flow:** quality gate results feed back into orchestration to either advance, retry, or request user intervention.

## Suggested Build Order (Dependency-Aware)

1. **Artifact contracts + state schema first** (run metadata, stage output schemas, `.planning` file contracts).
2. **Stage orchestrator second** (state machine transitions, retries, and gate interfaces).
3. **Tool adapter layer third** (git/web/mcp/llm wrappers with permission and timeout boundaries).
4. **Specialist agents fourth** (context, research, requirements, roadmap workers) against stable interfaces.
5. **Validation and policy engine fifth** (quality checks, guardrails, stop conditions).
6. **Observability and checkpoint UX last** (trace dashboards, resume commands, audit reports).

This order reduces rework: agents and prompts change often, while state contracts and orchestration boundaries should stabilize early.

## Scaling Considerations

| Scale                       | Architecture Adjustments                                                               |
| --------------------------- | -------------------------------------------------------------------------------------- |
| 0-1k workflow runs/month    | Single process with local durable store is usually sufficient.                         |
| 1k-100k workflow runs/month | Split orchestrator and workers, queue tool-heavy tasks, add centralized trace storage. |
| 100k+ workflow runs/month   | Move to distributed workers, strict idempotency keys, and sharded state/event storage. |

### Scaling Priorities

1. **First bottleneck:** external tool/LLM latency; fix with parallel worker execution and bounded retries.
2. **Second bottleneck:** state and trace volume; fix with event retention policy and archival tiers.

## Anti-Patterns

### Anti-Pattern 1: One Mega-Agent for All Stages

**What people do:** Use a single agent prompt to perform context capture, research, requirements, and roadmap generation in one loop.  
**Why it's wrong:** Blurs responsibilities, weakens gates, and makes failures non-localized.  
**Do this instead:** Use stage-specific workers with explicit handoff artifacts.

### Anti-Pattern 2: Non-Durable In-Memory Orchestration

**What people do:** Keep run state only in memory and rerun from scratch on crashes.  
**Why it's wrong:** Long runs become brittle; retries duplicate side effects and waste tokens.  
**Do this instead:** Persist stage transitions and tool-call outputs with replayable run IDs.

## Integration Points

### External Services

| Service                | Integration Pattern                             | Notes                                         |
| ---------------------- | ----------------------------------------------- | --------------------------------------------- |
| LLM provider APIs      | Gateway interface with model routing policy     | Keep provider details out of stage logic.     |
| Git provider/local git | Adapter commands behind checkpoint service      | Treat commits as explicit stage-side effects. |
| MCP servers/tools      | MCP client per server with capability discovery | Use per-server permissions and timeouts.      |
| Observability backend  | OpenTelemetry traces + run metadata export      | Needed for debugging multi-agent failures.    |

### Internal Boundaries

| Boundary                           | Communication                             | Notes                                               |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| Interface -> Orchestration         | Command DTO + run config                  | No direct tool access from interface layer.         |
| Orchestration -> Agents            | Task contracts + expected artifact schema | Prevent prompt coupling to orchestration internals. |
| Agents -> Tools                    | Adapter interfaces only                   | Enables permission control and test stubs.          |
| Orchestration -> Artifact Compiler | Validated stage outputs                   | Compiler remains deterministic and model-agnostic.  |

## Sources

- Anthropic, "Building effective agents" (Published 2024-12-19): https://www.anthropic.com/engineering/building-effective-agents (HIGH)
- LangGraph overview and core benefits (durable execution, HITL, memory): https://docs.langchain.com/oss/python/langgraph/overview (HIGH)
- Temporal workflow concepts (workflow definitions/executions, event history, deterministic replay): https://docs.temporal.io/workflows (HIGH)
- Temporal AI Cookbook (agentic loop, durable agents, HITL patterns): https://docs.temporal.io/ai-cookbook (HIGH)
- MCP architecture (host/client/server, tools/resources/prompts, transport and capability negotiation): https://modelcontextprotocol.io/docs/learn/architecture (HIGH)
- OpenAI Agents SDK primitives (agents, handoffs, guardrails, tracing, built-in loop): https://github.com/openai/openai-agents-js/blob/main/docs/src/content/docs/index.mdx (HIGH, via Context7)
- OpenAI Agents SDK core concepts (agents/tools/handoffs/guardrails/tracing): https://github.com/openai/openai-agents-js/blob/main/packages/agents/README.md (HIGH, via Context7)
- Temporal core application components (workflows, activities, workers): https://github.com/temporalio/documentation/blob/main/docs/evaluate/development-production-features/core-application.mdx (HIGH, via Context7)

---

_Architecture research for: AI-assisted project initialization workflow tooling_  
_Researched: 2026-02-26_
