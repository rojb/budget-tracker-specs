## ADDED Requirements

### Requirement: Data stays current
The figures of the signed-in tabs SHALL NOT stay stale after the plan changed elsewhere. Screen 01
Inicio SHALL support pull to refresh, like 02, 10 and 13, and refresh the envelopes (so Ready to
Assign and the goals), the accounts and the movements. When the app returns to the foreground after
it was away for a minute or more, it SHALL reload the envelopes, the accounts and the
movements of the active plan without any gesture and without hiding what is shown; a reload that
fails SHALL keep the figures already shown. A refresh SHALL NOT change the active plan, the viewed
month or the open screen.

#### Scenario: Pull to refresh on Inicio
- **WHEN** another member assigned money while the user had Inicio open, and the user pulls down on 01
- **THEN** "Listo para asignar" shows the new figure

#### Scenario: Back to the app
- **WHEN** the user returns to the app after five minutes away
- **THEN** the figures of 01, 02, 10 and 13 are reloaded and show the current data

#### Scenario: Quick return
- **WHEN** the user leaves the app and returns after ten seconds
- **THEN** nothing is reloaded

#### Scenario: Reload fails
- **WHEN** the app returns to the foreground without a connection
- **THEN** the figures already shown stay and no error covers the screen

#### Scenario: Viewed month kept
- **WHEN** the user is viewing next month in 02 and the app reloads on return
- **THEN** 02 keeps showing next month
