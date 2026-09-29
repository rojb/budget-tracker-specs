# Design

## Context

First end-to-end vertical slice: contract in `openapi.yaml`, NestJS `users`/`auth` modules, a
generated Dart client and the Flutter screens 18 Acceso, 19 Crear cuenta and 34 Bienvenida.
`scaffold-backend` left the app with TypeORM (no entities, `synchronize: false`), a Joi-validated
config and a global `ValidationPipe`; `api-contract-base` fixed the error shape and the global
bearer scheme; `ui-foundation` provides the `Ui*` components.

Sources: FR-01 (PRD.md), PRD-ux-spec.md §5 (Acceso states), §6.1, §9.1, §9.5 (navigation map),
renders `design/screens/18-acceso.png`, `19-crear-cuenta.png`, `34-bienvenida.png`, capability specs
`api-conventions` and `ui-design-system`.

## Goals / Non-Goals

**Goals:**
- Register, login and `/users/me`, with a global default-protected guard.
- A generated, committed `packages/api_client` and a documented regeneration command.
- Session persistence, logout and session-based routing in the app.
- Screens 18, 19, 34 built from `packages/ui`.

**Non-Goals:**
- Refresh tokens, password reset, email verification, social login, rate limiting (academic scope).
- Screens 01/02, 20, 30: only placeholder routes so navigation is demonstrable.
- Authorization by plan membership (arrives with `add-plans-and-accounts`).
- Test files of any kind (repo rule); verification is manual.

## API surface

All three are added to `openapi.yaml` (first `[specs]` task) and to `budget-tracker-back`.

| Operation | Path | Auth | Request | Responses |
|---|---|---|---|---|
| `register` | `POST /auth/register` | public (`security: []`) | `RegisterRequest` | `201 AuthSession`, `400 ValidationFailed`, `409 Error` |
| `login` | `POST /auth/login` | public (`security: []`) | `LoginRequest` | `200 AuthSession`, `400 ValidationFailed`, `401 Error` |
| `getCurrentUser` | `GET /users/me` | bearer | none | `200 User`, `401 Unauthorized` |

Schemas (new in `components/schemas`, camelCase):
- `RegisterRequest { name: string 1..80, email: string format email max 254, password: string 8..128 }`
- `LoginRequest { email: string format email, password: string 1..128 }`
- `User { id: Uuid, name, email, createdAt: Timestamp }`
- `AuthSession { accessToken: string, user: User }`

`register` returns `201`; `login` returns `200` (`@HttpCode(200)`, Nest defaults POST to 201). The
login failure body is `{ statusCode: 401, message: "Invalid email or password", error: "Unauthorized" }`
for both unknown email and wrong password. Duplicate email is
`{ statusCode: 409, message: "Email already registered", error: "Conflict" }`. The server does not
echo whether the email exists on login; it does on register, which is the accepted trade-off of
a plain sign-up form (the client needs it for the field error on screen 19).

New tag `Auth` (register, login) and `Users` (me).

## Backend design

Per-feature modules, no hexagonal layers (`openspec/config.yaml`):

```
src/users/  users.module.ts users.controller.ts users.service.ts
            entities/user.entity.ts  dto/user.dto.ts
src/auth/   auth.module.ts auth.controller.ts auth.service.ts
            auth.guard.ts public.decorator.ts current-user.decorator.ts
            dto/register.dto.ts dto/login.dto.ts dto/auth-session.dto.ts
src/database/migrations/<timestamp>-CreateUsers.ts
```

- **Entity and migration.** `users(id uuid pk default gen_random_uuid(), name varchar(80) not null,
  email varchar(254) not null, password_hash varchar(255) not null, created_at timestamptz not null
  default now())` with `UNIQUE (email)` and `CHECK (email = lower(email))`, so uniqueness and
  normalization hold at the database. It is the first migration; `synchronize` stays false. Written
  by hand (no test database is used for `migration:generate`), applied with `npm run migration:run`.
- **Normalization.** DTOs trim `name` and `email` and lowercase `email` with `class-transformer`
  `@Transform`, before validation, on both register and login.
