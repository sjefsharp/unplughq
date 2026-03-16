---
artifact: fe-auth-pages
produced-by: frontend-developer
project-slug: unplughq
work-item: task-236-fe-auth-pages
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: approved
azure-devops-id: 236
---

# FE Auth Pages

## Deliverables

### Route Group: `(auth)/`
Centered layout, no sidebar, max-w-md, bg-surface background.

### Pages
- **`/signup`**: Email + password + confirm password. Zod validation with strength rules (8+ chars, upper/lower/number). autocomplete="email"/"new-password".
- **`/login`**: Email + password with "Forgot password?" link. autocomplete="email"/"current-password". Generic error display (no user enumeration).
- **`/forgot-password`**: Email input, sends reset link.
- **`/reset-password/[token]`**: New password + confirm. Token consumed from URL params.
- **`/settings`**: Account profile (name, email) + notification preferences (failed backups, system updates, weekly digest) with Switch toggles.

### Form Architecture
- react-hook-form v7 + @hookform/resolvers + Zod
- FormField/FormItem/FormLabel/FormControl/FormMessage pattern
- aria-invalid + aria-errormessage on validation errors
- fieldset/legend for grouped notification preferences
