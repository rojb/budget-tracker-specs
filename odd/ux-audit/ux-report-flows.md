# UX audit: task flows and usability (Flutter budgeting app, Honor TFY-LX3, local API)

Scope: daily loop, first run, error prevention, feedback, navigation, copy, empty/loading states, data freshness. Evidence: screenshots in `...\scratchpad\ux-shots\` (cited by file name), PRD-ux-spec.md, and the Flutter code in `budget-tracker-front\lib` only to confirm causes. Read-only audit.

Severity: blocker for daily use / major / minor. Layer: back / front / spec. "Spec change" = the PRD deliberately specifies it, I think it is bad. No visual polish here.

Not exercised by the testers (so no verdict): 45 deep link, saving 07 with no envelope chosen, a slow or offline API, a failed save.

---

## A. Verdicts on the tester notes

| Note | Verdict | Evidence |
|---|---|---|
| Onboarding allows negative Ready to Assign | CONFIRMED, but the spec allows it. The warning is weaker than the spec asks. | `46b-asignacion-parcial.png`; `assign_money_page.dart` (~l.180-190): "Te pasaste" uses `inkMuted` and the Listo button stays enabled. PRD 6 "Asignar de más": negative in red with the excess. See F-02. |
| Payees never suggest an envelope | CONFIRMED as behavior, REJECTED as a bug. | `26-elegir-beneficiario.png`. `openspec/specs/payees/spec.md`: `suggestedEnvelopeId` is set by hand (create/PATCH). Nothing learns it. Seeded payees have none. The picker and `new_transaction_page.dart` l.112 do use it when present. Learning it is a spec change. See F-04. |
| Filter chip counts do not add up | CONFIRMED, real gap in the design. | `02-plan-del-mes.png`, `02c-plan-filtro-falta.png`. 0 + 1 + 11 = 12 of 14. `plan_filters.dart`: "Cubiertos" = funded and not empty; the 2 empty envelopes (no goal, 0 assigned, 0 available) are in no chip. Only "Todos" shows them. Not a counting error. See F-07. |
| Silent no-op after an empty save on 07 | REJECTED for this build. | `07b-nuevo-movimiento-error-vacio.png` shows "Ingresá un monto mayor a cero." (with an alert icon) under the keypad. `new_transaction_page.dart` l.172/386 render it via `UiFormMessage`. The real problem is how easy it is to miss (F-06): it sits between keypad and SaveBar and shifts the bar down by about 60 px, so the tester probably tapped and saw nothing change near their thumb. |
| Displayed time one hour earlier than -03:00 seeded data | LIKELY a device time zone artifact, not an app bug. One real design gap behind it. | Every screenshot shows the app clock equal to the status-bar clock (`07-nuevo-movimiento.png` "Hoy, 21:57" and status bar 21:57). The code uses `DateTime.toLocal()` everywhere (`dates.dart`, `months.dart`, `envelope_move_row.dart`) and no hard-coded offset. So the app prints device local time. If the phone is not on UTC-3 (for example set to UTC-4), seeded -03:00 data shows 1 h earlier. Check with `adb shell getprop persist.sys.timezone` and `adb shell date`. The real gap: `plan.timeZone` exists (`plans_repository.dart` l.35) and month attribution uses it on the server (PRD l.345), but the UI ignores it. See F-09. |

Also corrected: the notes say there is no way to refresh. `RefreshIndicator` exists on Plan (`plan_page.dart` l.188), Movimientos, Cuentas and the empty plan. Only Inicio (01) has none, and no screen refetches when the app returns to the foreground except Planes (`plans_page.dart` l.75). See F-05.

---

## B. Findings

### Real bugs

**F-01 | major | screens 22, 10 | `22-detalle-supermercado-orden-y-contraparte-borrada.png`, `10-movimientos.png` | front/back**
What: the day header says "Hoy · viernes 6" over rows dated "lun 2, 18:00", "jue 5, 19:00", "mar 3, 21:00". Grouping is by registration day (RRG-57), but each row prints its own occurred date. The Movimientos list is also not in date order, so an October expense can sit above a November one.
Why it hurts: the one list the user reads daily looks scrambled. "Hoy" is false for most rows under it. Totals by day cannot be trusted by eye. It breaks the spec convention 5 (date groupers "Hoy / Ayer / Sábado 26", PRD 6.1).
Fix: group and sort by `occurredAt` (day header = occurred day). If registration order must stay, keep it as a secondary sort inside a day and drop the "Hoy" label from rows that are not today. Registration time is useful, but as a detail, not as the grouper.
Effort: M. Layer: front (grouping) and possibly back (sort).
Note: if RRG-57 deliberately chose registration order, this is a **spec change**, not a bug. The conflict with 6.1(5) still needs a decision.

**F-02 | major | screen 46 (and 02 after) | `46b-asignacion-parcial.png` | front**
What: when the user types more than the balance, the footer says "Te pasaste $ 80.000" in muted gray with a small warning icon. "Listo" stays active and the plan opens with Ready to Assign at −$ 80.000.
Why it hurts: a first-run user starts with a negative plan and no explanation. PRD 6 says the over-assign mitigation is "negative in red with the excess". The screenshot is gray (code uses `UiColors.inkMuted` for both branches). The warning is also the only signal and it sits next to the primary button.
Fix: render the over-assigned line in the danger color with the text "Te pasaste $ 80.000. Quitá dinero de algún sobre o seguí y lo ajustás después", and label the button "Listo, ajusto después" when remaining < 0. Optionally show the remaining amount in the header card live (the 500.000 does not change as you type; it should show 420.000 then −80.000).
Effort: S. Layer: front. (Blocking over-assign at 46 would be a **spec change**; I would not do it, the user may want to start negative and fix later.)

**F-03 | minor | screen 31 | `31-nuevo-sobre-meta.png` | front**
What: new goal envelope defaults to "Con fecha", 50.000 preselected, "Fecha límite —" empty, and the SaveBar is cut at the bottom edge of the screen.
Why it hurts: the user can save a dated goal with no date (the outcome of that is untested) and the save button is half off screen.
Fix: default the target type to "Sin objetivo" (as PRD 9.4 says "Sin objetivo" is the plain default; the spec shows "Mensual" only for the reference render) or require the date before enabling Crear sobre. Make the form scroll with the bar pinned above the safe area.
Effort: S. Layer: front.

### Real UX problems in the daily loop

**F-04 | major | screens 07, 26, 36 | `26-elegir-beneficiario.png`, `07-nuevo-movimiento.png`, `07c-nuevo-movimiento-completo.png` | front + back, spec change for learning**
What: logging an expense needs: `+` , amount, Beneficiario, Sobre, Guardar. Cuenta and time default well. The envelope field says "Elegir" and is not filled from anything the user did before. Each payee row says "Sin sobre sugerido".
Why it hurts: the daily loop costs 6-7 taps instead of the 5 in the KR3 target (PRD 4: "carrusel con el sobre sugerido por el beneficiario ya centrado"). The implemented picker is a sheet, not the carousel, and the suggestion exists only if someone edits the payee by hand (screen 41), which nobody will do.
Fix (1, no spec change): when a payee is picked and has no suggestion, preselect the envelope of that payee's last transaction in the sheet (client side, from the payee's last movement). (2, spec change): when a transaction is saved with a payee that has no `suggestedEnvelopeId`, set it automatically (and say so in the toast: "Coto → Supermercado la próxima vez"). (3) Show "Sugerido" on the Sobre row and the payee row even for a fresh account, with the plan's most used envelope as a fallback.
Effort: M. Layer: front (1), back + spec (2).

**F-05 | major | screens 01, all | `01a-inicio-datos-viejos-sin-refrescar.png` | front**
What: Inicio showed old figures (−$ 80.000, 12 sobres) after data changed on the server; only an app restart updated it. Inicio has no `RefreshIndicator` and there is no refetch on tab switch or on foreground. Plan, Movimientos and Cuentas do have pull to refresh, but nothing hints at it.
Why it hurts: Ready to Assign is the first number of Inicio (PRD 6). A stale number there is the worst place to be stale, and it matters as soon as a second member or device edits the plan. After saving a movement the user returns to a list that may not show it unless the repository invalidates (not verified for every screen).
Fix: add pull to refresh to Inicio; refetch plan/envelopes/transactions when the app resumes (the `didChangeAppLifecycleState` in `plans_page.dart` l.75 already shows the pattern) and when a tab is selected after more than N seconds. Show "Actualizado hace X min" only when the data is older than a minute.
Effort: S-M. Layer: front.

**F-06 | minor | screens 07, 18, 30, 24 | `07b-nuevo-movimiento-error-vacio.png`, `18b-acceso-error-vacio.png`, `30b-unirse-codigo-invalido.png`, `24b-mover-dinero-completo.png` | front**
What: inline errors appear below the content and push the next control down (07b: SaveBar jumps ~60 px; 18b: tester mis-tapped; 30b: "Unirme" moves after the keyboard closes; 24b: chips shift after choosing the destination). The 07 empty-amount error is also not near the amount.
Why it hurts: on a one-handed daily flow a button that moves between touch-down and touch-up is a mis-tap. This is likely the source of the "silent no-op" note.
Fix: reserve a fixed-height message slot above the SaveBar (no layout shift), and also shake or highlight the amount capsule when the amount is 0. For 24, keep the amount chips in place and only fill the "Hacia" card.
Effort: S. Layer: front.

**F-07 | minor | screen 02 | `02c-plan-filtro-falta.png`, `02-plan-del-mes.png` | front, partly spec change**
What: chips are Todos / Sobregirados · N / Falta · N / Cubiertos · N. The 4th chip is clipped at the right edge (scrolls, but nothing says so). Counts total 12 of 14, because empty envelopes belong to no chip. A filtered result also hides the Ready to Assign header only after scrolling (`02b`: header and chips scroll away, no sticky).
Why it hurts: the user cannot find the 2 envelopes that have nothing assigned ("what still needs money?") by any filter, and counts look wrong.
Fix: add "Sin asignar · N" as a chip (or count empty ones inside "Falta"), shorten labels so 4 fit ("Sobregir. 0"), or add a right fade. Keep the filter row pinned while scrolling.
Note: PRD 9.3 removed the chips from 02 as "de valor bajo"; the implementation shows them anyway. That is a spec/implementation drift to settle, not something I count as a defect.
Effort: S. Layer: front.

**F-08 | major | screens 07, 09 | `09-registrar-ingreso.png`, `07-nuevo-movimiento.png` | front**
What: Gasto opens the keypad; Ingreso hides it ("Tocá el monto para escribirlo"). Also the dark circle on the SaveBar is a split icon in Gasto (its accessibility label is "Calculadora") and a calculator in Ingreso, and tapping the split icon with amount 0 shows the same "monto mayor a cero" error.
Why it hurts: the second most frequent action (log income) takes one extra tap and the same screen behaves two ways; a screen-reader user hears "Calculadora" for a split action.
Fix: open the keypad in both modes; fix the accessibility label to "Dividir pago". Keep the calculator toggle only where there is no split.
Effort: S. Layer: front.

**F-09 | minor | all dated screens | `07-nuevo-movimiento.png`, `22-detalle-supermercado-despues-mover.png` | front, back**
What: times are shown in device time; the plan has its own `timeZone` that decides which month a movement belongs to.
Why it hurts: if the phone zone differs from the plan zone (travel, a wrong device setting as in this test), the displayed day/time and the month attribution disagree near midnight on the 31st. The user sees "30 oct 23:30" in a November list.
Fix: format with the plan time zone (package `timezone`), or at least show a one-line note in the plan settings "Horas en hora de Buenos Aires" when the device zone differs.
Effort: M. Layer: front.

**F-10 | major | screens 24, 22, 10 | `22-detalle-supermercado-despues-mover.png`, `22-detalle-supermercado-orden-y-contraparte-borrada.png`, `10-movimientos.png` | front, spec change**
What: after "Mover dinero", the confirmation is only the new row at the top of 22; there is no toast like 49's "Recalculado · Deshacer" and the move rows are not tappable (no undo, no edit). "Movido a Temporal" keeps showing after Temporal was deleted. No "Movido" rows appear in Movimientos (10) or in the account detail (14), by design (moves are not transactions).
Why it hurts: a money operation with no undo and no confirmation toast; a typo moves the wrong amount and can only be fixed by moving back, which creates two more rows.
Fix: show a toast "Movido $ 10.000 a Salidas · Deshacer" for ~5 s, reusing 49's pattern; make move rows tappable with a delete/undo sheet; show "Movido a (sobre eliminado)" instead of the stale name. Showing moves in 10 is a spec change (decide whether moves are "movimientos" for the user).
Effort: M. Layer: front + back for undo.

**F-11 | minor | screen 22 | `22-detalle-de-sobre-antes.png` | front, spec change**
What: the split transaction "Carrefour, 2 sobres" shows −$ 30.000 (whole amount) inside the Supermercado envelope, while the Gastado tile counts only that envelope's portion (22.000).
Why it hurts: the list does not add up to "Gastado"; the user will think the number is wrong.
Fix: in an envelope detail, show the envelope's own portion with the total as secondary ("−$ 22.000 · de $ 30.000 en 2 sobres").
Effort: S. Layer: front.

**F-12 | minor | screen 36 / 02 | `36-elegir-sobre.png` | front**
What: Alquiler is "$ 0 · Sin asignar" in the picker but "$ 180.000 de $ 180.000 · Cubierto" in Plan. Same state, two descriptions (`envelope_picker.dart` l.88: available == 0 means "Sin asignar").
Why it hurts: "Sin asignar" for a fully spent envelope reads as "you forgot to fund it".
Fix: use the same state logic as the plan (`rowCaption`): "Gastado completo" or "Cubierto".
Effort: S. Layer: front.

**F-13 | minor | screen 41 | `41-beneficiario.png` | front**
What: the "Sobre" row in the payee form has no chevron and does not open 36, although PRD 9.4/9.5 specify it does (and convention 4: value rows carry a chevron). This is the only place a payee suggestion can be set, which makes F-04 worse.
Fix: add chevron and navigation to 36.
Effort: S. Layer: front.

**F-14 | minor | screen 05 | `05-detalle-de-meta.png` | front**
What: the tiles "Plan de aportes", "Mover dinero", "Ajustar objetivo" are not exposed as buttons to accessibility; only "Últimos aportes" navigated.
Why it hurts: dead ends for TalkBack; for sighted users the tiles look tappable (PRD 9.4 gives destinations for them).
Fix: wrap all tiles in a proper `Semantics(button: true)` / `InkWell`, or remove the ones with no destination.
Effort: S. Layer: front.

### Improvements (not defects)

**F-15 | minor | screen 20, 16 | `20-nuevo-plan.png`, `16b-planes-con-dos-planes.png` | front**
Default plan name "Mi plan" prefilled; a second plan gets the same name, only the subtitle differs. Also the SaveBar has a yellow check circle (the real button), a text label and a ghost check on the right, so it is unclear which to tap. Fix: leave the name empty with a placeholder, or suffix automatically ("Mi plan 2"); make the whole bar one target.
Effort: S. Layer: front.

**F-16 | minor | screens 02, 10 | `02d-plan-busqueda.png`, `10c-movimientos-filtrado-cuenta.png` | front**
Search field does not take focus after tapping the lupa; the summary under a filtered list says "Salió en la franja" with no time band set. Fix: autofocus on open; wording "Salió en este filtro" when no band is selected.
Effort: S. Layer: front.

**F-17 | minor | screens 01, 05 | `01-inicio.png` | front**
"Hola Ux1!" wraps onto two lines and takes about 130 px of the first screen; goal name "Viaje a Bariloc…" truncated while the amounts have room. Ready to Assign is first number as required, fine, but the greeting pushes goals down. Fix: one line with ellipsis (PRD 5 "Desborde"), or drop the greeting after the first week.
Effort: S. Layer: front.

**F-18 | minor | screens 25, 02 | `25-cierre-de-mes.png`, `02-plan-del-mes.png` | front**
Month rollover works and the reconciliation line ("Todo cuadra: 1.824.900 − 1.174.900 − 0 = 650.000") is a good trust signal. But it appears with no explanation of what "se arrastra" means for envelopes that would have gone negative, and the toast "Mes de noviembre abierto" covers the third row and the start of the next group for a few seconds. Fix: one sentence under the title ("Lo que sobró en cada sobre pasa a noviembre"), and put the toast above the bottom bar's safe area.
Effort: S. Layer: front.

**F-19 | minor | screen 03 | `03-asignar-dinero.png` | front**
Amount chips show "10.000" twice (the first, highlighted, is the "Falta" suggestion, unlabeled). Fix: label it ("Falta 10.000") and de-duplicate.
Effort: S. Layer: front.

**F-20 | minor | screen 48 | `48-archivar-cuenta.png` | front**
The account row in the archive sheet has an empty balance ("Banco Nación, Banco, "). Fix: show the balance or hide the separator.
Effort: S. Layer: front.

---

## C. What works well (keep)

- Inline error copy on 18/19/30/31 is specific and in the user's voice ("Email o contraseña incorrectos. Revisalos e intentá de nuevo.").
- 49 toast "Recalculado · Noviembre actualizado · Deshacer" is the right model for every money change (see F-10).
- 11 "Ver 17 movimientos" live count; 25 reconciliation line; 04 future-month banner with "Hoy".
- Empty states exist and are explained (06, 22 "Sin movimientos este mes").
- Defaults on 07 (account, now, Gasto) are good; only the payee and envelope fields cost taps.

## D. Priority order

1. F-04 (daily loop taps) 2. F-01 (movement list order and grouping) 3. F-05 (stale Ready to Assign) 4. F-10 (moves: no undo or toast) 5. F-02 (over-assign in onboarding) 6. F-08 (income flow) 7. F-06 (layout shifts) 8. F-07 (chip counts) 9. F-09 (time zone) 10. F-03, F-12, F-13
