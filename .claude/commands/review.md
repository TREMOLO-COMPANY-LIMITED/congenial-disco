---
description: Perform a self-review for the current changes with a focus on correctness, regressions, and security.
allowed-tools: Read, Glob, Grep, Bash(git diff --name-only), Bash(git diff)
---

# Self Review

Read `CLAUDE.md` first, then review the files changed in this session.

Use:

```bash
git diff --name-only HEAD
git diff
```

Read all changed files before making conclusions.

## Review Checklist

Check every applicable item:

1. route behavior still matches the current architecture and docs
2. auth/session usage is correct for Better Auth flows
3. admin-only actions are properly guarded
4. request and response validation follow existing patterns
5. no obvious authorization gaps or IDOR paths exist
6. DB changes are reflected in shared types and consumers
7. upload, email, Redis, R2, and other external-service calls fail safely
8. sensitive values are not logged or hardcoded
9. tests cover the changed behavior sufficiently
10. docs were updated if the change alters setup, workflow, or architecture

## Output Format

Report findings first, using this structure:

- `CRITICAL: [file:line] issue and why it matters`
- `WARNING: [file:line] issue and recommended fix`
- `PASS: <check item>`

If there are no findings, say:

```text
No review findings. Residual risk: <brief note if any>.
```
