# Roadmap de entrega — budget-tracker

> **Aprobado por la usuaria el 2026-09-28.** Ver `odd/tasks/team-coordination-setup.md` (T2).

**Equipo:** Ruben, nathaliascode. **Split:** por feature, full-stack — cada *change* de OpenSpec
tiene un único owner y cubre `budget-tracker-back` (NestJS, módulos clásicos por feature:
module/controller/service/dto/entities, sin hexagonal) y `budget-tracker-front` (Flutter; UI
compartida en `packages/ui` con Widgetbook, features en `lib/features/<feature>`).
Contrato: `budget-tracker-specs` (`openapi.yaml` + OpenSpec + PRD + UX spec + diseño).

**Sin archivos de test.** Decisión fija del equipo: ni `*.spec.ts`/`*.test.ts` (NestJS) ni
`*_test.dart`/golden tests (Flutter) en ninguno de los dos repos. Los `spec.md` de OpenSpec no
son tests y se mantienen. La verificación de cada change es **manual**: Widgetbook para UI,
Swagger UI o Prism contra `openapi.yaml` para API. El chequeo de *contract drift* con `oasdiff`
en CI **se mantiene**, porque compara documentos (`openapi.yaml` vs. el export de
`@nestjs/swagger`), no ejecuta tests. Ningún change de este roadmap incluye tareas de
"escribir tests"; los tamaños (S/M/L) tampoco las contemplan.

**Tamaños:** S ≈ 1–2 días/persona, M ≈ 3–5 días, L ≈ 6–9 días. Estimación gruesa para
comparar carga relativa entre changes, no un compromiso de fechas.

---

## 1. Fase 0 — Fundación

Prerrequisitos compartidos, todos de Ruben bajo la asignación aprobada (ver nota debajo de la
tabla). Internamente se secuencian así: `scaffold-backend` y `api-contract-base` primero (el
contrato en sí puede redactarse en paralelo con el scaffold, ya que no depende de él, salvo para
el wiring de `oasdiff`) porque son los que desbloquean a nathaliascode; después
`scaffold-frontend` → `ui-foundation` → `add-auth`, en paralelo con el trabajo de nathaliascode en
`add-budget-calc-engine` (Fase 1).

| Change | Owner | Contenido | Depende de | Tamaño |
|---|---|---|---|---|
| `scaffold-backend` | Ruben | Repo `budget-tracker-back`: Nest CLI, ESLint/Prettier, estructura de módulos, `docker-compose` (Postgres), TypeORM inicial (entidades en `<feature>/entities/`, migraciones con TypeORM CLI, `synchronize: false`). **`nest-cli.json` con `generateOptions.spec: false`** y borrado de los `*.spec.ts` y carpeta `/test` que el CLI genera por defecto, para que ningún scaffold posterior reintroduzca archivos de test. CI: lint + build (sin step de test). | — | S |
| `scaffold-frontend` | Ruben | Repo `budget-tracker-front`: Flutter CLI, `packages/ui` como paquete local, Widgetbook, `analysis_options.yaml`, estructura `lib/features/`. Borrado de `test/widget_test.dart` por defecto; sin `flutter test` en CI. CI: `flutter analyze` + build (sin step de test). | — | S |
| `api-contract-base` | Ruben (PR aprobada por nathaliascode) | `openapi.yaml` inicial en `budget-tracker-specs`: formato de error (`{ statusCode, message, error }` estilo Nest), esquema de auth (`Bearer` JWT), dinero como entero en unidad menor + `currency` del plan (FR-40), fechas `timestamptz` ISO-8601, ids UUID v4, paginación (`?page&pageSize` o cursor — a decidir, ver ambigüedad al pie), convención de nombres en inglés. Wiring de `oasdiff` en CI de `budget-tracker-back` (compara `openapi.yaml` contra el export de `@nestjs/swagger`) una vez existe `scaffold-backend`. | `scaffold-backend` (para el wiring de `oasdiff`; el documento en sí puede redactarse en paralelo) | S |
| `ui-foundation` | Ruben | `packages/ui`: tokens de §7 (color, tipografía Urbanist, radios, elevación) y componentes base de §8 — `StatusBar`, `NavCluster`, `IconButton` (7 variantes), `Button` (Primary/Secondary), `Chip`, `AmountCapsule`, `SaveBar` (incl. variante Disabled y swipe-to-confirm), `Toggle`, `TextField`, `FieldRow`, `Key` (teclado calculadora), `Avatar`, `Toast` (5 variantes) — cada uno con su story en Widgetbook. Fila/lista específicas de dominio (`EnvelopeRow`, `TxRow`, `AccountRow`, `PayeeRow`, `MemberRow`, `PlanRow`) quedan documentadas pero se implementan junto con el feature que las estrena. | `scaffold-frontend` | M |
| `add-auth` (FR-01) | Ruben | Pantallas 18 Acceso, 19 Crear cuenta, 34 Bienvenida. Back: módulo `users`/`auth`, hash Argon2/bcrypt, JWT, guard global de sesión. Front: `lib/features/auth`, formularios con `TextField`/`Button`/`SaveBar` de `packages/ui`. | `api-contract-base`, `ui-foundation`, `scaffold-backend` | M |

