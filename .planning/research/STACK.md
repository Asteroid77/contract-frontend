# Stack Research

**Domain:** AI-assisted project initialization workflow tooling (CLI coding environments)
**Researched:** 2026-02-26
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology                               | Version           | Purpose                                                           | Why Recommended                                                                                                                                                                                         |
| ---------------------------------------- | ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js                                  | 24.x LTS          | Runtime for the CLI orchestrator and agents                       | Official Node release policy recommends LTS for production; v24 is Active LTS now and is the cleanest baseline for a 2025+ greenfield CLI stack. **Confidence: HIGH**                                   |
| TypeScript                               | 5.9.3             | Type-safe orchestration, tool contracts, and workflow state       | Current TS line with improved `tsc --init` defaults and strong NodeNext ergonomics; this cuts startup friction for new workflow tooling. **Confidence: HIGH**                                           |
| commander                                | 14.0.3            | CLI command surface (`init`, `research`, `plan`, `roadmap`)       | Mature, strict parser with strong subcommand/help model; widely adopted and now Node 20+ aligned. **Confidence: HIGH**                                                                                  |
| @modelcontextprotocol/sdk                | 1.27.1            | MCP client/server integration for tool interoperability           | MCP is now a cross-vendor standard and official TypeScript SDK is Tier-1 in MCP docs; this avoids custom tool protocol lock-in. **Confidence: HIGH**                                                    |
| @langchain/langgraph (+ @langchain/core) | 1.1.5 (+ ^1.1.16) | Deterministic orchestration for multi-step agent workflows        | LangGraph is explicitly built for long-running, stateful agent orchestration (durable execution, HITL, memory), which matches initialization workflows better than ad-hoc loops. **Confidence: MEDIUM** |
| better-sqlite3 + drizzle-orm             | 12.6.2 + 0.45.1   | Local durable state for runs, checkpoints, and planning artifacts | For CLI-first products, local SQLite is the fastest path to reliable persistence; better-sqlite3 is performance-focused and Drizzle keeps schema/migrations typed and lightweight. **Confidence: HIGH** |

### Supporting Libraries

| Library           | Version | Purpose                                                | When to Use                                                                                    |
| ----------------- | ------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| openai            | 6.25.0  | Primary model provider SDK                             | Use when defaulting to OpenAI models and the Responses API-driven tool flow.                   |
| @anthropic-ai/sdk | 0.78.0  | Secondary model provider SDK                           | Use for Claude-based tool use and MCP helper utilities; keep as first-class fallback provider. |
| zod               | 4.3.6   | Runtime validation for prompts, tool I/O, config files | Use at all trust boundaries (`.planning` schema, agent outputs, tool calls).                   |
| execa             | 9.6.1   | Safe subprocess execution                              | Use for git/npm/project-scaffold subprocesses; avoids shell-escaping footguns.                 |
| pino              | 10.3.1  | Structured logging                                     | Use for machine-readable run logs and replay/debug in CI and local runs.                       |
| @inquirer/prompts | 8.3.0   | Interactive setup UX                                   | Use only in interactive mode; auto mode should bypass prompts and run unattended.              |

### Development Tools

| Tool          | Purpose                              | Notes                                                                             |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| pnpm 10.x     | Fast, disk-efficient package manager | Best fit for monorepo-style workflow tooling and repeated agent package installs. |
| vitest 4.0.18 | Unit/integration testing             | Current docs require Node >=20 and Vite >=6; good fit for TS CLI packages.        |
| tsx 4.21.0    | Fast TypeScript execution in dev     | Use for local iteration on commands/agents without prebuild loops.                |

## Installation

```bash
# Core
npm install commander @modelcontextprotocol/sdk @langchain/langgraph @langchain/core zod better-sqlite3 drizzle-orm

# Supporting
npm install openai @anthropic-ai/sdk execa pino @inquirer/prompts

# Dev dependencies
npm install -D typescript tsx vitest @types/node
```

## Alternatives Considered

| Recommended                                          | Alternative                          | When to Use Alternative                                                                                     |
| ---------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `commander`                                          | `oclif`                              | Use `oclif` only if you need plugin marketplace semantics and heavy CLI framework conventions from day one. |
| `@langchain/langgraph`                               | hand-rolled async orchestration      | Use custom orchestration only for very small one-shot flows with no durability/restart requirements.        |
| `better-sqlite3` + `drizzle-orm`                     | hosted Postgres (`postgres` or `pg`) | Use Postgres when multiple users/processes need shared state and remote concurrency.                        |
| direct provider SDKs (`openai`, `@anthropic-ai/sdk`) | one-provider lock-in                 | Use single-provider only for internal prototypes where portability and negotiation leverage do not matter.  |

