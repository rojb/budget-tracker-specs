# Design

## Context

See proposal.md for the why. A move (`POST /plans/{planId}/envelopes/move`, `EnvelopesService.moveMoney`)
only calls `AssignmentsService.shiftAssignments` inside a transaction that holds the source envelope's
row lock (`SELECT ... FOR UPDATE NOWAIT`, RRG-52), so nothing remembers that it happened. The detail
of 22 asks the transactions list for the month and shows only that.

Sources: FR-24, FR-25; PRD-ux-spec.md §6.1 (rule 5 date grouping), §8 (`TxRow`), §9.5 rows 22 and 24;
renders `design/screens/22-detalle-de-sobre.png` and `24-mover-dinero.png`; `envelope-goals` spec;
`transactions` spec (registration order, RRG-57 D8).

## Goals / Non-Goals

**Goals:**
- Record each successful move atomically with its assignments and show it in 22 for both envelopes.
- Change no figure: assigned, available, spent and Ready to Assign stay what the engine computes.

**Non-Goals:**
- Showing moves in 10, 14, the totals or the reports: a move is not a transaction and touches no account.
- Reconstructing moves made before this change (no data exists), editing or undoing a move, recording
  who made it.
- A new `packages/ui` component, an endpoint, or test files of any kind.

## Data model

New table `envelope_moves` (entity `EnvelopeMove`, migration `AddEnvelopeMoves`, up and down):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `plan_id` | uuid NOT NULL | FK `plans` ON DELETE CASCADE |
| `from_envelope_id` | uuid NULL | FK `envelopes` ON DELETE SET NULL |
| `to_envelope_id` | uuid NULL | FK `envelopes` ON DELETE SET NULL |
| `from_envelope_name` | varchar NOT NULL | name when the move was made, same type as `envelopes.name` |
| `to_envelope_name` | varchar NOT NULL | idem |
| `amount_minor` | bigint NOT NULL | CHECK `> 0`; `minorAmountTransformer` like the other tables |
| `month` | char(7) NOT NULL | the month the move was made for, CHECK `YYYY-MM` |
| `created_at` | timestamptz NOT NULL | default `now()`; the registration instant |

Indexes on `(from_envelope_id, month)` and `(to_envelope_id, month)` serve the detail query. Down drops
the table (the history is disposable: no figure depends on it).

Why a table of its own, not a column on `assignments`: an assignment is one fact per envelope and month
that moves overwrite; a move is an event with a source, a destination and a time.

## Write path

Inside the existing `lockingSource` work callback of `moveMoney`, right after `shiftAssignments` and
with the same `EntityManager`, insert one `EnvelopeMove` row (names read from the already loaded
`rows`). It is therefore in the same database transaction as the assignments and under the same row
lock: a refused move throws `409` before the insert; a failure after it rolls both back; a retry after
`55P03` (lock busy) rolled back its whole attempt, so only the attempt that commits records a row.
The response and the figures are unchanged.

## API surface

| Operation | Path | Change |
|---|---|---|
| `getEnvelopeDetail` | `GET /plans/{planId}/envelopes/{envelopeId}/detail` | response `EnvelopeDetail` gains `moves` and `movesTotal` |
| `moveMoney` | `POST /plans/{planId}/envelopes/move` | no schema change; description says the move is recorded |

New schema `EnvelopeMove`: `id` (uuid), `direction` (`in` | `out`), `counterpartId` (uuid or null),
`counterpartName` (string), `amountMinor` (positive integer), `month` (`MonthKey`), `createdAt`
(date-time). `EnvelopeDetail.required` gains `moves` and `movesTotal`.

### Shape decision: separate `moves` array, not a union in `activity`

Options: (a) make `activity` a discriminated union of transaction and move items; (b) keep `activity`
as transactions and add `moves`.

Chosen (b):
- It is additive: no existing field changes meaning or type, so oasdiff reports no breaking change and
  `TransactionDto` and every client that reads `activity` keep working. A union would change the item
  type of an existing array, which regenerates `activity` as a polymorphic model in the Dart client and
  breaks `activity.items` consumers.
