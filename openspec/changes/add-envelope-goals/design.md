# Design

## Context

See proposal.md for the why. The repos live side by side (`budget-tracker-back` and
`budget-tracker-front` inside the specs folder; the contract is `../openapi.yaml` from the back).
Already merged and reused here:

- Back: `Envelope` / `EnvelopeGroup` entities and `EnvelopesService` (`list`, `ledger`, `find`,
  `remove`), `AssignmentsService` (`setAssignment`, `setAssignments`, `ledgerRows`: one fact per
  envelope and month, upserted in one database transaction), `CalculationService` (pure, consumes a
  `PlanLedger`, returns `assignedMinor`, `carryoverMinor`, `spentMinor`, `availableMinor` per
  envelope and the month's Ready to Assign), `TransactionsService.list` (filters `envelopeId`,
  `from`, `to` in the plan's time zone), `PlanAccessService` (`READ_ROLES`, `WRITE_ROLES`, 404 for
  non-members, 403 by role), `month-key.ts` (`compareMonths`, `currentMonth`) and the Joi
  environment schema.
- Front: `EnvelopesController` / `EnvelopesRepository` (groups, lines, Ready to Assign of the loaded
  month), `PlanPage` (02) with `UiEnvelopeRow` (it already draws Funded, Underfunded, Overspent and
  Empty), `EnvelopeFormPage` (31), `showGroupPicker` (52), `showDeleteEnvelopeSheet` (43),
  `showEnvelopePicker` (36), `showAmountSheet`, `showTextEditSheet`, `showSaved`, `UiStripeBar`,
  `UiSheet`, `UiTxRow` and `buildDayGroups` for movements, `ApiGateway` (bearer token), `HomePage`
  (01, only the avatar so far).

Sources: FR-19, FR-20, FR-24, FR-25, FR-41 (PRD.md; FR-21, the plan-view filters, and the "+" of
the Ready to Assign card belong to RRG-51 and are untouched), PRD-ux-spec.md §5 (state "Sobre"),
§6.1, §7 "Forma" (stripes, dots, photos radius 32, glass panels), §8 (`EnvelopeRow`, Toast), §9.1 and
§9.5 (screens 01, 05, 22, 23, 24, 31, 40, 43, 50); renders
`design/screens/{01,05,22,23,24,31,40,43,50}-*.png`, `design/photos/`; `odd/tasks/goal-photo-and-states.md`;
capability specs `envelopes`, `budget-calc-engine`, `transactions`, `ui-design-system`,
`api-conventions`, `plans`, `plan-sharing`.

## Goals / Non-Goals

**Goals:**
- A goal per envelope (monthly, or amount by a date), with one server-side definition of the
  required amount and of Funded / Underfunded / Overspent that every client and the RRG-51 filters
  reuse.
- The envelope detail (22), edit (23), goal detail (05), options (40), photo (50), move money (24)
  screens and the goals carousel of 01, with the temporary long press on 02 replaced by the real
  entries.
- A goal photo stored by the backend, validated by content, resized, served only to members.

**Non-Goals:**
- Month navigation, the status filter chips (FR-21), the "+" of the Ready to Assign card (03, 53),
  month close and Reportes: other changes. 05's "Asignar a esta meta" is disabled until 03 exists.
- Photos in object storage or a CDN (PRD §9: local disk is enough), and removing orphaned photo
  files of deleted plans.
- Per-month goal history, notifications, savings projections.
- Test files of any kind (repo rule).

## API surface