- **Hashing: `argon2` npm, Argon2id**, parameters `memoryCost 19456` (19 MiB), `timeCost 2`,
  `parallelism 1` (the OWASP minimum profile; cheap enough for a dev laptop and phone-driven demo).
  `PasswordHasher` lives in `AuthService`. Alternative `bcrypt` rejected: 72-byte limit and weaker
  against GPUs; PRD accepts either. On login with an unknown email the service still verifies against
  a fixed dummy hash so response time does not reveal the account.
- **Duplicate email.** `UsersService.create` inserts and maps the Postgres unique violation (`23505`)
  to `ConflictException`. A pre-check would race, so the constraint is the source of truth.
- **JWT.** `@nestjs/jwt`. Payload `{ sub: userId }`, HS256, signed with `JWT_SECRET`, expiry
  `JWT_EXPIRES_IN` (default `7d`). Both variables are added to the Joi schema: `JWT_SECRET` is
  required, min 32 characters, no default (startup fails without it); `JWT_EXPIRES_IN` defaults to
  `7d`. `.env.example` documents them. No refresh token.
- **Global guard.** `AuthGuard` is registered as `APP_GUARD` in `AuthModule`. It reads the
  `@Public()` metadata with `Reflector` (handler then class); when public it lets the request in,
  otherwise it requires a `Bearer` header, verifies signature and expiry with `JwtService`, loads the
  user with `UsersService.findById(sub)` (rejecting deleted users) and stores it on the request. Any
  failure throws `UnauthorizedException`, which renders the standard `{ statusCode, message, error }`
  shape. Passport is not used: one strategy, one guard.
- **`@Public()`** = `applyDecorators(SetMetadata(IS_PUBLIC, true), ApiSecurity({}))`, so runtime and
  the exported spec (`security: []` via the existing `markPublicOperations`) cannot disagree.
  `GET /health` switches from the bare `@ApiSecurity({})` to `@Public()`, otherwise it would become
  protected. `@CurrentUser()` is a param decorator returning the request user.
- **Controllers return DTOs**, never the entity: `UserDto` (`id`, `name`, `email`, `createdAt`) and
  `AuthSessionDto`, mapped in the service. `password_hash` is not a DTO field, so it can never be
  serialized.
- **Swagger.** All DTOs use `@ApiProperty`; controllers declare every documented status with
  `@ApiCreatedResponse/@ApiOkResponse/@ApiConflictResponse/@ApiUnauthorizedResponse/@ApiBadRequestResponse`
  and an `operationId` equal to the contract's, so `scripts/contract-drift.mjs` reports no drift.
- **CORS** is not needed for the mobile client.

## Contract tooling

`openapi.yaml` is linted with `npx @redocly/cli lint openapi.yaml`. After the back is implemented,
`npm run openapi:export` plus `node scripts/contract-drift.mjs ../2do/openapi.yaml` (or its
documented arguments) must report no drift for the three auth paths.

## Generated client (`packages/api_client`)

Generator: `@openapitools/openapi-generator-cli` (npx, Java available) with the `dart-dio`
generator, pinned in `openapitools.json` (`generator-cli.version`, `generators` config) and run from
the front repo:

```
npx @openapitools/openapi-generator-cli generate -g dart-dio -i ../2do/openapi.yaml -o packages/api_client
```

A README section (and an npm-free `regenerate` note) documents that command; the `openapitools.json`
pin keeps the generator version fixed. The output is committed in its own commit. The generator's
`test/` and `doc/` folders are deleted (no test files), and `packages/api_client` is excluded from
the root analyzer through `analysis_options.yaml` only if the generated code does not analyze clean.
The app depends on it by path; `packages/ui` never does. Generated files are never edited by hand:
fixes go to `openapi.yaml` or generator options and are regenerated.

## Frontend design

Layout under `lib/` (container/presentational, composition root injects everything):

