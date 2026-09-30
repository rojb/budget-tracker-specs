# Spec Delta

## Purpose

Lets a plan's owner share it through a single-use invitation code (and its QR link) with a role,
lets another user preview and join the plan with that code, and lets the owner manage the members.

## ADDED Requirements

### Requirement: Invitation code
The owner SHALL be able to generate an invitation for a plan with
`POST /plans/{planId}/invitation`, choosing the role it grants (`editor` or `viewer`). The code
SHALL be six characters from an alphabet without ambiguous characters, shown as `XXX-XXX`, valid
for 24 hours and for a single use. A plan SHALL have at most one active invitation: generating a
new one SHALL revoke the previous one. Only the owner SHALL see or manage the invitation (`403`
for other members).

#### Scenario: Generate a code
- **WHEN** Sofía generates an invitation for "Casa con Juli" with role editor
- **THEN** the API responds `201` with `{ code: "K7M-4QX"-like, role: "editor", expiresAt: now + 24 h, link: "https://sobres.app/unirse/K7M4QX" }`

#### Scenario: Generate another code
- **WHEN** the owner generates a new code while one is active
- **THEN** the previous code stops working and only the new one is active

#### Scenario: Editor tries to invite
- **WHEN** an editor of the plan requests `POST /plans/{planId}/invitation`
- **THEN** the API responds `403`

### Requirement: Read and revoke the active invitation
`GET /plans/{planId}/invitation` SHALL return the active invitation to the owner, or `404` when
there is none (expired, used or revoked). `DELETE /plans/{planId}/invitation` SHALL revoke it and
respond `204`.

#### Scenario: Revoke
- **WHEN** the owner revokes the active code
- **THEN** the API responds `204` and joining with that code fails as invalid

### Requirement: Preview an invitation
Any signed-in user SHALL be able to preview an invitation with `GET /invitations/{code}`, with or
without the dash and in any letter case. The preview SHALL contain the plan name, the owner's
name, the plan currency, the role granted and the expiry, and SHALL NOT contain any amount or
member email. An unknown, expired, used or revoked code SHALL respond `404`.

#### Scenario: Valid code
- **WHEN** Julián previews `k7m4qx`
- **THEN** the API responds `200` with `{ planName: "Casa con Juli", ownerName: "Sofía Martínez", currency, role: "editor", expiresAt }`

#### Scenario: Expired code
- **WHEN** someone previews a code generated more than 24 hours ago
- **THEN** the API responds `404` with the standard error shape

### Requirement: Join with a code
A signed-in user SHALL join a plan with `POST /invitations/{code}/accept`, becoming a member with
the invitation's role; the response SHALL be `200` with the plan. The code SHALL then be used and
SHALL NOT work again, even under concurrent attempts. Joining a plan the user already belongs to
SHALL respond `409`; joining a plan that already has 5 members SHALL respond `409`.

#### Scenario: Join
- **WHEN** Julián accepts a valid editor code of "Casa con Juli"
- **THEN** Julián becomes an editor of the plan and the plan appears in Julián's `GET /plans`

#### Scenario: Single use
- **WHEN** another user tries the same code after Julián used it
- **THEN** the API responds `404` and no membership is created

#### Scenario: Already a member
- **WHEN** the owner accepts the code of their own plan
- **THEN** the API responds `409` and the code stays active

### Requirement: Manage members
The owner SHALL be able to change another member's role between `editor` and `viewer` with
`PATCH /plans/{planId}/members/{userId}` and remove another member with
`DELETE /plans/{planId}/members/{userId}`. A member other than the owner SHALL be able to leave the
plan by deleting their own membership. The owner's own membership SHALL NOT be changed or removed
(`409`), and other members SHALL NOT manage anyone else (`403`).

#### Scenario: Make a member read-only
- **WHEN** Sofía changes Julián from editor to viewer
- **THEN** Julián's writes to the plan respond `403` from then on

#### Scenario: Member leaves
- **WHEN** Julián deletes their own membership
- **THEN** the plan no longer appears in Julián's list and a later request to it responds `404`

#### Scenario: Owner cannot leave
- **WHEN** the owner deletes their own membership
- **THEN** the API responds `409` and the owner keeps the plan

### Requirement: Invite screen
Screen 21 Invitar miembro SHALL open from "Invitar con código" in 16 (owner only) and show
"Invitar a <plan>", the role chips Editor and Lector (the chosen one lavender), the code in large
type with a copy button that shows "Copiado" for about 1.5 s, the QR of the invitation link, "Vence
en 24 h · un solo uso", "Compartir código" (native share sheet with the code and link), "Generar
otro código", and a status card of the active code with its creation time and a way to revoke it.
Changing the role SHALL generate a new code with that role.

#### Scenario: Open 21 without an active code
- **WHEN** the owner opens 21 and the plan has no active code
- **THEN** a new editor code is generated and shown with its QR

#### Scenario: Copy the code
- **WHEN** the owner taps the code or the copy button
- **THEN** the code is copied to the clipboard and "Copiado" appears over it

#### Scenario: Revoke from 21
- **WHEN** the owner revokes the active code
- **THEN** the card shows that there is no active code and offers "Generar otro código"

### Requirement: Join screens
Screen 30 Unirse a un plan SHALL let the user type a code (dash optional) and join with "Unirme";
an invalid, expired or used code SHALL show the field in error with "Código vencido o inválido.
Pedile uno nuevo.". Its "Escanear QR" tab SHALL explain that the phone camera opens the invitation
link. Screen 45 Unirse desde enlace SHALL open from the link `https://sobres.app/unirse/<code>` and
show the plan preview (initials, plan name, "Administrado por <owner> · <currency> · rol <role>"),
the code, "Unirme a <plan>" and "No soy yo / usar otro código" (→ 30). Joining SHALL make the plan
active, open its Plan tab and show "Te uniste a <plan>".

#### Scenario: Join from 30
- **WHEN** Julián types `K7M-4QX` in 30 and taps "Unirme"
- **THEN** Julián joins, "Casa con Juli" becomes the active plan and the toast "Te uniste a Casa con Juli" appears

#### Scenario: Invalid code in 30
- **WHEN** the user types an expired code
- **THEN** the field shows the error and the user stays in 30

#### Scenario: Link without an account
- **WHEN** someone without a session opens `https://sobres.app/unirse/K7M4QX`
- **THEN** they sign up or sign in first and then land on 45 with the code already loaded

### Requirement: Member roles in 16
In 16, when the signed-in user is the owner, tapping another member's role SHALL open a sheet to
choose "Puede editar" or "Solo lectura" or to remove the member ("Quitar del plan", with
confirmation). A member who is not the owner SHALL see "Salir del plan", which removes their
membership after confirmation and switches to another plan.

#### Scenario: Change a role from 16
- **WHEN** Sofía taps Julián's "Puede editar" and picks "Solo lectura"
- **THEN** 16 shows Julián as "Solo lectura"

#### Scenario: Leave from 16
- **WHEN** Julián taps "Salir del plan" in "Casa con Juli" and confirms
- **THEN** the plan disappears from Julián's list and another plan (or the no-plan start) is shown