## What NOT to Use

| Avoid                                                                      | Why                                                                                                                                                    | Use Instead                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `inquirer` (legacy monolith package) for new builds                        | Inquirer maintainers state the old package is maintained but not actively developed after rewrite; new prompts API is the forward path.                | `@inquirer/prompts`                   |
| Building new tool orchestration on OpenAI Chat Completions as primary path | OpenAI SDK docs mark Responses API as the primary API; Chat Completions is previous standard.                                                          | `openai` Responses API + tool calls   |
| `node-sqlite3` for CLI local state engines                                 | `better-sqlite3` docs explicitly call out simpler API and better performance characteristics for Node usage patterns.                                  | `better-sqlite3`                      |
| Yeoman-centered architecture for AI-assisted init workflows                | Yeoman is template-generator oriented; modern AI workflow init requires dynamic tool calling, MCP integration, and iterative plan-state orchestration. | Commander + MCP SDK + LangGraph stack |

## Stack Patterns by Variant

**If local-first single-developer CLI (most greenfield):**

- Use `better-sqlite3` + `drizzle-orm` for run state.
- Keep transport local (`stdio`) for MCP servers.
- Because startup speed and zero-infra operation matter more than distributed concurrency.

**If team/shared orchestration service:**

- Keep Node/TS + Commander + MCP + LangGraph, but switch state to Postgres (`postgres@3.4.8` or `pg@8.19.0`) with Drizzle.
- Prefer remote MCP server connections over local-only stdio.
- Because shared checkpointing, multi-user visibility, and concurrent runs become mandatory.

## Version Compatibility

| Package A                                      | Compatible With                                                        | Notes                                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `node@24.x`                                    | `commander@14.0.3`, `@inquirer/prompts@8.3.0`, `better-sqlite3@12.6.2` | Commander requires Node >=20; Inquirer prompts requires >=20.12; better-sqlite3 supports Node 20/22/23/24/25. |
| `@langchain/langgraph@1.1.5`                   | `@langchain/core@^1.1.16`, `zod@^3.25.32` or `zod@^4.2.0`              | Pin `@langchain/core` explicitly to avoid peer drift.                                                         |
| `@modelcontextprotocol/sdk@1.27.1`             | `zod@^3.25` or `zod@^4.0`                                              | MCP SDK has peer dependency on Zod; keep Zod as a direct dependency.                                          |
| `vitest@4.0.18`                                | Node >=20, Vite >=6                                                    | For pure CLI packages, Vite is only needed for Vitest internals/tooling integration.                          |
| `openai@6.25.0` and `@anthropic-ai/sdk@0.78.0` | Node 20 LTS+                                                           | Both SDK READMEs document Node 20 LTS or later for supported runtimes.                                        |

## Sources

- Context7: unavailable in this run (quota exceeded), so stack confidence is based on official docs + official repos.
- https://nodejs.org/en/about/previous-releases — Node LTS policy and current release status (HIGH)
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html — current TS release and defaults (HIGH)
- https://modelcontextprotocol.io/docs/sdk.md — official MCP SDK list/tiering (HIGH)
- https://modelcontextprotocol.io/docs/develop/build-client.md — MCP TypeScript client workflow patterns (HIGH)
- https://github.com/modelcontextprotocol/typescript-sdk — official TS SDK, v1 production guidance and package split direction (HIGH)
- https://docs.langchain.com/oss/javascript/langgraph/overview — LangGraph orchestration capabilities (MEDIUM)
- https://github.com/openai/openai-node — Responses API as primary, runtime requirements (HIGH)
- https://github.com/anthropics/anthropic-sdk-typescript — MCP helpers, runtime requirements (HIGH)
- https://github.com/tj/commander.js — CLI command architecture and usage model (HIGH)
- https://github.com/SBoudrias/Inquirer.js — modern prompts package and legacy package status note (HIGH)
- https://vitest.dev/guide/ — Vitest runtime/version requirements (HIGH)
- https://github.com/WiseLibs/better-sqlite3 — SQLite driver performance and usage guidance (HIGH)
- https://orm.drizzle.team/docs/overview — Drizzle positioning and migration/query workflow (MEDIUM)
- https://zod.dev/ — Zod v4 status and TS-first validation model (HIGH)
- `npm view` metadata (versions, peer deps, engines, modified dates) for all recommended packages (HIGH)

---

_Stack research for: AI-assisted project initialization workflow tooling in CLI coding environments_
_Researched: 2026-02-26_
