# PRD: Gestor de Plan de Presupuesto (clon de YNAB)

**Status**: Draft
**Autor**: Estudiante — Tópicos Avanzados de Programación (TAP), 2026
**Última actualización**: 2026-09-28
**Versión**: 1.6

> Este documento es la fuente de verdad del alcance. `ALCANCE.md` es su resumen ejecutivo.

> **Equipo de 2 personas**: Ruben y nathaliascode. División por feature, full-stack (no por
> capa) — cada OpenSpec change tiene un único owner y cubre backend y frontend. Ver
> `docs/ROADMAP.md` (asignación) y `docs/COLABORACION.md` (flujo operativo).
> El alcance de la sección 6 se implementa completo.

---

## 1. Overview

Aplicación móvil de presupuesto personal basada en el método de sobres y presupuesto de
base cero. El usuario abre un **plan**, registra sus **cuentas**, y cada mes reparte el
dinero disponible entre **sobres** (categorías) antes de gastarlo. Registra ingresos y
gastos con fecha, hora, beneficiario y sobre, y la aplicación mantiene la coherencia
aritmética del plan ante cualquier modificación posterior.

Dirigido a personas que ya intentaron llevar un registro de gastos y abandonaron porque
saber en qué se fue el dinero no evitó que se fuera.

---

## 2. Problem Statement

**Current State**: Una persona con ingresos variables o múltiples obligaciones mensuales
mantiene sus compromisos de dinero en la memoria: sabe que "algo" del sueldo es para el
alquiler y "algo" para la cuota, pero no cuánto del saldo que ve en la cuenta ya está
comprometido. Al consultar el saldo, ve un número que no distingue entre dinero libre y
dinero reservado.

**Impact**: El dinero comprometido se gasta en otra cosa porque nada lo distingue del
dinero libre. La consecuencia recurrente es llegar a la obligación sin fondos y cubrirla
desplazando otra obligación, un desplazamiento que se propaga mes a mes. Las herramientas
de registro de gastos no lo evitan: informan después del hecho, cuando la decisión ya se
tomó.

**Root Cause**: El saldo de una cuenta es un único número agregado, mientras que las
obligaciones son múltiples y tienen distinto vencimiento. Mientras el compromiso de un
monto exista solo en la intención del usuario y no en el sistema que consulta antes de
gastar, no hay nada que impida gastarlo dos veces.

---

## 3. Goals & Success Metrics

### Objective

Que el usuario pueda responder "¿puedo gastar esto?" mirando el sobre correspondiente, y
que esa respuesta siga siendo correcta después de editar, borrar o reasignar cualquier
movimiento del pasado.

### Key Results

| KR | Baseline | Target | Deadline | Owner |
|----|----------|--------|----------|-------|
| KR1 — Escenarios de revisión del docente que pasan (asignación futura; saldado del mes anterior cuadrando; edición y borrado con recálculo) | 0 / 3 | 3 / 3 | Entrega | Equipo |
| KR2 — Campos obligatorios por transacción implementados (fecha+hora, descripción, monto, beneficiario, sobre, dirección) | 0 / 6 | 6 / 6 | Entrega | Equipo |
| KR3 — Interacciones para registrar un gasto desde la apertura de la app | n/a | ≤ 5 toques | Entrega | Equipo |
| KR4 — Cobertura de tests unitarios del dominio de presupuesto en el backend ⁽²⁾ | 0 % | ≥ 80 % de líneas | Entrega | Equipo |
| KR5 — Invariante del plan verificado tras operaciones de alta, edición y borrado ⁽²⁾ | 0 casos | ≥ 12 casos de prueba, todos en verde | Entrega | Equipo |

⁽²⁾ **KR4 y KR5 no se cumplen tal como están escritos.** El equipo decidió no tener archivos de
test en ningún repo (`odd/tasks/team-coordination-setup.md`; ver la nota ⁽¹⁾ de §7 y
`docs/ROADMAP.md`, "Ambigüedades del PRD", punto 5), así que no hay cobertura de líneas medida
(KR4) ni una suite de casos que corra en CI (KR5). En su lugar:

- El dominio de presupuesto vive en un único módulo puro del backend (`CalculationService`, sin
  acceso a la base), lo que permite verificarlo directamente con datos fijos.
- `npm run calc:kr1` (`src/scripts/kr1-scenarios.ts`) reproduce sobre el dataset canónico los 3
  escenarios de KR1, el invariante de FR-11 tras editar y borrar movimientos pasados, la
  atribución de mes por zona horaria y el umbral de rendimiento: 28 comprobaciones con valor
  esperado y calculado, todas correctas.
