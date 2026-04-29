# Token To Figma Brief

## Purpose

This brief turns the current frontend design token layer into a practical prompt and review contract for Figma-style mockups and GPT image generation. It is intended for enterprise contract-management screens built with Vue, Naive UI, and Tailwind CSS.

## Source Of Truth

- Code tokens: `src/app/presentation/theme/ThemeToken.ts`
- Naive UI bridge: `src/app/presentation/theme/hooks/useTheme.ts`
- CSS generation: `vite-plugin/ThemeGeneratorVitePlugin.ts`
- Design constraints: `docs/design-contract.yaml`

The implementation follows the mainstream token layering used by design systems:

1. Primitive tokens: raw palette and base dimensions.
2. Semantic tokens: surface, text, border, status, interaction, and link meaning.
3. Component tokens: control height, table row height, navigation item height, minimum target.
4. Implementation bridge: Naive UI theme overrides and Tailwind CSS variables.

## Current Token Scope

### Typography

- Use `Inter` and `Noto Sans SC`.
- Use `typographyTokens` for body, title, heading, weights, and line heights.
- Avoid viewport-scaled font sizes. Use explicit token sizes.

### Layout And Density

- Desktop design canvas: 1440px.
- Content max width: 1200px.
- Desktop grid: 12 columns, 24px gutter, 120px margin.
- Mobile grid: 4 columns, 16px gutter, 16px margin.
- Spacing scale: 4, 8, 16, 24, 32, 48, 64, 80, 120px.
- Minimum interactive target: 24px.

### Component Semantics

Mockups must explicitly show these component categories:

- Navigation: sidebar item default, hover, active, collapsed.
- Data table: header, row, row hover, selected row, loading, empty state.
- Form controls: input, select, date picker, validation error, disabled.
- Status tags: draft, pending, approved, rejected, archived.
- Overlay feedback: modal, popover, notification.

### Accessibility

- Body text must meet WCAG AA contrast target of at least 4.5:1.
- Non-text UI indicators, focus rings, borders, and state indicators should target at least 3:1.
- Icon-only actions and compact controls must keep at least 24px hit targets.

## GPT Image Prompt Template

```text
Use case: ui-mockup
Asset type: Figma-ready high-fidelity enterprise web app screen

Primary request:
Create a desktop UI mockup for a contract management system page.

Product context:
- Contract management, approval workflows, electricity sales agreements, work orders.
- Internal enterprise users performing repeated operational tasks.
- Prioritize scanability, information density, state recognition, and low-friction actions.

Canvas and layout:
- 1440x1024 desktop frame.
- 12-column grid, 120px outer margin, 24px gutter.
- Fixed left sidebar 240px, top header 64px.
- Main content max width 1200px.
- Use the 4/8px spacing system.
- Do not nest cards inside cards.

Design tokens:
- Font: Inter + Noto Sans SC.
- Radius: 4px, 8px, 12px.
- Body background: #f8fafc.
- Card/surface background: #ffffff.
- Subtle surface: #f1f5f9.
- Main text: #0f172a.
- Body text: #334155.
- Secondary text: #64748b.
- Border: #e2e8f0.
- Primary: #334155.
- Link/accent: #2563eb.
- Success: #15803d.
- Warning: #b45309.
- Error: #b91c1c.

Required components:
- Sidebar navigation with active item.
- Header with page context, search or compact utility controls.
- Query/filter area with customer name, agreement status, signing date, owner, and more filters.
- Data table with agreement number, customer, contract type, signing status, approval status, seller, updated time, and actions.
- Status tags: Draft, Pending Approval, Signed, Rejected, Archived.
- Right detail panel or compact summary panel for the selected agreement.

Figma handoff requirements:
- Show Auto Layout-like grouping.
- Make spacing, padding, row height, input height, and button height visually inferable.
- Show default, hover, active, disabled, focus, loading, and empty states where appropriate.
- All colors must map to the token palette above. Do not invent decorative colors.
- Keep the UI quiet, utilitarian, and suitable for long work sessions.

Avoid:
- Marketing hero layout.
- Decorative gradients, blobs, or large illustrations.
- Oversized cards, large-radius pill-heavy styling, or low-density dashboard decoration.
- Unreadable small text or overlapping content.
```

## Review Checklist

- Can every visible color map to a semantic token?
- Can every spacing choice map to the spacing scale?
- Are table, form, navigation, status, and overlay states represented?
- Does the design remain implementable with Naive UI theme overrides and local component CSS?
- Are there any visual ideas that require a new token or component contract before implementation?