**Asignación aprobada (2026-09-28):** los cinco changes de Fase 0 son de Ruben — a diferencia del
borrador original, no hay reparto por persona dentro de esta fase. La secuencia que importa es
`scaffold-backend` → `api-contract-base`: esos dos changes van **primero** porque son los que
desbloquean a nathaliascode (ver Fase 1). En cuanto mergean, nathaliascode arranca
`add-budget-calc-engine` mientras Ruben sigue, en paralelo, con `scaffold-frontend` →
`ui-foundation` → `add-auth`. Recién ahí hay paralelismo real entre los dos devs; antes de eso,
nathaliascode no tiene nada para empezar.

---

## 2. Fases 1..6 — Changes de feature

### Fase 1 — Riesgo de camino crítico

| `add-budget-calc-engine` | **nathaliascode** (owner única, sin excepción) |
|---|---|

- **FRs:** FR-11 (`Available`/`ReadyToAssign` derivados), FR-12 (arrastre y saldado de mes).
- **Pantallas:** ninguna propia — es el motor que alimenta 02, 03, 04, 25, 46, 53. Se verifica
  de forma manual reproduciendo los 3 escenarios KR1 del PRD (incluido el ejemplo del 29/09:
  `$ 1.000.000 − $ 931.800 − $ 20.000 = $ 48.200`) contra los endpoints con Swagger UI o Prism
  usando fixtures, sin archivos de test automatizados.
- **Back (alto nivel):** entidades `BudgetMonth`, `Assignment`; `CalculationService` con las dos
  fórmulas de FR-11/12 (regla de sobregiro: `Available` negativo no se arrastra, se descuenta del
  `ReadyToAssign` del mes siguiente). Sin endpoints públicos todavía — servicio interno que
  `add-envelopes`, `add-transactions` y `add-monthly-assignment` consumen.
- **UI nueva:** ninguna.
- **Depende de:** `api-contract-base`, `scaffold-backend` (ambos de Ruben — arranca en cuanto
  mergean). Corre **en paralelo** con el resto de la Fase 0 que hace Ruben
  (`scaffold-frontend`, `ui-foundation`, `add-auth`): es el primer tramo de paralelismo real
  entre los dos devs.
