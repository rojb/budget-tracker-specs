# Pattern consistency across screen types

## Objective
Screens of the same type share structure, controls, copy and sizes. The user approved every fix below on 2026-09-28.

## Conventions (write them into PRD-ux-spec.md as a "Convenciones" section, in Spanish)
1. **Top bar:**
   - screens pushed from another screen use back (chevron-left);
   - create flows opened from the central "+" use close (x);
   - sibling screens with the same entry use the same control.
2. **Destructive actions:**
   - the entry is always a red text link at the bottom of the form;
   - it always opens a confirmation sheet;
   - the DangerButton is solid #C62828 with white text, height 56, r 28;
   - nothing is deleted or archived without a sheet.
3. **BottomNav:** always a `BottomNavWrap` sibling of `Content`, fixed; never inside scrolling content.
4. **Editable value rows (`Field/*`):** always a trailing chevron-right, in both create and edit.
5. **Date groupers:** "Hoy · martes 29", "Ayer · lunes 28", then "Sábado 26".
6. **Amount + word:** the amount goes first ("$ 24.000 disponible").
7. **Sizes:**
   - tab-root titles 36;
   - sheet titles 24;
   - detail-entity titles 30;
   - sheet close buttons 48×48;
   - full-screen top buttons 52×52.
8. **Status bar color follows what is behind it:** dark on light backgrounds, white (StatusBar/Light) over photos.
9. **Pickers ("Elegir X"):** a search field and a selection indicator (radio circle, lavender check when selected). The only exception is 38 Fecha y hora, which uses an explicit "Listo".
10. **List screens:** search is a magnifier IconButton in the header that opens an in-place field; no always-visible search bar.
11. **The on-screen title matches the entity name** used in the navigation map.

## Fixes
**P1:**
- **06 Plan vacío:**
  - use the Plan-tab header like 02: title "Plan", Actions (layers + search), MonthSwitch "Septiembre 2026";
  - keep the BalanceCard ($ 300.000, 0 sobres, disabled "+"), the "Primeros pasos" card, the template chips and the buttons;
  - remove the avatar/greeting header, which belongs to 01;
  - nothing may be clipped.
- **22:** move BottomNav out of Content into a BottomNavWrap sibling, like 02.
- **16:** x becomes chevron-left; the title "Tus planes" becomes "Planes y miembros".
- **27:** DangerButton solid, height 56, like 43/44.
- **41:**
  - "Eliminar beneficiario" opens the NEW sheet **47 Eliminar beneficiario**: "¿Eliminar Coto?", "Sus 14 movimientos se conservan, sin beneficiario asignado.", then Cancelar / solid Eliminar;
  - clone 43.
- **42:**
  - the inline archive block is replaced by the red link "Archivar cuenta", which opens the NEW sheet **48 Archivar cuenta**;
  - the sheet says "¿Archivar Banco Nación?" and "Deja de sumar al saldo total. Sus movimientos se conservan.", then Cancelar / solid Archivar (#C62828);
  - clone 43.

**P2:**
- **41 and 42:** the Field/Nombre rows get a trailing chevron-right.
- **14:** "Lunes 28" becomes "Ayer · lunes 28".
- **08:** "Disponible $ 24.000" and "Disponible $ 47.550" become "$ 24.000 disponible" and "$ 47.550 disponible".
- **12:** remove the header trash-2 IconButton and add a red "Eliminar movimiento" text link at the bottom (→ 27).
- **37:** add a search field, cloned from 36, and re-tune Dimmed so the sheet ends at the bottom.
- **26:** the payee rows get radio selection indicators like 36/37; Coto is selected as the current value.
- **15:** replace the always-visible SearchField with a search IconButton in the header, next to user-plus.
- **18 and 19:**
  - apply convention 8: check what sits behind each status bar and use the matching color;
  - if 19's hero does not extend under the status bar, the status bar is dark.

**P3:**
- **10:** title 34 → 36.
- **11:** sheet title 30 → 24.
- **43 and 44:** sheet titles 22 → 24.
- **39:** close button 44 → 48.
- **22:** entity title 26 → 30.
- **Docs:** add the chip-height scale and the three group-label styles (plan Group header, UPPERCASE picker divider, GroupRow) to PRD-ux-spec §7/§8.

## Also
- Mapa de navegación: add 47 (from 41) and 48 (from 42), and update 12 (delete from the bottom link).
- Flows: add 47 to F8 after 41 and 48 to F7 after 42. Split bands longer than about 8 screens.

## Tasks
- [x] T1 Apply everything above. Route: delegated writer.
- [x] T2 Verify with contact sheets and the parent spot check.

## Progress / evidence
- Writer applied every P1, P2 and P3 fix and added sheets 47 and 48. PRD-ux-spec gained §6.1 Convenciones, the chip scale and the group-label styles; the inventory, flows and navigation map were updated.
- Convention script: 62 of 65 checks pass. The 3 failures are Field/Nombre on 41/42 with no chevron in the source, but the FieldRow master renders one, which the writer verified in app.op and the parent confirmed on the 42 render.
- Parent contact-sheet check of 06, 12, 15, 16, 19, 22, 26, 27, 37, 42, 47 and 48: correct, nothing clipped, and the sheets reach the bottom.
- Noted, pre-existing and not changed:
  - 12 shows the "Recalculado" toast next to the unsaved form, as a state demo;
  - 22 labels "Objetivo mensual 74%", while 74% is the spent share.

- **Convention change (user request, 2026-09-28):**
  - The destructive entry moved from a red text link at the bottom to a red `IconButton/Danger` in the top bar, opposite the back chevron: trash-2 on 12, 23 and 41; archive on 42.
  - The bottom links were removed. The confirmation sheets 27, 43, 47 and 48 are unchanged.
  - Updated UX spec §6.1 convention 2, the affordance table and the navigation-map rows 12, 23, 41 and 42.
- **User request:** the target amount on 23 and 31 gained QuickAmounts chips (cloned from 03): 23 has 100k / 150k / 180k (selected) / 200k, 31 has 20k / 30k / 50k (selected) / 80k. Tapping the capsule opens the keypad for a custom amount, the same state as 53 (documented in the navigation map).
- Parent verified 12, 23, 31, 41 and 42 in a contact sheet: nothing clipped.

## Next step
User review.
