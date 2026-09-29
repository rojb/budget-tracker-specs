# Tasks

## [back]

- [x] 1.1 Scaffold `budget-tracker-back` with `@nestjs/cli` (npm, Node 22) and verify `npm run build` succeeds on the untouched scaffold. (f81db0f)
- [x] 1.2 Delete all default test artifacts (`src/**/*.spec.ts`, `test/`, Jest config in `package.json`, `test`/`test:*` scripts, `jest`/`ts-jest`/`supertest`/`@types/jest`/`@types/supertest`/`@nestjs/testing` devDependencies) and set `nest-cli.json` `generateOptions.spec: false`; verify a glob for `*.spec.ts`/`*.test.ts`/`test/` (excluding `node_modules`) returns nothing. (f5985f7)
- [x] 1.3 Add `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `joi` dependencies; add a config module with a Joi `validationSchema` for `DATABASE_HOST`/`DATABASE_PORT`/`DATABASE_USER`/`DATABASE_PASSWORD`/`DATABASE_NAME`/`PORT`/`NODE_ENV`; verify `npm run build` still succeeds. (802a3ac)
- [x] 1.4 Wire `TypeOrmModule.forRootAsync` in `AppModule` using `ConfigService`, with `autoLoadEntities: true` and `synchronize: false`; verify `npm run build` succeeds. (cf63e3e)
- [x] 1.5 Add standalone `src/database/data-source.ts` (CLI-only `DataSource`, reading `.env` via `dotenv`) and `src/database/migrations/` folder; add `migration:generate`, `migration:run`, `migration:revert` npm scripts; verify `npm run migration:run` executes against a running Postgres with no pending migrations. (501776c)
- [x] 1.6 Add `docker-compose.yml` with a `postgres:16` service, named volume, and healthcheck; add `.env.example` documenting all required variables; add `.env` to `.gitignore`; verify `docker compose up -d` brings the DB to healthy. (3cf8788)
- [x] 1.7 Register a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `main.ts`; verify `npm run build` succeeds. (052b2bc)
- [x] 1.8 Add/keep a `GET /health` endpoint returning `{ status: 'ok' }` on the default controller/service, removing the boilerplate "Hello World" response; verify `curl http://localhost:3000/health` returns `{ "status": "ok" }` with the app running and DB up. (4985615)
- [x] 1.9 Document the per-feature module convention (`src/<feature>/{<feature>.module.ts,.controller.ts,.service.ts,dto/,entities/}`) in `README.md`, without creating any feature module; verify the README section exists and matches `openspec/config.yaml`'s per-feature/no-hexagonal rule. (54dacc4)
- [x] 1.10 Add `.github/workflows/ci.yml` (Node 22, `npm ci`, `npm run lint`, `npm run build`, no test step); verify the workflow file is valid YAML and lists exactly those steps. (cda2b08)
- [x] 1.11 Write `README.md` (Spanish): requisitos, setup (`cp .env.example .env`, `docker compose up -d`, `npm ci`, `npm run migration:run`, `npm run start:dev`), convención de módulos por feature, regla sin tests, link al repo de specs; verify each documented command runs as written. (54dacc4)

## 2. Verification

- [x] 2.1 Manual verification checklist (no UI/API contract changes in this repo, so no Widgetbook/Swagger comparison applies): `npm run lint` passes; `npm run build` passes; `docker compose up -d` reports the Postgres healthcheck healthy; the app starts and its logs show TypeORM connected; `curl GET /health` returns `{ "status": "ok" }`; `npm run migration:run` succeeds against the running DB; a glob for `*.spec.ts`/`*.test.ts`/`test/` (excluding `node_modules`) in the repo returns nothing; `docker compose down` cleans up. (verified against cda2b08, no back-repo commit — verification only)
