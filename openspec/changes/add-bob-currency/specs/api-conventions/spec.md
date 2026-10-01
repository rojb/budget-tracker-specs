## MODIFIED Requirements

### Requirement: Plan currency
Each plan SHALL have exactly one currency, chosen when the plan is created and immutable
afterwards. The currency SHALL be one of exactly four options, represented in the contract by a
`Currency` object `{ code, symbol, name, minorUnits }`:

| code | symbol | name       | minorUnits |
|------|--------|------------|------------|
| ARS  | `$`    | pesos      | 0          |
| USD  | `US$`  | dólares    | 2          |
| EUR  | `€`    | euros      | 2          |
| BOB  | `Bs.`  | bolivianos | 2          |

#### Scenario: Currency of a plan
- **WHEN** the API returns a plan
- **THEN** it carries one `currency` object whose `code` is `ARS`, `USD`, `EUR` or `BOB` and whose other fields match the table

#### Scenario: Plan in bolivianos
- **WHEN** a client creates a plan with currency code `BOB`
- **THEN** the API responds `201` and the plan's `currency` is `{ code: BOB, symbol: "Bs.", name: "bolivianos", minorUnits: 2 }`

#### Scenario: Unsupported currency at creation
- **WHEN** a client creates a plan with a currency code other than `ARS`, `USD`, `EUR` or `BOB`
- **THEN** the API responds `400` with a validation error

#### Scenario: Currency change attempted
- **WHEN** a client tries to change the currency of an existing plan
- **THEN** the API rejects the request and the plan keeps its original currency
