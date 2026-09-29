## MODIFIED Requirements

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
