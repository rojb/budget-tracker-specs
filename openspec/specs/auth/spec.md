# auth Specification

## Purpose
TBD - created by archiving change add-auth. Update Purpose after archive.

## Requirements

### Requirement: Account registration
The API SHALL let a visitor create an account with `POST /auth/register`, sending `name`, `email`
and `password`. On success it SHALL respond `201` with an `AuthSession` containing an access token
and the created `User`. `name` SHALL be 1 to 80 characters after trimming, `email` SHALL be a
valid email address, and `password` SHALL be 8 to 128 characters. The endpoint SHALL be public.

#### Scenario: Successful registration
- **WHEN** a visitor registers with name "Sofía Martínez", email "sofia@correo.com" and a 10-character password
- **THEN** the API responds `201` with `{ accessToken, user: { id, name, email, createdAt } }` and the new user can immediately call protected endpoints with that token

#### Scenario: Duplicate email
- **WHEN** a visitor registers with an email that already belongs to an account, in any letter case
- **THEN** the API responds `409` with the standard error shape and creates no second account

#### Scenario: Invalid registration payload
- **WHEN** a visitor registers with a malformed email and a password of 5 characters
- **THEN** the API responds `400` with a `message` array containing one entry per violated constraint

#### Scenario: Unknown property rejected
- **WHEN** a visitor registers sending an extra property such as `role`
- **THEN** the API responds `400` naming the offending property

### Requirement: Email normalization and uniqueness
The API SHALL store and compare emails in lowercase with surrounding whitespace removed. Two
accounts SHALL NOT share the same normalized email, and the uniqueness SHALL be enforced by the
database, not only by application code.

#### Scenario: Mixed-case registration
- **WHEN** a visitor registers with "Sofia@Correo.COM"
- **THEN** the returned user has email "sofia@correo.com"

#### Scenario: Mixed-case login
- **WHEN** the owner of "sofia@correo.com" logs in typing "SOFIA@correo.com"
- **THEN** the login succeeds

### Requirement: Password protection
The API SHALL store passwords only as an Argon2id hash and SHALL NOT store, log or return the
plain password or its hash. No response of any endpoint SHALL contain a password or hash field.

#### Scenario: Password never returned
- **WHEN** any endpoint returns a `User` or an `AuthSession`
- **THEN** the payload contains no `password`, `passwordHash` or similar field

#### Scenario: Stored as slow hash
- **WHEN** an account is created
- **THEN** the persisted credential is an Argon2id hash, never the plain text and never a fast hash

### Requirement: Login
The API SHALL let a registered user obtain a session with `POST /auth/login`, sending `email` and
`password`. On success it SHALL respond `200` with an `AuthSession`. Any credential failure SHALL
respond `401` with one generic message that does not reveal whether the email exists. The endpoint
SHALL be public.

#### Scenario: Successful login
- **WHEN** a registered user logs in with the correct email and password
- **THEN** the API responds `200` with `{ accessToken, user }`

#### Scenario: Wrong password
- **WHEN** a registered user logs in with a wrong password
- **THEN** the API responds `401` with `message: "Invalid email or password"`

#### Scenario: Unknown email
- **WHEN** someone logs in with an email that has no account
- **THEN** the API responds `401` with exactly the same body as for a wrong password

#### Scenario: Missing fields
- **WHEN** a login request omits the password
- **THEN** the API responds `400` with a validation error

### Requirement: Session token
A session SHALL be a signed JWT access token sent as `Authorization: Bearer <token>`. The token
SHALL identify the user, SHALL expire after a configurable period (default 7 days) and SHALL be
signed with a secret supplied through the environment. The API SHALL sign tokens with HS256 and
SHALL accept only tokens signed with HS256 by that secret: a token signed with any other algorithm,
even with the same secret, and a token with no signature (`alg: none`) SHALL be rejected. The API
SHALL refuse to start without the secret. There SHALL be no refresh token; when the token expires
the user logs in again.

#### Scenario: Token identifies the user
- **WHEN** a protected endpoint is called with a valid token
- **THEN** the request is attributed to the user the token was issued for

#### Scenario: Missing secret
- **WHEN** the API starts without a signing secret configured
- **THEN** startup fails with a configuration validation error

