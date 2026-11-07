# Motion system for the budgeting app: design and build plan

Scope: read-only study. Nothing in the repo, device, API or git was touched.
Stack verified locally: Flutter 3.47.1 (stable), Dart 3.13.1, go_router 18.0.2, `packages/ui` (presentational design system), Widgetbook catalog in `budget-tracker-front/widgetbook`. Test device: Honor TFY-LX3 (mid-range Android). Flutter API facts below were checked against the installed SDK source (`C:\flutter\packages\flutter\lib\src`) and the go_router 18.0.2 package, not from memory.

---------------------------------------------------------------------------

## 0. What exists today (audit)

| Area | Finding | Evidence |
|---|---|---|
| Page transitions | Nobody configured them. On Android, Flutter 3.47 defaults to `PredictiveBackPageTransitionsBuilder`, which for any button/programmatic navigation falls back to `FadeForwardsPageTransitionsBuilder`: **450 ms**, old page drifts -25%, new page fades in over the first 75%. That is already above the 200-350 ms budget on every push, and the scrim behind it is `ColorScheme.surface` (white) while the app background is `#F5F5F5`. | `material/page_transitions_theme.dart` lines 451-575 and 764-770; `material/predictive_back_page_transitions_builder.dart`; `buildUiTheme()` in `packages/ui/lib/src/tokens/theme.dart` sets no `pageTransitionsTheme`. |
| Predictive back gesture | Not enabled: `AndroidManifest.xml` has no `android:enableOnBackInvokedCallback`. | `android/app/src/main/AndroidManifest.xml` |
| Tab switch | Instant. `StatefulShellRoute.indexedStack` + `navShell.goBranch`. Branches are lazy (`preload` defaults to false). | `lib/app/router.dart`, `lib/features/shell/app_shell.dart`, go_router `route.dart` 1129 |
| Pushed screens | Every detail/form route (22, 23, 24, 05, 07...) is a top-level `GoRoute`, so it lives on the **root** navigator, above the tab shell (this is why 22 has no bottom bar). All use `builder:`, so one theme-level builder covers all of them; none uses `pageBuilder`. | `lib/app/router.dart` |
| Sheets | `showUiSheet` -> `showModalBottomSheet`, Flutter defaults 250 ms in / 200 ms out. Fine; only needs tokens and a reduce-motion hook (`sheetAnimationStyle` exists, as does `AnimationStyle.noAnimation`). | `organisms/sheet.dart`; `material/bottom_sheet.dart` 27-28, 246-250 |
| Existing animation | Only 5 spots, all with private magic numbers: skeleton pulse 1100 ms (`movements_page.dart`), SaveBar snap-back 180 ms easeOut, PageDots 180 ms, assign carousel 240 ms, the goal carousel tilt (`_Tilted`, driven by the scroll controller, fine). Nothing reads `MediaQuery.disableAnimations`. | grep over `lib` and `packages/ui/lib` |
| Skeleton | Spec says a left-to-right `shimmer` (PRD-ux-spec §5). Code does an opacity pulse in Movimientos only; Detalle de sobre and the goals carousel use a **static** grey box; the Plan tab shows an empty `SizedBox()` while loading (spec table §5 requires "Esqueleto"). | `movements_page.dart` 349-430; `envelope_detail_page.dart` 291; `home_page.dart` 273; `plan_tab_page.dart` 33 |
| Money figures | All plain `Text(formatMoney(...))`. `UiJoinedCard` takes pre-formatted strings. | `ui/src/organisms/joined_card.dart`, `format/money.dart` |
| Progress bars | `UiStripeBar` is a `CustomPaint`, no animation. Its dot field uses `Random(7)` consumed from `x = filled + 3`, so **if `value` ever changes frame to frame the dot pattern re-rolls (flicker)**. Must be fixed before animating it. Goal card line is a 3 dp `FractionallySizedBox`. No rings exist anywhere in the app. | `atoms/stripe_bar.dart` 68-77; `molecules/goal_card.dart` 163 |
| Press feedback | None. Almost every tappable goes through `UiHitTarget` (29 files in `packages/ui`), but cards use raw `GestureDetector` (`EnvelopeRow`, `GoalCard`, `GlassTile`, `OptionCard`, `ChoiceCard`, `SplitRow`...). Theme sets `NoSplash` and transparent highlight, so a tap currently shows nothing at all. | `atoms/hit_target.dart`; `tokens/theme.dart` 116 |
| Haptics | Zero uses of `HapticFeedback`. | grep |
| Toast | Appears and disappears instantly (inserted/removed `OverlayEntry`, no controller). Success toast is the only "saved" confirmation: "Guardado" ~1.5 s, `bottomOffset: 100`. | `molecules/toast.dart`; `features/common/feedback.dart` |
| Save flow timing | `saveTransaction` awaits `transactions.create` **then** `Future.wait([envelopes.load(), accounts.load()])` before the toast and `context.pop()`. The user waits for 2 network round trips before the screen closes. Move money (24) awaits `moveMoney` (which reloads) before pop. This is network time, not animation time, but it caps how good any "saved" moment can feel. | `new_transaction_page.dart` 183-205, 411-449; `move_money_page.dart` 98-134 |
| Lists | Pages are `ListView(children: [...])` (lazy element creation: rows are built only when scrolled near). Plan shows 14+ rows. Anything a row does in `initState` will replay when it is scrolled into view again. | `plan_page.dart` 190; `movements_page.dart` 130 |
| Nav bar | `UiNavCluster` has a `BackdropFilter(blur 12)` tray; the active tab colour flips instantly. Anything repainting inside that tray re-blurs. | `organisms/nav_cluster.dart` 105 |
| Tests | There is no `test/` dir and no `flutter_test` dev dependency in the app or in `packages/ui`. The catalog (Widgetbook) is the verification surface, and the ui-design-system spec requires a Widgetbook use case for every new component/variant. | pubspec files; spec "Catalog coverage" |
| Lifecycle fact that helps us | Routes covered by an opaque route have their overlay entry built with `tickerEnabled: false`, so tickers/animation controllers on hidden tabs and covered pages pause and resume on reveal. Stagger/fill/shimmer on hidden pages cost nothing. | `widgets/overlay.dart` 420, 907 |
| Hero across navigators | A `Hero` inside the Plan tab's nested navigator IS eligible for a flight to a route pushed on the root navigator, as long as it is in the top-most `PageRoute` of the nested navigator. So row -> 22 shared element works with no router change. | `widgets/heroes.dart` 316-335 |

