# Visual quality and accessibility audit (device vs approved renders)

Device: Honor TFY-LX3, 1080x2388 (about 20:9, tall, ~393 dp wide). Renders: 780x1688 (~19.5:9). Reviewed pairs: 01, 14, 22, 24, 31 with renders; 02c, 07c, 10, 17, 20, 22-salidas on device; code spot checks in budget-tracker-front (lib/features, packages/ui). Not every one of the 85 shots was opened; findings below are from the screens listed per finding.
Screenshot folder: C:\Users\lTemp\AppData\Local\Temp\claude\ce2da5deaf6ea710\66c6a901-4ebf-46db-8b1d-4cbd5f2676be\scratchpad\ux-shots\ (abbreviated "shots/"). Renders: D:\desktop\College\TAP\2026\2do\design\screens\ (abbreviated "renders/").

Token check: inkMuted #6B6B6B on bg #F5F5F5 is about 4.9:1 and on white about 5.3:1 (passes AA). The contrast issues below are therefore about text over photos and thin weight at small size, not the muted token itself. Hit areas: spec requires >= 48 dp; circular buttons seen on device are about 48-56 dp (OK).

## Decision: bottom navigation on 22
The PRD does NOT put NavCluster on 22. PRD-ux-spec section 9.1 row 22 lists only: back, pencil, "Mover dinero", TxRow. Rows 14, 13, 10, 02 explicitly list `NavCluster` in their actions (line 630 for 14); rows 22, 23, 24, 31 do not. So the device (no bar on 22) follows the PRD text; render 22-detalle-de-sobre.png is the outlier (it draws the cluster). Verdict: not a functional defect, but a spec/render conflict and a sibling inconsistency (14 account detail, same header pattern back + action + pencil, keeps the bar; 22 does not). Recommendation: pick one and write it down. Preferred: keep 22 without the bar (it is a drill-down with its own primary CTA "Mover dinero", and 23/24 are pushed forms), and correct the render plus add one line to the PRD; the alternative is adding NavCluster to 22 to match 14. See V-09.

## Findings

### V-01 | major | screen 31 (also affects 23) | shots/31-nuevo-sobre-meta.png vs renders/31-nuevo-sobre.png
Wrong: On "Nuevo sobre" for the Metas group, the SaveBar ("Crear sobre") sits at the very bottom edge and is cut off. Cause (code): lib/features/envelopes/envelope_form_page.dart puts UiSaveBar as the last child of the ListView (line ~250), so with the extra rows that Metas adds (Foto row, then "Con fecha" revealing "Fecha limite") the content exceeds the screen and the primary action is pushed below the fold with no cue that it scrolls. The render (and PRD line 600-602) explicitly says the bar must not be clipped; the render only fits because it has 2 rows and "Mensual" (no date row).
Fix: use the pattern already in lib/features/plans/new_plan_page.dart: SafeArea > Column > [Expanded(ListView), UiSaveBar pinned with bottom padding]. Add a 24 dp bottom spacer inside the list. Apply the same to envelope_edit_page.dart. Also consider auto-scrolling to the first error on save.
Scope: single screen (two form pages), reuse the pinned pattern. Effort: S.

### V-02 | major | 20, 07, 24, 31, 23 and every SaveBar screen | shots/20-nuevo-plan.png, 07c-nuevo-movimiento-completo.png, 24b-mover-dinero-completo.png, 31-nuevo-sobre-meta.png
Wrong: The SaveBar is placed inconsistently. On 20 and 07 it is inset about 45 px (about 16 dp) on both sides relative to the 43 px card margin (bar spans x 90-815 while cards span 43-862); on 24 and 31 it is full width (43-862). Bottom inset also differs: on 20 the bar floats about 35 px above the screen bottom with no gesture-bar clearance, on 24 it floats mid-screen. The three-part bar (dark calculator circle + chartreuse check + label + ghost check) also has two check icons, which the tester found ambiguous (INDEX 20): only the chartreuse circle is tappable.
Fix: make UiSaveBar own its horizontal margin (same 20 dp as page padding) and bottom inset (max(16, MediaQuery.padding.bottom + 12)); remove the second ghost check, or make the whole bar tappable (hit area >= 48 dp) so the label and the check do the same thing. Disabled state should dim the bar, not leave a decorative check.
Scope: packages/ui (SaveBar) plus removing per-page wrappers. Effort: M.

### V-03 | major | 02 (also 04, 06, 33) | shots/02c-plan-filtro-falta.png
Wrong: Filter chips row is horizontally scrollable but the fourth chip ("Cubiertos") is cut at the right edge with no fade or end padding, so it reads as a clipping bug, and the selected chip ("Falta · 1") hugs the edge. Chip text (15 sp light) is fine; the row has no trailing 20 dp padding.
Fix: add 20 dp trailing padding to the scroll row and a right-edge fade (or let the selected chip scroll into view); keep chip height 44 (spec) for hit area.
Scope: packages/ui (chip row) or the plan screen. Effort: S.

