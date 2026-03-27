---
description: Run the current pre-PR checks for this repository.
allowed-tools: Read, Glob, Grep, Bash(git status), Bash(git diff), Bash(pnpm lint), Bash(pnpm test), Bash(pnpm build), Bash(pnpm --filter), Bash(pnpm audit)
---

# Pre-PR Check

Run the following checks in order. Stop at the first hard failure and report the cause clearly.

## Step 1: Check the git state

```bash
git status
git diff --stat
```

Warn if there are unstaged or uncommitted changes.

## Step 2: Run lint

```bash
pnpm lint
```

Report any lint failures.

## Step 3: Run tests

```bash
pnpm test
```

Report failing packages or test files.

## Step 4: Run the production build

```bash
pnpm build
```

Report any build failures.

## Step 5: Optional security package audit

If network/package audit is available in the current environment, run:

```bash
pnpm audit --audit-level=moderate
```

If audit cannot run because of environment restrictions, say so explicitly rather than pretending it passed.

## Output Format

Use this structure:

```text
Pre-PR Check Result
━━━━━━━━━━━━━━━━━━━
✅/❌ Git state reviewed
✅/❌ Lint
✅/❌ Tests
✅/❌ Build
✅/❌ Audit (or skipped with reason)
━━━━━━━━━━━━━━━━━━━
Conclusion: PR ready / changes required
```
