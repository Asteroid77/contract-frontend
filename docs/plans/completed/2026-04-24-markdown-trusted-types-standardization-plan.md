Status: completed
Owner: frontend
Last verified: 2026-04-27
Source of truth: yes

# Markdown DOMPurify + Trusted Types Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the current regex-based markdown sanitizer with a DOMPurify-backed standard implementation, tighten the shared Trusted Types HTML boundary so raw strings can no longer pass through unchecked, and stop once the markdown path is either proven compatible under `Report-Only` or explicitly documented as a controlled third-party exception.

**Architecture:** Keep [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts) as the only business entry for markdown rendering. Move HTML and Mermaid SVG sanitization to DOMPurify with separate allow/forbid rules, then require any self-owned HTML sink to go through a runtime-checked sanitized payload before creating `TrustedHTML`. Do not patch `md-editor-v3`; if its internal sinks remain incompatible with direct Trusted Types values under Chromium `Report-Only`, complete the standardization by documenting that boundary instead of widening policy scope.

**Tech Stack:** Vue 3, TypeScript, md-editor-v3, DOMPurify, Vitest, CSP `Report-Only`, Trusted Types, Chromium manual verification

---

## Scope

- In scope:
  - Replace the regex sanitizer in [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts) with DOMPurify.
  - Separate HTML and Mermaid SVG sanitizer profiles.
  - Tighten [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts) so HTML wrapping no longer accepts arbitrary raw strings.
  - Keep markdown rendering behind one safe loader boundary.
  - Add tests and manual verification steps that define the stop line.
- Out of scope:
  - `trusted-types default`
  - Patching `node_modules`
  - Switching CSP from `Report-Only` to enforce
  - Extending this work to unrelated third-party sinks
  - Git commit / branch steps

## Completion Rule

This plan is complete when all of the following are true:

1. [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts) no longer uses regex replacement as the primary sanitizer.
2. [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts) no longer exposes an HTML helper that accepts unchecked raw strings.
3. [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts) remains the only business-facing entry for markdown security props.
4. Chromium manual verification under the current `Report-Only` header reaches one of these terminal states:
   - Path A: markdown flow works and no new unacceptable Trusted Types violations are observed.
   - Path B: violations still originate from `md-editor-v3` internals; the markdown path is documented as a controlled third-party exception and no wider TT policy is introduced.

Path B is still considered complete. The stop line is standardization plus explicit boundary documentation, not “perfect TT compatibility at any cost”.

## File Structure

- Modify: [`package.json`](../../../package.json)
  - Add `dompurify` runtime dependency.
- Modify: [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts)
  - Replace regex sanitizer with DOMPurify-backed HTML and SVG profiles.
- Modify: [`src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`](../../../src/modules/work-order/presentation/__tests__/markdown-security.spec.ts)
  - Lock in sanitizer behavior for display hooks, removed tags, removed attributes, and Mermaid SVG handling.
- Modify: [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts)
  - Keep `TrustedScriptURL` handling for workers.
  - Replace raw-string HTML entry with a runtime-checked sanitized payload helper.
- Modify: [`src/modules/shared/application/security/__tests__/trusted-types.spec.ts`](../../../src/modules/shared/application/security/__tests__/trusted-types.spec.ts)
  - Verify the tightened HTML API and keep worker URL tests green.
- Modify: [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts)
  - Keep raw HTML disabled, Mermaid `strict`, and standardized sanitizer injection as the only loader boundary.
- Modify: [`src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`](../../../src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts)
  - Verify the loader keeps injecting the standardized sanitizer functions and ignores caller overrides.
- Modify: [`src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`](../../../src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts)
  - Protect the page-level integration boundary so pages keep consuming the preloaded safe components.
- Modify: [`docs/plans/completed/2026-04-21-trusted-types-rollout.md`](./2026-04-21-trusted-types-rollout.md)
  - Record the final standardization result and, if needed, the third-party exception boundary.

## Pre-Flight Notes

- The repo rule in `AGENTS.md` forbids planning git operations unless the user asks. This plan intentionally omits commit steps.
- Do not start by trying to force `TrustedHTML` directly through `md-editor-v3` props. First standardize DOMPurify and the shared TT boundary, then use Chromium verification to decide whether the markdown path can consume stricter TT handling without widening policy scope.

### Task 1: Replace Regex Markdown Sanitization With DOMPurify