### V-04 | major | 01, 05, 22, 24, 36 | shots/01-inicio.png, 22-detalle-de-sobre-antes.png vs renders/01-inicio.png, 22-detalle-de-sobre.png
Wrong (hierarchy of key numbers): On 22 the three stats (Asignado / Disponible / Gastado) are the same size and weight; "Disponible" is the number the user needs and is not emphasized, and "Gastado" is dimmed to inkMuted at the same size, so the eye reads Asignado first. In the device shot, with six-digit values ("$ 400.000" and "$ 481.800") the gap between columns is about 35 px at 905 scale (about 14 dp): adjacent values nearly touch, and 7-digit amounts or text scale > 1.15 will overflow or wrap (no FittedBox/ellipsis seen). The render has the same equal-weight treatment (so this is an improvement within the approved style, not a redesign).
Fix: make "Disponible" the larger/darker center value (ink, +2 sp or semibold) and the side values secondary; wrap each value in FittedBox(scaleDown) with maxLines 1; reserve min 12 dp gutter.
Scope: packages/ui (stat row / JoinedCard-like triple). Effort: S-M.

### V-05 | major | 01 | shots/01-inicio.png vs renders/01-inicio.png
Wrong: Goal card: (a) the name truncates ("Viaje a Bariloc..."), the render uses a short name; (b) overlay text "$ 200.000" and "22%" is white directly on mid-tone lake and sky with no scrim, contrast is below 3:1 over the bright water, and the progress line crosses the subject's backpack; (c) the glass panel with title is only about 40% opaque, so the white subtitle "$ 900.000 . julio" is thin white on grey.
Fix: add a bottom-up gradient scrim (ink 0 -> 55%) behind the whole lower 40% of the card, raise glass panel alpha, set title maxLines 2 (or keep 1 and shrink with FittedBox) and keep the amount/percent row above the panel on the scrim. Spec section 7 forbids certain contrast pairs; text-over-photo should be covered by the scrim rule.
Scope: packages/ui (GoalCard). Effort: M.

### V-06 | minor | 22 | shots/22-detalle-salidas-destino.png vs renders/22-detalle-de-sobre.png
Wrong: The new "Movido desde Supermercado" row (RRG-59): title wraps to two lines and makes the row about 20% taller than neighbors; the lavender capsule "+$ 10.000" is a different amount style from the plain "-$" text of expense rows (plain ink text) with no account line, so the right column does not align with the rows below (capsule x-range 622-822 vs text right-aligned at 822 is OK, but vertical center differs). Row icon uses the same grey circle as expenses, so it differs from them only by the arrows glyph. Row is also not tappable, but looks identical to tappable TxRow (no chevron by PRD decision section 8).
Fix: shorten to "Desde Supermercado" / "Hacia Salidas" with the amount capsule taking its width, maxLines 1 ellipsis on the title; keep row min height equal to TxRow (72 dp); consider an inkMuted time line identical in position to TxRow's second line.
Scope: packages/ui (TxRow variant) + the new move row. Effort: S.

### V-07 | minor | 07 vs 09, 24 | shots/07c-nuevo-movimiento-completo.png, 24b-mover-dinero-completo.png, 31-nuevo-sobre-meta.png
Wrong: Amount chips are inconsistent: 24 shows two chips ("10.000", "20.000", left aligned, 2 of 4 slots) while 31 shows four chips spread full width; a lone chip layout looks half-empty and 24b shifts when destination changes (INDEX). 24 title is one line on device ("Mover dinero") but wraps in the render (two lines), so vertical rhythm differs: render title block 255-405 vs device 270-340, which pushes the content up and is in fact better on device.
Fix: chips row should use fixed flex slots (equal widths) or Wrap with consistent min width; reserve the chips' height while the destination is empty so layout does not jump. Update the render to the one-line title.
Scope: packages/ui (AmountChips) + 24. Effort: S.

### V-08 | minor | all tabs (01, 02, 10, 13, 14, 17) | shots/10-movimientos.png, 17-reportes.png, 14-detalle-de-cuenta.png vs renders/14-detalle-de-cuenta.png
Wrong: Safe area and bottom nav overlap: the last list row is cut off flat by a straight white band behind the NavCluster (row clipped at y about 1795, nav floats at 1830-1960), so scrolling content ends in a hard edge rather than fading under the glass cluster; no bottom list padding was visible, so the last row can be obscured. NavCluster bottom clearance (about 25 px) is small versus the gesture bar on tall phones; it matches the render but the render has a rounded device frame with extra room.
Fix: add bottom padding to scrollables = cluster height + 24 dp + MediaQuery.padding.bottom; replace the hard white band with a 24 dp gradient from bg to transparent. 
Scope: packages/ui (nav shell/scroll padding) once. Effort: S-M.

