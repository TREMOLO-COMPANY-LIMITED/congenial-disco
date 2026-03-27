---
description: Run a focused security review for authentication, admin access, uploads, secrets, and external integrations.
allowed-tools: Read, Glob, Grep, Bash(git diff --name-only), Bash(git diff), Bash(git log --oneline -5)
---

# Security Review

Use this for changes involving authentication, authorization, admin features, uploads, user data, or external service credentials.

## Step 1: Determine the review scope

If `$ARGUMENTS` is provided, review that file or directory.
Otherwise inspect the most recent change set:

```bash
git diff --name-only HEAD~1
```

Read every target file before reviewing.

## Step 2: Security Checklist

### A. Authentication and Authorization

- are protected routes actually protected
- do admin routes rely on admin middleware or equivalent checks
- can one user access or modify another user's data unexpectedly
- are session and secret values sourced from environment variables

### B. Secrets and Sensitive Data

- no secrets, tokens, or credentials are hardcoded
- logs do not expose passwords, tokens, or private user data
- API responses do not leak internal-only fields

### C. Input Validation and Injection Risks

- inputs are validated at request boundaries
- dangerous HTML rendering is not introduced without sanitization
- DB access uses safe patterns already established in the codebase

### D. Upload and External Service Safety

- upload endpoints validate content type and size
- R2, Redis, Resend, and Sentry failures are handled safely
- public URLs and signed URLs are not over-permissive

### E. Integrity and Abuse Risks

- state-changing actions do not allow unauthorized role changes or self-escalation
- admin actions cannot accidentally remove all privileged access
- repeated requests do not create obvious duplicate or inconsistent outcomes

## Step 3: Report Findings

Use this structure:

```text
CRITICAL:
  [file:line] issue -> required fix

WARNING:
  [file:line] issue -> recommended fix

PASS:
  [check name] no issue found
```

## Final Verdict

- any `CRITICAL` finding means not ready to merge
- only `WARNING` findings means merge is possible with known follow-up
- all `PASS` means the reviewed scope passed the security review
