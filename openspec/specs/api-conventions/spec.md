# api-conventions Specification

## Purpose
TBD - created by archiving change api-contract-base. Update Purpose after archive.

## Requirements

### Requirement: Error response shape
Every non-2xx response from the API SHALL be a JSON object with `statusCode` (integer, equal to
the HTTP status), `message` (a string, or an array of strings for validation failures) and
`error` (the short HTTP reason phrase, e.g. `Not Found`).

#### Scenario: Resource not found
- **WHEN** a client requests a resource that does not exist
- **THEN** the API responds `404` with `{ "statusCode": 404, "message": "<reason>", "error": "Not Found" }`

#### Scenario: Unexpected server error
- **WHEN** an unhandled error occurs while serving a request
- **THEN** the API responds `500` with the same `{ statusCode, message, error }` shape and never leaks a stack trace

### Requirement: Bearer authentication by default
Every endpoint SHALL require an `Authorization: Bearer <JWT>` header unless the contract
explicitly marks it public with an empty security requirement. The contract SHALL declare a single
HTTP bearer security scheme applied globally.

#### Scenario: Protected endpoint without token
- **WHEN** a client calls an endpoint that is not marked public without a valid bearer token
- **THEN** the API responds `401` using the standard error shape

#### Scenario: Public endpoint opt-out
- **WHEN** a client calls an endpoint the contract marks public (e.g. `GET /health`)
- **THEN** the API responds without requiring an `Authorization` header

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

### Requirement: Money as integer minor units
Every monetary amount in a request or response SHALL be an integer expressed in the minor units of
the owning plan's currency, as defined by that currency's `minorUnits`, carried in a field whose
name ends in `Minor` (e.g. `amountMinor`). The currency is a property of the plan and SHALL NOT be
repeated per amount. Floating-point amounts SHALL NOT appear in the contract.

#### Scenario: Amount in a two-decimal currency
- **WHEN** a plan uses USD and an amount of US$ 12.50 is returned
- **THEN** the field is `amountMinor: 1250`

#### Scenario: Amount in a zero-decimal currency
- **WHEN** a plan uses ARS (0 minor digits) and an amount of $ 1.500 is returned
- **THEN** the field is `amountMinor: 1500`

#### Scenario: Non-integer amount submitted
- **WHEN** a client submits an amount with a fractional value
- **THEN** the API rejects it with `400` and a validation error

### Requirement: Formatting is a client responsibility
The API SHALL return amounts only as raw integers in minor units and SHALL NOT return
pre-formatted money strings. Clients format amounts for display using the es-AR locale (`.` as
thousands separator, `,` as decimal separator, decimals following the currency's `minorUnits`),
the plan currency's `symbol`, and a `−` sign placed before the symbol for negative amounts.

#### Scenario: Raw amount returned
- **WHEN** the API returns an available amount of −1250 for a USD plan
- **THEN** the field is the integer `amountMinor: -1250` and no string such as `"−US$ 12,50"` appears in the response

#### Scenario: Client displays a negative amount
- **WHEN** a client displays `amountMinor: -1250` for a USD plan
- **THEN** it renders `−US$ 12,50` using the currency's symbol and `minorUnits`

### Requirement: UUID identifiers
Every entity identifier exposed by the API SHALL be a UUID (version 4) string, in path parameters,
request bodies and responses.

#### Scenario: Malformed identifier in path
- **WHEN** a client calls `/resources/not-a-uuid`
- **THEN** the API responds `400` with the standard error shape

### Requirement: ISO-8601 timestamps
Every instant SHALL be an ISO-8601 date-time string with a UTC offset (`format: date-time`),
e.g. `2026-09-29T14:30:00Z`.

#### Scenario: Timestamp in a response
- **WHEN** the API returns a creation or update instant
- **THEN** it is an ISO-8601 string with offset, never an epoch number or an offset-less string

### Requirement: Budget month keys
A budget month SHALL be identified by a string `YYYY-MM` (pattern `^\d{4}-(0[1-9]|1[0-2])$`)
wherever a month is a key, parameter or field.

#### Scenario: Valid month key
- **WHEN** a client requests month `2026-09`
- **THEN** the API accepts it as September 2026

#### Scenario: Invalid month key
- **WHEN** a client sends month `2026-13` or `2026-9`
- **THEN** the API responds `400` with a validation error

### Requirement: camelCase JSON
All JSON property names, request and response, SHALL use camelCase.

#### Scenario: Property naming
- **WHEN** any endpoint returns or accepts a JSON object
- **THEN** its property names are camelCase (`pageSize`, not `page_size`)

### Requirement: Offset pagination
Every list endpoint that can return an unbounded collection SHALL accept the query parameters
`page` (integer, 1-based, default 1) and `pageSize` (integer, default 20, maximum 100) and SHALL
respond with an envelope `{ items, page, pageSize, total }` where `total` is the count of all
matching items.

#### Scenario: Default page
- **WHEN** a client calls a list endpoint without pagination parameters
- **THEN** the response has `page: 1`, `pageSize: 20` and at most 20 items

#### Scenario: Page size above the maximum
- **WHEN** a client sends `pageSize=500`
- **THEN** the API responds `400` with a validation error

#### Scenario: Page past the end
- **WHEN** a client requests a page beyond the last one
- **THEN** the response has an empty `items` array and the correct `total`

### Requirement: Validation errors
A request that fails validation SHALL be rejected with `400` and the standard error shape, where
`message` is an array with one human-readable string per violated constraint.

#### Scenario: Several invalid fields
- **WHEN** a client sends a body that violates two constraints
- **THEN** the API responds `400` with `error: "Bad Request"` and a `message` array with two entries

#### Scenario: Unknown property
- **WHEN** a client sends a property that the request schema does not declare
- **THEN** the API responds `400` naming the offending property

### Requirement: Contract-first drift rule
`openapi.yaml` in the specs repository SHALL be the source of truth for the API. Every endpoint
implemented by the backend SHALL match the contract; the contract MAY describe endpoints the
backend has not implemented yet. The backend CI SHALL fail when an implemented endpoint diverges
from the contract in a breaking way, and SHALL report, without failing, contract paths that are
not implemented yet. The drift check SHALL run against the contract version the backend declares
it implements (a pinned specs commit recorded in the backend repository), not against a moving
branch, and that pin SHALL change only through an explicit commit. The check SHALL fail closed: it
SHALL fail, with a clear message, whenever the comparison tool cannot run or its output cannot be
interpreted, and the tool SHALL be installed from a release whose checksum is verified.

#### Scenario: Implemented endpoint diverges
- **WHEN** the backend's exported spec changes a response field type of an implemented endpoint relative to the contract
- **THEN** the backend CI check fails

#### Scenario: Contract ahead of the backend
- **WHEN** the contract defines a path the backend does not implement yet
- **THEN** the CI check passes and lists that path as not yet implemented

#### Scenario: Contract moves ahead of the pin
- **WHEN** the specs repository merges a new contract version and the backend has not bumped its pin
- **THEN** the backend CI keeps comparing against the pinned version and its result does not change

#### Scenario: Comparison tool cannot run
- **WHEN** the drift check cannot execute the comparison tool or cannot parse its output
- **THEN** the check fails with a message naming the cause, and never reports success

#### Scenario: Tool checksum mismatch
- **WHEN** the downloaded comparison tool does not match the committed checksum
- **THEN** the CI job fails before the tool is extracted or run
