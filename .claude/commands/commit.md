---
description: Review staged work, generate a commit message, and create a focused commit for this repository.
allowed-tools: Read, Glob, Grep, Bash(git status), Bash(git diff), Bash(git add), Bash(git commit), Bash(git log)
---

# Review and Commit

Follow these steps in order.

## Step 1: Inspect the current diff

```bash
git status
git diff --stat
git diff
```

Understand what changed before staging anything else.

## Step 2: Perform a lightweight self-review

Read all changed files and check for:

1. route protection and authorization where required
2. correct use of Better Auth session and admin middleware
3. validation at boundaries using Zod or equivalent existing patterns
4. no obvious IDOR-style access paths
5. error handling around DB, upload, email, or external service operations
6. no hardcoded secrets or unsafe logging
7. tests updated when behavior changed
8. docs updated if the change alters workflow, architecture, or setup

If you find a critical issue, fix it before committing.

## Step 3: Generate the commit message

Use Conventional Commit style when possible:

```text
type(scope): short description
```

Suggested types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `build`

Suggested scopes:

- `api`
- `web`
- `admin`
- `db`
- `shared`
- `ui`
- `docs`
- `e2e`

The subject should be in English and start lowercase.

If `$ARGUMENTS` is present, use it as guidance for the message.

## Step 4: Stage only the intended files

Do not use `git add .`.
Stage files explicitly to avoid accidentally adding secrets or unrelated changes.

```bash
git add <file1> <file2> ...
git commit -m "<generated message>"
```

## Step 5: Report the result

Use this format:

```text
Commit complete: <commit message>
```