#### Scenario: Token signed with another algorithm
- **WHEN** a client calls a protected endpoint with a token signed with HS512 using the server's own secret
- **THEN** the API responds `401` with the standard error shape

#### Scenario: Unsigned token
- **WHEN** a client calls a protected endpoint with a token whose header declares `alg: none`
- **THEN** the API responds `401` with the standard error shape

### Requirement: Protected endpoints
Every endpoint not declared public SHALL reject requests without a valid session. Rejection SHALL
be `401` with the standard error shape for a missing header, a malformed token, a token with a
wrong signature, and an expired token.

#### Scenario: No token
- **WHEN** a client calls `GET /users/me` without an `Authorization` header
- **THEN** the API responds `401` with `{ statusCode: 401, message, error: "Unauthorized" }`

#### Scenario: Invalid token
- **WHEN** a client calls `GET /users/me` with `Authorization: Bearer garbage`
- **THEN** the API responds `401`

#### Scenario: Expired token
- **WHEN** a client calls a protected endpoint with a token past its expiry
- **THEN** the API responds `401`

#### Scenario: Token of a deleted user
- **WHEN** a client presents a valid token whose user no longer exists
- **THEN** the API responds `401`

### Requirement: Public endpoints
Only `GET /health`, `POST /auth/register` and `POST /auth/login` SHALL be public. They SHALL be
marked with an empty security requirement in the contract. Any endpoint added later is protected
unless it is explicitly marked public.

#### Scenario: Public without header
- **WHEN** a client calls `GET /health`, `POST /auth/register` or `POST /auth/login` without an `Authorization` header
- **THEN** the API does not reject the request for missing authentication

#### Scenario: New endpoint defaults to protected
- **WHEN** a developer adds a controller route without marking it public
- **THEN** calling it without a token responds `401`

### Requirement: Current user
The API SHALL expose `GET /users/me`, returning the `User` of the session (`id`, `name`, `email`,
`createdAt`) with `200`.

#### Scenario: Fetch own profile
- **WHEN** a client calls `GET /users/me` with a valid token
- **THEN** the API responds `200` with that user and no credential field

### Requirement: Client session persistence
The mobile app SHALL keep the access token in platform secure storage, restore it on startup and
attach it to every API call as a bearer token. The app SHALL show the sign-in screen when there is
no stored token and the signed-in area when there is one. While the token is being restored the
app SHALL show a neutral loading state, not the sign-in screen.

#### Scenario: Session survives restart
- **WHEN** a signed-in user force-closes and reopens the app
- **THEN** the app opens the signed-in area without asking for credentials

#### Scenario: Cold start without session
- **WHEN** the app starts with no stored token
- **THEN** it shows screen 18 Acceso

#### Scenario: Token rejected by the API
- **WHEN** any API call responds `401` while the app holds a token
- **THEN** the app discards the token and returns to screen 18 Acceso

### Requirement: Logout
The app SHALL let a signed-in user end the session. Logout SHALL delete the stored token and
return the user to screen 18 Acceso, and the back stack SHALL NOT allow returning to signed-in
screens.

#### Scenario: Sign out
- **WHEN** a signed-in user chooses to sign out
- **THEN** the stored token is deleted and screen 18 Acceso is shown

#### Scenario: Relaunch after logout
- **WHEN** the app is restarted after logout
- **THEN** screen 18 Acceso is shown

### Requirement: Screen 18 Acceso
Screen 18 SHALL show a hero card ("Sobres" / "Cada peso con un destino, antes de gastarlo."), the
title "Iniciar sesión", an Email `TextField`, a Contraseña `TextField` with a show/hide toggle, a
primary "Entrar" `Button` and the link "¿No tenés cuenta? Crear cuenta". Screens SHALL be built
only from `packages/ui` components and match `design/screens/18-acceso.png`.

#### Scenario: Successful sign-in
- **WHEN** the user submits valid credentials
- **THEN** the button shows a loading state while the request is in flight, then the app leaves the sign-in flow for the signed-in home (screen 01/02 placeholder until those changes ship)