**Files:**
- Modify: [`package.json`](../../../package.json)
- Modify: [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts)
- Test: [`src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`](../../../src/modules/work-order/presentation/__tests__/markdown-security.spec.ts)

- [x] **Step 1: Add failing sanitizer expectations that the regex version cannot satisfy**

Add these assertions to [`src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`](../../../src/modules/work-order/presentation/__tests__/markdown-security.spec.ts):

```ts
it('removes embedded iframe containers instead of leaving passive-looking active embeds behind', () => {
  const html = `
    <p>before</p>
    <iframe src="https://example.com/embed"></iframe>
    <p>after</p>
  `

  const sanitized = sanitizeMarkdownHtml(html)

  expect(sanitized).toContain('<p>before</p>')
  expect(sanitized).toContain('<p>after</p>')
  expect(sanitized).not.toContain('<iframe')
})

it('keeps safe display hooks while forbidding style/script payload containers', () => {
  const html = `
    <pre><code class="hljs language-ts" data-line="1">const value = 1</code></pre>
    <style>@import "javascript:alert(1)"</style>
  `

  const sanitized = sanitizeMarkdownHtml(html)

  expect(sanitized).toContain('class="hljs language-ts"')
  expect(sanitized).toContain('data-line="1"')
  expect(sanitized).not.toContain('<style')
})
```

- [x] **Step 2: Run the markdown sanitizer spec and confirm it fails against the current regex implementation**

Run: `pnpm test:unit --run src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`

Expected: FAIL because the current implementation in [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts) strips a small set of active patterns but does not remove entire `iframe` containers or replace the regex path with a standard sanitizer.

- [x] **Step 3: Install DOMPurify**

Run: `pnpm add dompurify`

Expected: `package.json` and the lockfile are updated with `dompurify` as a runtime dependency.

- [x] **Step 4: Replace the regex sanitizer with separate DOMPurify HTML and SVG profiles**

Replace the implementation in [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts) with a DOMPurify-backed version shaped like this:

```ts
import DOMPurify from 'dompurify'

const MARKDOWN_HTML_CONFIG: DOMPurify.Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe'],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: true,
}

const MARKDOWN_SVG_CONFIG: DOMPurify.Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['foreignObject', 'script', 'style'],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: true,
}

function sanitizeHtmlWithConfig(input: string, config: DOMPurify.Config) {
  return DOMPurify.sanitize(input, config)
}

export function sanitizeMarkdownHtml(html: string) {
  return sanitizeHtmlWithConfig(html, MARKDOWN_HTML_CONFIG)
}

export async function sanitizeMarkdownMermaid(svg: string) {
  return sanitizeHtmlWithConfig(svg, MARKDOWN_SVG_CONFIG)
}
```

Implementation notes:

- Preserve `class`, `id`, `aria-*`, and `data-*` because the existing tests prove they are needed for KaTeX, highlight, Mermaid, heading anchors, and editor hooks.
- Keep `foreignObject` explicitly forbidden in the SVG profile.
- Do not add a custom allowlist broader than current product needs.
- If a DOMPurify hook is required to keep one display attribute, add the smallest possible hook and cover it with a spec before moving on.

- [x] **Step 5: Re-run the markdown sanitizer spec**

Run: `pnpm test:unit --run src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`

Expected: PASS.

### Task 2: Tighten The Trusted Types HTML Boundary

**Files:**
- Modify: [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts)
- Test: [`src/modules/shared/application/security/__tests__/trusted-types.spec.ts`](../../../src/modules/shared/application/security/__tests__/trusted-types.spec.ts)

- [x] **Step 1: Add failing tests for a runtime-checked sanitized HTML payload**

Update [`src/modules/shared/application/security/__tests__/trusted-types.spec.ts`](../../../src/modules/shared/application/security/__tests__/trusted-types.spec.ts) with these expectations:

```ts
it('rejects raw strings when creating TrustedHTML', async () => {
  const { createTrustedHtmlFromSanitized } =
    await import('@/modules/shared/application/security/trusted-types')

  expect(() => createTrustedHtmlFromSanitized('<p>raw</p>' as never)).toThrow(
    /SanitizedHtmlInput/,
  )
})

it('creates TrustedHTML only from sanitized payload objects', async () => {
  const createHTMLSpy = vi.fn((input: string) => `trusted:${input}`)

  Object.defineProperty(window, 'trustedTypes', {
    configurable: true,
    value: {
      createPolicy: vi.fn(() => ({
        createHTML: createHTMLSpy,
      })),
    },
  })

  const {
    asSanitizedHtmlInput,
    createTrustedHtmlFromSanitized,
  } = await import('@/modules/shared/application/security/trusted-types')

  expect(
    createTrustedHtmlFromSanitized(asSanitizedHtmlInput('<p>safe</p>')),
  ).toBe('trusted:<p>safe</p>')
})
```