---------------------------------------------------------------------------

## 1. Principles (the contract for every slice)

1. **Motion explains, it never gates.** No callback, navigation or request is ever delayed for an animation. Animations run in parallel with, or after, the real work.
2. **Numbers only move from a value the user has already seen.** A finance app must not flash "$ 0" and count up on first paint. Money tweens animate *changes* (old -> new), never first appearance.
3. **Frequent path = near-invisible.** Typing amounts, keypad, switching tabs, opening pickers: <= 180 ms, no spatial travel beyond 12 dp. The "wow" is spent on rare, meaningful moments (a number rolling after you save, a goal reached, money landing).
4. **One-shot entrance.** Stagger/fill entrance runs when content goes skeleton -> loaded (once per screen mount), never on refresh, pagination, filter, scroll re-entry or controller `notifyListeners`.
5. **Transform and opacity only** on hot paths. No layout-animated lists, no `Opacity` widget (use `FadeTransition`/`AnimatedOpacity`), no animated `BackdropFilter`, one controller per scope, `RepaintBoundary` around animated painters.
6. **No state by motion alone.** Same rule the UX spec already applies to colour (§6): every celebratory state also has text/icon.
7. **Prefer built-ins; zero new dependencies** (see §7).

---------------------------------------------------------------------------

## 2. Tokens (single source of truth) - `packages/ui/lib/src/tokens/motion.dart`

### 2.1 Durations (base values)

| Token | ms | Used for |
|---|---|---|
| `instant` | 90 | press scale down/up, haptic-paired feedback |
| `fast` | 150 | chip/toggle/tab-colour changes, icon swaps, skeleton -> content crossfade, tab crossfade (180 for the pair) |
| `base` | 240 | sheets, small reveals, fills of small bars, toast in (out is `fast`), pop |
| `slow` | 300 | route push / modal (reverse is 240) |
| `emphasis` | 600 | money tween, big progress fill (signature, never blocking) |
| `celebrate` | 900 | goal-reached burst only |
| `stagger` | 28 per item, **max 6 items** | list entrance (total <= 220 + 6*28 = 388 ms, once per mount; justified exception to the 350 ms target because it never blocks input and runs once) |

### 2.2 Curves

| Token | Value | Use |
|---|---|---|
| `enter` | `Curves.easeOutCubic` | things appearing / settling |
| `exit` | `Curves.easeInCubic` | things leaving (exit is ~25% shorter than enter) |
| `standard` | `Curves.easeInOutCubic` | moves between two resting places |
| `fill` | `Curves.easeOutQuart` | money tween, progress bars |
| `settle` | `Curves.easeOutBack` (Cubic 0.175, 0.885, 0.32, 1.275: max ~3% overshoot) | check stamp, SaveBar snap-back, press release. Max one overshoot per screen at a time. |
| route curves | built-in `FadeForwards` (`easeInOutCubicEmphasized`) | route pushes |

All verified present in `animation/curves.dart` and `material/motion.dart`.

### 2.3 The single reduce-motion switch

```dart
// packages/ui/lib/src/tokens/motion.dart (sketch)
@immutable
class UiMotion {
  const UiMotion._(this.reduced);
  final bool reduced;                         // MediaQuery.disableAnimationsOf(context)
  Duration get instant => reduced ? Duration.zero : const Duration(milliseconds: 90);
  Duration get fast    => reduced ? Duration.zero : const Duration(milliseconds: 150);
  // base, slow, emphasis, celebrate the same way ...
  Duration stagger(int i) => reduced ? Duration.zero : Duration(milliseconds: 28 * math.min(i, 6));
  static const enter = Curves.easeOutCubic; // curves are not switched
  ...
}
extension UiMotionContext on BuildContext {
  UiMotion get motion => UiMotion._(MediaQuery.disableAnimationsOf(this));
}
```

