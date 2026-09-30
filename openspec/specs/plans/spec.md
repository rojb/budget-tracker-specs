# plans Specification

## Purpose
Lets a signed-in user create, list, rename and delete budget plans, each an isolated scope with a
currency fixed at creation and one or more members with a role, and lets the app show, choose
and switch the active plan.

## Requirements

### Requirement: Create a plan
The API SHALL let a signed-in user create a plan with `POST /plans`, sending a `name` (1 to 60
characters after trimming) and a `currencyCode` (`ARS`, `USD` or `EUR`), optionally a `timeZone`
(IANA name, default `America/Argentina/Buenos_Aires`) and optionally a `firstAccount`. The
creator SHALL become the plan's only member, with role `owner`. The response SHALL be `201` with
the plan.

#### Scenario: Plan with its first account
- **WHEN** Sofía creates "Mi plan" in `ARS` with first account "Banco Nación", type bank, opening balance 300.000
- **THEN** the API responds `201` with the plan (currency `{ code: ARS, symbol: $, name: pesos, minorUnits: 0 }`, Sofía as `owner`) and the account exists in the plan with balance 300.000

#### Scenario: Plan without an account
- **WHEN** a user creates a plan with only a name and a currency
- **THEN** the plan is created with no accounts

#### Scenario: Invalid plan
- **WHEN** a user creates a plan with an empty name, currency `BRL` or time zone `Mars/Base`
- **THEN** the API responds `400` with one message per violated constraint and creates nothing

#### Scenario: Creation is atomic
- **WHEN** the first account in the request is invalid
- **THEN** neither the plan nor the account is created

### Requirement: Immutable plan currency
A plan's currency SHALL be fixed when the plan is created. No endpoint SHALL change it. Every
amount of the plan SHALL be expressed in that currency's minor units.

#### Scenario: Currency in an update
- **WHEN** the owner sends `PATCH /plans/{planId}` with a `currencyCode`
- **THEN** the API responds `400` naming the property and the currency is unchanged

### Requirement: List my plans
`GET /plans` SHALL return every plan the signed-in user is a member of, each with its id, name,
currency, time zone, the caller's role and its members (user id, name, email, role, join
instant), ordered by creation. Plans the user is not a member of SHALL never appear.

#### Scenario: Two plans
- **WHEN** Sofía owns "Mi plan" and "Viaje a Chile" and is an editor of nothing else
- **THEN** the list contains exactly those two plans with `myRole: owner`

#### Scenario: Another user's plan
- **WHEN** Julián has a plan Sofía is not a member of
- **THEN** Sofía's list does not include it

### Requirement: Read one plan
`GET /plans/{planId}` SHALL return the plan to any of its members. For a user who is not a member,
or a plan that does not exist, it SHALL respond `404` without revealing whether the plan exists.

#### Scenario: Member reads
- **WHEN** a member requests the plan
- **THEN** the API responds `200` with the plan and its members

#### Scenario: Non-member reads
- **WHEN** a user who is not a member requests the plan
- **THEN** the API responds `404` with the standard error shape

### Requirement: Rename a plan
The plan's owner SHALL be able to change its name with `PATCH /plans/{planId}`. Editors and
viewers SHALL receive `403`.

#### Scenario: Owner renames
- **WHEN** the owner renames "Mi plan" to "Casa"
- **THEN** the API responds `200` with the new name

#### Scenario: Editor renames
- **WHEN** an editor tries to rename the plan
- **THEN** the API responds `403` and the name is unchanged

### Requirement: Delete a plan
The plan's owner SHALL be able to delete it with `DELETE /plans/{planId}`, which SHALL remove the
plan and everything scoped to it (members, accounts, budget months and assignments). Other members
SHALL receive `403`.

#### Scenario: Owner deletes
- **WHEN** the owner deletes a plan
- **THEN** the API responds `204` and a later `GET /plans/{planId}` responds `404`

#### Scenario: Viewer deletes
- **WHEN** a viewer tries to delete the plan
- **THEN** the API responds `403` and the plan still exists

### Requirement: Authorization by plan membership
Every endpoint scoped to a plan SHALL require the caller to be a member of that plan. Reading
SHALL be allowed to every role. Changing the plan's data (accounts and, in later changes,
envelopes, payees, transactions and assignments) SHALL be allowed to `owner` and `editor` and
rejected with `403` for `viewer`. Plan-level settings (rename, delete) SHALL be allowed to the
`owner` only.

#### Scenario: Viewer writes
- **WHEN** a viewer creates an account in the plan
- **THEN** the API responds `403`

