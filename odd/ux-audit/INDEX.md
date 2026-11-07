# UX shots index

Device: Honor TFY-LX3, side-by-side debug package com.budgettracker.budget_tracker.uxcheck, local API (localhost:3000), account ux1@correo.com, plan "Mi plan" (ARS), dataset seeded by API. Screen numbers follow PRD-ux-spec.md section 9.1. 85 images, 52 distinct screens (all of 01-53 except 45).
Friction is my own first-use impression; "BUG?" marks something that looks wrong rather than just awkward.

## First run (new user)
- 18-acceso-login.png | 18 Acceso | cold launch, no session | Clean. Hero image takes half the screen, form starts low.
- 18b-acceso-error-vacio.png | 18 error | Entrar with empty fields | Inline errors "Ingresá tu email / contraseña". Clear. Layout shifts down, so the next tap target moves (I mis-tapped once).
- 18c-acceso-form-lleno.png | 18 | typed email + password | Keyboard hides the password field; Enter on the keyboard jumps to the next field, which works.
- 18d-acceso-error-credenciales.png | 18 error | unknown account, wrong password | "Email o contraseña incorrectos. Revisalos e intentá de nuevo." Good copy, same message for unknown user (fine).
- 19-crear-cuenta.png | 19 Crear cuenta | "Crear cuenta" on 18 | Fine.
- 19b-crear-cuenta-error-vacio.png | 19 error | submit empty | Three inline errors incl. "Usá al menos 8 caracteres". Good.
- 34-bienvenida.png | 34 Bienvenida | after registering | Two big cards. Clear.
- 20-nuevo-plan.png | 20 Nuevo plan | "Crear mi plan" | Plan name prefilled "Mi plan" (generic, and a second plan gets the same name, see 16b). Save bar: the yellow check circle is the real button, the label "Crear plan" and the right ghost check are not; unclear which to tap.
- 20b-nuevo-plan-saldo-teclado.png | 20 | tap "Saldo inicial" | Custom keypad sheet. Fine.
- 20c-nuevo-plan-completo.png | 20 | filled form | -
- 06-plan-vacio.png | 06 Plan vacío | after creating the plan | "Primeros pasos" checklist + chips of suggested envelopes. Clear.
- 35-plantilla-sugerida.png | 35 Plantilla sugerida | "Usar plantilla sugerida" | 12 pre-checked envelopes in groups. Clear.
- 46-asigna-tu-dinero.png | 46 Asigná tu dinero | "Crear 12 sobres" | Per-envelope amount rows + "Te quedan $ X por asignar".
- 46b-asignacion-parcial.png | 46 over-assigned | typed 180.000 + 400.000 on a 500.000 balance | Text turns to "Te pasaste $ 80.000" but "Listo" still works and the plan then shows Listo para asignar −$ 80.000. BUG?/friction: onboarding lets a new user start the plan over-assigned.
- 53-asignar-monto-propio.png | 53 Asignar monto propio | tap an envelope row in 46 | Keypad sheet with "Listo". Fine.
- 02-plan-del-mes.png | 02 Plan del mes | after "Empezar noviembre" in 25 | -

## Home, plan, assign
- 01a-inicio-datos-viejos-sin-refrescar.png | 01 (stale) | Inicio after seeding via API | Shows old figures (−$80.000, 12 sobres). There is no pull-to-refresh and switching tabs does not refetch; only an app restart updated it. Friction (matters once a second member or device edits the plan).
- 01-inicio.png | 01 Inicio | Inicio tab after restart | Goal card with photo looks great. "Viaje a Bariloc…" truncated; greeting "Hola Ux1!" wraps onto two lines.
- 05-detalle-de-meta.png | 05 Detalle de meta | goal card | Four tiles (Últimos aportes, Plan de aportes, Mover dinero, Ajustar objetivo) are not exposed as buttons by accessibility; only "Últimos aportes" navigated (to 22).
- 40-opciones-de-meta.png | 40 Opciones de meta | "…" on 05 | Fine.
- 25-cierre-de-mes.png | 25 Cierre de mes | opened Plan tab for the first time in November | Shown automatically; "Todo cuadra: 1.824.900 − 1.174.900 − 0 = 650.000" is good but dense.
- 02b-plan-del-mes-scroll.png | 02 scrolled | swipe up | Header, Listo para asignar and filter chips scroll away (no sticky header).
- 02c-plan-filtro-falta.png | 02 filter | chip "Falta · 1" | Fourth chip "Cubiertos · 11" is clipped at the right edge. BUG?: chip counts (0+1+11 = 12) do not add to the 14 active envelopes.
- 02d-plan-busqueda.png | 02 search | lupa then type | The search field is not focused after tapping the lupa; I had to tap it again.
- 32-grupos.png | 32 Grupos | layers icon | Fine; the "Nuevo grupo" row has an inline field with no visible affordance.
- 44-eliminar-grupo.png | 44 Eliminar grupo | trash on a group | Clear copy, money is safe.
- 04-plan-mes-futuro.png | 04 Mes futuro | › on the month | Banner "Estás en un mes futuro", "Hoy" shortcut. Good.
- 03-asignar-dinero.png | 03 Asignar dinero | + on the joined card | Amount chips show "10.000" twice (the first is presumably the suggested "Falta" amount, unlabeled).
- 52-elegir-grupo.png | 52 Elegir grupo | Grupo row in 23 | Fine.
- 31-nuevo-sobre-meta.png | 31 Nuevo sobre | "+ Nueva meta" on 01 | Goal type defaults to "Con fecha" with 50.000 preselected but an empty date. The save bar is cut off at the bottom edge of the screen. BUG?
- 31b-nuevo-sobre-sin-nombre.png | 31 error | save with no name | Inline "Poné un nombre para el sobre." Good.
- 50-foto-de-la-meta.png | 50 Foto de la meta | Foto row | Gallery, camera and 4 suggested photos. Not exercised (would leave the app).

