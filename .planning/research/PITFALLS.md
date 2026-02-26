# Pitfalls Research

**Domain:** AI-assisted project initialization workflow tooling (idea -> context -> research -> requirements -> roadmap)
**Researched:** 2026-02-26
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Requirement hallucination from low-context auto mode

**What goes wrong:**
The workflow produces confident requirements and phased plans that were never actually validated with the user. The plan looks complete but encodes guessed constraints, invented user priorities, or fake dependencies.

**Why it happens:**
Auto mode optimizes for throughput and skips deep questioning. Without explicit uncertainty handling, models fill gaps with plausible-but-wrong assumptions.

**How to avoid:**

- Require a "Known / Assumed / Unknown" block in every major artifact.
- Enforce a minimum evidence threshold before roadmap generation (e.g., at least N validated inputs from PROJECT.md, repo scan, and research).
- Add a mandatory "assumption review" gate before phase decomposition.

**Warning signs:**

- Frequent use of absolute language ("must", "always") without source links.
- Requirements sections that do not quote any user-provided constraints.
- Later phase rewrites invalidate earlier milestones.

**Phase to address:**
Phase 1 - Intake & scope contract (before research and roadmap generation).

---

### Pitfall 2: Cross-artifact drift (PROJECT.md, RESEARCH, REQUIREMENTS, ROADMAP disagree)

**What goes wrong:**
Planning files look individually good but contradict each other (scope, stack, priorities, risk posture). Downstream execution teams cannot trust which artifact is canonical.

**Why it happens:**
Multiple agent passes optimize each file locally. Without schema-level consistency checks, contradictions accumulate silently.

**How to avoid:**

- Define one canonical source-of-truth hierarchy (PROJECT.md > validated decisions > derived files).
- Add machine-checkable invariants (same phase names, same scope boundaries, same non-goals across files).
- Run an artifact diff gate that fails on semantic contradictions before commit.

**Warning signs:**

- Different phase counts or names between summary and roadmap.
- Stack recommendations in research not reflected in requirements.
- Out-of-scope items reappearing as roadmap milestones.

**Phase to address:**
Phase 3 - Artifact synthesis and consistency validation.

---

### Pitfall 3: Vibe-based quality (no evals, no trace grading, no regression baseline)

**What goes wrong:**
Teams judge planning quality by "looks good". Changes to prompts/models silently degrade plan quality, skill routing, or safety behavior.

**Why it happens:**
LLM outputs are nondeterministic; without evals and trace-level checks, regressions are invisible until execution fails.

**How to avoid:**

- Build an eval suite for initialization outputs: scope fidelity, dependency correctness, risk coverage, and phase realism.
- Add trace grading for workflow decisions (routing, tool calls, phase handoffs).
- Track release-over-release score deltas and block rollout on regression thresholds.

**Warning signs:**

- "This version feels better" is the main acceptance criterion.
- No historical benchmark set for successful/failed planning runs.
- Prompt edits are shipped without rerunning eval datasets.

**Phase to address:**
Phase 4 - Validation gates, eval harness, and release criteria.

---

### Pitfall 4: Prompt injection and untrusted context poisoning in repo-aware planning

**What goes wrong:**
Untrusted repository text, docs, or MCP tool output manipulates planning decisions (scope inflation, secret leakage, malicious instructions, wrong priorities).

**Why it happens:**
Initialization pipelines ingest large amounts of untrusted text. If that text is treated like trusted instructions, the planner can be steered off-policy.

**How to avoid:**

- Strict trust boundaries: untrusted repo/context goes to user-level context, never developer/system instructions.
- Use structured outputs between stages to reduce free-form instruction smuggling.
- Keep tool approvals enabled by default; require explicit approval for high-impact tool actions.
- Constrain MCP usage with allowlists and least-privilege approvals.

**Warning signs:**

- Planning output suddenly mirrors odd phrasing from unrelated repo files.
- Unrequested network/tool operations appear in traces.
- Scope changes are justified by opaque "tool said so" statements.

**Phase to address:**
Phase 2 - Research/context ingestion hardening (and continuously in Phase 4 validation).

---

### Pitfall 5: Losing critical decisions in long runs (context overflow / bad compaction)

**What goes wrong:**
Long initialization threads forget earlier constraints or decisions, causing circular planning, repeated questions, and contradictory later artifacts.

**Why it happens:**
Long-horizon workflows exceed context windows. Naive truncation or poor compaction drops decision-critical state.