### V-09 | minor | 22 vs 14 | shots/22-detalle-supermercado-despues-mover.png, shots/14-detalle-de-cuenta.png, renders/22-detalle-de-sobre.png
Wrong: See decision above. Spec says 22 has no NavCluster, render shows one, sibling 14 shows one. On 22 the empty bottom 40% of the screen is dead space (no bar) while the CTA "Mover dinero" floats right under the list, so on a short list the primary action sits mid-screen and moves down as rows are added.
Fix: (a) record the decision in PRD row 22 and fix render 22; (b) pin "Mover dinero" at the bottom (SaveBar-like position) or keep it after the list but add a sticky variant when the list is long; do not add the nav unless 14-style consistency is wanted.
Scope: single screen + docs. Effort: S.

### V-10 | minor | 31, 20, 24 | shots/31-nuevo-sobre-meta.png, 20-nuevo-plan.png
Wrong: Inconsistent section-label style inside one page: "Icono" and "Objetivo (opcional)" are dark section titles, while "Monto a alcanzar" is muted label text of the same size; the render uses the muted "Objetivo mensual". The capsule amount "50.000" (about 64 sp) is the biggest element on the form even when not edited (preselected default), which suggests a value was entered. "Fecha limite" row shows only a dash with no required marker even though the goal type "Con fecha" needs it.
Fix: single label style for all field groups (section title for groups, muted for single fields); show a placeholder style (inkMuted) for the unconfirmed default amount; mark "Fecha limite" as required with helper text.
Scope: single screen + small token for field label. Effort: S.

### V-11 | minor | 07 / 09 / 12 | shots/07c-nuevo-movimiento-completo.png, 07b
Wrong: Split button is an icon-only dark circle with accessibility label "Calculadora" (INDEX); on 07 it also appears where the calculator toggle sits on 24 and 31, so the same dark circle means two different things (split vs calculator). Icon-only controls without text also cannot be identified at 200% text scale or by TalkBack.
Fix: unique Semantics labels ("Dividir pago", "Calculadora"), tooltip, and distinct icon per function; keep the same position for the same function across screens.
Scope: packages/ui (SaveBar leading action takes icon + semantics param). Effort: S.

### V-12 | minor | 17 | shots/17-reportes.png vs renders/17-reportes.png
Wrong: Bar chart: past months with no data render as 6 identical grey pills with equal height, which reads as an error rather than "no data"; the Oct bar is grey (no fill) and Nov is chartreuse hatched, so the only encoding is color/hatch (no value labels except the Nov tooltip "$ 400k"). Category list: "Comida afuera" row is cut by the nav band.
Fix: label empty months with "Sin datos" in the legend or a thin baseline tick instead of pills; show value text above the selected bar and make bars focusable with semantic values; same bottom padding as V-08.
Scope: packages/ui (chart) and 17. Effort: M.

### V-13 | cosmetic | 14, 17, 22 | shots/14-detalle-de-cuenta.png vs renders/14-detalle-de-cuenta.png
Wrong: Summary card on 14: "Entro en nov" left and "Salio" right have different vertical alignment of values ($ 950.000 baseline is lower than $ 451.000 by about 18 px at 905 scale) because the left column's value is larger; the render has the same offset for sep. Subtitle "Banco . saldo inicial $ 500.000" is 13 sp light on bg, readable but thin.
Fix: align both values on a shared baseline (CrossAxisAlignment.baseline) or make both the same size.
Scope: packages/ui (JoinedCard). Effort: S.

### V-14 | cosmetic | 01 | shots/01-inicio.png
Wrong: "Hola / Ux1!" breaks onto two lines by design (render does too), but with long display names the headline can go to three lines and push the JoinedCard below the fold. Also Metas page indicator is a 2-dot pill versus 5 dots in the render (data), fine.
Fix: cap greeting at 2 lines with ellipsis on the name.
Scope: single screen. Effort: S.

### V-15 | cosmetic | 25, 46, 02b | not opened in detail; from INDEX only
Wrong (unverified visually): dense equation line "Todo cuadra: 1.824.900 - 1.174.900 - 0 = 650.000" and the sticky header loss on scroll (02b) are noted by the tester; I did not review these shots. Mark for a follow-up pass.
Scope: n/a. Effort: S.

## Cross-cutting accessibility notes
- Text scaling: no use of MediaQuery.textScaler / FittedBox was found in packages/ui or lib (code search for textScal returned only toast and sheet padding hits). Stat rows (V-04), chips (V-03, V-07) and bars (V-02) have fixed heights and will clip at system font 130-200%. Recommendation: add a golden test at textScaler 1.3 for 01, 22, 24, 31 and let fixed-height rows use min-height.
- Phone screen size: device is 20:9 (about 393 x 873 dp). Pages that use ListView with trailing SaveBar (V-01) assume the shorter render height (about 19.5:9 at 780x1688); the pinned-bar pattern in new_plan_page.dart is the right one for every form. Sheets already add viewInsets and padding.bottom (packages/ui/lib/src/organisms/sheet.dart lines 29-30), so keep that for forms too.
- Touch targets: circular buttons meet 48 dp; chips are 44 dp high but spec says hit area >= 48, so verify the hit slop on chips (V-03, V-07) and on the 34 dp compact chips.
- Debug ribbon in every shot is the debug build, not a defect.