## Envelope detail and move money (RRG-59)
- 22-detalle-de-sobre-meta.png | 22 (goal envelope, empty) | "Últimos aportes" on 05 | "Sin movimientos este mes" empty state.
- 22-detalle-sobre-vacio.png | 22 empty | Regalos from Plan | Same empty state.
- 22-detalle-de-sobre-antes.png | 22 before a move | Supermercado | Reference: assigned 400.000, available 481.800, spent 83.200. The split transaction "Carrefour, 2 sobres" shows −$30.000 (whole amount) in this envelope, while spent counts only this envelope's 22.000 portion; possibly by design, confusing.
- 23-editar-sobre.png | 23 Editar sobre | pencil on 22 | Fine. Back button, trash top right.
- 43-eliminar-sobre.png | 43 Eliminar sobre | trash on 23 | Clear.
- 24-mover-dinero.png | 24 Mover dinero | "Mover dinero" on 22 | Desde preselected, Hacia "Elegí un sobre".
- 36-elegir-sobre.png | 36 Elegir sobre | Hacia row | Alquiler shows "$ 0 · Sin asignar" although in 02 it is "$ 180.000 de $ 180.000 · Cubierto": inconsistent wording for a fully spent envelope.
- 24b-mover-dinero-completo.png | 24 filled | Salidas + 10.000 chip | The layout shifts after choosing the destination, so a tap on the amount chip at its old position misses.
- 22-detalle-supermercado-despues-mover.png | 22 after the move | confirm in 24 | "Movido a Salidas" 21:52 −$10.000, arrows icon, not tappable, first row. Assigned 390.000, available 471.800, spent unchanged. No bottom navigation bar, unlike design/screens/22 (the design shows the nav cluster).
- 22-detalle-salidas-destino.png | 22 destination | Salidas | "Movido desde Supermercado" with +$10.000 in the lavender capsule, arrows icon, time 21:52. The long name wraps onto two lines and pushes the row taller.
- 22-detalle-supermercado-orden-y-contraparte-borrada.png | 22 ordering | after a later expense and a move to a since-deleted envelope | Order is by registration (move 22:08, expense 21:57, move 21:52, older rows). "Movido a Temporal" still shown after Temporal was deleted. Non-tappable.

