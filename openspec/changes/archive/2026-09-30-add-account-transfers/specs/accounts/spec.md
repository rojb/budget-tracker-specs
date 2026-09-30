# Spec Delta

## ADDED Requirements

### Requirement: Transfer between accounts
An owner or editor SHALL be able to move money between two active accounts of the same plan with
`POST /plans/{planId}/transfers`, sending `fromAccountId`, `toAccountId`, `amountMinor` (a positive
integer in the plan currency's minor units) and `occurredAt` (instant with offset). A transfer
SHALL NOT use an envelope or a payee and SHALL NOT count as envelope spending or income; it only
moves balance from one account to the other. The response SHALL be `201` with the transfer.

#### Scenario: Canonical transfer
- **WHEN** Sofía transfers 20.000 from Banco Nación (842.300) to Mercado Pago (121.200)
- **THEN** the API responds `201`, Banco Nación's balance becomes 822.300, Mercado Pago's becomes 141.200, and the plan's total balance and Ready to Assign do not change

#### Scenario: Same account
- **WHEN** a member sends the same account as origin and destination
- **THEN** the API responds `400` and nothing is recorded

#### Scenario: Invalid amount
- **WHEN** a member sends an amount of 0, a negative amount or 10.5
- **THEN** the API responds `400` with a validation error

#### Scenario: Archived or foreign account
- **WHEN** one of the accounts is archived, or belongs to another plan
- **THEN** the API responds `409` for the archived account and `404` for the foreign one, and nothing is recorded

### Requirement: List and delete transfers
`GET /plans/{planId}/transfers` SHALL return the plan's transfers newest first, paginated, and with
`accountId` only those that leave or enter that account. An owner or editor SHALL be able to delete
a transfer with `DELETE /plans/{planId}/transfers/{transferId}` (`204`), which restores both
balances. A viewer SHALL receive `403` when creating or deleting.

#### Scenario: Transfers of an account
- **WHEN** the plan has a transfer Banco Nación → Mercado Pago and another Mercado Pago → Efectivo, and the list is requested with Mercado Pago's id
- **THEN** both transfers are returned

#### Scenario: Delete a transfer
- **WHEN** the 20.000 transfer is deleted
- **THEN** Banco Nación is back at 842.300 and Mercado Pago at 121.200

### Requirement: Transfers in balances and monthly flows
Account balances SHALL include transfers (incoming add, outgoing subtract) and an account's monthly
"entered" and "left" figures SHALL include the transfers of that month in the plan's time zone. In
the budget calculation, a transfer between two active accounts SHALL change no total; a transfer
involving an archived account SHALL count only on the active side.

#### Scenario: Monthly flows
- **WHEN** Banco Nación sends 20.000 to Mercado Pago on 2026-09-29
- **THEN** Banco Nación's September "left" includes 20.000 and Mercado Pago's September "entered" includes 20.000

### Requirement: Transfer screen
Screen 29 Transferencia SHALL open from "Transferir" in 14 with that account as origin, and show a
close button, "Transferencia", the "Desde" and "Hacia" accounts as account cards with balance and
share (each opens 37 Elegir cuenta, which never offers the other side's account), an arrow between
them, the amount in the `AmountCapsule` with the plan symbol, "Fecha y hora" (default now, opens
38), the note "Una transferencia no usa sobres." and the `SaveBar` "Transferir". Confirming SHALL
record it, show "Transferencia guardada" and return to 14 with the new balance.

#### Scenario: Transfer from 14
- **WHEN** the user opens 29 from Banco Nación, keeps Mercado Pago as destination, enters 20.000 and confirms
- **THEN** 14 shows Banco Nación with the new balance and the transfer in its movements

#### Scenario: Missing amount
- **WHEN** the user confirms with an amount of 0
- **THEN** nothing is saved and the form says "Ingresá un monto mayor a cero"

#### Scenario: Only one account
- **WHEN** the plan has a single active account
- **THEN** 29 explains that a second account is needed and offers "Agregar cuenta" (→ 28)

### Requirement: Date and time picker
Screen 38 Fecha y hora SHALL be a bottom sheet with the current value ("Hoy, 14:32"), a month
calendar with ‹ › navigation where the chosen day is lavender, hour and minute steppers, and
"Listo" to confirm; closing it keeps the previous value.

#### Scenario: Pick yesterday at 09:00
- **WHEN** the user picks yesterday, sets 09:00 and taps "Listo"
- **THEN** the field shows "Ayer, 09:00" and the transfer is recorded at that local instant

### Requirement: Transfers in the account detail
Screen 14 SHALL list the account's transfers among its movements, newest first, grouped by day
("Hoy · martes 29", "Ayer · lunes 28", then "Sábado 26"), each as a `TxRow` with the transfer icon,
"Transferencia a <account>" or "Transferencia de <account>", the time, and the amount with a `−`
for money that left. Tapping one SHALL offer to delete it after confirmation.

#### Scenario: Transfer row
- **WHEN** Banco Nación sent 20.000 to Mercado Pago today at 15:04
- **THEN** Banco Nación's 14 shows under "Hoy · <weekday> <day>" a row "Transferencia a Mercado Pago · 15:04" with "−$ 20.000"