- Cada change registra en su `tasks.md` la verificación manual de sus endpoints (Swagger UI,
  Prism o requests contra la API real, incluidos los errores) y de sus pantallas contra los
  renders.

Es verificación reproducible pero no automatizada en CI: si la cátedra exige formalmente KR4 o
KR5, la decisión de no tener tests tiene que revisarse.

### Anti-Goals

- No se optimiza para réplica visual de YNAB: la interfaz es de diseño propio.
- No se optimiza para volumen ni concurrencia: el uso previsto es de un plan por persona.
- No se optimiza para disponibilidad: la aplicación no se despliega.
- No se persigue paridad funcional con YNAB; se persigue corrección del método de sobres.

---

## 4. User Personas

### Primary Persona

- **Nombre**: Sofía, 29 años
- **Rol / Contexto**: Empleada con sueldo fijo y trabajos ocasionales. Paga alquiler,
  servicios y una cuota mensual. Usa el teléfono para todo y casi nunca una computadora.
- **Goals**: Saber cuánto puede gastar hoy sin comprometer el alquiler. Registrar un gasto
  en el momento de pagarlo, parada en la caja.
- **Pain Points**: Usó una app de gastos tres semanas y la abandonó: le decía en qué había
  gastado pero no si podía gastar. Mantiene el reparto del sueldo en la cabeza y se le
  desarma cuando aparece un gasto no previsto.
- **Technical Level**: Intermedio. No conoce contabilidad ni el término "presupuesto de
  base cero".

### Secondary Persona

- **Nombre**: Docente evaluador — TAP 2026
- **Rol / Contexto**: Evalúa la entrega. No usa la aplicación para administrar su dinero:
  la recorre buscando corrección lógica y usabilidad.
- **Why secondary**: No es usuario del producto, pero sus criterios de revisión son
  requisitos duros. Va a probar deliberadamente asignación a meses futuros, el saldado del
  mes anterior y la edición y borrado de transacciones ya contabilizadas.

---

## 5. User Stories / Jobs to be Done

| # | Job to be Done | Persona | Prioridad |
|---|----------------|---------|-----------|
| 1 | Cuando empiezo a organizar mis finanzas, quiero abrir un plan con mis cuentas y sus saldos, para partir de mi situación real | Sofía | Must |
| 2 | Cuando cobro, quiero repartir el ingreso entre mis sobres, para que cada peso tenga un destino antes de que lo gaste | Sofía | Must |
| 3 | Cuando pago algo, quiero registrarlo en pocos toques con su beneficiario y su sobre, para no postergarlo y olvidarlo | Sofía | Must |
| 4 | Cuando estoy por comprar algo, quiero ver cuánto queda en ese sobre, para decidir en el momento | Sofía | Must |
| 5 | Cuando un pago cubre cosas de sobres distintos, quiero dividir la transacción, para que cada sobre descuente lo suyo | Sofía | Must |
| 6 | Cuando ya sé que un gasto grande cae en dos meses, quiero asignar dinero a un mes futuro, para no tener que acordarme después | Sofía | Must |
| 7 | Cuando cierro el mes y me pasé en un sobre, quiero que el sistema lo salde y quede cuadrado, para arrancar el mes siguiente sin arrastrar un error | Sofía | Must |
| 8 | Cuando cargué mal un monto la semana pasada, quiero corregirlo y que todos los saldos se recalculen, para no rehacer el mes a mano | Sofía | Must |
| 9 | Cuando reviso un sobre, quiero ver su actividad ordenada por fecha y hora, para reconocer los movimientos de un mismo día | Sofía | Must |
| 10 | Cuando cargo un monto que es una suma de varios ítems, quiero escribir la operación en el campo, para no calcularla aparte | Sofía | Should |
| 11 | Cuando defino un sobre, quiero fijarle un objetivo mensual, para saber si lo financié o me falta | Sofía | Should |
| 12 | Cuando reviso el mes, quiero filtrar los sobres sobregirados o sin financiar, para atacar primero lo urgente | Sofía | Should |
| 13 | Cuando quiero entender mis hábitos, quiero ver mi gasto por sobre en un período, para detectar dónde se me va el dinero | Sofía | Could |
| 14 | Cuando administro las cuentas con otra persona, quiero compartir el plan, para que ambos veamos lo mismo | Sofía | Could |

---

## 6. Functional Requirements

> Nota sobre la proporción de `Must`: es alta (≈ 41 %) porque las directrices de la cátedra
> son, por definición, bloqueantes de la entrega. No es inflación de alcance: es el alcance
> mínimo evaluable.