## Movements
- 10-movimientos.png | 10 Movimientos | tab | No "Movido" rows anywhere in the list (checked after scrolling). Newest-registered first, so an October expense can appear above a November one (by design, RRG-57), which reads as scrambled.
- 10b-movimientos-scroll.png | 10 scrolled | swipe | Incomes at the bottom because they were registered first.
- 11-filtrar-movimientos.png | 11 Filtrar | sliders icon | "Ver 17 movimientos" live count is great.
- 38-fecha-y-hora.png | 38 Fecha y hora | Desde in 11 | Calendar sheet. Fine.
- 37-elegir-cuenta.png | 37 Elegir cuenta | Cuenta in 11 | Shows balance and % of total; good.
- 10c-movimientos-filtrado-cuenta.png | 10 filtered | Mercado Pago | Summary says "Salió en la franja" although no time band is set; odd wording.
- 12-editar-movimiento.png | 12 Editar movimiento | tap a row | Fine.
- 12b-editar-monto.png | 12 | tap the amount | Inline calculator keypad.
- 27-eliminar-movimiento.png | 27 Eliminar movimiento | trash on 12 | Clear, "Se recalculará noviembre."
- 49-movimientos-recalculado.png | 49 Recalculado | saved an edit (17.900 to 20.000) | Toast "Recalculado · Noviembre actualizado · Deshacer". Good.
- 07-nuevo-movimiento.png | 07 Nuevo movimiento | + in the nav | Keypad open by default in Gasto mode.
- 07b-nuevo-movimiento-error-vacio.png | 07 error | save with amount 0 | Nothing happens and no message (silent). Friction.
- 26-elegir-beneficiario.png | 26 Elegir beneficiario | Beneficiario row | Every payee says "Sin sobre sugerido" even Cine Hoyts whose only expense used Salidas. BUG?/friction: suggestion never learned.
- 07c-nuevo-movimiento-completo.png | 07 filled | Coto, Supermercado, 55.000 | Split button is the dark circle with a split icon but its accessibility label is "Calculadora".
- 07d-tras-guardar.png | 10 after saving | confirm | -
- 08-dividir-pago.png | 08 Dividir pago | split icon on 07 | Fine.
- 09-registrar-ingreso.png | 09 Registrar ingreso | Ingreso toggle | Keypad is hidden here (hint "Tocá el monto para escribirlo") unlike Gasto: inconsistent.

## Accounts
- 13-cuentas.png | 13 Cuentas | tab | Total and per-account balances add up (checked). Note "Salió" etc. fine.
- 28-nueva-cuenta.png | 28 Nueva cuenta | + on 13 | -
- 14-detalle-de-cuenta.png | 14 Detalle de cuenta | Banco Nación | No move rows (also after scrolling, 14b).
- 14b-detalle-cuenta-scroll.png | 14 scrolled | swipe | The transfer appears only once in the list. -
- 29-transferencia.png | 29 Transferencia | Transferir on 14 | Fine.
- 42-editar-cuenta.png | 42 Editar cuenta | pencil on 14 | -
- 48-archivar-cuenta.png | 48 Archivar cuenta | archive icon on 42 | The account row in the sheet has an empty balance ("Banco Nación, Banco, "). Minor.
- 13b-cuentas-con-archivadas.png | 13 | after archiving a test account | "Archivadas · 1" row.
- 51-cuentas-archivadas.png | 51 Cuentas archivadas | Archivadas row | Restore button, "Ver movimientos".

## Menu, beneficiaries, plans, reports
- 39-menu-de-cuenta.png | 39 Menú de cuenta | avatar on 01 | Fine.
- 15-beneficiarios.png | 15 Beneficiarios | menu | -
- 41-beneficiario.png | 41 Beneficiario | tap a payee | The "Sobre" row has no chevron and is not tappable although the spec says it opens 36.
- 41b-beneficiario-nuevo.png | 41 new | + on 15 | -
- 47-eliminar-beneficiario.png | 47 Eliminar beneficiario | trash on 41 | Clear.
- 16-planes-y-miembros.png | 16 Planes y miembros | menu | -
- 21-invitar-miembro.png | 21 Invitar miembro | "Invitar con código" | QR + code CF6-PXE, role toggle, share, revoke.
- 30-unirse-a-un-plan.png | 30 Unirse a un plan | "Unirme con código" | -
- 30b-unirse-codigo-invalido.png | 30 error | code ABC123 | "Código vencido o inválido. Pedile uno nuevo." Good. (The Unirme button moves down after the keyboard closes.)
- 20-nuevo-plan-usd.png | 20 | Nuevo plan with Dólares | Amount shows "US$ 2.005,00" because my keypad taps typed 2005 (decimal handling is right).
- 33-plan-en-dolares.png | 33 Plan en dólares | after creating the USD plan | "US$" badge next to the title. I switched back to the ARS plan afterwards.
- 16b-planes-con-dos-planes.png | 16 | two plans | Both named "Mi plan" (only the subtitle tells them apart): the default name invites confusion.
- 17-reportes.png | 17 Reportes | chart icon on 01 | Spent total and category list match the transactions (399.900 with the moves not counted).
- 17b-reportes-ingresos.png | 17 Ingresos tab | tab | -
- 17c-reportes-patrimonio.png | 17 Patrimonio tab | tab | -
- 17d-reportes-rango.png | 17 range | "Elegir rango" | 3, 6 or 12 months. -

## Not reached
- 45 Unirse desde enlace: needs a deep link / QR scan (camera or another app); skipped on purpose.
- "Cerrar sesión" (to 18) not used so the app stays logged in; 18 was captured at first launch.
- Camera / gallery photo pickers not opened (other apps).