* `MediaQuery.disableAnimationsOf` exists (`widgets/media_query.dart` 2015) and subscribes only to the `disableAnimations` aspect, so toggling the OS setting rebuilds only motion consumers.
* **Every** widget in the system reads durations only from `context.motion`. A lint-by-grep rule goes in the PR template: `Duration(milliseconds:` is forbidden outside `motion.dart` and non-animation timers (toast display time, debounce).
* Reduced policy: durations -> zero (implicit animations then jump to the end value), spatial motion (translate, scale, hero flight, confetti, shake, stagger) removed, route transitions become a **<= 100 ms cross-fade** (built-in builder still has a fixed `transitionDuration`, so the builder renders `Interval(0, 0.33)` of opacity when `reduced`), shimmer becomes a static `#EDEDED`, haptics are unchanged (they are not motion; Android's own touch-feedback setting governs them).
* Flutter does not scale durations by Android's animator-duration scale. Whether the Honor's "Remove animations" maps to `disableAnimations` must be checked once on the device (Settings -> Accessibility -> Remove animations, then read `MediaQuery.disableAnimations`); the plan assumes it does and adds a one-line debug overlay in Widgetbook to flip it.
* Widgetbook gets a "Reduce motion" addon (a `MediaQuery` override) so every use case can be reviewed in both modes.

---------------------------------------------------------------------------

## 3. Page transitions by navigation type

| Type | Examples (screen numbers) | Motion | Duration in / out | Mechanism |
|---|---|---|---|---|
| **Tab switch** | 01 / 02 / 10 / 13 via `NavCluster` | Cross-fade; incoming rises 8 dp. No horizontal travel (tabs are peers, not a hierarchy). The nav cluster itself does not move. | 180 / 180, overlapped | `StatefulShellRoute(navigatorContainerBuilder: ...)` replacing `.indexedStack`; branch children stay mounted (`Offstage` + `TickerMode`) so state is preserved exactly as today. `ShellNavigationContainerBuilder` signature verified (`route.dart` 1189). |
| **Push (hierarchical)**, back chevron | 02 -> 22, 22 -> 23, 01 -> 05, 17, 15 -> 41, 14 | Built-in FadeForwards (new page fades in and slides in from the right, old page drifts left 25% and fades). Shorter and with matching scrim colour. | **300 / 240** (today 450 / 450) | One `PredictiveBackPageTransitionsBuilder` subclass in `buildUiTheme()` overriding `transitionDuration`/`reverseTransitionDuration` and `fallbackColor: UiColors.bg`. Covers every `builder:` GoRoute with no router change. iOS keeps Cupertino (native swipe-back). |
| **Modal flow**, close "x" | 07/09 Nuevo movimiento, 24 Mover dinero, 29 Transferencia, 08 Dividir | Slide up from the bottom edge, fully opaque; the page underneath stays still. Pop: slides down. | 320 / 240, `enter` / `exit` | `CustomTransitionPage` (go_router `pageBuilder`) with `fullscreenDialog: true`; a helper `uiModalPage(state, child)` in `lib/app/`. Matches UX spec rule 6.1.1 ("alta flows from the central + use close x; pushed screens use back"). |
| **Sheet** | all 20 `showUiSheet` pickers/confirmations | Keep Flutter's slide-up. Align to tokens (`base` in, `fast`+ out) and pass `AnimationStyle.noAnimation` when reduced. | 240 / 180 | `showUiSheet(sheetAnimationStyle: ...)`. One edit, all sheets follow. |
| **Replace / redirect** (login -> home, welcome) | 18/19/34 | No custom motion; router redirects replace the stack (built-in is fine, appears once). | | untouched |
| **In-place state change** | search field open, filter chips, month switch, toggle | `AnimatedSwitcher`/`AnimatedContainer` at `fast`. | 150 | see slice S11 |

### Predictive back (optional, tiny)
Add `android:enableOnBackInvokedCallback="true"` to `<application>`; the theme builder already wraps `PredictiveBackPageTransitionsBuilder`, so Android 14+ shows the system peek-behind-the-page back animation. Risk: any `PopScope`/`WillPop` handling (none found in `lib`) and go_router's own back handling must be checked on the device; ship it as its own revertable commit.

### Shared-element moments

1. **Envelope row -> 22 Detalle de sobre.** Shared element: the **icon circle**. `Hero(tag: 'env-${id}')` on the 44 dp circle in `UiEnvelopeRow` (new optional `heroTag`), and on a matching circle in the 22 header. Today 22 draws a bare 30 dp icon, so the header gets the same 44 dp circle (design change, see §6). 22 must render its header (icon, name, group) **immediately from `envelopes.lineById(id)`** (already in memory) instead of waiting for `GET .../detail`; only the figures and activity come from the detail. That also removes the full-page skeleton on a screen the user has already seen part of. Cross-navigator eligibility confirmed in `heroes.dart`. A `flightShuttleBuilder` is not needed (same shape, circle -> circle, `RectTween` default). Name text gets a 150 ms cross-fade only (no text Hero: font-size morphs jank).
2. **GoalCard -> 05 Detalle de meta.** The photo (or lavender tint) expands from the rounded card (radius 32) to the full-bleed `GoalBackdrop` (radius 0). `Hero` + a `flightShuttleBuilder` that interpolates the `ClipRRect` radius; text and glass panels fade in after the flight (Interval 0.4-1). Biggest wow for this app's most photogenic component; the photo is a `NetworkImage` already cached when the card is visible.
3. Rejected: a Material "container transform" (`animations` package `OpenContainer`). It snapshots whole pages, pushes its own route (bypassing go_router's URL stack and `parentNavigatorKey` logic), and adds a dependency for an effect two `Hero`s deliver.

---------------------------------------------------------------------------

## 4. Signature moments

| # | Moment | Design | Frequency / cost control |
|---|---|---|---|
| A | **Animated money figures** | `UiMoneyText` / `UiAnimatedAmount(minor:, currency:, style:)` in `packages/ui`: `TweenAnimationBuilder<int>` (IntTween) rendering `formatMoney(v, currency)` per frame (integer arithmetic only, so no float drift; consistent with the `money.dart` contract). Duration `emphasis` 600 ms, curve `Interval(0.25, 1, curve: fill)` so the first quarter is absorbed by the pop transition that is still covering the page. First build = no animation (begin == end). Where: `UiJoinedCard` primary figure ("Listo para asignar", saldo total, "Salió"), the three figures in 22, goal saved label, envelope row available amount, accounts rows. `UiJoinedCard` keeps its string API and gains an optional `primaryAmount:` (non-breaking). | Only on value *change*. Negative/zero crossing keeps the `-` handling of `formatMoney`. Digits are proportional in the variable font unless Urbanist ships `tnum` (not verified: no font tooling on this machine; check `GSUB` for `tnum`; if absent, left-align the animated figures and avoid centering during the tween). |
| B | **Progress bars filling** | `UiStripeBar`: stateful, `AnimationController` + `CustomPainter(repaint: animation)` so only paint runs per frame; stripes grow from 0 -> value on first appearance of a *hero* bar (goal row in 22, 05 summary, goal card line) and animate old -> new on value change; list-row bars only when the parent says `animateIn: true` (first load of the screen, first 6 rows). **Fix the dot field first**: derive each dot from a hash of its absolute grid cell (`(ix * 73856093) ^ (iy * 19349663)`), not from a sequential `Random`, so dots never re-roll; cache the dot field as a `ui.Picture` per size. Colour/overspent variants unchanged. | 14 rows x 440 dots per frame is the worst case today; the cache removes it. Offscreen rows do not exist (lazy list) so they cost nothing. |
| C | **Confirmation after saving a transaction** (07/09/12/23/28/29/31) | Three beats, none blocking: (1) at swipe release or tap: `HapticFeedback.mediumImpact`, handle snaps to the end with `settle`, bar shows the chartreuse trail full (no waiting: `onConfirm` fires immediately, the existing `_saving` flag disables the bar); (2) while the request runs the handle shows a small progress ring (new `saving` state) instead of the lock; (3) on success the **toast** animates in (240 ms rise 24 dp + fade) and its check circle stamps in (scale 0.6 -> 1.0, `settle`, 80 ms delay) with a second light haptic; the screen pops in parallel. The destination's numbers then roll (A). | The toast is the only confirmation that survives the pop, so it carries the moment. Out animation 150 ms. |
| D | **Swipe feel on the SaveBar** | A chartreuse trail fills behind the handle proportional to drag, a `selectionClick` when the drag crosses the 0.8 threshold ("detent"), spring-back with `settle` when released early. Silent invalid save (screenshot 07b: nothing happens) gets a 240 ms horizontal shake of the amount capsule + `lightImpact` + the existing error text. | Swipe is the main save gesture, so this is felt on every create flow. |
| E | **Money-move moment (24 -> 22)** | On 24: when both envelopes are chosen and the amount is valid, the down arrow between the cards turns chartreuse and does one 400 ms "pour" (a dot travels down the arrow). Confirm = same C haptic/bar behaviour. On return to 22 (which reloads after pop): the three figures roll (A), and the new "Movido a ..." row is **highlighted**: slides in from 12 dp above, tinted lavender for 700 ms then fades to the card colour (`UiFreshHighlight`, applied only to ids not present in the previous load). Same highlight for a newly saved transaction at the top of Movimientos. | Highlight is driven by id diff between loads, so refreshes and pagination never replay it. |
| F | **Goal reached** | On an observed transition `percent < 100 -> >= 100` of a goal (detected in a small app-level `MomentsController` that diffs `EnvelopesController.lines` between loads; never on first load, never persisted): the progress line fills to 100%, one `celebrate` (900 ms) burst of ~40 chartreuse/lavender particles from the percent label (`CustomPainter`, one controller, `RepaintBoundary`), `heavyImpact` then `lightImpact` 90 ms later, label becomes "Meta cumplida" with a check icon (text, not colour alone). Reduced motion: no particles; static badge. | Fires at most once per transition; zero cost otherwise. |
| G | **Ready to Assign reaches zero** | Same observed-transition detection (`readyToAssignMinor` goes from non-zero to 0 after an assignment). The joined-card figure rolls to $ 0 (A), a chartreuse ring pulses once around the "+" (500 ms), the label swaps to "Todo asignado" with a check icon for 2 s, one `mediumImpact`. Negative -> 0 (fixing an over-assignment, screenshot 46b) gets the same moment: it is the budgeting goal. | Same guard as F. |
| H | **Staggered list entrance** | `UiEntranceScope` (one controller, 220 ms + `stagger`) and `UiEntranceItem(index:)` = fade + 12 dp rise via `Interval`. Armed once per mount when the screen goes skeleton -> loaded. Applied to Plan rows, Movimientos day groups/rows, Cuentas rows, 22 activity rows. | First 6 items only; later items appear instantly; no replay on scroll (item reads the scope's `armed` flag in `initState` only). |
| I | **Skeleton -> content** | `UiSkeleton`: one group `ShaderMask` with a left-to-right linear-gradient sweep (1200 ms loop, the PRD §5 spec) over `#EDEDED` blocks; single shader mask per screen. `UiLoadSwitcher` = `AnimatedSwitcher(150 ms)` + `AnimatedSize`, aligned top, so the skeleton fades out as the content fades in without a layout jump. Plan and Cuentas get the skeleton they are missing. | The shimmer is the only continuous animation in the app, only while loading, auto-paused when covered. Fallback if profile shows raster cost: keep the current opacity pulse (cheaper, no `saveLayer`). |
| J | **Press feedback** | `UiPressable`: a `Listener` (does not join the gesture arena, so taps/scrolls/drags are unaffected) driving `AnimatedScale` with `instant` 90 ms; scale 0.96 buttons/keys, 0.97 chips/icon buttons, 0.985 cards/rows. Built into `UiHitTarget` (instantly covers 29 files) and used by `EnvelopeRow`, `GoalCard`, `TxRow`, `AccountRow`, `GlassTile`, `OptionCard`, `ChoiceCard`, `SplitRow`. Because the theme has `NoSplash`, this is the *only* tap acknowledgement in the app. | No extra repaint of siblings: transform is composited. |
| K | **Haptics map** | `selectionClick`: keypad keys, chips, toggle, month switch, tab select, list pickers selection. `lightImpact`: primary button press, shake, toast info/warning. `mediumImpact`: save confirmed, move confirmed, Ready-to-Assign zero. `heavyImpact`: goal reached (+ light). One tiny `UiHaptics` wrapper so call sites never import `services` directly and a future "haptics off" preference is a one-line change. | Android respects the system touch-feedback setting. |
| L | **Tab bar** | `UiNavCluster`: an ink bubble slides (`standard`, 220 ms) under the newly selected tab (positions are static: tab 60, add 64, gap 8, pad 6, so offsets are computable), icon colour cross-fades; "+" gets the press scale. | Repaints inside the blur tray; budget check in the profile run (the tray is small). Fallback: `AnimatedContainer` colour cross-fade only. |
| M | **Micro-interactions** | Toggle thumb slide, Chip selection fill, MonthSwitch label slide, selection check "draw", checklist tick, BarChart bars growing on first show / range change (reports), calendar day selection. All at `fast`, all tokenised. | Only on state change. |

Deliberately **not** animated: digit entry in the amount capsule and keypad (typing must be instant), list scrolling, refresh, pagination, filter result swaps (only the count morph), anything inside a pending request path.

---------------------------------------------------------------------------

## 5. Implementation slices, ranked by delight per effort

Estimates are changed lines including the Widgetbook use cases; each slice is one coherent commit (Conventional Commit, `feat(ui)`/`feat(app)`), target <= 400 lines. Order is the recommended build order too; each slice is independently shippable and revertable.

### S1. Motion foundation: tokens, reduce-motion switch, route transitions (~230 lines) - highest value, lowest risk
* New `packages/ui/lib/src/tokens/motion.dart` (tokens, `UiMotion`, `context.motion`); export in `packages/ui/lib/ui.dart`.
* New `packages/ui/lib/src/motion/page_transitions.dart`: `UiPageTransitionsBuilder` (subclass of `PredictiveBackPageTransitionsBuilder`: 300/240 ms, `fallbackColor: UiColors.bg`, reduced -> <=100 ms fade).
* `packages/ui/lib/src/tokens/theme.dart`: `pageTransitionsTheme` for Android.
* `packages/ui/lib/src/organisms/sheet.dart`: `showUiSheet(sheetAnimationStyle: ...)`.
* Replace magic numbers: `organisms/save_bar.dart` (180), `atoms/page_dots.dart` (180), `lib/features/plan/assign_page.dart` (240), `lib/features/transactions/movements_page.dart` (skeleton 1100, left for S8).
* Widgetbook: "Reduce motion" addon in `widgetbook/lib/main.dart`.
* Delta: pushes go from 450 -> 300 ms, white scrim flash removed, one switch for the OS setting.

### S2. Press feedback + haptics wrapper (~220 lines)
* New `packages/ui/lib/src/atoms/pressable.dart` (`UiPressable`), new `packages/ui/lib/src/tokens/haptics.dart` (`UiHaptics`).
* `atoms/hit_target.dart` uses `UiPressable` (covers buttons, icon buttons, keys, chips, nav circles, toggles via their existing use).
* Cards with raw `GestureDetector`: `molecules/envelope_row.dart`, `goal_card.dart`, `glass_tile.dart`, `option_card.dart`, `choice_card.dart`, `split_row.dart`, `tx_row.dart`, `account_row.dart`.
* Haptic calls on keys (`atoms/key.dart`), chips (`atoms/chip.dart`), `atoms/toggle.dart`, `organisms/nav_cluster.dart`.
* Widgetbook use cases for the pressed state.

### S3. Nav cluster sliding indicator (~140 lines)
* `packages/ui/lib/src/organisms/nav_cluster.dart`: ink bubble `AnimatedPositioned` + icon colour tween; "+" press scale. Profile the blur tray before/after.

### S4. Animated money figures (~260 lines)
* New `packages/ui/lib/src/molecules/animated_amount.dart` (`UiMoneyText`).
* `organisms/joined_card.dart` (additive `primaryAmount`), `molecules/goal_card.dart` (saved label), `molecules/envelope_row.dart` (amount), `molecules/account_row.dart`.
* App wiring: `lib/features/home/home_page.dart`, `lib/features/envelopes/plan_page.dart`, `lib/features/accounts/accounts_page.dart`, `lib/features/accounts/account_detail_page.dart`, `lib/features/envelopes/envelope_detail_page.dart` (the three figures), `lib/features/transactions/movements_page.dart` (summary card).

### S5. Progress fill + stable dots (~230 lines)
* `packages/ui/lib/src/atoms/stripe_bar.dart` (hash-based dots, cached dot picture, animated stripes), goal card line in `molecules/goal_card.dart`, `molecules/goal_summary.dart`, `molecules/goal_row.dart` (they host the bar), `molecules/split_progress.dart`.
* Widgetbook: bar at 0 / 0.6 / 1 / overspent, and a "play" use case.
* Note: this changes the dot pattern slightly (flagged for design review) but makes it stable.

### S6. Toast entry/exit + success stamp (~210 lines)
* `packages/ui/lib/src/molecules/toast.dart`: host `StatefulWidget` with a controller inside the `OverlayEntry` (rise + fade in 240 ms, fade out 150 ms before removal; swipe-dismiss path unchanged), check-circle stamp for `success`, haptic by variant.
* `lib/features/common/feedback.dart`: no signature change.
* The 4 s / 1.5 s display timers are unchanged.

### S7. SaveBar trail, detent haptic, saving state, invalid-save nudge (~280 lines)
* `packages/ui/lib/src/organisms/save_bar.dart`: trail, `selectionClick` at the threshold, `settle` spring-back, optional `saving` flag (ring instead of lock).
* New `packages/ui/lib/src/atoms/shake.dart` (`UiShake`); `molecules/amount_capsule.dart` accepts a shake trigger.
* App wiring of `saving:` and the nudge: `lib/features/transactions/new_transaction_page.dart` (`_saving`, `_error`), `edit_transaction_page.dart`, `envelopes/move_money_page.dart`, `accounts/transfer_page.dart`, `accounts/account_form_page.dart`, `envelopes/envelope_form_page.dart`, `envelopes/envelope_edit_page.dart`.

### S8. Skeleton system + crossfade + the missing skeletons (~330 lines)
* New `packages/ui/lib/src/molecules/skeleton.dart` (`UiSkeleton`, `UiSkeletonBox`, `UiLoadSwitcher`).
* Replace the three ad-hoc skeletons: `movements_page.dart` `_SkeletonRows`, `envelope_detail_page.dart` `_Skeleton`, `home_page.dart` `_GoalsSkeleton`.
* Add the missing ones: `lib/features/envelopes/plan_tab_page.dart` (blank `SizedBox()` today), `lib/features/accounts/accounts_page.dart` (verify its loading branch).
* Closes a spec gap (PRD §5 table requires "Esqueleto" for Plan; text says shimmer, code pulses).

### S9. Staggered entrance (~220 lines)
* New `packages/ui/lib/src/atoms/entrance.dart` (`UiEntranceScope`, `UiEntranceItem`).
* `lib/features/envelopes/plan_page.dart`, `lib/features/transactions/movements_page.dart`, `lib/features/common/day_groups.dart` (shared builder used by 10 and 22), `lib/features/accounts/accounts_page.dart`, `lib/features/envelopes/envelope_detail_page.dart`.

### S10. Modal route type + tab cross-fade (~230 lines)
* New `lib/app/page_transitions.dart` (`uiModalPage`), `lib/app/router.dart`: `pageBuilder` for `newTransaction` (and its `split` child), `moveMoney`, `transferFrom`.
* `lib/app/router.dart` + `lib/features/shell/app_shell.dart` (or new `lib/features/shell/tab_container.dart`): `StatefulShellRoute(navigatorContainerBuilder:)` cross-fade container; inactive branches `Offstage` + `TickerMode(enabled: false)`.
* Must verify: state preservation per branch, the stagger of S9 on first visit not double-animating with the 180 ms tab fade.

### S11. Micro-interactions (~300 lines)
* `atoms/toggle.dart`, `atoms/chip.dart`, `molecules/filter_chip.dart`, `molecules/month_switch.dart`, `atoms/selection_mark.dart`, `atoms/checklist_row.dart`, `organisms/bar_chart.dart` (grow on first show / range change, `shouldRepaint` currently returns false so it needs an animation-aware painter), `organisms/calendar_month.dart`.

### S12. Shared elements (~320 lines)
* `molecules/envelope_row.dart` (`heroTag`), `molecules/goal_card.dart` (`heroTag`, photo hero), `atoms/goal_backdrop.dart` (destination + shuttle radius morph).
* `lib/features/envelopes/envelope_detail_page.dart`: header from `lineById` immediately, 44 dp icon circle, Hero; `lib/features/goals/goal_detail_page.dart`; `lib/features/envelopes/plan_page.dart` and `lib/features/home/home_page.dart` pass tags.
* Risk: Hero + FadeForwards on a mid-range GPU; profile 02 -> 22 and 01 -> 05 specifically.

### S13. Move landing + fresh-row highlight (~250 lines)
* New `packages/ui/lib/src/molecules/fresh_highlight.dart`; `molecules/tx_row.dart` gets `fresh:`.
* `lib/features/common/day_groups.dart` and `lib/features/envelopes/envelope_detail_page.dart` (id diff between loads), `lib/features/transactions/movements_page.dart`.
* `lib/features/envelopes/move_money_page.dart`: arrow "pour" when valid.

### S14. Celebration moments: goal reached and Ready-to-Assign zero (~390 lines)
* New `lib/core/moments/moments_controller.dart` (diff of `EnvelopesController` loads; in-session only), wired in `lib/app/dependencies.dart`.
* New `packages/ui/lib/src/atoms/confetti_burst.dart`, `atoms/pulse_ring.dart`.
* Consumers: `lib/features/home/home_page.dart` (joined card, goal card), `lib/features/goals/goal_detail_page.dart`, `lib/features/envelopes/plan_page.dart`.
* Needs product copy approval ("Meta cumplida", "Todo asignado").

### S0 (optional, anytime): Predictive back opt-in (~5 lines)
* `android/app/src/main/AndroidManifest.xml`: `android:enableOnBackInvokedCallback="true"` on `<application>`. Separate commit, device-verify back from every tab and from sheets.

### Perceived-speed prerequisite (not animation, not in these slices; needs a product decision)
`saveTransaction` and `moveMoney` wait for the create **and** a refresh of envelopes+accounts before closing. Popping as soon as the create succeeds and letting `envelopes.load()`/`accounts.load()` finish in the background would make saving feel instant and let moment A (numbers rolling) play in front of the user. Trade-off: the destination may show the old figure for ~100-300 ms before it rolls, which A makes look intentional. Leave as an explicit follow-up decision.

---------------------------------------------------------------------------

## 6. Spec changes needed (`openspec/specs/ui-design-system/spec.md`, plus UX spec)

New change proposal suggested: `add-motion-system` (openspec), delta specs:

| Delta | Type | Why |
|---|---|---|
| **Motion tokens and reduced motion** (durations, curves, `context.motion`, behaviour when `MediaQuery.disableAnimations` is true, "no `Duration(milliseconds:)` outside tokens") | ADDED requirement | There is none today. |
| **Presentational package boundary**: currently says internal `StatefulWidget` is allowed "only for local gesture or focus state (SaveBar drag, TextField focus, Toast timer)". Animated widgets need tickers. | MODIFIED | Must allow local *animation* state (controllers, tweens). Without this S2-S14 violate the spec. |
| **Press feedback and haptics** (`UiPressable` scales, haptic map, wrapper) | ADDED | New behaviour on every tappable. |
| **Toast**: entry/exit animation, success stamp, haptic by variant (keeps 350x64, 4 s, swipe, one-at-a-time) | MODIFIED | Existing scenarios stay; add scenarios. |
| **SaveBar**: trail fill, threshold haptic, `saving` state, shake on invalid save | MODIFIED (SaveBar + SaveBar disabled state) | "Swipe released early: handle animates back" already exists; new states are not covered. |
| **NavCluster**: sliding active indicator | MODIFIED | "Active tab" scenario describes a static look. |
| **Animated amount** (`UiMoneyText`, `JoinedCard.primaryAmount`, "animates only on change") | ADDED | New component. |
| **Goal progress indicators / StripeBar**: fill animation, stable dot field | MODIFIED | The requirement says "the existing StripeBar"; the dot pattern changes (needs design sign-off). |
| **Skeleton** (shimmer sweep vs. pulse, min 3 rows, crossfade, reduced = static) | ADDED | Reconciles PRD §5 (shimmer) with the code (pulse, or static). |
| **Page transitions by navigation type** (table in §3) | ADDED | No requirement covers routing motion. |
| **Catalog coverage** | existing | Every new component/variant needs a Widgetbook use case in the same change, flagged for the other developer's review. Each slice above includes them. |
| **GoalCard / EnvelopeRow**: optional `heroTag` | MODIFIED (additive) | |

Outside `ui-design-system`:
* `PRD-ux-spec.md` §6.1 "Convenciones" (approved by the user on 2026-09-28): add rule 12 "Motion" (durations/curves/reduced motion, no animation gates an action). Needs the user's approval like the other rules.
* `PRD-ux-spec.md` §5: new celebratory states and copy ("Meta cumplida", "Todo asignado"); §5 skeleton paragraph updated if the pulse is kept.
* `PRD-ux-spec.md` §9.1/design `design/screens/22`: header icon in a 44 dp circle (needed for the Hero) and the header rendering before the detail loads. Visual change vs. the approved render.
* No API/OpenAPI change in any slice.

---------------------------------------------------------------------------

## 7. Dependencies: none

| Candidate | Verdict | Reason |
|---|---|---|
| `animations` (flutter.dev) | No | SharedAxis/FadeThrough are ~40 lines of built-ins; `OpenContainer` fights go_router. |
| `flutter_animate` | No | Chained rebuild-driven API; we need ~10 controlled animations. |
| `confetti`, `lottie`, `rive` | No | One `CustomPainter` (~120 lines) covers the only particle effect; Lottie/Rive add runtime and asset weight for a single moment. Revisit only if design hands over a bespoke animated illustration. |
| Haptics | Built-in `HapticFeedback` (`services/haptic_feedback.dart`: `selectionClick`, `lightImpact`, `mediumImpact`, `heavyImpact`, `vibrate` verified). | |
| Springs | Built-in `SpringDescription.withDurationAndBounce` available if a true spring is wanted later; `Curves.easeOutBack` is enough now. | |

Optional dev dependency (SDK, not third-party): add `flutter_test` to `packages/ui` for 3 tiny tests (reduced-motion zeroes durations; `UiMoneyText` does not animate on first build; entrance does not replay after an unrelated rebuild). The repo has no tests today, so this is a team decision; Widgetbook use cases are the mandatory check either way.

---------------------------------------------------------------------------

## 8. Performance plan (mid-range Android)

Rules baked into the slices:
* Animate `transform`/`opacity` via `FadeTransition`, `SlideTransition`, `ScaleTransition`/`AnimatedScale`; use `AnimatedBuilder(child:)` so subtrees are not rebuilt per frame; no `Opacity` widget.
* Painters animate through `CustomPainter(repaint: animation)`, not `setState`; `shouldRepaint` stays precise; `RepaintBoundary` around bars, confetti and the sliding indicator.
* `ShaderMask` exists only in the skeleton (one per screen); no animated `BackdropFilter`; the nav bar tray is the one blur surface and its animation (S3) is profiled.
* Controllers: one per scope (entrance scope, skeleton group), not per row; lists animate at most the first 6 items; lazy lists mean off-screen rows cost nothing; covered/hidden tabs are paused by `TickerMode`.
* Nothing animates in `build()` unconditionally: every animated widget triggers on a changed input (`didUpdateWidget`/`TweenAnimationBuilder` end change) or an explicit one-shot flag.

How to verify per slice (acceptance gate in the PR description):
1. `flutter run --profile` on the Honor; DevTools Performance overlay; scenarios: cold Inicio, first visit to Plan (14 rows, stagger + bars), tab switch x4, push 02 -> 22 (Hero), 01 -> 05 (photo Hero), open/close 07, save an expense (toast + rolling number), open 3 sheets in a row, scroll Movimientos (500 rows) during a refresh.
2. Pass bar: no frame over 16.7 ms build or raster in p95 of each scenario; worst frame under 32 ms; nothing janky when scrolling after an entrance finishes.
3. Run each scenario with reduce-motion on: no spatial motion, nothing blocked.
4. If a slice fails the bar, the documented fallbacks are: shimmer -> pulse (S8), sliding bubble -> colour cross-fade (S3), Hero -> fade (S12), particles -> static badge (S14). Each fallback is a one-line switch behind the tokens.

---------------------------------------------------------------------------

## 9. Risks and open decisions

1. **Reduce-motion on this device** is unverified (does the Honor's "Remove animations" set `disableAnimations`?). Check in S1 before anything else.
2. **Predictive back** (S0) can change back-button behaviour; keep it separate.
3. **22 header redesign** for the Hero (44 dp circle) needs design approval; if declined, drop S12's first Hero and keep the photo Hero.
4. **Celebration copy and the "zero = done" semantic** are product decisions (S14).
5. **Dot-field stabilisation** changes the exact pixel pattern of the stripe bar (S5); confirm with whoever owns the visual spec.
6. **Urbanist `tnum`** unverified; affects jitter during money tweens in centered figures (22).
7. **Tab cross-fade** briefly composites two screens; if profile shows raster cost on Plan/Movimientos, ship instant tabs and keep S3 (bubble) only.
8. The perceived-speed change to the save flow (pop after create) is outside motion scope but multiplies the value of S4/S6.
9. `TweenAnimationBuilder` first-build behaviour (begin == end shows the value without animating) is the key to principle 2; confirm with a widget test or a Widgetbook use case in S4 before wiring into screens.
