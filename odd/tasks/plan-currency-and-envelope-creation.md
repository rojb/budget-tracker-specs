# Plan currency + envelope and group creation

## Objective
1. Each plan has exactly one currency (user decision, option **a**). The UI shows that currency consistently wherever an amount appears.
2. Envelopes and groups can be created, renamed and reordered from the UI at any time, not only from the empty-plan screen.

## Why
- Multi-currency was never specified in the UI. FR-33 excluded conversion, but the per-plan currency was implicit.
- Today an envelope can only be created on 06 Plan vacío. No screen creates groups or reorders them, although FR-04 requires both.

## Decisions
- The currency is chosen when the plan is created (20 Nuevo plan) and is **immutable** afterwards, because changing it would require conversion.
- Supported list: ARS "$", USD "US$", EUR "€", with the list extensible.
- Formatting always uses the es-AR locale: dot thousands separator, comma decimals. Decimals follow the currency's minor unit, and backend amounts are stored in minor units of the plan currency.
  - ARS: 0 decimals in the UI (`$ 48.200`).
  - USD/EUR: 2 decimals (`US$ 1.250,50`, `€ 980,00`).
  - Negative: `−US$ 12,50`.
- No conversion and no multi-currency accounts. FR-33 stays in Won't Have, narrowed to conversion.

## Scope
- **PRD.md** (Spanish):
  - new FR-40 "Moneda del plan" (Should Have);
  - FR-02 mentions the currency;
  - FR-33 reworded;
  - Revision History row;
  - §9 Technical Constraints: minor units per currency.
- **PRD-ux-spec.md**:
  - a "Moneda" section with a table of every place an amount appears and its format;
  - screen inventory and flows updated.
- **Screens** (edit design/app.base.op):
  - 02 Plan del mes: a "+" IconButton on each group header (creates an envelope in that group), and a "Nuevo grupo" plus "Editar grupos" action after the last group.
  - NEW 31 Nuevo sobre: name, group (preselected), the icon picker (same as 23), optional target (chips "Sin objetivo" (selected) / "Mensual" / "Hasta una fecha"), and a "Crear sobre" SaveBar.
  - NEW 32 Grupos: the list of groups with drag handles, envelope counts, rename and delete actions, a "Nuevo grupo" field, and the note "Al borrar un grupo, sus sobres pasan a…".
  - 20 Nuevo plan: the currency becomes a selector card with options Pesos (ARS) $ selected, Dólares (USD) US$, Euros (EUR) €, plus the note "No se puede cambiar después de crear el plan."
  - 16 Planes y miembros: each plan row shows its currency; add a third plan "Viaje a Chile · Solo vos · dólares (US$)".
  - NEW 33 Plan en dólares: a Plan del mes for plan "Viaje a Chile" in USD, with US$ amounts and 2 decimals everywhere (balance card, envelope rows, nav), showing the currency on the month header or plan chip.
  - The AmountCapsule badge shows the plan currency symbol; add a USD instance somewhere (e.g. inside 33, or note it on the component sheet).
- **Flows**:
  - F2 = 16 → 20 → 33 → 21 → 30.
  - F4 = 02 → 31 → 32 → 22 → 23 → 24.

## Constraints
- design/build-components.js generates design/app.op; never hand-edit app.op.
- The OpenPencil 0.8.4 rules are in odd/tasks/component-library.md:
  - children[0] draws on top, also at page level;
  - paths stretch to their box;
  - refs need numeric widths;
  - the row width audit exists.
- Verify in the headless render AND in a PrintWindow capture of the GUI window.

## Checks
- TDD: not applicable.
- Git: not initialized.

## Tasks
- [ ] T1 PRD + UX spec. Route: delegated writer.
- [ ] T2 Screens 02, 16 and 20, plus the new 31, 32 and 33. Route: same writer.
- [ ] T3 Flows F2 and F4, then verify. Route: writer plus a parent spot check.

## Progress / evidence
- Writer:
  - PRD: FR-40 added, FR-02 and FR-33 reworded, §9 minor units, v1.2.
  - UX spec: §7 Moneda table added; §9 extended to 33 screens.
  - AmountCapsule symbol can be overridden per instance.
  - PlanRow gets a solo variant.
  - Screen 02 has "+" per group plus Nuevo/Editar grupos; 16 shows currencies and adds Viaje a Chile; 20 has the currency selector.
  - New screens 31, 32 and 33.
  - Flows F2 and F4 updated.
- Parent spot check fixed:
  - 31: the "Hasta una fecha" chip overflowed the right edge; renamed it "Con fecha" in 31 and 23 so they stay consistent;
  - 32: the note was a literal placeholder ("pasan a…"), now it reads "pasan a «Sin grupo». No se pierde dinero ni movimientos."
- Verified 02, 31, 32 and 33.
- All tasks done.

## Next step
Navigation audit (odd/tasks/navigation-audit.md).