```
lib/core/api/api_client_provider.dart    # builds Dio + generated Api classes, bearer interceptor
lib/core/session/session_storage.dart    # flutter_secure_storage wrapper (read/write/delete token)
lib/features/auth/
  auth_repository.dart      # wraps generated AuthApi/UsersApi, maps DioException -> AuthFailure
  auth_controller.dart      # ChangeNotifier: status unknown|signedOut|signedIn, user, restore/login/register/logout
  login_controller.dart     # form state for screen 18 (fields, loading, errors)
  register_controller.dart  # form state for screen 19
  login_page.dart  register_page.dart  welcome_page.dart   # screens 18, 19, 34
lib/features/placeholder/placeholder_page.dart             # screens 01/02, 20, 30 stand-ins
```

- **Session.** `AuthController.restore()` runs at startup: it reads the token, and if present calls
  `GET /users/me` to validate it and load the user (a `401` deletes the token; a network error keeps
  the token and enters `signedIn` with a cached-less user, so an offline start does not force a
  logout). While `status == unknown` the router shows a neutral splash (`bg` background, nothing
  else). `login`, `register` store the token then set the user. `logout()` deletes the token and sets
  `signedOut`.
- **Bearer and 401.** The Dio instance has an interceptor that adds `Authorization: Bearer` from the
  current token and, on any `401` response outside `/auth/*`, calls `AuthController.expire()` (delete
  token, `signedOut`). The base URL comes from `AppConfig.apiBaseUrl` (already `--dart-define`); on the
  device it is `http://localhost:3000` through `adb reverse`.
- **Cleartext HTTP.** Allowed for debug builds only: `android/app/src/debug/AndroidManifest.xml`
  gets `android:usesCleartextTraffic="true"`; the release manifest is untouched. `INTERNET` is already
  in the debug/profile manifests; it is added to `main` because the app now calls the network.
- **Secure storage.** `flutter_secure_storage` (Android Keystore-backed). `minSdk` is raised if the
  package requires it.