### Must Have (bloqueantes de entrega)

- [ ] **FR-01** — Registro e inicio de sesión de usuario. Autenticación mínima con
      credenciales; toda operación exige sesión válida.
- [ ] **FR-02** — Alta, edición, listado y baja de **planes**. Un usuario puede tener más de
      un plan; cada plan es un ámbito aislado de cuentas, sobres y beneficiarios, y opera en
      la moneda que se le asignó al crearlo (FR-40).
- [ ] **FR-03** — Alta, edición, listado y baja de **cuentas** dentro de un plan, con saldo
      inicial. El saldo corriente se deriva de las transacciones, nunca se almacena. La "baja"
      de una cuenta se resuelve como **archivado**, no como borrado: sus movimientos deben
      moverse a otra cuenta o se conservan igual, y la cuenta archivada deja de sumar al saldo
      total y de ofrecerse en altas nuevas. Un borrado real invalidaría el saldo derivado de
      todas las cuentas que compartieron transacciones con ella. Las cuentas archivadas se listan
      aparte (no se ocultan del todo) y pueden **restaurarse**, lo que las vuelve a sumar al
      saldo total y a ofrecerlas en altas nuevas.
- [ ] **FR-04** — Alta, edición, listado, reordenamiento y baja de **grupos de sobres** y
      **sobres** dentro de un plan. Al vaciar un plan, una plantilla sugerida (4 grupos, 12
      sobres) permite crearlos todos de una vez, sin objetivo y en $ 0, desmarcando los que no
      se quieran.
- [ ] **FR-05** — Alta, edición, listado y baja de **beneficiarios** dentro de un plan, con
      reutilización entre transacciones. La baja de un beneficiario **conserva sus movimientos
      pasados** (quedan con el beneficiario que tenían al momento de registrarse) y solo lo
      retira de la lista para transacciones nuevas.
- [ ] **FR-06** — Registro de **transacción** con: fecha y hora, descripción, monto,
      beneficiario, sobre, cuenta, y dirección (entrada o salida de dinero).
- [ ] **FR-07** — La hora es parte del dato, no un detalle de presentación: se persiste, se
      usa para ordenar la actividad y es criterio de filtrado.
- [ ] **FR-08** — Un **ingreso** se destina a *Ready to Assign* o directamente a un sobre, a
      elección del usuario en el momento de registrarlo.
- [ ] **FR-09** — **Asignación mensual**: el usuario asigna montos a cada sobre para un mes
      determinado.
- [ ] **FR-10** — **Asignación a meses futuros**: se permite asignar a cualquier mes
      posterior al actual. El *Ready to Assign* del mes de origen refleja el compromiso y la
      navegación entre meses expone las asignaciones futuras ya realizadas.
- [ ] **FR-11** — **Cálculo derivado del estado del plan**, recomputado desde los hechos en
      cada consulta, sin valores agregados persistidos:
      `Available(sobre, mes) = Assigned(sobre, mes) + Carryover(sobre, mes−1) − Spent(sobre, mes)`
      y `ReadyToAssign(mes) = Σ saldos de cuentas − Σ Available(sobre, mes) − Σ Assigned(sobre, meses > mes)`.
      El último término es el dinero ya comprometido en meses futuros (FR-10); sin él, la
      asignación anticipada contaría dos veces el mismo peso. Ejemplo del diseño (29/09):
      `$ 1.000.000 − $ 931.800 − $ 20.000 = $ 48.200`.
- [ ] **FR-12** — **Arrastre y saldado de mes**: un `Available` positivo se arrastra al mes
      siguiente. Un `Available` negativo (sobregiro) **no** se arrastra como sobre negativo:
      se descuenta del *Ready to Assign* del mes siguiente y el sobre parte de cero. Tras el
      saldado, el invariante de FR-11 se mantiene exacto.
- [ ] **FR-13** — **Edición y baja de transacciones en cualquier momento**, incluidas las de
      meses ya cerrados, con recálculo completo de saldos de cuenta, `Available`, `Carryover`
      y `ReadyToAssign` de todos los meses afectados, incluidos los posteriores.
- [ ] **FR-14** — **División de pagos**: una transacción puede repartirse en dos o más
      porciones, cada una con su sobre y su monto. La suma de las porciones debe igualar el
      monto de la transacción; el sistema rechaza el guardado si no cuadra.
- [ ] **FR-15** — **Navegación entre meses**, hacia el pasado y hacia el futuro, sin límite
      artificial.
