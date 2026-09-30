# accounts Specification

## Purpose
Lets plan members declare the accounts where the plan's money lives, with an opening balance and a
balance derived from facts, and retire an account by archiving it (restorable), never deleting it.

## Requirements

### Requirement: Create an account
The API SHALL let an owner or editor create an account with `POST /plans/{planId}/accounts`,
sending `name` (1 to 60 characters after trimming), `type` (`bank`, `digitalWallet` or `cash`) and
`openingBalanceMinor` (an integer in the plan currency's minor units, which MAY be zero or
negative). The response SHALL be `201` with the account.

#### Scenario: New wallet account
- **WHEN** Sofía creates "Mercado Pago", type `digitalWallet`, opening balance 50.000 in her ARS plan
- **THEN** the API responds `201` with the account, `balanceMinor: 50000` and `archived: false`

#### Scenario: Invalid account
- **WHEN** a member sends type `credit` or an opening balance of 10.5
- **THEN** the API responds `400` with a validation error and creates nothing

### Requirement: Derived account balance
An account's `balanceMinor` SHALL be derived on every read as its opening balance plus the signed
amounts of its transactions (income and incoming transfers add, expenses and outgoing transfers
subtract). It SHALL never be stored. Until transactions exist, the balance equals the opening
balance.

#### Scenario: Balance of a new account
- **WHEN** an account is created with opening balance 300.000 and has no transactions
- **THEN** its `balanceMinor` is 300.000

#### Scenario: Opening balance edited
- **WHEN** the opening balance of an account with no transactions is changed from 300.000 to 320.000
- **THEN** its `balanceMinor` becomes 320.000

### Requirement: List accounts
`GET /plans/{planId}/accounts` SHALL return the plan's active (not archived) accounts ordered by
creation, and with `archived=true` the archived ones ordered by archive instant, most recent
first. Each account SHALL carry id, name, type, opening balance, derived balance, `archived`, the
archive instant (present only when archived) and the creation instant.

#### Scenario: Active list
- **WHEN** the plan has Banco Nación, Mercado Pago, Efectivo and an archived Brubank
- **THEN** the default list returns the first three and not Brubank

#### Scenario: Archived list
- **WHEN** the same plan is listed with `archived=true`
- **THEN** only Brubank is returned, with its archive instant

### Requirement: Account detail
`GET /plans/{planId}/accounts/{accountId}` SHALL return the account plus the money that entered
and left it in a given month (`month` query parameter, `YYYY-MM`, default the current month in
the plan's time zone). An account of another plan, or one that does not exist, SHALL respond `404`.

#### Scenario: Detail of an account
- **WHEN** a member requests Banco Nación for 2026-09
- **THEN** the API responds `200` with the account, `month: 2026-09`, `inflowMinor` and `outflowMinor`

#### Scenario: Account from another plan
- **WHEN** a member requests an account id that belongs to a different plan
- **THEN** the API responds `404`

### Requirement: Edit an account
An owner or editor SHALL be able to change an account's name, type and opening balance with
`PATCH /plans/{planId}/accounts/{accountId}`; only the fields sent change. The balance SHALL be
re-derived with the new opening balance.

#### Scenario: Rename
- **WHEN** an editor renames "Banco Nación" to "Nación sueldo"
- **THEN** the API responds `200` with the new name and the same balance

### Requirement: Archive instead of delete
An account SHALL never be deleted. An owner or editor SHALL be able to archive it with
`POST /plans/{planId}/accounts/{accountId}/archive`: it keeps its data and history, stops counting
in the plan's total balance and in the budget calculation, and stops being offered for new
entries. Archiving an archived account SHALL respond `409`.

#### Scenario: Archive
- **WHEN** Banco Nación is archived
- **THEN** it no longer appears in the default list, it appears with `archived: true` and its archive instant in the archived list, and the plan's total balance no longer includes it

#### Scenario: No delete endpoint
- **WHEN** a client sends `DELETE /plans/{planId}/accounts/{accountId}`
- **THEN** the API does not delete the account

### Requirement: Restore an archived account
An owner or editor SHALL be able to restore an archived account with
`POST /plans/{planId}/accounts/{accountId}/restore`, which makes it count again in the total
balance and offered for new entries. Restoring an active account SHALL respond `409`.

#### Scenario: Restore
- **WHEN** Brubank is restored
- **THEN** it appears again in the default list and in the total balance

### Requirement: Accounts screen
Screen 13 Cuentas SHALL show the `JoinedCard` with the total balance of active accounts, their
count and a lavender "+" (→ 28), the note "Esto es lo que tenés, no lo que podés gastar. Lo
gastable está en tus sobres.", one `AccountRow` per active account (icon by type, name, type
label, balance, percentage of the total and a proportional chartreuse stripe bar) and, when there
are archived accounts, a muted row "Archivadas · N" (→ 51). Tapping a row SHALL open 14.

