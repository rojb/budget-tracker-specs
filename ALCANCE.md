# Alcance — Gestor de Plan de Presupuesto (clon de YNAB)

**Asignatura:** Tópicos Avanzados de Programación (TAP) — 2026
**Equipo:** 2 personas (Ruben, nathaliascode), división por feature full-stack — ver
[`docs/ROADMAP.md`](./docs/ROADMAP.md) (asignación) y [`docs/COLABORACION.md`](./docs/COLABORACION.md)
(flujo de trabajo)

> Resumen ejecutivo. El detalle de requisitos, prioridades, métricas y criterios de
> aceptación vive en [`PRD.md`](./PRD.md), que es la fuente de verdad. Este documento no
> repite requisitos: los resume.

---

## Qué es

Aplicación móvil de presupuesto personal por el método de sobres y presupuesto de base
cero. El usuario abre un **plan**, declara sus **cuentas**, y cada mes reparte el dinero
disponible entre **sobres** antes de gastarlo. El sistema mantiene la coherencia
aritmética del plan ante cualquier modificación posterior.

La interfaz es de diseño propio: de YNAB se toma el método, no la apariencia.

---

## Invariante del sistema

```
Available(sobre, mes)  = Assigned(sobre, mes) + Carryover(sobre, mes-1) − Spent(sobre, mes)

ReadyToAssign(mes)     = Σ saldos de cuentas − Σ Available de todos los sobres
```

Ningún valor derivado se persiste: todos se recomputan desde las transacciones y
asignaciones. Es la condición que permite editar o borrar una transacción de un mes
cerrado y que el plan siga cuadrando.

**Regla de sobregiro:** un `Available` positivo se arrastra al mes siguiente. Un
`Available` negativo no se arrastra como sobre negativo: se descuenta del `ReadyToAssign`
del mes siguiente y el sobre parte de cero.

---

## Stack

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | Flutter / Dart, mobile first | Presentación, navegación, estado de UI, cliente HTTP. Cliente delgado, sin lógica de negocio |
| Backend | NestJS / TypeScript | Dominio completo, reglas de presupuesto, autenticación, persistencia. Servidor autoritativo |

Persistencia y gestión de estado: a definir en la fase de diseño.
Aplicación siempre conectada; sin despliegue productivo.

---

## Modelo de dominio

`User` · `Plan` · `PlanMember` · `Account` · `EnvelopeGroup` · `Envelope` · `Payee` ·
`Transaction` · `TransactionSplit` · `BudgetMonth` · `Assignment`

---

## Alcance funcional

**Núcleo, bloqueante de entrega.** Gestión de planes, cuentas, grupos de sobres y sobres,
y **beneficiarios** como entidad administrable. Registro de transacciones con fecha y
**hora**, descripción, monto, beneficiario, sobre, cuenta y dirección del dinero. Ingresos
con destino a `Ready to Assign` o directo a un sobre. División de pagos entre varios
sobres. Asignación mensual y **asignación a meses futuros**. Arrastre y saldado de mes.
Edición y baja de transacciones en cualquier momento con recálculo completo. Navegación
entre meses.

**Alto valor.** Calculadora en el campo de monto. Objetivos por sobre y estados derivados
(`Funded`, `Underfunded`, `Overspent`). Filtros por estado de sobre y filtros de
transacciones por fecha, hora, beneficiario, sobre, cuenta y dirección — estos últimos son la
razón por la que la cátedra exigió la hora. Autocompletado de beneficiario. Detalle de sobre.
Mover dinero entre sobres.

**Complementario.** Reportes, planes compartidos y transferencias entre cuentas. No figuran
en las directrices de la cátedra; se implementan por decisión del equipo.

---

## Fuera de alcance

Conciliación bancaria (excluida explícitamente por la cátedra) · sincronización con
entidades bancarias · funcionamiento sin conexión · cuentas de crédito con sobre de pago ·
múltiples monedas · transacciones programadas · importación y exportación de archivos ·
notificaciones push · aplicación web · despliegue productivo · presupuesto por semana o
quincena.

---

## Convenciones técnicas

- **Dinero:** entero en centavos de punta a punta, incluido el JSON de la API. Sin punto
  flotante para montos.
- **Identificadores:** UUID.
- **Fecha y hora:** instante con zona (`timestamptz`); la atribución a un mes
  presupuestario se resuelve en la zona horaria del plan.
- **Idioma del código:** inglés para identificadores, entidades y endpoints.
- **Metodología:** OpenSpec, sobre repositorio GitHub.