- [ ] **FR-16** — **Vista de plan**: pantalla principal con el mes en curso, el *Ready to
      Assign* destacado, y los sobres agrupados mostrando asignado y disponible, con edición
      de la asignación en la misma pantalla.
- [ ] **FR-17** — **Detalle de cuenta** con su listado de transacciones ordenado por fecha y
      hora descendente.

### Should Have (alto valor)

- [ ] **FR-18** — El campo de monto **acepta expresiones aritméticas** (suma, resta,
      multiplicación, división) y resuelve el resultado al confirmar.
- [ ] **FR-19** — **Objetivo por sobre**: monto mensual, o monto a alcanzar antes de una
      fecha.
- [ ] **FR-20** — **Estados derivados por sobre**: `Funded`, `Underfunded`, `Overspent`, con
      indicador de progreso respecto del objetivo.
- [ ] **FR-21** — **Filtros en la vista de plan** por los estados de FR-20.
- [ ] **FR-22** — **Filtros de transacciones** por rango de fecha y hora, beneficiario, sobre,
      cuenta y dirección. Es la razón por la que la cátedra exigió la hora: persistir la hora
      sin un filtro que la use dejaría el requisito sin sentido.
- [ ] **FR-23** — **Autocompletado de beneficiario** al registrar una transacción, sobre los
      beneficiarios ya existentes en el plan.
- [ ] **FR-24** — **Detalle de sobre** con su actividad del mes, su objetivo y su progreso.
- [ ] **FR-25** — **Mover dinero entre sobres** dentro de un mismo mes sin pasar por una
      transacción.
- [ ] **FR-41** — **Foto de meta**: el usuario puede asociar una foto a cada meta (sobre de
      tipo meta), elegida desde la galería, la cámara o un set de fotos sugeridas, y cambiarla
      o quitarla en cualquier momento. Se almacena a través del backend NestJS: subida de hasta
      5 MB, formatos JPEG/PNG/WebP, redimensionada en el servidor a un ancho fijo. Sin foto, la
      tarjeta de la meta usa un color en su lugar.

### Could Have

- [ ] **FR-26** — **Reportes**: gasto por sobre en un período, evolución del patrimonio,
      ingresos contra egresos, con selección de rango temporal.
- [ ] **FR-27** — **Planes compartidos**: unión a un plan mediante un código generado y su
      QR, con un rol por miembro (Editor o Lector), un solo uso y vencimiento a las 24 h. La
      dueña puede regenerar o revocar el código en cualquier momento. El QR codifica un enlace
      (`sobres.app/unirse/<code>`): si quien lo escanea con la cámara del teléfono no tiene
      cuenta, pasa primero por el alta de cuenta y llega directo a la unión con el código ya
      cargado; si ya tiene cuenta, ve la vista previa del plan y el código prefilado. El modelo
      de datos ya lo contempla (un plan tiene de uno a N miembros), de modo que habilitarlo no
      exige rediseño.
- [ ] **FR-28** — **Transferencia entre cuentas** como transacción sin sobre.
- [ ] **FR-40** — **Moneda del plan**: al crear un plan se elige su moneda entre una lista
      extensible (ARS "$", USD "US$", EUR "€"). La moneda es **inmutable** una vez creado el
      plan, porque cambiarla exigiría convertir montos históricos. Todo monto del plan —
      tarjetas de saldo, sobres, cuentas, movimientos, filtros, reportes y la vista de unión a
      un plan — se muestra con el símbolo y el formato de esa moneda (locale es-AR: separador
      de miles punto, decimales con coma; ARS sin decimales, USD/EUR con 2).

> FR-26, FR-27 y FR-40 no figuran en las directrices de la cátedra. Se implementan por
> decisión del equipo.

### Won't Have (fuera de esta versión)

- **FR-29** — Conciliación bancaria — *el docente la excluyó explícitamente.*
- **FR-30** — Sincronización con entidades bancarias e importación automática de movimientos
  — *requiere integraciones externas sin valor evaluable.*
- **FR-31** — Funcionamiento sin conexión y sincronización diferida — *decisión de
  arquitectura: el servidor es autoritativo y la aplicación asume conexión permanente.*
- **FR-32** — Cuentas de crédito con su sobre de pago asociado — *es la mecánica más compleja
  de YNAB y no aporta al método de sobres; su ausencia además simplifica FR-12.*
- **FR-33** — **Conversión** entre monedas y cuentas multi-moneda — *un plan opera en una sola
  moneda, elegida al crearlo (FR-40) e inmutable después; no hay tasas de cambio ni cuentas
  que mezclen monedas dentro de un mismo plan.*
