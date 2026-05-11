# TODOS

## Validate API key during wizard setup

**What:** After collecting the API key in `npm run setup`, call `GET /athlete/0` to verify the key is valid before writing `.env`.

**Why:** Non-technical users who mistype or paste their key incorrectly get a clear "invalid API key" message during setup instead of a confusing 401 error the first time they try Claude. This is the most common onboarding failure mode.

**Context:** The current wizard (`src/setup.ts`) writes whatever string the user pastes without verifying it works. Adding a validation call requires constructing an axios instance mid-wizard before `.env` is written (the shared `client.ts` reads from `process.env`, which hasn't been updated yet). The fix: import `axios` directly in `setup.ts`, construct a one-off instance with the collected key, call `GET https://intervals.icu/api/v1/athlete/0`, and only write `.env` on success. On failure, print the HTTP status and ask the user to check their key.

**Depends on:** The setup wizard (`src/setup.ts`) — ship that first (done as of this PR).
