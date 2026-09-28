# Archived accounts, group picker, custom assign amount

## Objective
Close three UI gaps the user found. The user approved on 2026-09-28.

## Scope
1. **Archived accounts:**
   - 13 Cuentas: add a row at the end of the account list, "Archivadas · 1 ›" (muted row, archive icon) → 51. Nothing may be clipped on 13.
   - **NEW 51 Cuentas archivadas:**
     - back → 13;
     - title "Cuentas archivadas";
     - the note "No suman al saldo total. Sus movimientos se conservan.";
     - one archived account row: **Brubank · Banco · archivada el 12 ago · $ 0**, with a "Restaurar" chip or button;
     - optionally a "Ver movimientos ›" link.
   - Dataset addition in canonical-dataset.md terms: Brubank, archived on 12 Aug 2026, balance $ 0. Because it is archived with $ 0, no sum changes.
2. **Group picker:**
   - **NEW 52 Elegir grupo**, a bottom sheet (picker convention: search is optional here because there are only 4 groups; a radio selection is required):
     - rows Obligaciones (3 sobres), Día a día (4 sobres, selected), Disfrutar (3), Metas (2);
     - a last row "+ Nuevo grupo" that expands in place into a name field plus "Crear". Show it expanded, with "Hogar" typed.
   - Opened from the "Grupo ›" rows on 31 Nuevo sobre and 23 Editar sobre. Update the navigation map.
   - Group creation stays available in 32 Grupos as well.
3. **Custom assign amount:**
   - **NEW 53 Asignar · monto propio**, the state of 03 Asignar dinero after tapping the AmountCapsule:
     - the capsule is active with a caret and "15.000" typed;
     - no quick chip selected;
     - the calculator keypad is visible (clone the Keypad from 07);
     - the selected envelope is shown compactly: Transporte, "−$ 6.200 disponible → quedaría en $ 8.800";
     - a line "Listo para asignar quedaría en $ 33.200" (48.200 − 15.000);
     - the SaveBar reads "Asignar $ 15.000".
     Drop or collapse the envelope carousel and the month chips if needed to fit. Nothing may be clipped.
   - Also fix 03's "Súper" label to "Supermercado" (naming convention).
4. **Flows:**
   - F7: add 51 after 48 (archiving → where archived accounts live).
   - F4: add 52 after 31.
   - F3: add 53 after 03.
   - Split any band longer than about 8 screens (F4 and F8 may need a/b bands). Keep the flow titles and FR tags.
5. **Docs (Spanish):**
   - UX spec inventory for 51–53, the navigation map, and flows.
   - PRD FR-03 mentions that archived accounts are listed and can be restored.
   - Revision row 1.7.

## Constraints
- Pipeline: design/app.base.op → design/build-components.js → design/app.op.
- Conventions: odd/tasks/pattern-consistency.md.
- Numbers: odd/tasks/canonical-dataset.md.
- OpenPencil rules: odd/tasks/component-library.md.

## Tasks
- [x] T1 Apply. Route: delegated writer.
- [x] T2 Verify with the parent spot check.

## Progress / evidence
- Writer:
  - 13 "Archivadas · 1" row;
  - new 51 Cuentas archivadas (Brubank $ 0 with Restaurar), 52 Elegir grupo (radio rows plus an expanded "Hogar" + Crear) and 53 Asignar · monto propio (15.000, keypad, Transporte → $ 8.800, RTA → $ 33.200);
  - 03 now says "Supermercado";
  - F4 split into F4a and F4b;
  - PRD FR-03 plus revision 1.7; UX-spec inventory, flows and navigation map.
- Convention script: 67 of 70 checks pass (only the known 41/42 source-only chevron cases fail).
- Parent contact sheet of 03, 13, 51, 52, 53: correct, nothing clipped, the arithmetic is right.