- **FR-34** — Transacciones programadas o recurrentes — *no figuran en las directrices.*
- **FR-35** — Importación y exportación de archivos (CSV, OFX) — *no figura en las
  directrices.*
- **FR-36** — Notificaciones push — *exige infraestructura desplegada.*
- **FR-37** — Aplicación web — *la cátedra admite web **o** mobile; se eligió mobile.*
- **FR-38** — Despliegue en un entorno productivo — *la cátedra lo declaró innecesario.*
- **FR-39** — Envío de emails (invitaciones o notificaciones) — *FR-27 resuelve la invitación
  a un plan con un código y su QR generados en la app, sin depender de un proveedor de correo
  saliente.*

---

## 7. Non-Functional Requirements

| Categoría | Requisito | Umbral |
|-----------|-----------|--------|
| Exactitud | Dinero representado como entero en la unidad menor de la moneda del plan (§9) de punta a punta, incluido el JSON de la API | Cero uso de punto flotante para montos |
| Integridad | El invariante de FR-11 se mantiene tras cada operación de escritura | Verificado por test en alta, edición, baja, división y saldado de mes ⁽¹⁾ |
| Rendimiento | Respuesta de la API en entorno local | p95 < 300 ms para la vista de plan de un mes |
| Rendimiento | Recálculo del estado de un mes | < 100 ms con 2.000 transacciones en el plan |
| Rendimiento | Registro de un gasto de punta a punta | ≤ 5 toques y ≤ 15 s |
| Seguridad | Contraseñas almacenadas con hash de derivación lenta (Argon2 o bcrypt) | Nunca en texto plano ni con hash rápido |
| Seguridad | Autorización por plan en todos los endpoints | Un usuario no accede a datos de un plan del que no es miembro |
| Seguridad | Validación de entrada en el borde de la API | Rechazo con 4xx de todo payload que no satisfaga el esquema |
| Accesibilidad | Área táctil de los controles | ≥ 48 dp |
| Accesibilidad | Contraste de texto y de los indicadores de estado | WCAG 2.1 AA (4.5:1 en texto normal) |
| Accesibilidad | Los estados de sobre no se comunican solo por color | Color acompañado de texto o icono |
| Plataforma | Flutter en canal estable; Android e iOS | Android 8.0+ / iOS 13+ |
| Escalabilidad | No es objetivo. Volumen previsto | 1 plan, hasta 5 miembros, hasta 10.000 transacciones |
| Observabilidad | Registro de errores del backend | Traza de errores 5xx con identificador de petición |

⁽¹⁾ El equipo decidió no tener archivos de test en ningún repo (`odd/tasks/team-coordination-setup.md`).
Este requisito se verifica de forma **manual** — reproduciendo los 3 escenarios KR1 contra los
endpoints con Swagger UI o Prism — en vez de con una suite de tests automatizada. Ver
`docs/ROADMAP.md`, sección "Ambigüedades del PRD", punto 5, para el detalle de este trade-off.

---

## 8. Out of Scope

- Todo lo enumerado como `Won't Have` en la sección 6, con su razón.
- Envío de emails, tanto invitaciones a un plan como notificaciones: la invitación se resuelve
  con el código y el QR de FR-27, generados y validados dentro de la app.
- Diseño visual derivado de YNAB: la interfaz es de autoría propia. Se toma de YNAB el
  **método**, no la apariencia.
- Migración de datos desde otras herramientas de presupuesto.
- Internacionalización y traducción de la interfaz a otros idiomas.
- Auditoría e historial de cambios sobre transacciones editadas o borradas.
- Adjuntar comprobantes o fotografías a una transacción.
- Presupuesto por semana o por quincena: la unidad de presupuesto es el mes.

---

## 9. Technical Constraints & Dependencies

### Constraints

- **Frontend Flutter, cliente delgado.** Presentación, navegación, estado de interfaz y
  cliente HTTP. No calcula valores de presupuesto: renderiza lo que la API devuelve. Su capa
  de dominio se limita a view models.
- **Backend NestJS, servidor autoritativo.** Contiene el dominio completo y es la única
  implementación de las reglas de presupuesto. El dominio se implementa y prueba con
  independencia del framework web.
- **Los valores derivados no se persisten.** `Available`, `Carryover`, `ReadyToAssign` y los
  saldos de cuenta se recomputan desde las transacciones y asignaciones. Es la condición que
  hace correcto a FR-13: si no hay agregados almacenados, no hay agregados que queden
  desactualizados al editar el pasado.
