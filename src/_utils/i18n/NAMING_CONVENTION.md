# i18n Naming Conventions

This project follows a **Domain-Driven** naming strategy for internationalization keys. This ensures keys are organized, scalable, and easy to find.

## Structure

Keys should be hierarchical, following the pattern:
`{domain}.{subdomain}.{category}.{key}`

### 1. Root Levels

- **`common`**: Shared across the entire app (e.g., buttons, generic labels, errors).
- **`auth`**: Authentication specific (Login, Register, Password Reset).
- **`layout`**: Global application shell (Menu, Header, Footer).
- **`domain`**: Business logic modules.

### 2. Common Categories

Within any level, use these standard categories to group keys:

- **`action`**: Buttons or interactive links (e.g., `submit`, `cancel`, `view`).
- **`field`**: Form labels, table headers, data attributes (e.g., `name`, `status`, `createdTime`).
- **`status`**: Enumerations for states (e.g., `pending`, `success`, `rejected`).
- **`message`**: Feedback messages, toasts, alerts (e.g., `success`, `confirmDelete`).
- **`validation`**: Form validation error messages.
- **`placeholder`**: Input placeholders.
- **`option`**: Dropdown/Sort options (often nested by field name).

## Naming Rules

1.  **CamelCase**: Use `camelCase` for all key segments (e.g., `companyName`, not `company_name`).
2.  **Noun-First**: For fields, use the noun (e.g., `name`).
3.  **Verb-First**: For actions, use the verb (e.g., `submit`, `viewItem`).
4.  **No Hungarian Notation**: Avoid type prefixes in the key name itself if the hierarchy explains it (e.g., use `validation.required` instead of `errRequired`).

## Examples

| Context            | Old Style (Avoid) | New Standard                     |
| :----------------- | :---------------- | :------------------------------- |
| **User's Name**    | `user.name`       | `domain.user.field.name`         |
| **Submit Button**  | `actions.submit`  | `common.action.submit`           |
| **Login Title**    | `login.text`      | `auth.login.title`               |
| **Status Label**   | `status`          | `common.label.status`            |
| **Pending Status** | `status.1`        | `domain.approval.status.pending` |

## Maintenance

- **Adding Keys**: Always check `common` first. If it's specific to a module, allow it in `domain.{module}`.
- **Removing Keys**: Search the codebase globally before deleting a key from `en.ts`/`zh.ts`.