- [x] **Step 2: Run the Trusted Types spec and confirm it fails**

Run: `pnpm test:unit --run src/modules/shared/application/security/__tests__/trusted-types.spec.ts`

Expected: FAIL because the current API still accepts unchecked strings through `createTrustedHtml`.

- [x] **Step 3: Replace the raw-string HTML helper with a runtime-checked sanitized payload API**

Refactor [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts) to keep the worker path unchanged but tighten the HTML path like this:

```ts
export type SanitizedHtmlInput = {
  readonly kind: 'sanitized-html'
  readonly value: string
}

export const asSanitizedHtmlInput = (value: string): SanitizedHtmlInput => ({
  kind: 'sanitized-html',
  value,
})

function assertSanitizedHtmlInput(value: unknown): SanitizedHtmlInput {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('kind' in value) ||
    !('value' in value) ||
    (value as { kind?: string }).kind !== 'sanitized-html' ||
    typeof (value as { value?: unknown }).value !== 'string'
  ) {
    throw new TypeError('createTrustedHtmlFromSanitized requires SanitizedHtmlInput')
  }

  return value as SanitizedHtmlInput
}

export const createTrustedHtmlFromSanitized = (input: SanitizedHtmlInput | unknown) => {
  const payload = assertSanitizedHtmlInput(input)
  return getContractFrontendHtmlPolicy()?.createHTML(payload.value) ?? payload.value
}
```

Implementation notes:

- Keep `createScriptURL`, `createTrustedScriptUrl`, and `installTrustedTypesWorkerConstructors()` behavior unchanged.
- Remove or deprecate the old raw-string `createTrustedHtml` export so new callers cannot keep bypassing the boundary.
- After the refactor, search for old callers before moving on:

Run: `rg -n "createTrustedHtml\\(" src`

Expected: no production callers remain.

- [x] **Step 4: Re-run the Trusted Types spec**

Run: `pnpm test:unit --run src/modules/shared/application/security/__tests__/trusted-types.spec.ts`

Expected: PASS.

### Task 3: Keep Markdown Behind One Loader Boundary And Run The Compatibility Gate

**Files:**
- Modify: [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts)
- Test: [`src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`](../../../src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts)
- Test: [`src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`](../../../src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts)

- [x] **Step 1: Expand loader tests so they prove the standardized sanitizer remains the only injected boundary**

Extend [`src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`](../../../src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts) to assert the injected functions now remove DOMPurify-forbidden containers:

```ts
expect(previewProps?.sanitize?.('<iframe src="https://example.com/embed"></iframe><p>ok</p>')).toBe(
  '<p>ok</p>',
)

await expect(
  previewProps?.sanitizeMermaid?.(
    '<svg><foreignObject>bad</foreignObject><text>ok</text></svg>',
  ),
).resolves.toContain('<text>ok</text>')
```

Keep the existing “caller-provided sanitize props are ignored” coverage.

- [x] **Step 2: Run the loader and page wiring specs**

Run: `pnpm test:unit --run src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`

Run: `pnpm test:unit --run src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`

Expected: PASS after the DOMPurify-backed sanitizer is wired through the loader.

- [x] **Step 3: Keep the loader string-based for `md-editor-v3`; do not force `TrustedHTML` through library props**

Leave the loader boundary shaped like this in [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts):

```ts
const markdownSecurityConfig = {
  markdownItConfig: disableMarkdownRawHtml,
  mermaidConfig: createStrictMermaidConfig,
}

function createWorkOrderMarkdownComponent(component: Component, name: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(component, {
          ...attrs,
          noEcharts: true,
          sanitize: sanitizeMarkdownHtml,
          sanitizeMermaid: sanitizeMarkdownMermaid,
        }, slots)
    },
  })
}
```

Implementation note:

- This task is about protecting the boundary, not about forcing TT objects into a third-party API that currently expects strings.
- If you experiment with direct TT values here and the library breaks type contracts or runtime behavior, revert that attempt immediately. The stop line is standardization, not library surgery.

- [x] **Step 4: Run the Chromium compatibility gate under the current `Report-Only` header**

