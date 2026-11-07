# Proposal

## Why

During manual testing the user moved money from one envelope to another (screen 24) and, back in the
detail of both envelopes (screen 22), found "Sin movimientos este mes": the figures had changed but
nothing explained why. Today a move only adjusts two assignments (`AssignmentsService`) and leaves no
record, and the activity of 22 lists transactions only, so an envelope that only received or sent
money looks untouched while its Assigned and Available moved (FR-24, FR-25).

## What Changes

- Every successful move is recorded, in the same database transaction as the move, in a new table.
  A refused move (`409`, `404`, `400`) records nothing.
- The envelope detail (`GET .../envelopes/{envelopeId}/detail`) gains a `moves` array (and
  `movesTotal`) beside `activity`: the moves of the month in which the envelope was the source or the
  destination, newest first by registration instant. `activity` keeps its shape (transactions), so
  the change is additive.
- Screen 22 merges both lists by registration instant and draws a move as a `TxRow`: title "Movido a
  <Sobre>" with `−amount` on the source, "Movido desde <Sobre>" with `+amount` (lavender capsule) on
  the destination, a left-right arrows icon and the time in the subtitle. A move row is not tappable.
- Moves appear only in 22. They never appear in Movimientos (10) nor in the account detail (14), and
  they never count in "Salió / Entró", because a move touches no account.
- Figures do not change: Assigned, Available, Spent and Ready to Assign are computed exactly as
  before; `spentMinor` does not include moves.
- Deleting an envelope keeps the moves it took part in for the surviving envelope, which keeps showing
  the name of the deleted counterpart.
- Moves made before this change cannot be reconstructed (no data was kept); there is no backfill.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `envelope-goals`: "Envelope detail" (the month's activity now also carries the moves),
  "Move money between envelopes" (each move is recorded atomically) and "Envelope detail screen"
  (move rows).

## Impact

- Repos touched: `budget-tracker-specs` (`openapi.yaml`, specs), `budget-tracker-back` (new table and
  migration, move and detail services, DTOs), `budget-tracker-front` (regenerated `api_client`,
  screen 22).
- No new `packages/ui` component: the move row reuses `UiTxRow`.
- Depends on `add-envelope-goals` (archived), which introduced the detail and the move.
- Verification: manual, Swagger/curl against the real back (both envelopes' detail, `409` writes no
  row, concurrent moves) and on the device against `design/screens/22-detalle-de-sobre.png`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-specs, budget-tracker-back, budget-tracker-front
- FRs covered: FR-24, FR-25
- Screens: 22, 24
- Depends on: add-envelope-goals
- Size: S
- Linear: [RRG-59](https://linear.app/rgonaut/issue/RRG-59)
