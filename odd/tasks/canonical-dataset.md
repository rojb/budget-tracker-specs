# Canonical dataset and cross-screen consistency

## Objective
Every screen shows numbers derived from ONE dataset, and each flow reads as a continuous story. The user approved this on 2026-09-28.

## Why
Every screen had invented its own numbers. For example, a new user created Banco Nación with $150.000 and then saw $850.000 to assign, while other screens said it opened with $300.000. The goal amounts made the RTA invariant impossible.

## Narrative states
- **A — onboarding (Tue 1 Sep 2026).** Sofía signs up (19 → 34 → 20). The plan starts empty.
- **B — established (Tue 29 Sep 2026, 14:32).** Most screens.
- **C — month close (Thu 1 Oct 2026).** Screen 25.
- **D — guest.** 21, 30 and 45: already consistent (code K7M-4QX, Casa con Juli).
- **E — USD plan.** 33: internally consistent; leave it.

## State A (onboarding)
1. 20 Nuevo plan: "Mi plan", ARS, first account **Banco Nación, saldo inicial $ 300.000**.
2. 06 Plan vacío right after: **Listo para asignar $ 300.000**, **0 sobres activos**. Add a **"Primeros pasos"** checklist card:
   - ✓ Creaste tu plan
   - ○ Agregá tus otras cuentas (→ 28)
   - ○ Creá tus sobres (→ 35 or "Crear sobre vacío")
   - ○ Asigná tu dinero (→ 46; looks disabled until envelopes exist)

   The template chips stay.
3. 28 Nueva cuenta (onboarding example): **Mercado Pago, Billetera virtual, saldo inicial $ 50.000**. Efectivo is added the same way with **$ 20.000**, which is not shown. After that, **Σ cuentas = $ 370.000**.
4. 35 Plantilla sugerida: **all 12 checked**, button "**Crear 12 sobres**". Groups:
   - Obligaciones (3): Alquiler, Servicios, Internet y celular
   - Día a día (4): Transporte, Supermercado, Farmacia, Comida afuera
   - Disfrutar (3): Salidas, Suscripciones, Regalos
   - Metas (2): **Emergencia**, Vacaciones

   Rename "Fondo de emergencia" to "Emergencia" everywhere.
5. **NEW 46 Asigná tu dinero** (first assignment, bulk):
   - header "Listo para asignar $ 370.000";
   - the 12 new envelopes grouped, each with an amount field;
   - some filled, e.g. Alquiler 280.000, Supermercado 60.000, Transporte 20.000 (Σ 360.000);
   - a live "Te quedan $ 10.000 por asignar";
   - primary "Listo".
   The numbers must add up.

## State B (Tue 29 Sep 2026, 14:32) — source of truth
**Accounts:**
| Account | Opening | Current | % |
|---|---|---|---|
| Banco Nación (Cuenta sueldo) | 300.000 | 842.300 (= 300.000 + 850.000 entró − 307.700 salió) | 84% |
| Mercado Pago (Billetera virtual) | 50.000 | 121.200 | 12% |
| Efectivo (Billetera) | 20.000 | 36.500 | 4% |
| **Σ** | | **1.000.000** | |

**Envelopes, September available:**
| Group | Envelope | Available | Notes |
|---|---|---|---|
| Día a día | Transporte | −6.200 | 51.200 spent of 45.000, Sobregirado |
| Día a día | Supermercado | 47.550 | 132.450 of 180.000 |
| Día a día | Farmacia | 24.000 | |
| Día a día | Comida afuera | 20.000 | |
| Obligaciones | Alquiler | 380.000 | Cubierto, vence el 10 (unpaid) |
| Obligaciones | Servicios | 20.700 | |
| Obligaciones | Internet y celular | 15.000 | |
| Disfrutar | Salidas | 25.000 | |
| Disfrutar | Suscripciones | 15.750 | |
| Disfrutar | Regalos | 10.000 | |
| Metas | Vacaciones | 360.000 | objetivo 600.000 · diciembre · 60% |
| Metas | Emergencia | 20.000 | objetivo 300.000 · 7% |