Run: `pnpm dev`

Manual verification:

1. Open the work-order create page.
2. Open one work-order detail page with existing markdown content.
3. Exercise:
   - code block highlighting
   - Mermaid preview
   - KaTeX content if available
   - safe image/link rendering
   - a payload fixture containing `iframe`, `javascript:`, and event handler attributes
4. Watch browser console and network for `securitypolicyviolation`.

Expected:

- Path A:
  - rendering behavior is intact
  - no new unacceptable TT/CSP violations are attributed to the markdown path
- Path B:
  - behavior is intact
  - TT/CSP violations still trace back to `md-editor-v3` internal sinks
  - do **not** add `trusted-types default`
  - do **not** widen the `contract-frontend-html` policy
  - continue to Task 4 and document the boundary as a controlled third-party exception

### Task 4: Record The Terminal State And Run The Full Verification Set

**Files:**
- Modify: [`docs/plans/completed/2026-04-21-trusted-types-rollout.md`](./2026-04-21-trusted-types-rollout.md)
- Verify: [`src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`](../../../src/modules/work-order/presentation/__tests__/markdown-security.spec.ts)
- Verify: [`src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`](../../../src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts)
- Verify: [`src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`](../../../src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts)
- Verify: [`src/modules/shared/application/security/__tests__/trusted-types.spec.ts`](../../../src/modules/shared/application/security/__tests__/trusted-types.spec.ts)

- [x] **Step 1: Add a closure section to the active Trusted Types rollout doc**

Append a short section to [`docs/plans/completed/2026-04-21-trusted-types-rollout.md`](./2026-04-21-trusted-types-rollout.md) using this structure:

```md
## Markdown DOMPurify / Trusted Types closure (2026-04-24)

- Markdown HTML and Mermaid SVG sanitization now use DOMPurify instead of the temporary regex path.
- The shared Trusted Types HTML helper no longer accepts unchecked raw strings.
- `md-editor-loader.ts` remains the only business entry for markdown security props.
- Final markdown TT state: [compatible under Report-Only | documented third-party exception].
- Explicitly retained constraints:
  - no `trusted-types default`
  - no widened policy names
  - no `node_modules` patching
```

Choose one final markdown TT state and make it explicit. Do not leave this ambiguous.

- [x] **Step 2: Run the targeted verification commands**

Run:

`pnpm test:unit --run src/modules/work-order/presentation/__tests__/markdown-security.spec.ts`

`pnpm test:unit --run src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts`

`pnpm test:unit --run src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`

`pnpm test:unit --run src/modules/shared/application/security/__tests__/trusted-types.spec.ts`

`pnpm type-check`

`pnpm build`

`pnpm check:csp:src`

`pnpm check:csp:dist`

Expected: all commands pass.

- [x] **Step 3: Close only if every stop-line condition is satisfied**

Before marking this plan done, verify this checklist against the real outputs:

- [`src/modules/work-order/presentation/markdown-security.ts`](../../../src/modules/work-order/presentation/markdown-security.ts) is DOMPurify-backed.
- [`src/modules/shared/application/security/trusted-types.ts`](../../../src/modules/shared/application/security/trusted-types.ts) no longer wraps unchecked raw strings as HTML.
- [`src/modules/work-order/presentation/md-editor-loader.ts`](../../../src/modules/work-order/presentation/md-editor-loader.ts) is still the only business-facing markdown security entry.
- [`docs/plans/completed/2026-04-21-trusted-types-rollout.md`](./2026-04-21-trusted-types-rollout.md) explicitly records Path A or Path B.
- No new work item in this plan is trying to “perfect TT-enable” `md-editor-v3` beyond the documented stop line.

If any item is false, the plan is not done.

## Archive Summary (2026-04-27)

- Implementation state: completed and archived.
- Final markdown Trusted Types state: Path B, documented third-party exception.
- The markdown path is DOMPurify-backed, raw-string TrustedHTML creation is removed, and `md-editor-loader.ts` remains the only business-facing markdown security entry.
- Fresh archive check on 2026-04-27:
  - `rg -n "createTrustedHtml\\(" src` produced no matches.
  - `pnpm test:unit --run src/modules/work-order/presentation/__tests__/markdown-security.spec.ts src/modules/work-order/presentation/__tests__/md-editor-loader.spec.ts src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts src/modules/shared/application/security/__tests__/trusted-types.spec.ts` passed: 4 files / 17 tests.