#### Scenario: Wrong credentials
- **WHEN** the API answers `401`
- **THEN** the password field enters its Error state and the message "Email o contraseña incorrectos. Revisalos e intentá de nuevo." is shown below the form, and no toast is shown

#### Scenario: Network failure
- **WHEN** the request cannot reach the API
- **THEN** an Error `Toast` explains that the connection failed and the form keeps what the user typed

#### Scenario: Empty fields
- **WHEN** the user taps "Entrar" with an empty email or password
- **THEN** the empty field shows its Error state with a message and no request is sent

#### Scenario: Go to sign-up
- **WHEN** the user taps "Crear cuenta"
- **THEN** screen 19 is shown

### Requirement: Screen 19 Crear cuenta
Screen 19 SHALL show a hero card ("Empezá" / "Un plan propio, con tus cuentas y tus sobres."), the
title "Crear cuenta", `TextField`s for Nombre, Email and Contraseña, a primary "Crear cuenta"
`Button` and the link "¿Ya tenés cuenta? Iniciar sesión", matching `design/screens/19-crear-cuenta.png`.

#### Scenario: Successful sign-up
- **WHEN** the user submits valid data
- **THEN** the account is created, the session is stored and screen 34 Bienvenida is shown

#### Scenario: Email already registered
- **WHEN** the API answers `409`
- **THEN** the Email field enters its Error state with the message "Ya existe una cuenta con ese email"

#### Scenario: Field validation errors
- **WHEN** the API answers `400` with messages about a specific field, or local checks fail (empty name, invalid email, password shorter than 8)
- **THEN** each message is shown in the Error state of the field it belongs to, not as a toast

#### Scenario: Network failure
- **WHEN** the request cannot reach the API
- **THEN** an Error `Toast` explains that the connection failed and the form keeps what the user typed

#### Scenario: Go to sign-in
- **WHEN** the user taps "Iniciar sesión"
- **THEN** screen 18 is shown

### Requirement: Screen 34 Bienvenida
Screen 34 SHALL show the title "¿Cómo querés empezar?", the explanation "Elegí si vas a armar tu
plan desde cero o alguien ya te invitó a uno.", a lavender option "Crear mi plan" and a white
option "Tengo un código", each with an icon circle, a chevron, a title and a description, plus the
note "El código QR también funciona con la cámara del teléfono.", matching
`design/screens/34-bienvenida.png`. It SHALL only be reachable after a successful sign-up.

#### Scenario: Create a plan
- **WHEN** the user taps "Crear mi plan"
- **THEN** screen 20 Nuevo plan is shown (a placeholder route until `add-plans-and-accounts` ships)

#### Scenario: Have a code
- **WHEN** the user taps "Tengo un código"
- **THEN** screen 30 Unirse a un plan is shown (a placeholder route until `add-plan-sharing` ships)

### Requirement: Navigation by session
The app SHALL route by session state: without a session only screens 18 and 19 are reachable;
with a session, screens 18 and 19 are not reachable and the app opens the signed-in home. A
successful sign-in from 18 SHALL leave the auth flow for the home (screen 01 or 02); a successful
sign-up from 19 SHALL go to 34.

#### Scenario: Deep navigation without session
- **WHEN** an unauthenticated user tries to open a signed-in route
- **THEN** the app shows screen 18

#### Scenario: Auth screens with a session
- **WHEN** a signed-in user's app tries to open screen 18 or 19
- **THEN** the app shows the signed-in home instead

### Requirement: Contract and generated client
`openapi.yaml` SHALL describe `POST /auth/register`, `POST /auth/login` and `GET /users/me` with
their request and response schemas, and the two auth paths SHALL declare `security: []`. The
frontend API client SHALL be generated from `openapi.yaml`, never written by hand, and the
backend's exported spec SHALL NOT drift from the contract for these endpoints.

#### Scenario: Contract lists the endpoints
- **WHEN** a developer opens `openapi.yaml`
- **THEN** the three operations exist with `AuthSession`, `User`, `RegisterRequest` and `LoginRequest` schemas, and registration documents `201`, `400` and `409`, login documents `200`, `400` and `401`

#### Scenario: No drift
- **WHEN** the backend exports its OpenAPI document and it is compared with the contract
- **THEN** no breaking difference is reported for the auth endpoints
