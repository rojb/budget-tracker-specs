# Tasks

## 1. [specs]

- [x] 1.1 Create `openapi.yaml` (OpenAPI 3.1) at the repo root per design: `info`, `servers`, global `bearerAuth` security, `Health` tag, public `GET /health`, and components (`Error`, `ValidationError`, `Uuid`, `Timestamp`, `MonthKey`, `CurrencyCode`, `Currency`, `MoneyMinor`, `PageMeta`, `Page`/`PageSize` parameters, `Unauthorized`/`NotFound`/`ValidationFailed` responses); verify `npx @redocly/cli lint openapi.yaml` reports no errors. (specs d5b46d2)
- [x] 1.2 Update `docs/COLABORACION.md` §4 step 3 so it states that the drift check compares only the paths the backend implements and reports unimplemented contract paths without failing; verify the section matches the design. (specs 97775ef)

## 2. [back]

- [x] 2.1 Add `@nestjs/swagger`, create `src/openapi.ts` (`DocumentBuilder` title/version/bearer scheme/global security), serve Swagger UI at `/docs` in `main.ts` only when `NODE_ENV` is not `production`, and decorate the health endpoint (`@ApiTags('Health')`, public, response schema matching the contract); verify `npm run lint` and `npm run build` pass. (back 9b7f1a1)
- [x] 2.2 Add `src/scripts/export-openapi.ts` (preview-mode `NestFactory`, no database), the `openapi:export` npm script, and gitignore `openapi.generated.json`; verify `npm run openapi:export` writes the spec with Docker stopped. (back 13a23c4)
- [x] 2.3 Add `scripts/contract-drift.mjs` (implemented-paths regex, unimplemented paths as notice, `oasdiff breaking --fail-on ERR`, informational `oasdiff diff`) and the `contract-drift` job in `.github/workflows/ci.yml` (checkout `rojb/budget-tracker-specs`, export, pinned `oasdiff` binary); verify the script passes locally against `../2do/openapi.yaml` and fails against a deliberately altered copy of the generated spec. (back c6ccb0b)
- [x] 2.4 Document in `README.md` (Spanish) the `npm run openapi:export` command, Swagger UI at `/docs`, and how the drift check works; verify each documented command runs as written. (back 2f635b9)

## 3. Verification

- [x] 3.1 Offline verification: `npx @redocly/cli lint openapi.yaml` has no errors; `npm run lint` and `npm run build` pass; `npm run openapi:export` works without Docker; the drift script passes against the contract and fails against an altered copy; a glob for `*.spec.ts`/`*.test.ts`/`test/` (excluding `node_modules`) in both repos returns nothing. (verified against back 2f635b9 and specs 97775ef)
- [x] 3.2 Live verification (needs Docker/Postgres): Swagger UI at `/docs` shows `GET /health` matching `openapi.yaml` (tag, public, `{ status: "ok" }` response); `curl GET /health` returns `{ "status": "ok" }`. (verified 2026-09-29 on back main b55d50d: GET /health 200 {"status":"ok"}; /docs 200 Swagger UI; /docs-json /health tag Health, security [], 200)