Added to and modified in `openapi.yaml` (first `[specs]` task), tag `Envelopes` (the photo
suggestions too), all under bearer auth:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `createEnvelope` (modified) | `POST /plans/{planId}/envelopes` | owner, editor | `CreateEnvelopeRequest` + optional `goal` | `201 Envelope` (+ `goal`, `photoUrl`), `400`, `401`, `403`, `404`, `409` |
| `listEnvelopes` (modified) | `GET /plans/{planId}/envelopes?month` | member | — | `200 EnvelopeList` (lines gain `state`, `goalStatus`) |
| `setEnvelopeGoal` | `PUT /plans/{planId}/envelopes/{envelopeId}/goal` | owner, editor | `EnvelopeGoal` | `200 Envelope`, `400`, `401`, `403`, `404` |
| `clearEnvelopeGoal` | `DELETE /plans/{planId}/envelopes/{envelopeId}/goal` | owner, editor | — | `200 Envelope`, `400`, `401`, `403`, `404` |
| `getEnvelopeDetail` | `GET /plans/{planId}/envelopes/{envelopeId}/detail?month` | member | — | `200 EnvelopeDetail`, `400`, `401`, `404` |
| `moveMoney` | `POST /plans/{planId}/envelopes/move` | owner, editor | `MoveMoneyRequest` | `200 MoveMoneyResult`, `400`, `401`, `403`, `404`, `409` |
| `uploadEnvelopePhoto` | `POST /plans/{planId}/envelopes/{envelopeId}/photo` | owner, editor | `multipart/form-data` `file` | `200 Envelope`, `400`, `401`, `403`, `404`, `413`, `415` |
| `getEnvelopePhoto` | `GET /plans/{planId}/envelopes/{envelopeId}/photo` | member | — | `200 image/jpeg`, `400`, `401`, `404` |
| `deleteEnvelopePhoto` | `DELETE /plans/{planId}/envelopes/{envelopeId}/photo` | owner, editor | — | `200 Envelope`, `400`, `401`, `403`, `404` |
| `applySuggestedEnvelopePhoto` | `POST /plans/{planId}/envelopes/{envelopeId}/photo/suggested` | owner, editor | `SuggestedPhotoRequest` | `200 Envelope`, `400`, `401`, `403`, `404` |
| `listPhotoSuggestions` | `GET /envelope-photo-suggestions` | signed-in | — | `200 PhotoSuggestion[]`, `401` |
| `getPhotoSuggestionImage` | `GET /envelope-photo-suggestions/{suggestionId}/image` | signed-in | — | `200 image/jpeg`, `401`, `404` |

Schemas (camelCase, optional fields omitted rather than `null`, no 3.1 `null` types):
- `EnvelopeGoal { type: monthly | targetByDate, targetMinor >= 1, dueDate? (date) }`. Create takes it
  optionally; setting it is a `PUT` and clearing a `DELETE`, because a merge `PATCH` cannot express
  "no goal" without `null` (the same reason `add-transaction-editing-and-filters` chose `PUT`).
- `Envelope` gains the optional `goal` and the optional `photoUrl` (a path relative to the API, with a
  `?v=` version so a changed photo is a new URL). Additive: existing clients keep working.
- `EnvelopeState`: `funded | underfunded | overspent`. `GoalStatus { requiredMinor, missingMinor,
  savedMinor, remainingMinor, percent (0..100), monthsRemaining? }`. `EnvelopeLine` gains the required
  `state` and the optional `goalStatus`.
- `EnvelopeDetail { month, line: EnvelopeLine, carryoverMinor, activity: Transaction[],
  activityTotal }` (the `Transaction` schema of the transactions capability, unchanged).
- `MoveMoneyRequest { fromEnvelopeId, toEnvelopeId, amountMinor >= 1, month? }`, `MoveMoneyResult {
  month, readyToAssignMinor, from: EnvelopeLine, to: EnvelopeLine }`.
- `SuggestedPhotoRequest { suggestionId: vacaciones | auto | emergencia | mudanza }`, `PhotoSuggestion {
  id, name, imageUrl }`. The suggestion id is an enum, so an unknown id is a plain validation `400`.
- New error responses: `PayloadTooLarge` (`413`) and `UnsupportedMediaType` (`415`), and a
  `MoveExceedsAvailable` (`409`) example.

## Data model and migration

Goal and photo columns go **on the `envelopes` table**, not in a `goals` or `envelope_photos` table:

- The goal and the photo are 0..1 per envelope, always read with it (every list line and every detail
  needs both), never queried on their own, and have no history; a second table would add a join to
  the hottest query of the app and a lifecycle (create / replace / orphan) to keep in step with the
  envelope for no gain. Deleting the envelope deletes the goal with it by construction.
- Columns: `goal_type varchar(16) NULL`, `goal_target_minor bigint NULL`, `goal_due_date date NULL`,
  `photo_file varchar(120) NULL` (the storage key), `photo_updated_at timestamptz NULL`. Checks keep
  the row coherent whatever writes it: `goal_type IN ('monthly','targetByDate')`; `(goal_type IS
  NULL) = (goal_target_minor IS NULL)`; `goal_target_minor > 0`; `(goal_type = 'targetByDate') =
  (goal_due_date IS NOT NULL)`; `(photo_file IS NULL) = (photo_updated_at IS NULL)`.
