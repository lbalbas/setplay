# Development Workflow

## Approach

Build SetPlay incrementally using a spec-driven, highly focused development loop. Context files in the `context/` directory define what to build, how to build it, and the active progress state. Always implement against these specifications — do not infer, speculate, or write placeholder code from scratch.

## Scoping Rules

- Implement one feature unit, endpoint, or database table change at a time.
- Prefer small, unit-testable increments over massive speculative codebase edits.
- Keep implementation boundaries distinct — do not combine frontend layout changes with database schema edits in the same step.

## When to Split Work

Split an implementation step if it mixes:

- Database schema changes and API route additions.
- Background cron worker matching logic and frontend stream card components.
- Push notification service worker registration and administrative manual override forms.

If a task cannot be fully tested and verified locally within a single turn, the scope is too broad — split it.

## Handling Missing or Ambiguous Requirements

- Do not invent product behavior.
- If a database boundary, API response shape, or matching algorithm rule is ambiguous, raise it as an open question in `progress-tracker.md` and clarify it with the user before writing any code.
- If you find deprecated methods or libraries in use, document the migration path in `architecture-context.md` before starting the refactor.

## Keeping Docs in Sync

Update the relevant context file whenever:

- The database schema in `src/server/db/schema.ts` is updated (update the corresponding architecture/database sections).
- The matching algorithm logic changes or a new API (e.g., YouTube streams) is added.
- The UI styling variables or design layout patterns are finalized.
- A phase or task is completed (update `progress-tracker.md`).

## Before Moving to the Next Feature Unit

1. The current feature unit passes all Vitest unit tests and builds without errors.
2. The code adheres to all guidelines in `code-standards.md`.
3. `progress-tracker.md` is updated to reflect the completed work.
