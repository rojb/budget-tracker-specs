# Design

## Context

`scaffold-frontend` left `packages/ui` with an empty `tokens/atoms/molecules/organisms` layout, a
throwaway `PlaceholderCard`, and a manual Widgetbook catalog. This change replaces the placeholder
with the design system of PRD-ux-spec.md §7 (tokens) and §8 (components). It ships no screens and
no API surface: no endpoint is added or modified, so `openapi.yaml` is untouched.

Sources of truth: PRD-ux-spec.md §7/§8; exact geometry from `design/build-components.js`;
renders in `design/screens/00-componentes.png`; money rules from PRD-ux-spec.md §7 "Moneda" and
`openspec/specs/api-conventions`.

## Goals / Non-Goals

**Goals:**
- Tokens, `ThemeData` and a `ThemeExtension` in `packages/ui`, Urbanist bundled.
- The 13 base components of §8 minus `StatusBar` (see decisions), each variant with a Widgetbook use case.
- One pure money formatter shared by every screen.
- Widgetbook built for web so components can be checked against the design renders without a device.

**Non-Goals:**
- Domain rows (`EnvelopeRow`, `TxRow`, `AccountRow`, `PayeeRow`, `MemberRow`, `PlanRow`, `GroupRow`),
  `BalanceCard`/`JoinedCard`, `GoalCard`: each ships with the feature change that first needs it
  (packages/ui PR reviewed by the other dev, docs/COLABORACION.md §5).
- Screens, navigation wiring, state, API calls.
- Test files of any kind (repo rule); verification is manual.
- Web platform for the app itself.

## UI components

Components used or added by this change, all new, all in `packages/ui`: `NavCluster`, `IconButton`,
`Button`, `Chip`, `AmountCapsule`, `SaveBar`, `Toggle`, `TextField`, `FieldRow`, `Key`, `Avatar`,
`Toast`. `StatusBar` is deliberately not a widget. Each is a new `packages/ui` component and gets
its Widgetbook story in this same change; the reviewer is the other developer.

**Naming: `Ui` prefix on every widget** (`UiIconButton`, `UiChip`, `UiTextField`, ...) because `IconButton`, `Chip`, `TextField` and `Key` already exist in Flutter and would clash on import. Catalog and docs use the spec names (IconButton, Chip, ...).

## File layout (`packages/ui/lib/src`)

```
tokens/
  colors.dart       # UiColors: the §7 tokens + soft grey #EDEDED, disabled greys
  typography.dart   # UiTypography: display/headline/title/body/bodyStrong/caption (Urbanist)
  shape.dart        # UiRadius, UiSizes (touch target 48, chip heights 44/34, ...)
  theme.dart        # buildUiTheme() -> ThemeData + UiTheme (ThemeExtension), SystemUiOverlayStyle
  icons.dart        # UiIcons: named aliases over the Lucide icon set
atoms/              # single-element widgets, no children components
  icon_button.dart  chip.dart  button.dart  avatar.dart  key.dart  toggle.dart
molecules/          # compose atoms + text
  text_field.dart  field_row.dart  amount_capsule.dart  toast.dart
organisms/          # compose molecules, own layout of a whole region
  nav_cluster.dart  save_bar.dart
format/
  money.dart        # Currency enum + formatMoney(int minor, Currency)
```

`lib/ui.dart` stays the single public barrel and re-exports every public symbol. Mapping rule:
an **atom** has no sub-components (IconButton, Chip, Button, Avatar, Key, Toggle); a **molecule**
combines an atom-level piece with text or a trailing icon (TextField, FieldRow, AmountCapsule,
Toast); an **organism** is a self-contained bar with its own interaction (NavCluster, SaveBar).
The `PlaceholderCard` is deleted; the home page switches to real components.

## Decisions