**How to avoid:**

- Use explicit compaction strategy with retained decision registers (constraints, decisions, open risks, rejected options).
- Persist checkpoints outside the prompt (artifact store + decision log) and rehydrate each stage from canonical state.
- Add "decision continuity" checks at each stage transition.

**Warning signs:**

- Previously settled constraints re-opened as if new.
- Duplicate milestone proposals across turns.
- Increasing latency/token usage with decreasing plan coherence.

**Phase to address:**
Phase 2 - Workflow runtime design (state model) and Phase 4 continuity checks.

---

### Pitfall 6: Premature multi-agent complexity and unsafe autonomy

**What goes wrong:**
Teams add parallel orchestrators/workers early, then spend cycles debugging routing, handoff loops, and approval gaps instead of improving plan quality.

**Why it happens:**
Multi-agent architecture is attractive, but introduces extra nondeterminism (tool selection, handoffs, parallel merge conflicts). Without strict gates, autonomy outpaces control.

**How to avoid:**

- Start with the simplest workflow that meets quality targets; scale to multi-agent only when evals show single/workflow limits.
- Add explicit human checkpoints for high-impact transitions (scope freeze, roadmap publish, commit checkpoints).
- Make side-effecting actions idempotent and checkpoint-aware to avoid duplicate operations on resume/retry.

**Warning signs:**

- Frequent handoff loops or duplicate subtasks from worker agents.
- Higher token/cost with no measurable quality gain.
- Retry/resume creates duplicate commits or repeated artifact writes.

**Phase to address:**
Phase 5 - Automation/parallelization hardening after single-flow reliability is proven.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut                                     | Immediate Benefit          | Long-term Cost                                                | When Acceptable                    |
| -------------------------------------------- | -------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| Skip explicit assumptions section            | Faster artifact generation | Hidden hallucinations become roadmap churn                    | Never                              |
| Disable approvals for MCP/tools globally     | Lower latency              | Data exfiltration and unsafe side effects                     | Only in isolated test environments |
| Single giant system prompt for all phases    | Quick setup                | Prompt fragility, poor debuggability, hard regression control | MVP prototype only                 |
| No cross-file consistency checks             | Less implementation effort | Conflicting planning artifacts and execution rework           | Never                              |
| Add multi-agent fan-out before eval baseline | Perceived sophistication   | Expensive instability and hard-to-debug handoff errors        | Never                              |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration            | Common Mistake                                      | Correct Approach                                                            |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| MCP servers/connectors | Trusting remote tool outputs as authoritative truth | Treat as untrusted input, keep approvals on, restrict allowed tools/domains |
| Git checkpoints        | Non-idempotent write/commit on retries              | Make checkpoint writes deterministic and skip-if-exists                     |
| Eval pipeline          | Running only offline evals                          | Combine offline baselines with online trace monitoring                      |
| Long-running threads   | Manual transcript pruning                           | Use compaction + canonical decision register                                |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap                                    | Symptoms                                        | Prevention                                                        | When It Breaks                    |
| --------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| Over-broad context ingestion            | Slow runs, noisy plans, irrelevant dependencies | Scope retrieval to project boundaries and decision-relevant files | Large repos (>100k files)         |
| Unbounded tool catalogs                 | Latency spikes, wrong tool selection            | Restrict tool set by phase and allowed_tools filters              | Multi-tool environments           |
| No compaction policy                    | Context-limit failures, forgotten constraints   | Enable compaction and structured decision persistence             | Long multi-turn planning sessions |
| Parallel workers without merge protocol | Conflicting artifacts, repeated work            | Define deterministic merge + conflict resolution rules            | >=3 concurrent planning workers   |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake                                                      | Risk                                            | Prevention                                                                |
| ------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Injecting untrusted repo text into developer/system messages | Prompt injection with highest privilege         | Keep untrusted content in user-level context; sanitize and structure      |
| Disabling MCP approvals in production                        | Unauthorized data/tool actions                  | Require approval for sensitive tools; log approval decisions              |
| Broad network allowlists for agent runtime                   | Exfiltration and supply-chain exposure          | Use minimal org-level + request-level allowlists; domain-specific secrets |
| Treating tool output as trusted policy input                 | Silent policy bypass and bad planning decisions | Validate tool outputs and corroborate with independent sources            |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall                              | User Impact                                  | Better Approach                                           |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------------------- |
| Hidden uncertainty                   | Users over-trust fragile plans               | Surface confidence and unknowns per section               |
| Opaque phase changes                 | Teams lose trust in automation               | Provide changelog-style delta after each stage            |
| "Done" without verification evidence | Premature handoff to implementation          | Require gate report (checks passed/failed + links)        |
| Over-automation in auto mode         | Users cannot correct wrong assumptions early | Keep lightweight human checkpoints at high-impact moments |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Scope capture:** Missing assumptions/unknowns section - verify every major claim has source or confidence label
- [ ] **Research artifacts:** Missing cross-file consistency checks - verify phase names and scope boundaries match across all planning files
- [ ] **Roadmap quality:** Missing eval results - verify baseline scores and regression diff are attached
- [ ] **Security posture:** Missing tool approval policy evidence - verify approvals, allowlists, and trust boundaries are documented
- [ ] **Long-run reliability:** Missing continuity checks - verify earlier decisions persist after compaction/resume

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall                   | Recovery Cost | Recovery Steps                                                                                              |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| Requirement hallucination | HIGH          | Freeze roadmap -> run assumption audit -> re-validate with user -> regenerate only affected phases          |
| Cross-artifact drift      | MEDIUM        | Run consistency linter -> select canonical source -> regenerate divergent artifacts from canonical state    |
| Prompt injection incident | HIGH          | Revoke unsafe outputs/tools -> isolate poisoned inputs -> rerun with trust boundaries and approvals enabled |
| Context-loss regression   | MEDIUM        | Rebuild decision register from last good checkpoint -> replay stages with compaction policy enabled         |
| Multi-agent instability   | MEDIUM        | Roll back to single-workflow mode -> re-establish eval baseline -> reintroduce parallelism incrementally    |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall                            | Prevention Phase                  | Verification                                                                  |
| ---------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Requirement hallucination          | Phase 1 - Intake & scope contract | Assumptions ledger reviewed and approved before roadmap generation            |
| Cross-artifact drift               | Phase 3 - Artifact synthesis      | Automated semantic consistency report passes                                  |
| Vibe-based quality                 | Phase 4 - Validation/evals        | Eval scorecards + trace grading meet release thresholds                       |
| Prompt injection/context poisoning | Phase 2 - Context hardening       | Trust-boundary tests and approval logs pass                                   |
| Context-loss in long runs          | Phase 2 + Phase 4                 | Decision continuity checks pass after compaction/resume tests                 |
| Premature multi-agent complexity   | Phase 5 - Automation hardening    | Single-flow baseline met; multi-agent rollout gated by comparative eval gains |

