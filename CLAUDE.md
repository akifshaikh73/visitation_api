# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Express.js + MongoDB REST API for managing visitation/address listings, masjids, and user auth for the Markaz List application. The entire API lives in one file: [visitation_api.js](visitation_api.js) (~820 lines, single `addressRouter` mounted at `/api`).

`address_api.js` is legacy/dead code — an earlier `AddressAPI` class-based prototype that is never required or mounted by `visitation_api.js`. Don't extend it; all real routes live in `visitation_api.js`.

## Commands

```bash
npm install              # install deps
npm run dev               # NODE_ENV=local, nodemon auto-reload (uses .env.local)
npm run local              # same as npm run dev
npm run prod                # NODE_ENV=production, node (no reload, uses .env.production)
npm start                    # nodemon with no NODE_ENV set (system defaults)
```

There is no test suite (`npm test` is a stub that exits 1) and no lint config — don't assume either exists.

Windows PowerShell helpers in [scripts/](scripts/):
- `.\scripts\start.ps1 local|remote` — start against local or remote (production) Mongo
- `.\scripts\stop.ps1` / `.\scripts\status.ps1` — stop/check the server on port 3000
- `.\scripts\git-push.ps1 ["message"]` — interactive stage/commit/push

Manual endpoint testing: open [test.http](test.http) (VS Code REST Client format) — note its `@baseUrl` targets port 5000, matching the code's actual fallback port, while the README/docs describe port 3000. When running locally without `PORT` set in `.env.local`, the server listens on **5000** (`const port = process.env.PORT || 5000` in visitation_api.js), not 3000.

Swagger UI is served at `/api-docs`, generated from [docs/openapi.yaml](docs/openapi.yaml) at startup.

## Environment configuration

Env file is chosen by `NODE_ENV` and loaded as `.env.${NODE_ENV}` (defaults to `local` if unset) — see top of `visitation_api.js`. Required vars: `NODE_ENV`, `MONGODB_URI`, `PORT`. `.env.local` / `.env.production` are gitignored; never commit them.

Database name is hardcoded as `listingdb` throughout the route handlers (`client.db('listingdb')`) regardless of what's in the connection string's path.

## Architecture notes

- **Single shared connection promise**: `dbconnect` (a `MongoClient.connect(...)` promise) is created once at module load and reused by every route via `dbconnect.then(client => ...)`. There is no reconnect/retry logic — if the initial connect fails, routes will reject against that same failed promise.
- **Routing style**: every route is registered directly on `addressRouter` in `visitation_api.js` with `.then/.catch(next)` chains (a few newer ones use `async/await` in a try/catch instead — e.g. `/addressList/:id/nearby`). Errors are forwarded to the single error-handling middleware at the bottom of the file, which responds `500` with `{ error: err.message }`.
- **Route ordering matters**: `/masjids/login` is registered before `/masjids` and `/masjids/:id` specifically to avoid being shadowed by the `:id` param route — follow this pattern (specific paths before param routes) when adding new masjid/user routes.
- **Optimistic concurrency via `version`**: listing mutations increment `version` using a Mongo update pipeline (`$set` with `$add`/`$convert`), e.g. `{ $set: { ...fields, version: { $add: [{ $convert: { input: '$version', to: 'long', onError: 0, onNull: 0 } }, 1] } } }`. Follow this pattern for any new mutation on `listings`.
- **ID generation**: new listings get `_id` from `generateNextSequence(db)`, which atomically increments a single document in `database_sequences` (mirrors a legacy Java app's sequence strategy — do not switch to Mongo `ObjectId` for listings).
- **`exclusions` / `userExclusions` projections**: internal/legacy fields (`sequenceNumber`, `_class`, `listingSource`, `deliverycode` for listings; `password`, `_class` for users) are stripped via projection on read endpoints — apply the same projection when adding new read routes over `listings`/`users` unless the endpoint intentionally needs raw internal fields (e.g. `/addressList/:id/address2` currently doesn't project).
- **Auth is PIN-based, not token-based**: `POST /api/users/login` supports two paths — email+PIN (admin, bcrypt-compared against `users.password`) and PIN-only (general user, scans enabled users for a match). `POST /api/masjids/login` matches a plaintext PIN stored on the masjid doc directly (no hashing). There's no session/JWT layer; the client is expected to hold onto the returned `role`/`masjidSlug`.
- **Soft delete**: listings use `inactive: true` rather than deletion. Recording a visit with `response: "Duplicate"` (via `PUT /addressList/visit/:id`) auto-sets `inactive: true`.
- **Nearby search** (`GET /addressList/:id/nearby`): filters candidates by `masjidId` + presence of lat/lng server-side, then does Haversine distance + sort in JS (not a Mongo geospatial query/index).

## Key collections (database `listingdb`)

- `listings` — core visitation records: `_id` (string, from `database_sequences`), `firstName`/`lastName`, `address1`/`address2`/`city`/`zipcode`, `masjidId`/`unitId` (ints), `area`, `inactive`, `latestResponse`, `met`, `version`, `lastModifiedDate`, `visitHistory[]` (`{ createdDate, response, comments }`), `students[]`, `latitude`/`longitude`.
- `masjids` — `_id`/`id`, `name`, `pin` (plaintext), `landing` (slug used for masjid-scoped frontend routing), address fields.
- `users` — admin/general accounts: `email`, `password` (bcrypt hash), `masjidId`, `accessToMasjidIds[]`, `enabled`.
- `database_sequences` — single document with a `seq` field, incremented atomically for new `listings._id` values.

## Documentation to keep in sync

When adding/changing routes, update the route tables in both [docs/API.md](docs/API.md) and [docs/openapi.yaml](docs/openapi.yaml) (the latter is served live at `/api-docs`). [AGENT.md](AGENT.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) also contain route/pattern references and should stay consistent with the actual code — they currently lag behind some newer endpoints (e.g. `/addressList/:id/nearby`, `PUT /masjids/:id`, `PATCH /addressList/:id/address2`), so verify against `visitation_api.js` itself rather than trusting those docs at face value.