- **Aplicación siempre conectada.** Sin conexión no hay funcionalidad.
- **Interfaz optimista** en la edición de asignaciones de la vista de plan: el cambio se
  refleja de inmediato y se revierte si la API lo rechaza.
- **Identificadores UUID** en todas las entidades.
- **Moneda del plan y unidades menores.** Cada plan guarda su moneda (FR-40) al crearse; el
  backend almacena y opera todo monto de ese plan como entero en la unidad menor de **esa**
  moneda, nunca en una unidad mixta. Unidades menores por moneda soportada: ARS 0 (no se
  modelan centavos; el peso es la unidad entera), USD 2 (centavos), EUR 2 (centavos). El
  formato usa siempre el locale es-AR (punto de miles, coma decimal). La conversión entre
  monedas queda fuera de alcance (FR-33).
- **Fecha y hora**: se persisten como instante con zona (`timestamptz`) y se muestran en la
  zona del dispositivo. La **atribución de una transacción a un mes presupuestario** se
  resuelve en la zona horaria del plan, para que un movimiento del día 31 a las 23:30 no
  caiga en el mes equivocado.
- **Persistencia:** TypeORM sobre PostgreSQL, levantado con `docker-compose`. TypeORM se
  integra de forma nativa con NestJS (`@nestjs/typeorm`) y define el modelo como entidades por
  feature, con migraciones generadas por su CLI. *Salvaguarda:* si la puesta en marcha de Docker
  se complica, se cambia el `type` de la conexión a `sqlite` y se documenta la razón. La evaluación es local y no hay despliegue, así que ningún criterio de
  la cátedra depende del motor.
- **Gestión de estado en Flutter:** Riverpod, **solo si al menos una de las dos personas ya lo
  usó**. En caso contrario, un repositorio simple con `ChangeNotifier`.
  *Resuelto (2026-09-29):* ninguna de las dos personas usó Riverpod, así que se adopta `ChangeNotifier` + `ListenableBuilder`, sin `provider` ni Riverpod, con dependencias inyectadas por constructor desde una raíz de composición (change `scaffold-frontend`).
- **Contrato de API:** acordado en el hito 1 y congelado. Todo cambio posterior se comunica de
  forma explícita porque desbloquea o bloquea a la otra persona.
- **Repositorio en GitHub** con OpenSpec como metodología de especificación.
- **Sin despliegue.** La evaluación se realiza en entorno local.
- **Almacenamiento de imágenes de metas (FR-41).** Los archivos se guardan en disco local del
  servidor o en almacenamiento de objetos (por ejemplo, un bucket compatible con S3); no se
  requiere CDN para el alcance de la cátedra. El backend devuelve la URL servida y el cliente
  Flutter solo la renderiza.

### Dependencies

| Dependencia | Tipo | Owner | Estado | ETA |
|-------------|------|-------|--------|-----|
| Repositorio GitHub creado e inicializado | Bloqueante | Equipo | No iniciado | — |
| Decisión de persistencia del backend | Bloqueante de implementación | Equipo | Pendiente — fase de diseño | — |
| Decisión de gestión de estado en Flutter | Bloqueante de implementación | Equipo | Resuelta — ChangeNotifier + ListenableBuilder (2026-09-29) | — |
| Definición de la interfaz de usuario propia | Bloqueante de implementación del frontend | Equipo | No iniciado | — |

---

## 10. Timeline & Milestones

Equipo de 2: **Ruben y nathaliascode**. División **por feature, full-stack** — no por capa
backend/frontend como en una versión anterior de este documento. Cada OpenSpec change tiene un
único owner y cubre tanto `budget-tracker-back` como `budget-tracker-front`. Los hitos se
expresan en orden de dependencia, sin fechas.

La condición que hace viable el paralelismo: **el contrato de la API (`openapi.yaml`) se acuerda
antes de que cada change que lo necesita empiece**, y `scaffold-backend` + `api-contract-base` —
los dos primeros changes, ambos de Ruben — desbloquean a nathaliascode.

El detalle de changes, orden, dependencias y balance de carga entre los dos vive en
`docs/ROADMAP.md`; el flujo operativo (setup, ramas, protocolo de contrato, protocolo de
`packages/ui`, sincronía) vive en `docs/COLABORACION.md`.

**Regla de prioridad.** Si los 3 escenarios de KR1 no pasan, se detiene todo trabajo de
interfaz y ambas personas convergen en el motor de cálculo. Los criterios de revisión
declarados tienen prioridad sobre cualquier requisito de presentación.

---

## 11. Stakeholders