**Theme: `ThemeData` built from tokens plus a `ThemeExtension`.** `buildUiTheme()` returns a
Material 3 `ThemeData` (scaffold background `bg`, `ColorScheme` seeded explicitly from the tokens,
`TextTheme` mapped from the Urbanist scale, splash disabled to keep the calm look) and attaches a
`UiTheme` extension carrying the tokens that Material has no slot for (lavender, chartreuse,
chartreuse-deep, warning, glass, ink-muted). Widgets read `Theme.of(context).extension<UiTheme>()`
via a small `context.ui` accessor. Alternative considered: plain static constants only. Rejected
because a theme lets Widgetbook and the app swap or later dark-mode the system in one place; the
constants still exist in `colors.dart` and are what the extension is built from, so no widget needs
a literal.

**Font: Urbanist variable TTF bundled as a package asset.** Downloaded from the `google/fonts`
repository (`ofl/urbanist/Urbanist[wght].ttf`, plus `OFL.txt` stored next to it). Declared in
`packages/ui/pubspec.yaml` under `flutter: fonts:` with `family: Urbanist`, and referenced from
text styles with `package: 'ui'` so it resolves in the app and in Widgetbook. One variable file
(85 KB) covers the weights 300, 400, 500, 600 with a single asset; text styles set
`fontVariations: [FontVariation('wght', w)]` in addition to `fontWeight` so the axis is honored.
Alternative: `google_fonts` runtime fetching, rejected (offline, license bundling, non-determinism).

**Icons: `lucide_icons_flutter` (pub.dev, v3.1.x).** Maintained (published this month, 160/160 pub
points, ~230k monthly downloads, MIT, Flutter-native icon font, all platforms). It provides the
Lucide set with several stroke weights; the default Lucide stroke is used since the thin 1.5 look
of §7 is Lucide's own. The older `lucide_icons` package was rejected: last release 2023. Fallback if
the package ever breaks: Material `Icons.*_outlined` behind the same `UiIcons` aliases, documented in
the README; components only ever import `UiIcons`, so the swap is one file.

**Money formatting: `intl` `NumberFormat` for grouping only.** `formatMoney(int minor, Currency)`
splits the integer into whole and fraction using integer arithmetic (`~/` and `%` by
`10^minorUnits`), formats the whole part with `NumberFormat.decimalPattern('es_AR')`, appends the
fraction with `,` when the currency has minor units, prefixes the symbol and a space, and puts `−`
(U+2212) before the symbol for negatives. Integer arithmetic avoids double rounding errors. `intl`
is added to `packages/ui` (locale data for `es_AR` is included in the package, no async init
needed for number symbols; the formatter is still a pure function). Alternative: hand-written
grouping with no dependency. Viable and simpler to reason about, but `intl` is the standard Flutter
answer and keeps locale rules out of our code. The `Currency` enum mirrors the API `Currency`
object (code, symbol, minorUnits) so `packages/ui` does not import the API client.

**StatusBar: no widget, use the OS status bar.** The design draws a fake 9:41 bar because it is a
static mockup; on a real device the OS already renders the clock, signal and battery, and a widget
would duplicate it and go stale. The only design-relevant behavior is icon brightness (§6.1 rule 8:
dark over light backgrounds, white over photos), which `SystemUiOverlayStyle` covers: `theme.dart`
exposes `UiOverlay.onLight` and `UiOverlay.onPhoto` and the theme's `AppBarTheme`/screens apply
them. This is a documented deviation from §8's component list (the proposal listed StatusBar; it
is realized, not skipped). No Widgetbook story exists for it.

**SaveBar: `StatefulWidget` internally.** The handle is dragged with a `GestureDetector`
(`onHorizontalDragUpdate/End`) and a local offset; release past 80% of the travel calls `onConfirm`
and the handle snaps back (the parent decides what confirmation does). A tap on the handle also
calls `onConfirm`, so keyboard, screen-reader and reduced-motor users are covered; the handle has
`Semantics(button: true, label: ...)`. Disabled is a constructor flag (`enabled: false`) with a
different label, lock icon and lower end-check opacity; gestures are ignored. All state is local
gesture state; no business logic.

