# ui-foundation (RRG-43)

## Objective
Implement the design system in `budget-tracker-front/packages/ui`: tokens from `PRD-ux-spec.md` §7
and the base components of §8, each with Widgetbook stories, so both developers build screens
from the same pieces.

## Why
Both devs build Flutter screens (split by feature); UI coherence depends on one shared library.
Unblocks the front half of every feature change.

## Decisions
- Source of truth: `PRD-ux-spec.md` §7 (tokens, contrast, typography, shape, Montos, Moneda) and §8
  (components, Toast rules, SaveBar swipe-to-confirm + Disabled, row chevron rule); exact geometry
  from `design/build-components.js` and renders in `design/screens/00-componentes.png` (+ other PNGs).
- Scope: StatusBar? (skip — OS status bar, document why), NavCluster, IconButton (7), Button (2),
  Chip (3, heights 44/34), AmountCapsule, SaveBar (Default/Disabled, swipe + tap), Toggle, TextField
  (Default/Focus/Error), FieldRow, Key (Number/Operator/Del), Avatar, Toast (5) + money formatter.
  Domain rows (EnvelopeRow, TxRow, AccountRow, PayeeRow, MemberRow, PlanRow, GroupRow) are OUT:
  they ship with the feature that introduces them.
- Money formatting (es-AR, minor units per currency, `−` before symbol) lives in `packages/ui` as a
  pure function so every screen formats identically (UX spec §7 Moneda; api-conventions spec).
- Urbanist bundled as asset (OFL, license file included), no runtime font fetching.
- Icons: Lucide (thin stroke 1.5) via a Flutter package if available, else documented fallback.
- SDD: remove `skip_specs`; capability `ui-design-system` spec (tokens fidelity, contrast rules,
  component states, SaveBar/Toast behavior, money formatting scenarios).
- Visual verification without device: Widgetbook web build + headless Edge screenshots compared
  against `design/screens/00-componentes.png`.

## Tasks
- [x] T1 Specs repo: specs → design → tasks, one commit per phase (route: delegated writer)
- [x] T2 Front repo: implement per tasks, one commit per task (route: same writer)
- [x] T3 Verify (analyze, apk build, Widgetbook web screenshots vs design) + tasks-complete commit
- [ ] T4 Review gate; merge; archive; Linear Done

## Checks
`flutter analyze` x3, `flutter build apk --debug`, Widgetbook web build + screenshots, no test files,
`openspec validate ui-foundation`. TDD: off (no test files rule).

## Progress
- RRG-43 moved to In Progress.
- Specs: 18bc344 specs, b2e6482 design, 9429d4e tasks, 9f566cb tasks complete (2.1 interactive behavior unchecked). Front: bcc3cbe..42fc355 (1.1-1.7).
- Evidence: analyze clean x3 (parent re-ran ui+widgetbook), apk + widgetbook web build ok, money strings exact, 39 headless Edge screenshots compared by writer; parent compared sheets A/B vs 00-componentes.png and screen 07.
- Decisions: lucide_icons_flutter 3.1.20 (weight-300 = 1.5 stroke), Urbanist variable TTF + OFL bundled, Ui* widget prefix, no StatusBar widget (SystemUiOverlayStyle).
- AmountCapsule lavender confirmed by screen 07 (00-componentes.png grey is stale). Follow-up: concave neck shape for AmountCapsule and NavCluster tray (currently rectangular/pill).
- Pending: SaveBar swipe/tap/disabled and Toast timing/swipe interactive check on device.