| Nombre | Rol | Involucramiento |
|--------|-----|-----------------|
| Docente — TAP 2026 | Evaluador | Decision Maker — define las directrices y aprueba la entrega |
| Equipo autor | Desarrollo | Contributor — arquitectura, implementación y pruebas |
| Sofía (persona de referencia) | Usuaria final modelada | Informed — valida usabilidad mediante los criterios de KR3 |

---

## 12. Open Questions

| # | Pregunta | Owner | Resolución |
|---|----------|-------|------------|
| 1 | ¿La entrega es individual o en equipo? | Equipo | **Resuelta** — equipo de 2 (Ruben, nathaliascode). División por feature, full-stack — ver `docs/ROADMAP.md` |
| 2 | ¿Se conservan FR-26 y FR-27, ausentes de las directrices? | Equipo | **Resuelta** — se implementan |
| 3 | ¿La cátedra exige alguna tecnología concreta de persistencia o de pruebas? | Equipo → Cátedra | TBD — se asume que no. Decisión tomada en la sección 9, con salvaguarda |
| 4 | ¿El docente espera que la asignación a un mes futuro comprometa el *Ready to Assign* del mes actual, o que solo exista en el mes destino? FR-10 asume lo primero, que es el comportamiento de YNAB | Equipo → Cátedra | TBD — asumido. Conviene resolverlo antes de implementar el motor de cálculo: es uno de los 3 escenarios que va a revisar y resolverlo al revés obliga a rehacerlo |
| 5 | ¿Se requiere documentación de la API (OpenAPI/Swagger) como parte de la entrega? | Equipo → Cátedra | TBD — el decorador de NestJS lo genera con coste marginal; se incluye salvo indicación contraria |
| 6 | ¿Qué persona toma backend y qué persona toma frontend? | Equipo | **Obsoleta** — la división pasó a ser por feature, full-stack, no por capa. Ver `docs/ROADMAP.md` |

---

## Appendix

### Modelo de dominio

| Entidad | Descripción |
|---------|-------------|
| `User` | Usuario autenticado |
| `Plan` | Plan de presupuesto. Ámbito de cuentas, sobres y beneficiarios. Tiene de uno a N miembros |
| `PlanMember` | Relación usuario–plan con su rol |
| `Account` | Cuenta con saldo inicial; el saldo corriente es derivado |
| `EnvelopeGroup` | Agrupación de sobres |
| `Envelope` | Sobre (categoría) de gasto, con objetivo opcional |
| `Payee` | Beneficiario, reutilizable entre transacciones |
| `Transaction` | Movimiento: instante (fecha y hora), descripción, monto, beneficiario, cuenta, dirección |
| `TransactionSplit` | Porción de una transacción dividida, con su sobre y su monto |
| `BudgetMonth` | Mes presupuestario de un plan |
| `Assignment` | Monto asignado a un sobre en un mes determinado |

### Alternatives Considered

| Opción | Pros | Cons | Por qué se rechazó |
|--------|------|------|--------------------|
| Cálculo del presupuesto en el cliente, servidor como almacén de hechos | Menor latencia; funcionaría sin conexión | Duplica el algoritmo si más adelante se agrega otro cliente; la lógica evaluable queda en la capa más difícil de testear | Se priorizó una única implementación del dominio, en el backend, como módulo puro verificable directamente (`npm run calc:kr1`) |
| Arquitectura offline-first con sincronización diferida | Funciona sin conexión, mejor producto real | Introduce convergencia y resolución de conflictos sobre un invariante monetario; es el riesgo más alto del proyecto y no se evalúa | Excluido: coste desproporcionado frente a su valor en la evaluación |
| Persistir `Available` y `ReadyToAssign` como columnas | Lecturas más rápidas | Cada edición de una transacción pasada obliga a invalidar agregados de todos los meses posteriores; es la fuente natural de descuadres | Rechazado: FR-13 exige recálculo confiable, y no hay agregado que se desactualice si no existe |
| Modelar planes privados y planes compartidos como entidades distintas | Modelo privado más simple al inicio | Duplica reglas de autorización y de acceso; migrar de privado a compartido exigiría rediseño | Rechazado: un `Plan` con `members: 1..N` cubre ambos casos con un solo modelo |
| Presupuesto por semana o quincena, además del mes | Se adapta a ingresos quincenales | Multiplica los casos de arrastre y saldado, que son el criterio central de evaluación | Fuera de alcance: la unidad es el mes |

