## ADDED Requirements

### Requirement: Members stay current in the plans screen
Screen 16 Planes y miembros SHALL show the members and the member count ("Compartido · N
miembros") the server holds for each plan, not the ones it had when the session started. It SHALL
reload the plans when it opens, when the app returns to the foreground while it is open, and
periodically while it stays open, without interrupting what the user is doing and without a
restart. After the owner changes a role, removes a member or a member leaves, the screen SHALL
reload as well.

#### Scenario: Member joins while 16 is open
- **WHEN** the owner has 16 open on a plan with one member and another user joins with the plan's code
- **THEN** within a few seconds 16 lists the new member and the plan reads "Compartido · 2 miembros", without restarting the app

#### Scenario: Open 16 after a member joined
- **WHEN** a member joined while the owner was on another screen and the owner then opens 16
- **THEN** 16 shows the new member right away

#### Scenario: Server unreachable
- **WHEN** a reload of 16 fails because the server cannot be reached
- **THEN** the list that was already shown stays as it was and no error blocks the screen