- Group totals: Día a día **85.350** (4 sobres), Obligaciones **415.700** (3), Disfrutar **50.750** (3), Metas **380.000** (2).
- **Σ disponible = 931.800.**
- **Future assignment:** $ 20.000 reserved in September for **Regalos · noviembre**.
- **RTA = 1.000.000 − 931.800 − 20.000 = $ 48.200.** RTA is plan-wide, so every month view shows $ 48.200 (FR-10: the origin month reflects the commitment).
- **12 sobres activos** everywhere.
- **Reportes, Gastado en septiembre** (Alquiler is NOT spent): Supermercado 132.450, Transporte 51.200, Servicios 41.300, Farmacia 15.800, Salidas 14.000, Comida afuera 9.800 = **$ 264.550**.

## State C (month close, 1 Oct)
25 "**Septiembre → Octubre**":
- Supermercado +$ 47.550 se arrastra
- Alquiler +$ 380.000 se arrastra
- Transporte −$ 6.200 se descuenta de Listo para asignar, and Transporte reinicia en $ 0.
- Listo para asignar en octubre: **$ 48.200 − $ 6.200 = $ 42.000**.
- Check: **$ 1.000.000 − $ 938.000 − $ 20.000 = $ 42.000 ✓**, where 938.000 = 931.800 + 6.200 and 20.000 is still reserved for November.
- Button "Empezar octubre".

## Screen edits
- **01:** goal carousel = Emergencia $ 20.000 · 7% (left), Vacaciones $ 360.000 · 60% (center), plus a right card "**+ Nueva meta**" replacing Auto.
- **02:** group subtotals $ 85.350 / $ 415.700; RTA $ 48.200; 12 sobres.
- **04 Noviembre:**
  - RTA $ 48.200 (plan-wide);
  - banner "Reservaste $ 20.000 desde septiembre";
  - envelopes: Regalos $ 20.000 asignado (reservado), Alquiler $ 0 sin asignar todavía;
  - Alquiler must NOT be under Metas;
  - 12 sobres.
- **06, 20, 28, 35, 46:** as in State A.
- **17 Reportes:** as in State B.
- **25:** as in State C.
- **29 Transferencia:** Mercado Pago $ 121.200 · 12%.
- **32 Grupos:** 4 groups with counts 4/3/3/2 (add the Disfrutar and Metas rows).
- **44:** "Día a día · 4 sobres".
- **PRD FR-04:** the template list matches.

Any other screen showing these entities must match. Search every text for the old values: 850.000 used as an RTA, 150.000, 58.400, 1.106.800, 1.058.600, 400.700, 41.350, 310.000, 960.000, "Crear 11", "Fondo de emergencia", "Agosto → Septiembre".

## Flows
- F1 = 18 → 19 → 34 → 20 → 06 → 28
- F3 = 06 → 35 → 46 → 02 → 03 → 04
- F5 = 25

## Tasks
- [x] T1 Apply the dataset to app.base.op and the PRD. Add screen 46; update the flows and the UX-spec inventory. Route: delegated writer.
- [x] T2 Verify: a script scans all texts for the old values; contact sheets; the parent spot-checks. Route: writer plus the parent.

## Progress / evidence
- Writer edited 01, 02, 04, 06, 17, 20, 25, 28, 29, 32, 35 and 44, added the new screen 46, and updated flows F1/F3 and the UX spec.
- Writer scripts: the forbidden-value scan found 0 hits (apart from the allowed income amounts), and all 30 arithmetic assertions passed.
- Parent spot check fixed:
  - on 25, the invariant formula ran under the check circle; the font went from 15 to 14;
  - the caption on 25 omitted the future-reservation term; it now reads "Σ cuentas − Σ disponible − reservado a futuro = Listo para asignar".
- PRD 1.5: the FR-11 RTA formula now subtracts future assignments (required by FR-10, missing before), with the design example.
- Flow bands refreshed; GUI open.

- User feedback: the month views were inconsistent. 02, 04 and 33 now share the same structure:
  - Header = layers + search;
  - month switch;
  - BalanceCard;
  - Filters, with counts matching each screen (04: Sobregirados 0 / Falta 1; 33: Sobregirados 2 / Falta 0);
  - groups with a header (name + amount + "+").
  In the future month, 04 shows "asignado" instead of "disponible", because carryover does not exist yet. The redundant Reserved block on 04 was removed.

## Next step
User review.