## Sources

- Anthropic, "Building effective agents" (Published 2024-12-19): https://www.anthropic.com/engineering/building-effective-agents (HIGH)
- OpenAI Docs, "Evaluation best practices": https://developers.openai.com/api/docs/guides/evaluation-best-practices (HIGH)
- OpenAI Docs, "Agent evals": https://developers.openai.com/api/docs/guides/agent-evals (HIGH)
- OpenAI Docs, "Safety in building agents": https://developers.openai.com/api/docs/guides/agent-builder-safety (HIGH)
- OpenAI Docs, "Connectors and MCP servers": https://developers.openai.com/api/docs/guides/tools-connectors-mcp (HIGH)
- OpenAI Docs, "Compaction": https://developers.openai.com/api/docs/guides/compaction (HIGH)
- OpenAI Blog, "Shell + Skills + Compaction" (2026-02-11): https://developers.openai.com/blog/skills-shell-tips (MEDIUM)
- OpenAI Blog, "Testing Agent Skills Systematically with Evals" (2026-01-22): https://developers.openai.com/blog/eval-skills (MEDIUM)
- LangGraph Docs, "Interrupts" (checkpointing/idempotency): https://docs.langchain.com/oss/python/langgraph/interrupts (MEDIUM)
- LangSmith Docs, "Evaluation": https://docs.langchain.com/langsmith/evaluation (MEDIUM)
- MCP Specification 2025-06-18, security principles: https://modelcontextprotocol.io/specification/2025-06-18 (HIGH)
- OWASP GenAI/LLM Top 10 project (Prompt Injection, Excessive Agency, Overreliance): https://owasp.org/www-project-top-10-for-large-language-model-applications/ (MEDIUM)

---

_Pitfalls research for: AI-assisted project initialization workflow tooling_
_Researched: 2026-02-26_