- **Tamaño:** L.
- **Riesgo:** si esto no cierra, todo el trabajo de interfaz de sobres/plan/cierre de mes queda
  bloqueado (misma regla de prioridad que el PRD: "si los 3 escenarios de KR1 no pasan, se
  detiene todo trabajo de interfaz"). Por eso va temprano, con una sola owner, y sin competir con
  otro change del mismo módulo. Su interfaz (`CalculationService`) es además el primer punto de
  sincronía entre los dos devs bajo la asignación aprobada: nathaliascode lo construye y Ruben lo
  consume desde `add-envelopes` y `add-transactions` (ver §5).

### Fase 2 — Entidades núcleo

| Change | Owner | FRs | Pantallas | Back | UI nueva | Depende de | Tamaño |
|---|---|---|---|---|---|---|---|
| `add-plans-and-accounts` | nathaliascode | FR-02, FR-03, FR-40 | 16 Planes y miembros, 20 Nuevo plan, 33 Plan en dólares, 06 Plan vacío, 13 Cuentas, 14 Detalle de cuenta, 28 Nueva cuenta, 42 Editar cuenta, 48 Archivar cuenta, 51 Cuentas archivadas, 37 Elegir cuenta | Entidades `Plan`, `PlanMember`, `Account`; endpoints CRUD de plan (con selector de moneda inmutable, FR-40) y de cuenta (con archivado/restauración, no borrado) | `PlanRow`, `AccountRow`, tarjeta selectora de moneda (3 opciones) | `add-auth`, `api-contract-base` | L |
| `add-envelopes` | Ruben | FR-04 | 02 Plan del mes (gestión de sobres/grupos), 31 Nuevo sobre, 32 Grupos, 52 Elegir grupo, 44 Eliminar grupo, 43 Eliminar sobre, 35 Plantilla sugerida, 46 Asigná tu dinero | Entidades `EnvelopeGroup`, `Envelope`; endpoints CRUD + reordenamiento + plantilla (4 grupos/12 sobres) + asignación masiva inicial | `EnvelopeRow`, `GroupRow`, `IconButton/plus` en encabezado de grupo | `add-plans-and-accounts`, `add-budget-calc-engine` (usa `Assignment`) | L |
| `add-payees` | nathaliascode | FR-05 | 15 Beneficiarios, 41 Beneficiario, 47 Eliminar beneficiario | Entidad `Payee`; CRUD con baja "soft" que conserva el beneficiario en movimientos pasados | `PayeeRow` (con chevron) | `add-plans-and-accounts` | S |

Nota de sincronía: `add-envelopes` depende del `Plan`/migración de `add-plans-and-accounts`
(dueños distintos) — coordinar el merge de esa entidad antes de abrir `add-envelopes`.

### Fase 3 — Registro de movimientos

| `add-transactions` | **Ruben** |
|---|---|

- **FRs:** FR-06, FR-07, FR-08, FR-14, y FR-18 (Should) empaquetado porque comparte la misma
  pantalla/componente (`AmountCapsule` + `Key`, calculadora en el monto de 07).
- **Pantallas:** 07 Nuevo movimiento, 36 Elegir sobre, 38 Fecha y hora, 26 Elegir beneficiario,
  08 Dividir pago, 09 Registrar ingreso, 10 Movimientos.
- **Back:** entidades `Transaction`, `TransactionSplit`; endpoint de alta con validación de
  división (la suma de porciones debe igualar el monto); ingreso con destino a *Ready to Assign*
  o a un sobre.
- **UI nueva:** `TxRow`, `Toggle` (Gasto/Ingreso) ya definido en `ui-foundation`, hoja de
  selección reutilizable para 26/36/37.
- **Depende de:** `add-envelopes`, `add-payees`, `add-budget-calc-engine`.
- **Tamaño:** L.

### Fase 4 — Vista de plan y edición

| Change | Owner | FRs | Pantallas | Back | UI nueva | Depende de | Tamaño |
|---|---|---|---|---|---|---|---|
| `add-transaction-editing-and-filters` | Ruben | FR-13 (Must), FR-22 (Should) | 12 Editar movimiento, 49 Movimientos·recalculado, 27 Eliminar movimiento, 11 Filtrar movimientos | Endpoints `PATCH`/`DELETE` de transacción con recálculo completo (saldos, `Available`, `Carryover`, `ReadyToAssign` de todos los meses afectados); `GET` con filtros (fecha, hora, beneficiario, sobre, cuenta, dirección) | Toast Neutral "Recalculado · Deshacer" | `add-transactions` | M |
| `add-monthly-assignment` | nathaliascode | FR-09, FR-10, FR-15, FR-16, FR-21, y la UI de FR-11/FR-12 (cierre de mes) | 02 Plan del mes (vista principal), 03 Asignar dinero, 53 Asignar · monto propio, 04 Plan · mes futuro, 25 Cierre de mes | Endpoint de asignación (`POST` a `Assignment` por sobre/mes, incl. meses futuros), endpoint de vista agregada del mes (llama a `CalculationService`) | `lib/features/plan`, tarjeta "Listo para asignar", chips de filtro por estado (FR-21) | `add-envelopes`, `add-transactions`, `add-budget-calc-engine` | L |

### Fase 5 — Alto valor

| `add-envelope-goals` | **Ruben** (mismo módulo `envelopes` que Fase 2, mismo owner) |
|---|---|

- **FRs:** FR-19, FR-20, FR-24, FR-25, FR-41.
- **Pantallas:** 22 Detalle de sobre, 23 Editar sobre (campos de objetivo), 05 Detalle de meta,
  40 Opciones de meta, 50 Foto de la meta, 24 Mover dinero, 01 Inicio (carrusel de metas).
- **Back:** extiende `Envelope` con objetivo (monto mensual o monto+fecha) y estados derivados
  (`Funded`/`Underfunded`/`Overspent`); endpoint de movimiento entre sobres del mismo mes;
  endpoint de subida de foto de meta (multipart, ≤ 5 MB, JPEG/PNG/WebP, redimensionado en
  servidor, devuelve URL).
- **UI nueva:** `GoalCard` (con tinte lavanda + ícono cuando no hay foto), indicador de progreso
  (rayas/puntos chartreuse).
- **Depende de:** `add-envelopes`, `add-transactions` (para `Spent` real).
- **Tamaño:** L.

### Fase 6 — Complementario (Could Have)

| Change | Owner | FRs | Pantallas | Back | UI nueva | Depende de | Tamaño |
|---|---|---|---|---|---|---|---|
| `add-plan-sharing` | nathaliascode | FR-27 | 21 Invitar miembro, 30 Unirse a un plan, 45 Unirse desde enlace | Generación/regeneración/revocación de código de invitación (uso único, vencimiento 24 h) sobre `PlanMember`; resolución del enlace `sobres.app/unirse/<code>` | Chips de rol (Editor/Lector), vista previa de plan | `add-plans-and-accounts` | M |
| `add-reports` | nathaliascode | FR-26 | 17 Reportes | Endpoints de agregación (gasto por sobre, evolución de patrimonio, ingresos vs. egresos) con rango temporal | Gráficos (biblioteca a elegir en el change) | `add-transactions`, `add-envelopes` | M |
| `add-account-transfers` | nathaliascode | FR-28 | 29 Transferencia | Transacción especial sin sobre entre dos cuentas del mismo plan | Reutiliza `TxRow`/`AmountCapsule` | `add-plans-and-accounts` | S |

Nota: las pantallas 39 Menú de cuenta y 01 Inicio son *hubs* de navegación que varios changes
completan de forma incremental (F8): el primer change que las toca (`add-payees`, Fase 2) crea el
shell mínimo; `add-envelope-goals` y `add-reports` agregan sus propias entradas al llegar.

---

## 3. Balance y riesgos

| Owner | Changes | Peso aproximado (S=1, M=2, L=3) |
|---|---|---|
| Ruben | `scaffold-backend`, `api-contract-base`, `scaffold-frontend`, `ui-foundation`, `add-auth`, `add-envelopes`, `add-transactions`, `add-transaction-editing-and-filters`, `add-envelope-goals` | 1+1+1+2+2+3+3+2+3 = **18** |
| nathaliascode | `add-budget-calc-engine`, `add-plans-and-accounts`, `add-payees`, `add-monthly-assignment`, `add-plan-sharing`, `add-reports`, `add-account-transfers` | 3+3+1+3+2+2+1 = **15** |

Carga total pareja (18 vs. 15). Asignación aprobada por la usuaria el 2026-09-28 —reemplaza el
reparto del borrador, que ponía toda la Fase 0 salvo los dos primeros changes en nathaliascode y
el motor de cálculo en Ruben—: se invirtió esa asignación para que Ruben arranque
`scaffold-backend` + `api-contract-base` y así desbloquee a nathaliascode lo antes posible (ver
§1). Solapamiento de módulo minimizado por diseño en las fases de feature:

- **Módulo `envelopes` (back) / `lib/features/envelopes` (front):** solo Ruben (`add-envelopes`,
  `add-envelope-goals`).
- **Módulo `transactions`:** solo Ruben (`add-transactions`, `add-transaction-editing-and-filters`).
- **Módulos `plans`/`accounts`:** solo nathaliascode (`add-plans-and-accounts`, `add-plan-sharing`,
  `add-account-transfers`).
- **Fundación de front (`packages/ui`, `scaffold-frontend`) y `auth`:** con la asignación
  aprobada pasan a ser exclusivamente de Ruben; nathaliascode no vuelve a tocar esos módulos.
- Dos cruces inevitables entre owners distintos (ambos secuenciales, no concurrentes; ver Puntos
  de sincronía):
  1. `add-envelopes` (Ruben) depende de la entidad `Plan` que crea `add-plans-and-accounts`
     (nathaliascode).
  2. `add-envelopes` y `add-transactions` (Ruben) dependen de la interfaz de
     `CalculationService` que construye `add-budget-calc-engine` (nathaliascode) — este cruce es
     nuevo respecto del borrador: antes el motor de cálculo y sus consumidores tenían el mismo
     owner (Ruben), ahora el motor lo construye nathaliascode y Ruben lo consume.

**Riesgo de camino crítico — motor de cálculo (`add-budget-calc-engine`, FR-11/FR-12).** Va en
Fase 1, con nathaliascode como owner única, sin compartir módulo con nadie más en ese momento y
sin competir con otro change simultáneo del mismo código. Bloquea, directa o indirectamente, seis
de los once changes de feature (`add-envelopes`, `add-transactions`, `add-monthly-assignment`,
`add-envelope-goals`, `add-reports`, y de forma transitiva `add-transaction-editing-and-filters`).
Como no hay archivos de test automatizados, su verificación depende enteramente de la
reproducción manual de los 3 escenarios KR1 — conviene que ambos devs la ensayen juntos antes de
darla por cerrada, aunque el owner sea una sola. Al ser ahora un change de nathaliascode
consumido por changes de Ruben, además de riesgo de camino crítico es un punto de sincronía
real entre los dos devs (ver §5).

---

## 4. Tabla resumen

| Change | Owner | Fase | Depende de | Tamaño |
|---|---|---|---|---|
| `scaffold-backend` | Ruben | 0 | — | S |
| `scaffold-frontend` | Ruben | 0 | — | S |
| `api-contract-base` | Ruben | 0 | `scaffold-backend` (paralelo a `scaffold-frontend`) | S |
| `ui-foundation` | Ruben | 0 | `scaffold-frontend` | M |
| `add-auth` | Ruben | 0 | `api-contract-base`, `ui-foundation`, `scaffold-backend` | M |
| `add-budget-calc-engine` | nathaliascode | 1 | `api-contract-base`, `scaffold-backend` | L |
| `add-plans-and-accounts` | nathaliascode | 2 | `add-auth`, `api-contract-base` | L |
| `add-envelopes` | Ruben | 2 | `add-plans-and-accounts`, `add-budget-calc-engine` | L |
| `add-payees` | nathaliascode | 2 | `add-plans-and-accounts` | S |
| `add-transactions` | Ruben | 3 | `add-envelopes`, `add-payees`, `add-budget-calc-engine` | L |
| `add-transaction-editing-and-filters` | Ruben | 4 | `add-transactions` | M |
| `add-monthly-assignment` | nathaliascode | 4 | `add-envelopes`, `add-transactions`, `add-budget-calc-engine` | L |
| `add-envelope-goals` | Ruben | 5 | `add-envelopes`, `add-transactions` | L |
| `add-plan-sharing` | nathaliascode | 6 | `add-plans-and-accounts` | M |
| `add-reports` | nathaliascode | 6 | `add-transactions`, `add-envelopes` | M |
| `add-account-transfers` | nathaliascode | 6 | `add-plans-and-accounts` | S |

---

## 5. Puntos de sincronía

- **PR a `openapi.yaml`** (`api-contract-base` y cualquier cambio posterior de contrato):
  aprobación de ambos antes de mergear. `oasdiff` en CI detecta drift entre el contrato y el
  export de `@nestjs/swagger`.
- **PR de componente nuevo a `packages/ui`**: revisado por el otro dev antes de mergear, aunque
  el feature que lo origina tenga un solo owner (aplica sobre todo a `add-envelope-goals` con
  `GoalCard` y a `add-monthly-assignment` con la tarjeta "Listo para asignar").
- **Interfaz del motor de cálculo (`CalculationService`, FR-11/FR-12):** con la asignación
  aprobada, éste es el sync point de mayor riesgo del roadmap, porque ahora cruza owners:
  nathaliascode lo construye en `add-budget-calc-engine` y Ruben lo consume desde
  `add-envelopes` y `add-transactions`. Su firma (entradas, salidas, forma de invocarlo desde
  otros módulos) se acuerda entre ambos **antes** de que `add-budget-calc-engine` se dé por
  cerrado, no después — a diferencia del borrador (donde el mismo Ruben era owner del motor y de
  sus consumidores y el acuerdo era interno), acá un desacuerdo tardío bloquea a Ruben mientras
  espera un ajuste de interfaz de nathaliascode.
- **Entidad `Plan` / migración inicial:** merge de `add-plans-and-accounts` antes de abrir
  `add-envelopes` (dueños distintos, dependencia secuencial señalada en la sección 3).
- **Verificación manual de los 3 escenarios KR1** sobre `add-budget-calc-engine`: ensayarla en
  conjunto antes de marcar el change como cerrado, ya que no hay suite de tests que la respalde.

---

## Ambigüedades del PRD detectadas al armar el roadmap

1. **Paginación:** el PRD no especifica el mecanismo (offset/`page` vs. cursor); queda para
   `api-contract-base` decidirlo.
2. **FR-40 (moneda, Could Have) bundleado en `add-plans-and-accounts` (Must):** la UX spec pone
   el selector de moneda en la misma pantalla 20 Nuevo plan que la creación de plan, sin forma
   limpia de separarlos sin rediseñar la pantalla.
3. **FR-18 (calculadora, Should) bundleado en `add-transactions` (Must):** mismo componente
   (`AmountCapsule` + `Key`) que 07 Nuevo movimiento.
4. **FR-21 (filtros de estado, Should) bundleado en `add-monthly-assignment` (Must):** mismos
   chips de la pantalla 02.
5. **Conflicto §7 NFR vs. decisión de "sin tests":** el PRD declara como criterio de aceptación
   que el invariante de FR-11 y el rendimiento (`p95 < 300 ms`, `< 100 ms` de recálculo) se
   "verifican por test"; la decisión fija del equipo prohíbe archivos de test. Este roadmap
   resuelve la verificación de forma manual (Swagger UI/Prism + Widgetbook) por instrucción
   explícita del usuario, pero deja constancia de que eso relaja el criterio de aceptación
   original del PRD — conviene que el equipo lo confirme con la cátedra si el criterio de
   evaluación lo exige formalmente.
6. **Owner backend/frontend por persona (§10 del PRD, "Persona A backend / Persona B
   frontend"):** ese timeline quedó reemplazado por la decisión de `team-coordination-setup.md`
   (split por feature, full-stack). `PRD.md` y `ALCANCE.md` se actualizaron en T3 de
   `team-coordination-setup.md` para reflejarlo; ver `docs/COLABORACION.md` para el flujo
   operativo del equipo.
