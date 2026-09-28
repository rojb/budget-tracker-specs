# Navigation audit, guest join and envelope templates

## Objective
- Every screen must be reachable from a visible entry point.
- Every tappable element must lead somewhere defined, so that nothing "appears from nowhere".
- Add the approved guest-join paths and the envelope-template preview.

## Why
The user found interactions missing across the UI. Verified example: 30 Unirse a un plan has no entry point, and "Usar plantilla sugerida" on 06 leads nowhere.

## Approved decisions (user, 2026-09-28)
- **Guest join**, three paths:
  1. The QR encodes a link `sobres.app/unirse/<code>`. Scanning it with the phone camera opens the app with the code prefilled. With no account, the path goes through 19 Crear cuenta and then straight to joining.
  2. After registration, a choice screen offers "Crear mi plan" or "Tengo un código".
  3. 16 Planes y miembros gets a "Unirme con código" action next to "Nuevo plan".
- **Suggested template**, from "Usar plantilla sugerida" on 06:

  | Grupo | Sobres |
  |---|---|
  | Obligaciones | Alquiler, Servicios, Internet y celular, Transporte |
  | Día a día | Supermercado, Farmacia, Comida afuera |
  | Disfrutar | Salidas, Suscripciones, Regalos |
  | Metas | Fondo de emergencia, Vacaciones |

  - A preview screen shows the groups with every envelope checked; each one can be unchecked.
  - "Crear 12 sobres" confirms, and the envelopes are created with no target and no money assigned.

## Tasks
- [x] T1 Navigation audit (read-only). For every screen, list its entry points; for every tappable element, list its target. Report the orphan screens, dead-end taps, and missing states or confirmations, each with a proposed fix. Route: delegated read-only mapper. Wait until the plan-currency writer finishes.
- [x] T2 Present the audit to the user and get approval of the fixes.
- [ ] T3 Implement the approved decisions:
  - welcome choice screen after 19;
  - "Unirme con código" on 16;
  - a deep-link note on 30 (prefilled state);
  - template preview screen from 06;
  - PRD and UX spec updates.
  Also implement the audit fixes the user approves. Route: delegated writer.
- [ ] T4 Verify with the headless render, bottom crops and a GUI PrintWindow capture. Route: writer plus a parent spot check.

## Audit result (T1 done; key claims verified by the parent against app.base.op)
- **Orphans:**
  - 28 Nueva cuenta and 29 Transferencia have no entry point;
  - 17 Reportes has none either (UX spec says "from Inicio", but nothing exists there);
  - 15 and 16 are only reachable through an undefined Avatar tap, which transitively orphans 20, 21 and 33;
  - 30 is planned;
  - 25 Cierre de mes has no trigger (should be auto-shown on month rollover).
- **Undefined taps:** Avatar and bell on 01/06; "…", "Últimos aportes" and "Plan de aportes" on 05; the Sobre, Cuenta and Fecha y hora fields on 07/09/12/29; the filter selects on 11; the pencil on 14; the "+" and rows on 15.
- **Missing pickers:** envelope, account, date & hour, group; the avatar menu; the "…" sheet; payee create/edit; account edit/delete; a success toast.
- **Missing confirmations:** "Eliminar sobre" on 23; the group trash icon on 32.
- **Inconsistencies:**
  - 02 and 04 lack Listo para asignar (FR-16) — verified;
  - 06 has the nav active on house — verified; its "+" is active with 0 envelopes;
  - EnvelopeRow, TxRow and AccountRow have no chevron;
  - 23 has both back and close;
  - 31 lacks the target follow-up fields;
  - 33 lacks the group footer;
  - the 06 template chips do not match the approved template.
- **SaveBar trailing check:** the auditor called it a stray icon. The parent disagrees: it comes from the inspiration, where it is a swipe-to-confirm control (drag the chartreuse knob to the end check). Proposed fix: document it as swipe-to-confirm (tap also works for accessibility), and show it muted or disabled when the form is invalid (08).

## Approved fix plan (user said "dale" to everything, 2026-09-28)
New screens and sheets are numbered from 34:
- 34 Bienvenida
- 35 Plantilla sugerida
- 36 Elegir sobre
- 37 Elegir cuenta
- 38 Fecha y hora
- 39 Menú de cuenta
- 40 Opciones de meta
- 41 Beneficiario (new/edit)
- 42 Editar cuenta
- 43 Eliminar sobre (confirm sheet)
- 44 Eliminar grupo (confirm sheet)
- 45 Unirse desde enlace (prefilled deep link)

**Batch A (P1 + previously approved):**
- 02 and 04 get the BalanceCard with Listo para asignar.
- 36/37/38 pickers, wired from 07, 09, 12, 11, 24 and 29.
- 25 is auto-shown on month rollover (documented).
- 34, 45, and "Unirme con código" on 16.
- 35 template preview from 06; the 06 chips match the approved template.
- Flows updated.

**Batch B (P2 + P3):**
- Entry points: "+" on 13 → 28; "Transferir" on 14 → 29; the pencil on 14 → 42; a Reportes icon on 01 → 17; the avatar on 01/06 → 39.
- The bell is removed from 01 and 06.
- 05: "…" → 40; the tiles → 22.
- 23 "Eliminar sobre" → 43; the trash icon on 32 → 44; the "+" and rows on 15 → 41.
- 06: nav set to Plan, "+" disabled.
- 23: back only.
- 31: target follow-up fields.
- 33: group footer.
- Chevrons on EnvelopeRow, TxRow and AccountRow.
- SaveBar documented as swipe-to-confirm with a disabled state.
- P3 UX-spec texts, plus a full navigation map (element → target) in the UX spec.

- [x] T3a Batch A. Route: delegated writer. Parent spot check found and fixed:
  - 02 lost its FR-21 status filters, and its group footer was hidden under the nav. Filters restored; the footer was replaced by a "layers" IconButton in the header that leads to 32.
  - 36 and 37 sheets did not reach the bottom (Dimmed +22 / +14).
  - 36 search text did not match the list, and Alquiler showed $ 0 instead of $ 380.000.
  - 38 had day 19 selected while showing "Hoy"; day 29 is now selected.
  - 04 showed RTA $ 120.000; it now shows $ 48.200, because RTA is plan-wide.
  - 78 duplicate raw-named exports were deleted from design/screens and design/flows.
  - Known headless-renderer quirk: some texts containing "1" render tiny (calendar on 38, keypad on 07).
- [x] T3b Batch B. Route: delegated writer, after T3a.
  - Writer delivered:
    - screens 39–44;
    - entry points on 01, 14, 33;
    - the bell removed;
    - 06 nav fix;
    - 23 back-only;
    - 31 target field;
    - SaveBar/Disabled master used on 08;
    - chevrons not added to EnvelopeRow, TxRow or AccountRow (no room; documented as whole-row tap);
    - the "Mapa de navegación" in the UX spec;
    - PRD FR-03 (archive) and FR-05 (delete keeps history), v1.4.
  - Parent spot check found and fixed:
    - the 06 BalanceCard "+" still rendered lavender, because the build did not carry the disabled fill; the build now overrides the plus fill and icon fill;
    - the 14 Transferir, 41 back and 42 back circles were #F5F5F5 on a #F5F5F5 background (invisible), now #EDEDED.
  - Verified 01, 06, 08, 14, 23, 31, 39–44; flow bands refreshed; GUI open.
- [x] T4 Verification (see above).

## Next step
User review. Pending: no git commits (repo not initialized); 00-componentes.png cannot be rendered as one page.
