# Proposal

## Why

The two devs need a working `budget-tracker-front` repo before any UI work can start, with
`packages/ui` and Widgetbook in place from day one and no default test scaffolding left behind.

## What Changes

- Initialize `budget-tracker-front` with Flutter CLI.
- Create `packages/ui` as a local package (tokens/atoms/molecules/organisms structure).
- Set up Widgetbook, `analysis_options.yaml`, and `lib/features/` structure.
- Delete the default `test/widget_test.dart`; no `flutter test` step in CI.
- CI: `flutter analyze` + build only, no test step.

## Capabilities

### New Capabilities

None — this is repo scaffolding and tooling setup, no application behavior yet.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-front`.
- Unblocks: `ui-foundation`, `add-auth`, and every frontend feature.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-front
- FRs covered: none (foundation)
- Screens: none
- Depends on: none
- Size: S
- Linear: [RRG-41](https://linear.app/rgonaut/issue/RRG-41)