#### Scenario: Canonical accounts
- **WHEN** the plan has Banco Nación $ 842.300, Mercado Pago $ 121.200 and Efectivo $ 36.500
- **THEN** 13 shows "$ 1.000.000 Saldo total", "3 Cuentas" and the rows at 84 %, 12 % and 4 % of the total

#### Scenario: No accounts
- **WHEN** the plan has no active accounts
- **THEN** 13 shows "Todavía no tenés cuentas" with an "Agregar cuenta" button (→ 28)

### Requirement: Account detail screen
Screen 14 Detalle de cuenta SHALL show the account name in the entity title size, its type and
opening balance ("Cuenta sueldo · saldo inicial $ 300.000" style subtitle), the balance in
`display` size, a `JoinedCard` with the money that entered and left in the current month, and its
transactions grouped by day, newest first, or "Todavía no hay movimientos" when there are none.
The top bar SHALL offer "Transferir" (→ 29) and the pencil (→ 42).

#### Scenario: Account without movements
- **WHEN** the user opens an account that has no transactions
- **THEN** 14 shows its balance, "Entró" and "Salió" at $ 0, and "Todavía no hay movimientos"

### Requirement: New and edit account screens
Screen 28 Nueva cuenta SHALL let the user set the name (`FieldRow` with chevron), the type with
three chips (Banco, Billetera virtual, Efectivo; the chosen one in lavender) and the opening balance
in the `AmountCapsule` with the plan's currency symbol, and confirm with the `SaveBar` "Crear
cuenta". Screen 42 Editar cuenta SHALL show the same form prefilled, confirm with "Guardar cambios",
and offer the archive action as a red `IconButton` in the top bar (→ 48).

#### Scenario: Create from 13
- **WHEN** the user fills "Mercado Pago", Billetera virtual, 50.000 and confirms
- **THEN** the account is created, a "Guardado" confirmation shows and 13 lists it

#### Scenario: Name required
- **WHEN** the user confirms with an empty name
- **THEN** the account is not created and the name field shows the error

### Requirement: Archive confirmation and archived accounts screens
Screen 48 Archivar cuenta SHALL be a confirmation sheet "¿Archivar "<name>"?" showing the account,
the note "Deja de sumar al saldo total. Sus movimientos se conservan." and the buttons Cancelar
and Archivar (solid `danger`). Screen 51 Cuentas archivadas SHALL list archived accounts with
their type, archive date and balance, the note "No suman al saldo total. Sus movimientos se
conservan.", and a lavender "Restaurar" chip per account that restores it in place and shows the
toast "Cuenta restaurada".

#### Scenario: Archive from 42
- **WHEN** the user taps the archive icon in 42 and then Archivar
- **THEN** the account is archived and 13 opens without it, with "Archivadas · 1"

#### Scenario: Cancel archive
- **WHEN** the user taps Cancelar in 48
- **THEN** nothing changes and 42 is shown again

#### Scenario: Restore from 51
- **WHEN** the user taps Restaurar on Brubank
- **THEN** Brubank leaves 51, the toast "Cuenta restaurada" appears and 13 counts it again

### Requirement: Account picker
Screen 37 Elegir cuenta SHALL be a bottom sheet titled "Elegí una cuenta" with a close button, a
search field that filters by name in place, and the active accounts with their balance and share
of the total; the current account is marked with a lavender check and the others with an empty
radio. Tapping a row SHALL select it and close the sheet. Archived accounts SHALL NOT be offered.

#### Scenario: Pick another account
- **WHEN** the sheet is opened with Banco Nación selected and the user taps Mercado Pago
- **THEN** the sheet closes returning Mercado Pago

#### Scenario: Search
- **WHEN** the user types "efe"
- **THEN** only Efectivo remains in the list

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