### Revision History

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-09-27 | Equipo | Versión inicial, alineada con las directrices de la cátedra: plan como entidad, beneficiarios administrables, hora en la transacción, asignación futura, saldado de mes, recálculo ante edición y borrado, calculadora en el monto, división de pagos. Conciliación excluida |
| 1.1 | 2026-09-28 | Equipo | FR-27 pasa de invitación por email a unión a un plan mediante un código generado y su QR (rol Editor/Lector, un solo uso, vencimiento 24 h, regeneración o revocación por la dueña). Se agrega FR-39 (envío de emails) a Won't Have y a Out of Scope |
| 1.1 | 2026-09-27 | Equipo | Se retiran las fechas de entrega y todo cronograma con fechas: los hitos quedan en orden de dependencia. Se confirma equipo de 2 con reparto backend/frontend. El alcance se implementa completo: FR-01 a FR-28, sin requisitos diferidos. Se fijan persistencia (Prisma) y gestión de estado |
| 1.2 | 2026-09-28 | Equipo | Se agrega FR-40 (moneda del plan, Should Have): la moneda se elige al crear el plan y es inmutable. FR-02 menciona la moneda del plan; FR-33 se acota de "múltiples monedas" a "conversión entre monedas", porque la elección de moneda deja de estar excluida. §9 fija las unidades menores por moneda soportada (ARS, USD, EUR) |
| 1.3 | 2026-09-28 | Equipo | Auditoría de navegación (Lote A): FR-27 documenta el caso de enlace profundo del QR (con o sin cuenta creada); FR-04 menciona la plantilla sugerida de sobres. Sin cambios de alcance: ambas piezas ya estaban aprobadas, esto solo alinea el texto con las 6 pantallas nuevas del diseño (34, 35, 36, 37, 38, 45) |
| 1.4 | 2026-09-28 | Equipo | Auditoría de navegación (Lote B): FR-03 aclara que la baja de una cuenta se resuelve como archivado, no como borrado, porque el saldo se deriva de las transacciones; FR-05 aclara que la baja de un beneficiario conserva sus movimientos pasados. Sin cambios de alcance: ambas aclaraciones alinean el texto con las 6 pantallas nuevas del diseño (39–44) |
| 1.5 | 2026-09-28 | Equipo | FR-11: la fórmula de *Ready to Assign* resta también lo asignado a meses futuros, que es lo que ya exigía FR-10 y la fórmula anterior omitía. El diseño pasa a un conjunto de datos único y verificable (odd/tasks/canonical-dataset.md) |
| 1.6 | 2026-09-28 | Equipo | Se agrega FR-41 (Foto de meta, Should Have): subir, cambiar o quitar una foto por meta desde la galería, la cámara o un set sugerido, almacenada por el backend con límite de tamaño y formato y redimensionada server-side; sin foto la tarjeta usa un color. §9 documenta el almacenamiento de imágenes (disco local u object storage, sin CDN). El diseño agrega la pantalla 50 (Foto de la meta) y separa el toast «Recalculado» de 12 en su propio estado posterior al guardado (pantalla 49) |
| 1.7 | 2026-09-28 | Equipo | FR-03 aclara que las cuentas archivadas se listan aparte y pueden restaurarse. El diseño cierra tres brechas encontradas por el usuario: la lista de cuentas archivadas (pantalla 51, con Restaurar), el selector de grupo como hoja con radio al crear o editar un sobre (pantalla 52, sin buscador porque solo hay 4 grupos) y el estado de monto propio de "Asignar dinero" con la calculadora visible (pantalla 53). También corrige la etiqueta "Súper" a "Supermercado" en 03, por la convención de nombres |
| 1.8 | 2026-09-28 | Equipo | Persistencia pasa de Prisma a TypeORM (integración nativa con NestJS, entidades por feature). Reparto del equipo por feature full-stack (ver docs/ROADMAP.md y docs/COLABORACION.md). Sin archivos de test: verificación manual |
| 2.0 | 2026-10-01 | Equipo | KR4 y KR5 llevan la nota ⁽²⁾: con la decisión de no tener archivos de test no se cumplen tal como están escritos, y se documenta qué los reemplaza (módulo puro del dominio, `npm run calc:kr1` con 28 comprobaciones, verificación manual por change). La alternativa de cálculo en el cliente deja de mencionar pruebas unitarias |
| 1.9 | 2026-09-29 | Equipo | Se resuelve la gestión de estado en Flutter: `ChangeNotifier` + `ListenableBuilder`, sin Riverpod ni `provider` (ninguna de las dos personas usó Riverpod, condición de §9). Dependencias inyectadas por constructor desde una raíz de composición. Change `scaffold-frontend` (RRG-41) |
