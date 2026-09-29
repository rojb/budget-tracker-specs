# Tasks

## 1. [front]

- [ ] 1.1 Add the token layer to `packages/ui`: `tokens/colors.dart`, `typography.dart`, `shape.dart`, `icons.dart` and `theme.dart` (`buildUiTheme()` with `ThemeData`, `UiTheme` `ThemeExtension`, `SystemUiOverlayStyle` helpers); bundle Urbanist variable TTF and `OFL.txt` under `packages/ui/assets/fonts/` and declare it in `pubspec.yaml`; add the `lucide_icons_flutter` dependency behind `UiIcons`. Export from `ui.dart`. Verify `flutter analyze` in `packages/ui`.
- [ ] 1.2 Add `format/money.dart` (`Currency` enum ARS/USD/EUR, `formatMoney(int minor, Currency)`) with the `intl` dependency. Verify the four spec strings (`$ 48.200`, `US$ 1.250,50`, `€ 980,00`, `−US$ 12,50`) are produced, by rendering them in Widgetbook (task 1.6) and reading them back.
- [ ] 1.3 Add the atoms: `UiIconButton` (7 variants), `UiButton` (Primary/Secondary), `UiChip` (Default/Selected/DefaultIcon, heights 44/34), `UiAvatar`, `UiKey` (Number/Operator/Del), `UiToggle`; every interactive one with a 48 dp hit area. Verify `flutter analyze` in `packages/ui`.
- [ ] 1.4 Add the molecules: `UiTextField` (Default/Focus/Error with message), `UiFieldRow`, `UiAmountCapsule` (overridable symbol), `UiToast` (5 variants) with `showUiToast` (one at a time, 4 s, swipe dismiss). Verify `flutter analyze` in `packages/ui`.
- [ ] 1.5 Add the organisms: `UiNavCluster` (4 tabs + "+") and `UiSaveBar` (Default/Disabled, swipe-to-confirm plus tap alternative). Verify `flutter analyze` in `packages/ui`.
- [ ] 1.6 Widgetbook: enable the web platform in `widgetbook/` only, apply `buildUiTheme()`, add one use case per variant of every component plus a money-format story, remove `PlaceholderCard` from the package and the catalog, and switch the app home page to real components. Verify `flutter analyze` in the app root, `packages/ui` and `widgetbook/`, and `flutter build apk --debug` in the app.
- [ ] 1.7 Update the `packages/ui` README (Spanish): component list, tokens, money formatter, and how to add a component (small separate PR with its Widgetbook story, reviewed by the other dev). Verify the documented commands.

## 2. Verification

- [ ] 2.1 Manual verification checklist: `flutter analyze` clean in app, `packages/ui`, `widgetbook/`; `flutter build apk --debug` succeeds; `flutter build web` in `widgetbook/` succeeds and the served catalog renders every use case; Widgetbook vs. `design/screens/00-componentes.png` compared for each component (colors, radii, typography, variants) and differences recorded; SaveBar swipe, tap and Disabled behave per spec, Toast one-at-a-time, 4 s and swipe dismiss behave per spec (interactive checks need a browser or device); money strings match the spec; no `test/` folder, `*_test.dart` or `flutter_test` anywhere; `openspec validate ui-foundation` passes.