- Derived values (`requiredMinor`, state, saved, percent) are **never stored**, per
  `budget-calc-engine`: the goal holds only the user's intent.

Migration `AddEnvelopeGoalsAndPhotos` adds the columns and checks (`ALTER TABLE ... ADD COLUMN`); `down`
drops them (goals and photo references of development data are lost on revert; the files stay on
disk). It runs, reverts and runs again as part of the verification.

## Goal, state and required amount (single source)

One pure module, `src/envelopes/goal-status.ts`, with no database access, holds the rules of the
`envelope-goals` capability and is the only place that computes them:

```
describeLine(goal | null, figures{assigned, carryover, spent, available}, month) -> { state, goalStatus? }
  required = monthly:      target
             targetByDate: max(0, ceil((target - carryover) / N)),  N = max(1, due - month + 1)
  state    = available < 0 -> overspent
             goal and assigned < required -> underfunded
             otherwise -> funded
  saved    = monthly: assigned; targetByDate: max(0, available)
  percent  = floor(100 * min(saved, target) / target)
  monthsRemaining (targetByDate) = max(0, due - month)
```

`EnvelopesService.list` calls it for every envelope with the engine's `EnvelopeMonthState` of the
requested month, so the list, the detail and the move result all return what it returns; RRG-51's
filters ("Sobregirados", "Falta") filter on the `state` of the same response and never re-derive it.
`due - month` is `compareMonths` of the month of `goal_due_date` and the viewed month; the due date
is a plain `YYYY-MM-DD`, its month the budget month it belongs to (no time zone is involved, as a
due date is not an instant). The integer ceiling uses integer arithmetic (`Math.floor((n + d - 1) / d)`
on safe integers), never floats for money.

Decisions behind the rules, all from the PRD and the UX spec: `Overspent` outranks the others because
the UX shows it as the alarm state (red, "Sobregirado") whatever the goal; `Underfunded` compares the
**assigned** amount with the requirement because 22 reads "100% asignado" for a monthly goal and
"Falta $ X" is what the month still needs; a target-by-date requirement is computed from the
**carryover**, not from the current Available, so it does not move while the user assigns (an
assigned-and-then-recomputed target would look funded one tap before it is); N counts the viewed
month because money assigned this month already counts toward the date; and spreading the shortfall
evenly (rounded up) is the simplest rule a user can verify by hand.

## Envelope detail

`getEnvelopeDetail` builds the line the same way as the list (it reuses `ledger` and
`calculateMonth` for the month and picks the envelope), and asks `TransactionsService.list` for the
activity with `envelopeId`, `from` = first day and `to` = last day of the month and `pageSize` 100, so
the plan time zone and the soft-delete rule are applied by the code that already owns them.
`EnvelopesModule` imports `TransactionsModule` (it does not import the envelopes module, so there is no
cycle). `activityTotal` is the list's `total`.

## Move money

`moveMoney` in `EnvelopesService`:

1. Both envelopes are loaded by id and plan (404 otherwise); same id or a non-positive or non-integer
   amount is `400`.
2. The month's figures are calculated once; if `amountMinor` is greater than the source's Available
   (including carryover) the call is `409` with the message "The source envelope has less available
   than the amount". The check uses the facts at that instant; a concurrent expense can still race
   it, which at worst leaves the source overspent, a state the app already represents.
3. One new method of `AssignmentsService`, `shiftAssignments(planId, month, deltas)`, applies
   `-amount` and `+amount` in one database transaction with `INSERT ... ON CONFLICT DO UPDATE SET
   amount_minor = assignments.amount_minor + EXCLUDED.amount_minor`, so there is no read-modify-write
   race between two moves, creates the budget month lazily as `setAssignments` does, and never touches
   other months or envelopes. Ready to Assign cannot change: the sum of the month's assignments is
   the same.
4. The result is the recalculated lines of both envelopes and Ready to Assign.

Decision (source cannot go negative): the PRD only says "mover dinero entre sobres dentro de un mismo
mes sin pasar por una transacción". 24 shows the source's "Disponible" and a "Mover $ X" bar and no
negative or overspent source, and "Sobregirado" is a state caused by spending (PRD-ux-spec.md §6
"Sobregiro inadvertido"). Letting a move create an overspent source would let a one-tap action produce
the alarm state the app tries to prevent, so the move is refused when it exceeds the source's
Available (`409`), and the screen disables the bar before it comes to that. The engine itself would
allow it (assignments may be negative), so the rule lives in the move, not in the engine.

