## MODIFIED Requirements

### Requirement: Create a plan
The API SHALL let a signed-in user create a plan with `POST /plans`, sending a `name` (1 to 60
characters after trimming) and a `currencyCode` (`ARS`, `USD`, `EUR` or `BOB`), optionally a `timeZone`
(IANA name, default `America/Argentina/Buenos_Aires`) and optionally a `firstAccount`. The
creator SHALL become the plan's only member, with role `owner`. The response SHALL be `201` with
the plan.

#### Scenario: Plan with its first account
- **WHEN** Sofía creates "Mi plan" in `ARS` with first account "Banco Nación", type bank, opening balance 300.000
- **THEN** the API responds `201` with the plan (currency `{ code: ARS, symbol: $, name: pesos, minorUnits: 0 }`, Sofía as `owner`) and the account exists in the plan with balance 300.000

#### Scenario: Plan in bolivianos
- **WHEN** a user creates "Viaje a La Paz" in `BOB` with first account "Banco Unión", type bank, opening balance 1.250,50
- **THEN** the API responds `201` with the plan (currency `{ code: BOB, symbol: "Bs.", name: bolivianos, minorUnits: 2 }`, the user as `owner`) and the account exists in the plan with balance 125050 minor units

#### Scenario: Plan without an account
- **WHEN** a user creates a plan with only a name and a currency
- **THEN** the plan is created with no accounts

#### Scenario: Invalid plan
- **WHEN** a user creates a plan with an empty name, currency `BRL` or time zone `Mars/Base`
- **THEN** the API responds `400` with one message per violated constraint and creates nothing

#### Scenario: Creation is atomic
- **WHEN** the first account in the request is invalid
- **THEN** neither the plan nor the account is created
