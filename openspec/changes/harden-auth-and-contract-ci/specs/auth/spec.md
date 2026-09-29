## MODIFIED Requirements

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