**Toast: presentation widget plus a host.** `Toast` is the capsule (StatelessWidget). One-at-a-time
behavior is delivered by `ToastHost`/`showToast` built on `OverlayEntry`: showing a toast removes
the existing entry first, schedules a 4 s `Timer` for removal, and wraps the capsule in `Dismissible`
(horizontal) for swipe dismissal. It lives in `molecules/toast.dart` and takes callbacks only.
Alternative: `ScaffoldMessenger` SnackBars. Rejected: SnackBar shape/position rules differ from
the 350 x 64 floating capsule and it queues rather than replaces.

**TextField: `StatefulWidget` wrapping a Flutter `TextField`.** A `FocusNode` drives the Focus
border; the Error state is a prop with a message line under the pill. Decoration is fully custom
(no underline, filled `surface`, radius 30).

**Joined shape (reopened after verification).** The first cut approximated the concave blob with a
rect neck and a pill tray; verification against the design renders showed both deviate. A single
reusable helper in `packages/ui/lib/src/tokens/joined_shape.dart` is a Dart port of
`design/shapes.js#blobPath`: given lobes (`x`, `w`, `r`) of equal height and a `neck` depth, it builds
one closed `Path` whose top and bottom edges leave each lobe, dip concavely by `neck` at the midpoint
between lobes (two cubic Beziers per waist) and rise onto the next lobe. It is exposed as a
`CustomClipper<Path>`, and a `CustomPainter` that fills, strokes and shadows the path. AmountCapsule
(lobes 64 + gap 6 + value width, r 32, neck 9) and NavCluster (one lobe per circle, circle + 12 wide,
r half, gap -4, neck 10) both use it, and a later JoinedCard can reuse it. Widgets stay presentational.

**AmountCapsule: one lavender joined shape.** The lavender fill is the joined-shape path painted
behind a white 48 dp badge and the value text; the value lobe width follows the text.

**NavCluster: glass tray via `BackdropFilter`.** The tray is the joined-shape path used as clip for
`BackdropFilter(blur 24)`, with `#FFFFFF8C` fill, a 1 px `#FFFFFFCC` stroke and the shadow; circles sit
on top.

**Touch targets.** Visual sizes follow the design; each interactive widget wraps its visual in a
`ConstrainedBox(minWidth/minHeight: 48)` hit area (Chip 34 stays 34 visually, 48 hit).

**Widgetbook: one use case per variant; web enabled for `widgetbook/` only.** Use cases are
declared by hand in `widgetbook/lib/catalog/` (one file per component group, aggregated in
`directories.dart`; no codegen). `flutter create --platforms web .` is run inside `widgetbook/` only
so `flutter build web` yields a static catalog that headless Edge can screenshot; the app itself
stays Android/iOS. Widgetbook applies `buildUiTheme()` so stories render with real tokens. Deep
links use the `?path=` query of Widgetbook (`?path=atoms/chip/default`).

## Risks / Trade-offs

- [Variable font weights ignored by the engine] -> text styles set `fontVariations` explicitly and
  the screenshot pass checks Light 300 vs Medium 500 visually.
- [Icon package drift] -> icons only through `UiIcons`; fallback to Material outlined documented.
- [Joined-blob shapes approximated] -> resolved by the reusable joined-shape helper (tasks 1.8, 1.9);
  device screenshots are compared against the design renders.
- [`intl` es_AR grouping differs from spec on some SDKs] -> the manual checklist compares the four
  spec strings exactly (`$ 48.200`, `US$ 1.250,50`, `€ 980,00`, `−US$ 12,50`).
- [Change exceeds ~400 changed lines] -> accepted; commits stay one per task and cohesive.

## Migration Plan

No data or API migration. Additive package changes, one commit per task on `rrg-43-ui-foundation`.
`PlaceholderCard` is removed in the same series once the home page no longer uses it. Rollback: do
not merge the branch.