## Goal photo

- **Library: `sharp`.** It installs on Windows with prebuilt binaries (checked: `npm install sharp`
  resolves `@img/sharp-win32-x64` and resizes a JPEG here), decodes JPEG, PNG and WebP, and has a pixel
  limit against decompression bombs. Alternatives rejected: `jimp` (pure JS, slow and heavy on 5 MB
  inputs) and a native `imagemagick` binary (an install step outside npm).
- **Upload.** `FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })` from
  `@nestjs/platform-express` (multer, in-memory: a file is at most 5 MB). A file over the limit is
  turned into `413` by Nest; a missing field is `400`.
- **Validation by content.** The first bytes decide the type: JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A
  1A 0A`, WebP `RIFF` + `WEBP` at offset 8. Anything else is `415`, whatever the file name or the
  multipart `Content-Type`. A file that passes the signature but fails to decode (`sharp` error) is
  also `415`. Neither is ever written to disk.
- **Resize.** `sharp(buffer, { limitInputPixels: 40_000_000 }).rotate().flatten({ background: white
  }).resize({ width: 1080, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })`: orientation
  applied, metadata dropped, transparency flattened on white, JPEG out so the client has one format.
  The PRD asks for "un ancho fijo"; a narrower image keeps its width, since enlarging adds bytes and
  no information.
- **Storage.** `PHOTOS_DIR` (environment variable, validated by Joi: a non-empty string, default
  `storage/photos`) is the root; the file is `<root>/<planId>/<envelopeId>-<8 random hex>.jpg` and the
  relative key is what `photo_file` stores. The key is built by the server from UUIDs and random hex,
  never from user input, so there is no path traversal; the directory is created on demand and
  `/storage` is added to `.gitignore`. Replace writes the new file, updates the row, then deletes the old
  file (and deletes the new one if the update fails), so a failure never leaves an envelope pointing to
  a missing file. `deleteEnvelopePhoto` and `EnvelopesService.remove` delete the file after the row
  change. The photo files of a deleted plan are orphaned (the plan cascade deletes rows only); a
  cleanup job is a later concern and is listed under Risks.
- **Serving with authorization.** `GET .../photo` runs `PlanAccessService.require(..., READ_ROLES)`
  (non-member 404, no token 401 from the global guard), loads the envelope by id and plan, and streams
  the file with `StreamableFile` (`Content-Type: image/jpeg`, `Cache-Control: private, max-age=31536000,
  immutable`, `X-Content-Type-Options: nosniff`); the `?v=` in `photoUrl` makes the immutable cache
  safe. There is no static file mount: every byte goes through the guard. The client renders it with
  `Image.network(url, headers: {'Authorization': 'Bearer <token>'})`, so the PRD's "el cliente solo la
  renderiza" holds.
- **Suggested photos (seeding).** The four design photos (`vacaciones`, `auto`, `emergencia`,
  `mudanza` from `design/photos/*.jpg`, about 380 KB in total) are committed in the back repo under
  `assets/suggested-photos/`, and a constant table in `photo-suggestions.ts` maps id to name and file.
  There is nothing to seed in the database: the list endpoint is the table, the image endpoint streams
  the file, and `applySuggestedEnvelopePhoto` reads the same file through the same resize and storage
  path as an upload (so a suggestion is just another stored photo; replacing or removing it needs no
  special case). The folder is resolved from the module's own URL (`../../assets` from `src/envelopes`
  and from `dist/envelopes`), so it works from `nest start` and from the build.

## Backend design

```
src/envelopes/
  goal-status.ts                  # pure rules: required amount, state, goal status
  envelopes.service.ts            # + goal set/clear, detail, moveMoney, lines with state
  envelopes.controller.ts         # + goal, detail, move
  envelope-photos.service.ts      # validate, resize, store, delete, stream
  envelope-photos.controller.ts   # upload, get, delete, suggested; suggestions list and image
  photo-suggestions.ts            # the four suggestions
  dto/envelope.dto.ts             # + goal, photoUrl, state, goalStatus
  dto/envelope-goal.dto.ts, dto/move-money.dto.ts, dto/envelope-detail.dto.ts, dto/photo.dto.ts
  entities/envelope.entity.ts     # + goal_*, photo_* columns
src/budget/assignments.service.ts # + shiftAssignments
src/config/env.validation.ts      # + PHOTOS_DIR
src/database/migrations/1790900000000-AddEnvelopeGoalsAndPhotos.ts
assets/suggested-photos/*.jpg
```

- Every DTO has `@ApiProperty` / `@ApiPropertyOptional` and every operation the `operationId`s of the
  table, so the exported spec matches the contract and the drift check stays clean; the multipart
  body is declared with `@ApiConsumes('multipart/form-data')` and a binary `file` property; the
  binary responses with `@ApiProduces('image/jpeg')`.
- Authorization follows the existing pattern: the controller calls `PlanAccessService.require` first
  (`READ_ROLES` for reads, `WRITE_ROLES` for goal, move and photo writes), then the service looks the
  envelope up by id and plan together, so an envelope of another plan is `404`.
- `.contract-ref` is bumped, in the `[back]` task that documents the endpoints, to the specs commit
  that holds the new paths.

## Generated client

Regenerated from the updated `openapi.yaml` with the pinned `dart-dio` generator (`-i` pointed at
`../openapi.yaml`, the pin untouched), then `dart run build_runner build`, `test/` and `doc/`
removed, own commit, as in the previous changes. The multipart upload is generated as a `MultipartFile`
parameter.

## Frontend design

```
lib/features/envelopes/
  envelopes_repository.dart   # + goal, state, goalStatus, photoUrl, detail, move, photo and suggestion calls
  envelopes_controller.dart   # + goalLines, setGoal / clearGoal, moveMoney, setPhoto / removePhoto
  goal_fields.dart            # the shared "Objetivo" block of 23 and 31 (chips, capsule, quick amounts, due date)
  envelope_detail_page.dart   # 22
  envelope_edit_page.dart     # 23
  envelope_form_page.dart     # 31 (+ goal block, Foto row, "+ Nueva meta" entry)
  move_money_page.dart        # 24
  plan_page.dart              # rows use the API state, tap -> 22, long press removed
lib/features/goals/
  goal_detail_page.dart       # 05
  goal_options_sheet.dart     # 40
  goal_photo_sheet.dart       # 50 (also the draft mode used by 31)
  goal_image.dart             # ImageProvider with the bearer header for photoUrl and suggestions
lib/features/home/home_page.dart, home_controller.dart   # "Metas" carousel
lib/core/api/api_gateway.dart # + authorization header for image requests
packages/ui/lib/src/...       # see UI components
```

- **Routes.** `/envelopes/:envelopeId` (22, replacing the placeholder), `/envelopes/:envelopeId/edit`
  (23), `/envelopes/:envelopeId/move` (24), `/goals/:envelopeId` (05), all on the root navigator (no
  tab bar). 40, 50 and 43 are bottom sheets (no route). `AppRoutes.newGoal` opens 31 with
  `?groupId=<Metas>&goal=targetByDate`. Pages read the `EnvelopeLineData` from `EnvelopesController`
  (the lines the list already loaded) and the detail from the repository.
- **Source of truth.** The client never derives a state or a required amount: `EnvelopeLineData` gains
  `state`, `goal` and `goalStatus` copied from the API, and 02, 22, 05, 01 and 24 render them. 02
  maps `state` to the existing `UiEnvelopeRowVariant` (Empty stays a cosmetic variant for "no goal and
  nothing assigned"); Underfunded draws "Falta <missing>" and stripes of `assigned / required`; a funded
  row with a goal says "Cubierto" with full stripes; rows without a goal keep today's look.
- **01 carousel.** `HomeController` also depends on `EnvelopesController` and exposes the lines whose
  goal is `targetByDate`; the carousel is a `PageView` with a fractional viewport (neighbors peek, as in
  the design), a `UiPageDots`-style indicator and a last "+ Nueva meta" card; empty, loading (skeleton
  card) and error (retry) states per PRD-ux-spec.md §5. The Ready to Assign card, its "+" and the
  Reportes button are RRG-51 and RRG-54: they stay out, and the header keeps the avatar.
- **22.** Back and pencil (hidden for a viewer, who is the plan's `viewer` role from `PlansController`),
  icon, name 30, group, a card of three figures, the goal row (`UiGoalRow`), "Actividad de <mes>" with
  `buildDayGroups` and `transactionRow` over `EnvelopeDetail.activity` (tap opens 12 with the
  `TransactionData`), and the chartreuse "Mover dinero". Skeleton rows while loading, retry on failure.
- **23 and 31.** One `GoalFields` widget: chips "Sin objetivo" / "Mensual" / "Con fecha", the
  `UiAmountCapsule` that opens `showAmountSheet` for an own amount, four quick amounts per currency
  (ARS 20.000, 50.000, 100.000, 200.000; USD and EUR 50, 100, 250, 500, in minor units) and, for "Con
  fecha", a "Fecha límite" `UiFieldRow` that opens the calendar sheet of 38 (`showDateSheet`). 23 adds
  the trash (→ 43 through `showDeleteEnvelopeSheet`), name/group/icon, saves with `updateEnvelope` and
  then `setEnvelopeGoal` or `clearEnvelopeGoal`, and returns to 22. 31 sends the goal with the
  create. The design's 23 shows two chips; "Sin objetivo" is added there because it is the only way to
  clear a goal, and it is the chip 31 already has.
- **05.** `UiGoalBackdrop` (photo or lavender tint with the icon), a top glass bar (back, name and "N
  meses restantes", "…" → 40), `UiGoalSummary` (Objetivo, Ya ahorrado, Falta, stripes and dots), four
  `UiGlassTile`s and the disabled "Asignar a esta meta". Status bar icons light over the photo
  (`SystemUiOverlayStyle`, PRD-ux-spec.md §6.1 rule 8).
- **40 and 50.** `showGoalOptionsSheet` (`UiSheet`, `UiMenuRow`s; "Eliminar meta" reuses 43 and then
  deletes the envelope and goes to 01) and `showGoalPhotoSheet`: the preview, "Elegir de la galería" and
  "Sacar una foto" (`image_picker`; a pick over 5 MB or of another format is refused client-side with
  the same message the API's `413` / `415` map to), the suggested grid (`UiPhotoThumb`, the four from
  `listPhotoSuggestions`, plus "Más fotos" which opens the gallery), "Quitar foto" with an in-place
  confirm, and "Listo", which uploads the pending choice (a picked file through `uploadEnvelopePhoto`, a
  suggestion through `applySuggestedEnvelopePhoto`). In draft mode (opened from 31) it returns a
  `PhotoChoice` instead of calling the API; 31 applies it right after `createEnvelope`.
- **Images.** `GoalImage` is a `NetworkImage(baseUrl + photoUrl, headers: gateway.authorizationHeaders)`;
  the `?v=` in the URL makes Flutter's image cache refresh when the photo changes. No photo, or a load
  error, falls back to the tint and icon.
- **24.** The source is the envelope it was opened from; both cards are `UiEnvelopeRow`s that open
  `showEnvelopePicker` (36, `exclude` hides the other end); the amount starts as the destination's
  overspending capped at the source's Available; `UiAmountCapsule` opens `showAmountSheet`; quick
  amounts are the cover amount (when any), 10.000 and 20.000 (scaled per currency); the `UiSaveBar` is
  Disabled with "Elegí un sobre", "Ingresá un monto" or "Supera lo disponible" and otherwise reads "Mover
  <amount>". `moveMoney` reloads the envelopes (so every figure comes from the API) and the page pops
  with "Guardado". A `409` shows "Ya no hay tanto disponible".
- **Temporary entries removed.** The long press on 02 rows and its `onLongPress` / `_delete` are
  deleted from `PlanPage`; the real entry to 43 is the trash of 23 and "Eliminar meta" of 40.
- **Month.** All screens use the month the envelopes were loaded for (`EnvelopesController.month`,
  the current month today); when `add-monthly-assignment` adds month navigation they receive the
  month through the same controller.

## UI components

Existing, used as is: `UiEnvelopeRow`, `UiStripeBar`, `UiAmountCapsule`, `UiSaveBar`, `UiFieldRow`,
`UiCard`, `UiSheet` / `showUiSheet`, `UiTxRow`, `UiIconButton`, `UiButton`, `UiChip`, `UiMenuRow`,
`UiInfoNote`, `UiToast`, `UiFormMessage`, `UiTextField`, and the pickers 36, 52 and the date sheet.

New in `packages/ui`, each with Widgetbook use cases and flagged for the other dev's review
(docs/COLABORACION.md §5), landed as small separate commits before the screens that use them:

- **`UiGoalCard` (new, molecule; the `GoalCard` of §8)**: with photo or lavender tint and icon; saved
  amount, percent over a line, glass panel with name, "<target> · <month>" and arrow. Takes an
  `ImageProvider?`, so the package knows no API.
- **`UiGoalRow` (new, molecule)**: the goal row of 22 (label, value, `UiStripeBar`; overspent: red full
  bar and "Sobregirado").
- **`UiGoalSummary` (new, molecule)**: the glass panel of 05 (Objetivo, Ya ahorrado, Falta, stripes
  and dots on glass, white text).
- **`UiGoalBackdrop` (new, atom)**: the full-bleed photo or tint under a scrim.
- **`UiGlassTile` (new, molecule)**: the tiles of 05.
- **`UiPhotoThumb` (new, atom)**: the grid cell of 50 (selected ring and check, and the "more" variant).
- **`UiPageDots` (new, atom)**: the carousel indicator of 01.
- **`UiIcons` (modified)**: adds the icons these use that the set lacks (for example `image`, `images`,
  `camera`, `history`, `target`, `sparkles`, `arrowUpRight`, `arrowDown`, `ellipsisVertical`).

`UiEnvelopeRow` keeps its four variants; only its caption can now be passed ("Falta $ X", "Cubierto"),
which it already supports.

## Decisions

**Goal columns on `envelopes`, not a table.** 0..1, always read with the envelope, no history; see
"Data model and migration".

**`PUT` / `DELETE` for the goal, not `PATCH`.** "No goal" cannot be expressed in a merge patch without
`null`; two explicit operations also keep the validation of the goal in one request schema.

**State and required amount only on the server.** One definition (`goal-status.ts`) exposed on the
list/month view, so RRG-51's filters, the detail, the carousel and the move result agree; the client
renders and never recomputes (PRD §9 "cliente delgado").

**Source of a move cannot go negative (`409`).** See "Move money". The alternative (allow it and show
the source as overspent) was rejected because 24 shows no such state.

**A "goal" in the carousel is a `targetByDate` goal.** 01 and 05 present a target, a saved amount and
"N meses restantes", which only a goal with a date has; a monthly goal is an envelope setting seen in
22 and 02. Photos are available on any envelope through the API, and the "Foto" row of 31 and 23 shows
when the group is "Metas" or the objective is "Con fecha", which is how the UX spec words it ("solo si
Grupo = Metas") extended to the carousel's own definition.

**Photos are served by an authenticated endpoint, stored as JPEG, never enlarged.** See "Goal photo".

**Suggested photos live in the back repo.** The PRD stores photos "a través del backend"; keeping the
set server-side means the client has one way to render a photo and the four files are one place to
change. The cost is two small read endpoints and 380 KB in the repo.

**The "Eliminar meta" of 40 deletes the envelope.** A goal is an envelope in this model; the
confirmation is 43, which already says what happens to its movements and its money.

## Risks / Trade-offs

- [`sharp` is a native dependency] -> prebuilt binaries are used on Windows, Linux and macOS (checked on
  Windows); if the install fails the upload endpoint is the only thing affected.
- [Photo files are orphaned when a plan is deleted, or the DB and the disk disagree after a crash] ->
  writes are ordered (file, row, old file) so an envelope never points to a missing file; orphan
  files cost disk only. A cleanup job is out of scope.
- [A concurrent expense races the "not more than available" check of a move] -> at worst the source
  ends overspent, which the engine and the UI already represent; the move itself is atomic.
- [The memory buffer of 5 MB per upload] -> the volume is one user at a time; a streaming pipeline would
  add code for no benefit here.
- [Authenticated `Image.network` needs the token at render time] -> `GoalImage` takes the header from
  the gateway on each build; a `401` shows the tint fallback and the session hook handles the sign-out.
- [The design shows `Con fecha` and `Mensual` only in 23] -> "Sin objetivo" is added (see Frontend
  design) and documented here.
- [05 is reachable only for goals with a date] -> a monthly-goal envelope is edited from 22.

## Migration Plan

`npm run migration:run` adds the goal and photo columns and checks; `npm run migration:revert` drops
them (development only: goals would be lost). Set `PHOTOS_DIR` in `.env` (the default works); the
folder is git-ignored. Front: regenerated client, one new dependency (`image_picker`), additive
routes and sheets.