- Both lists carry `createdAt`, so the client merges two newest-first lists by `createdAt` (a
  two-pointer merge) and groups them by day; the server needs no new ordering code.
- `activityTotal` keeps its meaning (the number of transactions, so `spentMinor` and the count line
  up); `movesTotal` counts moves. Each list is capped at 100 on its own, which is far above what a
  month produces for moves.

Trade-off: the client does the merge. It is about ten lines and lives where the grouping already is.

`direction` is relative to the envelope of the detail, so the client needs no knowledge of which
envelope is which: `out` draws "Movido a <counterpart>" with `−`, `in` draws "Movido desde
<counterpart>" with `+`. `counterpartName` is the live name of the counterpart when it exists and
the stored snapshot when it does not.

The detail query: moves of the plan where `month` is the requested month and the envelope is the source
or the destination, ordered by `created_at DESC, id DESC`, `LIMIT 100`, plus a `count`. A new
`EnvelopeMovesService` (module `envelopes`) owns `record(manager, ...)`, `forEnvelope(...)` and
`discardOrphans(planId)`.

## Deleting an envelope

Both envelope FKs are `ON DELETE SET NULL` and the names are stored, so deleting an envelope keeps the
move in the surviving envelope's activity ("Movido desde Alquiler" still explains where its money came
from) with `counterpartId` null. The deleted envelope's own history disappears with it. After the
delete, `EnvelopesService.remove` deletes the moves of the plan whose two ids are null (both envelopes
gone), so no unreachable row stays; deleting the plan cascades through `plan_id`. Retention rather
than cascade because deleting an envelope returns only its own money to Ready to Assign: the money it
sent elsewhere stays assigned there, and the history that explains it must stay.

## Screen 22: row and tap behavior

No new component: a move is a `UiTxRow` (`packages/ui`, §8 `TxRow`).

| Part | Source | Destination |
|---|---|---|
| icon | `UiIcons.arrowLeftRight` (the icon of "Mover dinero") | same |
| title | "Movido a <counterpartName>" | "Movido desde <counterpartName>" |
| amount | `−$ X`, variant `expense` | `+$ X`, variant `income` (lavender capsule) |
| subtitle | time of `createdAt` ("14:32") | same |
| caption | none | none |

The subtitle shows the day and short month ("1 oct, 14:32") before the time only when the move's
`month` differs from the month it was registered in (a move made for another month), so it is never
ambiguous under a day header of a different month. The day header comes from `createdAt` like the
transactions, through the existing `buildDayGroups`; the page builds one list of items (transaction or
move) sorted by `createdAt` descending and ties by id, which is the merge.

Tap behavior: a move row is not tappable (`onTap: null`; `UiTxRow` already renders no pressed state
and no chevron then). PRD-ux-spec §9.5 row 22 defines only `TxRow → 12`, and a move has no screen of
its own (12 is the transaction editor and would be wrong). Opening the counterpart's 22 was
considered and rejected: it adds a navigation that §9.5 does not define, stacks 22 over 22 (back
returns to the envelope the user came from, which is confusing), and does not work when the
counterpart was deleted. A non-tappable row has no dead tap because it gives no affordance. The empty
state "Sin movimientos este mes" shows only when both lists are empty.

## Alternatives considered

- Record a synthetic transaction: it would enter 10, 14 and the totals, which the user ruled out, and
  needs an account.
- Derive moves from assignment changes: assignments hold only the latest value per month.
- Cascade delete of moves with the envelope: the surviving envelope would keep an assignment that no
  row explains.

## Risks

- A move recorded and its assignments diverging: avoided by one transaction and one manager.
- The retry loop of `lockingSource` runs `work` several times: each attempt owns its transaction, so a
  rolled-back attempt leaves no row (verified by comparing the row count with the number of successes
  under concurrency).
- History before the change is missing: documented, no backfill.

## Verification

Manual: curl against the real back for both details, `409` leaving no row, concurrent moves (rows ==
successes), figures before and after, 10 and 14 unchanged; migration up, down, up; oasdiff drift;
on the device, 22 of both envelopes against `design/screens/22-detalle-de-sobre.png` and 10 without
the move.
