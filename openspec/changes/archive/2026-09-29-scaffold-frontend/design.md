# Design

## Context

`budget-tracker-front` does not exist yet (the GitHub remote is empty). This change creates it with
the Flutter CLI and lays down the structure every frontend change builds on: an app shell with a
composition root, the `packages/ui` local package, a Widgetbook catalog, the `lib/features/`
convention, lint rules, and CI. See proposal.md - Why for the motivation. PRD.md §9 fixes the
platform (Flutter stable, Android 8.0+ / iOS 13+), a thin-client architecture (presentation,
navigation, UI state, HTTP client; no budget calculations), and "always connected" behavior.

No product behavior ships here. The only screen is a placeholder home that proves the pattern end
to end: feature container -> `ChangeNotifier` controller -> presentational widget from
`packages/ui`.

Tooling in use: Flutter 3.47.1 (stable channel), Dart 3.13.1.

## Goals / Non-Goals

**Goals:**
- A cloned, analyzable, buildable Flutter project for Android and iOS only.
- `packages/ui` as a local path package with the `tokens/atoms/molecules/organisms` layout and a
  single barrel file, importing nothing from the app.
- A Widgetbook app that catalogs `packages/ui`, with one placeholder story, no code generation.
- One documented state-management and dependency-injection convention, demonstrated by a tiny
  feature.
- `flutter_lints` plus dependency-direction guarantees, and CI that analyzes and builds.
- Zero test artifacts: no `test/` folders, no `flutter_test` dev dependency.

**Non-Goals:**
- Design tokens and real components (PRD-ux-spec.md §7 and §8): that is `ui-foundation` (RRG-43).
- The generated `api_client` package and the Prism mock server: they belong to `add-auth` (RRG-44)
  and later feature changes. Planned location: `packages/api_client/`, generated from
  `../budget-tracker-specs/openapi.yaml`. Not created now.
- Endpoints: this change adds or modifies none, so there are no `openapi.yaml` references.
- UI components used or added from `packages/ui`: none from the PRD-ux-spec.md §8 inventory. A
  single throwaway `PlaceholderCard` is added under `atoms/` only to demonstrate the wiring and the
  Widgetbook story; `ui-foundation` replaces it. It needs no cross-dev `packages/ui` PR because it
  is scaffolding, not an inventory component.
- Authentication, real routes, theming, localization, web/desktop targets.

## Decisions

**Project identity: package `budget_tracker`, org `com.budgettracker`.** Generated with
`flutter create --org com.budgettracker --project-name budget_tracker --platforms android,ios .`
inside the cloned repo. The application id is therefore `com.budgettracker.budget_tracker`.
The org id is a fixed convention so both devs produce the same Android/iOS identifiers.

**Platforms: Android and iOS only.** Matches PRD §7 (Plataforma). `--platforms android,ios` keeps
web/desktop folders out of the repo. Android `minSdk` is set to 26 (Android 8.0) in
`android/app/build.gradle*`; the iOS deployment target is 13.0 (`ios/Podfile` and the Xcode
project). Flutter's defaults are lower than or equal to these, so they are pinned explicitly.

**Folder layout.**

```
lib/
  main.dart                     # runApp(App(dependencies: ...)) only
  app/
    app.dart                    # App widget (MaterialApp.router)
    router.dart                 # go_router configuration
    dependencies.dart           # composition root
  core/
    config.dart                 # AppConfig: API base URL via --dart-define
  features/
    <feature>/
      <feature>_page.dart       # container widget
      <feature>_controller.dart # ChangeNotifier
packages/ui/                    # local package, presentational only
widgetbook/                     # separate Flutter app
```

Features are folders under `lib/features/`, not packages: they are owned by one dev per change and
change together with the app. `packages/ui` is a package because it is shared by two consumers
(the app and Widgetbook) and its boundary must be enforced by the pub dependency graph.

**`packages/ui` layout.** `lib/src/{tokens,atoms,molecules,organisms}/` (each holds a
`.gitkeep` or its placeholder), and one public barrel `lib/ui.dart` that exports the public API.
Consumers import only `package:ui/ui.dart`, never `package:ui/src/...`. Widgets are
`StatelessWidget`, take data and callbacks through constructor parameters, and know nothing about
HTTP, controllers, or features. The package name is `ui`.

**State management: `ChangeNotifier` + `ListenableBuilder`; no `provider`, no Riverpod.**
Decided by the team on 2026-09-29. PRD §9 allowed Riverpod only if at least one of the two devs
had already used it; neither has. `ChangeNotifier` and `ListenableBuilder` ship with the Flutter
SDK, so there is no extra dependency to learn, version, or generate code for, and the thin-client
scope (UI state only) does not need more. Trade-off: no built-in scoping or disposal helpers, so
controllers are created and disposed by the container widget's `State` (or held by the
composition root when app-wide), and rebuild granularity is chosen by hand with
`ListenableBuilder`. Alternatives considered: Riverpod (rejected: no prior experience, extra
concepts), `provider` (rejected: extra dependency for what constructors already give us), `bloc`
(rejected: more boilerplate than a thin client needs).

**Dependency injection: constructors from a composition root.** `lib/app/dependencies.dart`
builds the object graph once (config, and later the `api_client`, repositories, app-wide
controllers) and `App` passes what each page needs through constructors or the router builders.
No service locator and no `InheritedWidget` lookups for dependencies. Consequence: every
dependency of a widget is visible in its constructor.

