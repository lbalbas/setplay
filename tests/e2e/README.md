# SetPlay — End-to-End Tests

Place Playwright E2E tests in this directory.

## Conventions

- Files must end in `.spec.ts`
- Focus on critical user flows only:
  - `dashboard.spec.ts` — Live Now dashboard renders streams
  - `calendar.spec.ts` — Event calendar search and filter
  - `theater.spec.ts` — Stream embed player and chat toggle
