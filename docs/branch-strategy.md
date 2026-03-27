# Branch Strategy and PR Workflow

This document describes the practical branch and pull request workflow for the current `starter` repository.

The default branch currently present in the local repository is `main`.

## Core Principles

- Keep `main` in a mergeable state.
- Always work in a topic branch.
- Prefer one clear purpose per branch.
- Split large work into multiple PRs when possible.
- Run at least `lint`, `test`, and `build` before merging.

## Branch Naming

Format:

```text
<type>/<short-description>
```

Common prefixes:

- `feat` - feature work
- `fix` - bug fixes
- `docs` - documentation updates
- `refactor` - refactoring
- `test` - test changes
- `chore` - maintenance work
- `ci` - CI-related changes

Examples:

```bash
git checkout -b feat/admin-user-detail
git checkout -b fix/verify-page-loading-state
git checkout -b docs/update-branch-strategy
git checkout -b refactor/auth-client-setup
```

## Starting Work

Create branches from the latest `main`.

```bash
git checkout main
git pull
git checkout -b <type>/<short-description>
```

Even if you cannot update `main` immediately, keep the rule that new work starts from `main`, not from an old feature branch.

## Scope of a Branch

Good split guidelines:

- separate API and UI changes when they are independently reviewable
- consider keeping DB schema changes in their own PR because of their blast radius
- keep docs-only updates in `docs/*` branches
- avoid mixing broad cleanup work into a bug-fix PR

Examples to avoid:

- putting auth fixes, admin UI updates, and DB migrations into one PR
- mixing unrelated refactors into a focused production fix

## Commit Messages

Conventional Commits style is recommended.

```text
<type>(<scope>): <subject>
```

Examples:

```text
feat(api): add admin users endpoint
fix(web): handle avatar upload retry
docs: update troubleshooting guide
refactor(shared): simplify auth types
test(admin): cover login redirect
```

### Suggested `type` values

`feat` | `fix` | `docs` | `refactor` | `test` | `chore` | `ci` | `build`

### Suggested `scope` values

`api` | `web` | `admin` | `db` | `shared` | `ui` | `docs` | `e2e`

### Rules

- keep the subject short and in English
- lowercase first word is preferred
- start with an action-oriented verb when possible
- keep one intent per commit

## Pre-PR Checks

At minimum, run:

```bash
pnpm lint
pnpm test
pnpm build
```

Additional checks when relevant:

```bash
pnpm --filter @starter/e2e e2e
pnpm db:migrate
```

Checklist:

- no unrelated changes are included
- `.env.local`, `.dev.vars`, and secrets are not staged
- DB schema changes include the required migration files
- documentation updates still match the codebase

## Opening a PR

```bash
git push -u origin <branch-name>
gh pr create
```

At minimum, the PR description should state:

- what changed
- why it was needed
- what areas are affected
- how reviewers can verify it

Example template:

```text
## Summary
- add admin user detail page
- connect the page to the existing users API

## Why
- allow admins to inspect user records without direct DB access

## How To Test
- pnpm --filter @starter/admin test
- open http://localhost:3001/users/:id
```

## Merge Strategy

- merge into `main` after review
- prefer squash merge to keep history readable
- optimize for meaningful PR-sized units of change

## Handling Conflicts

If `main` moved and your branch conflicts, resolve it in your current branch.

```bash
git fetch origin
git merge origin/main
```

After resolving conflicts, rerun:

```bash
pnpm lint
pnpm test
pnpm build
```

Using rebase is also fine if the team prefers it, but avoid complex history rewriting unless there is a clear reason.

## Current State of CI and Deployment

At the time of writing, this repository does not contain confirmed local configuration for `.github/workflows/`, `husky`, or `commitlint`.
This document therefore does not assume automation that is not currently present in the repo.

If CI is added later, a reasonable minimum pipeline would be:

- `pnpm install`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- optionally `pnpm --filter @starter/e2e e2e`

Current expected deployment split:

- `apps/web`: Vercel
- `apps/admin`: Vercel
- `apps/api`: Cloudflare Workers
- Database: Supabase PostgreSQL
- Redis: Upstash
- Storage: Cloudflare R2

## Related Documents

- `docs/development-workflow.md`
- `docs/troubleshooting.md`
- `docs/architecture.md`