- **Router.** `createRouter(dependencies)` uses `refreshListenable: authController` and one
  `redirect`: `unknown` -> `/splash`; `signedOut` -> `/login` unless already on `/login` or `/register`;
  `signedIn` on `/login`, `/register` or `/splash` -> `/home`. Screen 34 (`/welcome`) is allowed only
  while signed in and is reached by `context.go` from register success. Routes: `/login` (18),
  `/register` (19), `/welcome` (34), `/home` (01/02 placeholder, with a "Cerrar sesión" affordance
  showing the user's name), `/plans/new` (20 placeholder), `/plans/join` (30 placeholder). Placeholder
  pages use a `UiButton` Secondary "Volver"/"Cerrar sesión" and a title stating the screen number and
  the change that will build it.
- **Navigation map (§9.5).** 18: "Entrar" -> `/home`, "Crear cuenta" -> `/register`. 19: "Crear
  cuenta" -> `/welcome`, "Iniciar sesión" -> `/login`. 34: "Crear mi plan" -> `/plans/new`, "Tengo un
  código" -> `/plans/join`.
- **Errors (PRD-ux-spec §5 "Acceso").** Field-level: `401` on login sets the message "Email o
  contraseña incorrectos. Revisalos e intentá de nuevo." shown by `UiFormMessage` under the form and
  the password `UiTextField` in Error (no message repeated inside it). `409` on register sets the Email
  field `errorText`. `400` `message[]` entries are matched by property name prefix (`email`,
  `password`, `name` as produced by class-validator) to the corresponding field; unmatched entries
  become the form message. Local checks run first (empty fields, email shape, password >= 8).
  Network errors (`DioExceptionType.connectionError|connectionTimeout|...`) and unexpected `5xx` show an
  Error `UiToast` ("No pudimos conectar. Revisá tu conexión e intentá de nuevo.") through `showUiToast`,
  keeping typed values. The submit `UiButton` shows a spinner and ignores taps while loading (loading
  state of §5).

## UI components

Screens are composed only from `packages/ui`. Existing components used: `UiTextField` (Email,
Contraseña with `eye`/`eyeOff` trailing icon toggling `obscureText`, Nombre with `user` icon, Email
with `mail` icon), `UiButton` Primary ("Entrar", "Crear cuenta"), `UiButton` Secondary
(placeholder actions), `UiToast` Error (network failure), `UiIcons`, tokens/typography.

New or modified `packages/ui` components, each with Widgetbook stories, each a small, separately
reviewable commit for the other developer (docs/COLABORACION.md §5); they are flagged here as
requiring review:
- **`UiHeroCard` (new, molecule)**: rounded (radius 32) image card with a dark bottom scrim, a
  white `display` title and white body subtitle over the photo (§7 "sobre foto: texto blanco").
  Takes an `ImageProvider`, title and subtitle; used by 18 and 19. Both screens use the
  `design/photos/emergencia.jpg` fjord photo, bundled as an app asset (the package stays image-free).
- **`UiOptionCard` (new, molecule)**: card of radius 28 with a 52 dp circle icon, chevron-right,
  title (`title` 22) and description (`body` muted); variants Lavender and White. Used by 34.
- **`UiFormMessage` (new, atom)**: `danger` text with a leading `circleAlert` icon, shown under a
  form; text plus icon so meaning is not by color alone. Used by 18.
- **`UiLinkRow` (new, atom)**: centered "prompt + action" row ("¿No tenés cuenta? **Crear cuenta**")
  with a 48 dp hit area on the action. Used by 18 and 19.
- **`UiButton` (modified)**: optional `loading` flag showing a small `ink` spinner and disabling taps.
- **`UiTextField` (modified)**: optional `textInputAction`, `onSubmitted`, `autofillHints`,
  `autocorrect`/`enableSuggestions` pass-throughs so the keyboard "next/done" flow and password
  managers work; visuals unchanged.
- **`UiIcons` (modified)**: adds `user`, `eyeOff`, `circleAlert`, `qrCode`, `camera`, `logOut`.

Screen 34's note row ("El código QR también funciona con la cámara del teléfono.") is a `camera`
icon plus `caption`-style text composed in the page from tokens; it has no interaction, so it is not
a component.

## Decisions

**JWT without refresh, 7 days.** Fewer moving parts for an academic project without deployment;
logout is client-side. Trade-off: a stolen token is valid until expiry; acceptable for the scope and
documented in the README.

**Guard by default, `@Public()` opt-out.** Matches `api-conventions` ("protected unless marked
public"): a forgotten decorator fails closed. Alternative (guard per controller) rejected as fail-open.

**`argon2` native module.** Ships prebuilt binaries for Windows/Linux/macOS Node 22; if a platform
lacks one the install fails loudly rather than silently degrading to a weaker hash.

**Generated client committed.** Reviewers and the other dev can build the app without Java;
regeneration is one documented command with a pinned generator version, so diffs are deterministic.

**Prism for development before the back exists.** `npx @stoplight/prism-cli mock
../2do/openapi.yaml -p 4010` serves the three endpoints from the contract examples; the front
README documents launching it and running the app with
`--dart-define=API_BASE_URL=http://10.0.2.2:4010`. Prism ignores JWT validity, so it only proves the
happy paths; the real back is the check for 401 behavior.

**Hero photo is an app asset, not part of `packages/ui`.** The package stays presentational and
free of app imagery; `UiHeroCard` accepts an `ImageProvider`.

## Risks / Trade-offs

- [`argon2` native build fails on a machine] -> prebuilt binaries cover the team's platforms; README
  notes the toolchain requirement.
- [Generator output does not analyze clean] -> exclude `packages/api_client` in the root analyzer
  configuration and note it; never hand-edit generated code.
- [Offline start keeps a possibly expired token] -> the first API call that returns `401` triggers
  `expire()` and the redirect to 18.
- [Change exceeds ~400 authored lines] -> accepted; commits stay one per task and generated code is
  excluded from the budget.

## Migration Plan

Additive. Run `npm run migration:run` once to create `users`; set `JWT_SECRET` in `.env` (documented
in `.env.example`; the back refuses to start without it). Rollback: `npm run migration:revert`; the
front change is additive routes and a new package, and reverting the branch restores the placeholder
home.
