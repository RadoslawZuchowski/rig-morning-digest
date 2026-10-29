# Worker coordination

This file is the shared handoff protocol for agents working on the morning-digest plan.
GitHub issues are the durable coordination channel; do not rely on private agent memory or
chat history to communicate project state.

## Shared rules

- One worker owns one issue and works on its own branch or worktree, as required by `AGENTS.md`.
- Read the issue, `AGENTS.md`, `docs/vision.md`, `docs/styleguide.md`, and relevant ADRs before
  changing files.
- Before implementation, comment on the issue with the branch name, intended file scope, and
  any expected integration point. Keep scope disjoint from other active workers.
- Do not edit files owned by another issue. In particular, the coordinator owns `src/app.tsx`
  integration; workers provide isolated modules or views and report the import/route contract.
- Keep `runs/` read-only. Never commit `.env`, credentials, generated previews, or secrets.
- Run the checks required by the issue. Do not claim completion until the checks pass.
- Do not close an issue or merge/push a worker branch on behalf of the coordinator.

## Status and handoff

Use the issue comments as a durable message bus. Post a short update at start, when blocked, and
when ready for integration. A ready-for-integration comment must include:

```text
READY FOR INTEGRATION
Issue: #<number>
Branch: <branch name>
Files changed: <paths>
Contract / integration notes: <exports, route hooks, or none>
Checks: <commands and pass/fail>
Commit: <sha>
Blockers: none | <short description>
```

If blocked, post `BLOCKED` with the exact missing decision or dependency and stop work that would
conflict with other issues. The coordinator responds on the same issue thread so all workers can
see decisions.

## Parallel work and integration

- Issue #1 establishes and publishes the `src/digest/types.ts` contract first. Do not start the
  section 2 implementation before its commit is available on the default branch.
- After that contract lands, issues #2, #3, and #4 may be developed concurrently in separate
  worktrees and disjoint files. Issue #5 may prepare tests concurrently, but final route assertions
  and the green test run wait until route integration is complete.
- The coordinator alone integrates changes to shared route wiring in `src/app.tsx`, resolves
  conflicts, runs the full checks, and closes issues only when their stated done conditions hold.
- Keep every change small and issue-scoped. Commit messages use `closes #<number>` only when that
  commit actually completes the issue; otherwise use `refs #<number>`.

## Worker completion comment

When the coordinator confirms the issue's done condition, close it with the exact format from
`AGENTS.md`:

```text
done: <what changed, one line>
worker: <harness> · <model> · <effort>
commit: <sha or "none">
```
