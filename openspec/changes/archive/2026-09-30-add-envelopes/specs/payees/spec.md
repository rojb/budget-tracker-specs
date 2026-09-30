# Spec Delta

## MODIFIED Requirements

### Requirement: Create a payee
The API SHALL let an owner or editor create a payee with `POST /plans/{planId}/payees`, sending a
`name` (1 to 60 characters after trimming) and optionally a `suggestedEnvelopeId`, which SHALL be an
envelope of the same plan (`404` otherwise, creating nothing). Two active payees of the same plan
SHALL NOT share a name, compared without letter case; a duplicate SHALL respond `409`. The response
SHALL be `201` with the payee.

#### Scenario: New payee
- **WHEN** Sofía creates "Coto" in her plan
- **THEN** the API responds `201` with `{ id, name: "Coto", transactionCount: 0, deleted: false }`

#### Scenario: Duplicate name
- **WHEN** the plan already has an active payee "Coto" and a member creates "coto"
- **THEN** the API responds `409` and no second payee is created

#### Scenario: Invalid payee
- **WHEN** a member creates a payee with an empty name
- **THEN** the API responds `400` with a validation error

#### Scenario: Suggested envelope of the plan
- **WHEN** a member creates "Coto" with `suggestedEnvelopeId` of the envelope Supermercado of the same plan
- **THEN** the API responds `201` and the payee carries that `suggestedEnvelopeId`

#### Scenario: Suggested envelope of another plan
- **WHEN** a member creates a payee with the id of an envelope that belongs to another plan, or that does not exist
- **THEN** the API responds `404` and no payee is created

## ADDED Requirements

### Requirement: Suggested envelope follows the envelope
Changing the `suggestedEnvelopeId` of an active payee with `PATCH` SHALL apply the same rule as on
creation (an envelope of the same plan, `404` otherwise). When an envelope is deleted, every payee
that suggested it SHALL lose its suggested envelope and keep everything else.

#### Scenario: Edit to a foreign envelope
- **WHEN** a member patches a payee with an envelope id of another plan
- **THEN** the API responds `404` and the payee is unchanged

#### Scenario: Suggested envelope deleted
- **WHEN** the envelope Supermercado is deleted while "Coto" suggests it
- **THEN** "Coto" is still listed, with no `suggestedEnvelopeId`