#### Scenario: Non-member writes
- **WHEN** a user who is not a member creates an account in the plan
- **THEN** the API responds `404`

### Requirement: New plan screen
Screen 20 Nuevo plan SHALL let the user set the plan name (default "Mi plan"), pick the currency on
a three-option card (Pesos $, Dólares US$, Euros €, Pesos preselected, the choice shown in
lavender with a check) under the note "No se puede cambiar después de crear el plan.", and set the
first account's name and opening balance. Confirming "Crear plan" SHALL create the plan, make it
the active plan and open the Plan tab.

#### Scenario: Create from onboarding
- **WHEN** a new user reaches 20 from 34, keeps "Mi plan" and Pesos, and sets Banco Nación with $ 300.000
- **THEN** the plan is created and the Plan tab shows "Listo para asignar $ 300.000" and 0 active envelopes

#### Scenario: Dollar plan
- **WHEN** the user picks Dólares and enters an opening balance of 500,00
- **THEN** the balance is sent as 50000 minor units and later shown as `US$ 500,00`

### Requirement: Active plan
The app SHALL keep one active plan per signed-in user, remembered across app restarts. After
sign-in it SHALL open the remembered plan if the user is still a member, otherwise the first plan
of the list. A signed-in user with no plan SHALL be offered to create one (20) or join one (30).

#### Scenario: Restart keeps the plan
- **WHEN** the user switches to "Viaje a Chile" and restarts the app
- **THEN** the Plan tab opens "Viaje a Chile"

#### Scenario: No plans
- **WHEN** a signed-in user with no plans opens the app
- **THEN** the app offers "Crear mi plan" (→ 20) and "Tengo un código" (→ 30)

### Requirement: Plans and members screen
Screen 16 Planes y miembros SHALL list the user's plans with `PlanRow`: the active plan in lavender
with a check, the others with a chevron, each with its members' initials, "Solo vos" or
"Compartido · N miembros", and the currency name with its symbol (for example "pesos ($)"), never
an amount. Tapping a plan SHALL make it active and open its Plan tab. It SHALL offer "Nuevo plan"
(→ 20) and "Unirme con código" (→ 30), and list the members of the active plan with their role.

#### Scenario: Switch plan
- **WHEN** the user taps "Viaje a Chile" in 16
- **THEN** it becomes the active plan and the Plan tab shows it with amounts in `US$`

#### Scenario: Member roles
- **WHEN** the active plan has an owner and an editor
- **THEN** 16 lists them as "Titular" and "Puede editar" (a viewer as "Solo lectura"), with "(vos)" after the signed-in user's name; role labels are gender-neutral because the app does not know the member's gender

### Requirement: Plan currency in the app
Every amount of the active plan SHALL be displayed with its currency's symbol and minor units in
the es-AR format, and the Plan tab SHALL show a capsule with the symbol next to its title when the
currency is not pesos (screen 33).

#### Scenario: Dollar amounts
- **WHEN** the active plan is in USD and an account balance is 50000 minor units
- **THEN** it is displayed as `US$ 500,00`

### Requirement: Empty plan screen
When the active plan has no envelopes, the Plan tab SHALL show screen 06 Plan vacío: the
`JoinedCard` with "Listo para asignar" equal to the sum of the plan's account balances and "0
Sobres activos" with a muted "+", and a "Primeros pasos" checklist (Creaste tu plan ✓, Agregá tus
otras cuentas → 28, Creá tus sobres, Asigná tu dinero shown disabled), the template preview chips,
"Usar plantilla sugerida" and "Crear sobre vacío". Destinations built by later changes SHALL be
placeholder routes.

#### Scenario: Fresh plan
- **WHEN** the active plan has only Banco Nación with $ 300.000 and no envelopes
- **THEN** 06 shows "$ 300.000 Listo para asignar" and "0 Sobres activos"

#### Scenario: Add accounts from the checklist
- **WHEN** the user taps "Agregá tus otras cuentas"
- **THEN** screen 28 Nueva cuenta opens

### Requirement: Account menu
Screen 39 Menú de cuenta SHALL open from the avatar of the home screen as a bottom sheet with the
user's initials, name and email, and the entries "Planes y miembros" (→ 16), "Beneficiarios"
(→ 15), "Unirme con código" (→ 30) and a red "Cerrar sesión" that ends the session without extra
confirmation.

#### Scenario: Open plans from the menu
- **WHEN** the user taps the avatar and then "Planes y miembros"
- **THEN** screen 16 opens

#### Scenario: Sign out
- **WHEN** the user taps "Cerrar sesión"
- **THEN** the session ends and screen 18 is shown