**Container/presentational split.** A feature container (`<feature>_page.dart`) owns its
controller, listens with `ListenableBuilder`, and maps controller state to `packages/ui` widgets.
The controller (`<feature>_controller.dart`, a `ChangeNotifier`) holds UI state and calls the
API client (later); it never builds widgets. Presentational widgets in `packages/ui` never see a
controller. The demo feature is `home`: `HomeController` exposes a greeting message and `HomePage` renders `PlaceholderCard` from `packages/ui` with it.

**Routing: `go_router`.** First-party (flutter.dev) package. The app has 53 screens across several
flows (PRD-ux-spec.md §9.1), a bottom navigation shell, and will need an auth redirect in
`add-auth`; declarative routes with `redirect` and `ShellRoute`/`StatefulShellRoute` cover those
without hand-written `Router` delegates. Plain `Navigator` was rejected because retrofitting
named routes, deep links, and redirects later would touch every screen. Trade-off: one extra
dependency and its API churn between majors, accepted because it is maintained by the Flutter team.
Only a `/` route to `HomePage` exists now.

**Lint: `flutter_lints` plus enforced dependency direction.** The app's `analysis_options.yaml`
includes `package:flutter_lints/flutter.yaml` and enables a few additional rules
(`prefer_const_constructors`, `always_declare_return_types`, `avoid_print`).
`packages/ui` and `widgetbook` get the same base ruleset. "packages/ui must not import app code" is
enforced structurally instead of by a lint: `packages/ui/pubspec.yaml` has no dependency on
`budget_tracker`, so `import 'package:budget_tracker/...'` fails to resolve and `flutter analyze`
reports `uri_does_not_exist`. Its only dependency is the Flutter SDK. The same argument keeps the
API client out: `packages/api_client` will never appear in `packages/ui`'s pubspec. Dependency
direction: `app -> packages/ui`, `widgetbook -> packages/ui`, never the reverse.

**Widgetbook: separate Flutter app in `widgetbook/`, path dependency on `packages/ui`, manual
catalog.** `widgetbook/` is its own project (own `pubspec.yaml`, own `lib/main.dart`) so the
catalog never ships in the app binary. The catalog is declared by hand with `WidgetbookComponent`
and `WidgetbookUseCase` in Dart, so there is no `widgetbook_generator`, `build_runner`, or code
generation step (fewer moving parts for a 2-person team). One placeholder use case for
`PlaceholderCard`. It targets `android` and `ios` like the app and is run on an emulator or device
as documented in the README (`flutter run` inside `widgetbook/`).

**Configuration: `--dart-define`.** `lib/core/config.dart` exposes
`AppConfig.apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000')`
(`10.0.2.2` is the Android emulator's alias for the host machine, where the NestJS backend or the
Prism mock runs). No `.env` files and no runtime config package. Nothing consumes the value yet;
it establishes the seam for the API client.

**No tests, no `flutter_test`.** Fixed by team-wide constraint (`openspec/config.yaml`,
docs/COLABORACION.md §6). `flutter create` generates `test/widget_test.dart` and a `flutter_test`
dev dependency in the app; `flutter create --template=package` does the same for `packages/ui`.
All `test/` folders and every `flutter_test` dev dependency are removed immediately, before the
first commit that contains them.

**CI: GitHub Actions, install -> analyze -> build, no test step.** One workflow
`.github/workflows/ci.yml` on push and pull request, using `subosito/flutter-action` with
`channel: stable` (and pub caching). Steps: `flutter pub get` and `flutter analyze` in the app
root, in `packages/ui`, and in `widgetbook`; then `flutter build apk --debug` for the app. The APK
debug build is used because it proves the Android toolchain, Gradle config, and `minSdk` work
without needing signing secrets or a macOS runner. iOS is not built in CI (macOS runners are
slower and costlier; iOS is checked by the devs locally). `actions/setup-java` (Temurin 17) runs
before the build because the Android toolchain needs a JDK.

## Risks / Trade-offs

- [`flutter create` generates a default counter app, `test/widget_test.dart`, and a
  `flutter_test` dev dependency] -> Removed in a dedicated task before anything else builds on the
  scaffold; a glob for `test/`, `*_test.dart`, and `flutter_test` is part of the final manual
  verification.
- [`packages/ui` accidentally depends on app or API code] -> Prevented by its pubspec (no such
  dependency), so the analyzer fails instead of relying on review discipline.
- [`go_router` major versions change its API] -> Pin a caret range in `pubspec.yaml`; routing is
  isolated in `lib/app/router.dart`, so a migration touches one file.
- [Manual Widgetbook catalog can drift from `packages/ui`] -> Accepted deliberately to avoid code
  generation; the `packages/ui` protocol in docs/COLABORACION.md §5 requires a story in the same PR
  as any component change.
- [Two Flutter pubspec consumers (app and widgetbook) with path dependencies make CI install steps
  triple] -> Accepted; three `pub get` runs are cheap and explicit.
- [Android build in CI depends on a JDK and SDK licenses on the runner] -> The GitHub-hosted
  `ubuntu-latest` image ships the Android SDK; `actions/setup-java` pins the JDK.
- [iOS is unverified in CI] -> Acknowledged; local iOS verification is a dev responsibility until
  a macOS job is worth its cost.

## Migration Plan

Greenfield repository, so there is no data migration. Rollout: clone the empty remote -> create
`main` with an initial commit (`.gitignore` and README stub) -> branch `rrg-41-scaffold-frontend`
-> scaffold task by task (one commit each) -> verify locally (`flutter analyze` in three
projects, `flutter build apk --debug`, Widgetbook launch) -> PR. Rollback is trivial: the branch is
simply not merged; there is no deployed state.
