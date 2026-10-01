## MODIFIED Requirements

### Requirement: Archive confirmation and archived accounts screens
Screen 48 Archivar cuenta SHALL be a confirmation sheet "¿Archivar "<name>"?" showing the account,
the note "Deja de sumar al saldo total. Sus movimientos se conservan." and the buttons Cancelar
and Archivar (solid `danger`). Screen 51 Cuentas archivadas SHALL list archived accounts with
their type, archive date and balance, the note "No suman al saldo total. Sus movimientos se
conservan.", a lavender "Restaurar" chip per account that restores it in place and shows the
toast "Cuenta restaurada", and under each account a "Ver movimientos" link that opens 10
filtered by that account.

#### Scenario: Archive from 42
- **WHEN** the user taps the archive icon in 42 and then Archivar
- **THEN** the account is archived and 13 opens without it, with "Archivadas · 1"

#### Scenario: Cancel archive
- **WHEN** the user taps Cancelar in 48
- **THEN** nothing changes and 42 is shown again

#### Scenario: Restore from 51
- **WHEN** the user taps Restaurar on Brubank
- **THEN** Brubank leaves 51, the toast "Cuenta restaurada" appears and 13 counts it again

#### Scenario: View the movements of an archived account
- **WHEN** the user taps "Ver movimientos" under Brubank in 51
- **THEN** 10 opens with the account filter chip "Brubank" and lists only that account's movements

### Requirement: List and delete transfers
`GET /plans/{planId}/transfers` SHALL return the plan's transfers newest first by registration
instant (`createdAt`, ties by id), paginated, and with `accountId` only those that leave or enter
that account. An owner or editor SHALL be able to delete
a transfer with `DELETE /plans/{planId}/transfers/{transferId}` (`204`), which restores both
balances. A viewer SHALL receive `403` when creating or deleting.

#### Scenario: Transfers of an account
- **WHEN** the plan has a transfer Banco Nación → Mercado Pago and another Mercado Pago → Efectivo, and the list is requested with Mercado Pago's id
- **THEN** both transfers are returned

#### Scenario: Delete a transfer
- **WHEN** the 20.000 transfer is deleted
- **THEN** Banco Nación is back at 842.300 and Mercado Pago at 121.200

#### Scenario: Backdated transfer recorded last
- **WHEN** a transfer dated three days ago is recorded after another dated today
- **THEN** the list returns the backdated one first

### Requirement: Transfers in the account detail
Screen 14 SHALL list the account's transactions and transfers together among its movements, newest
first by registration instant, grouped by the day they were registered ("Hoy · martes 29", "Ayer ·
lunes 28", then "Sábado 26"). A transfer SHALL
be a `TxRow` with the transfer icon, "Transferencia a <account>" or "Transferencia de <account>",
the time, and the amount with a `−` for money that left; when the day of its own date differs from
the day it was registered, the time SHALL be preceded by that date ("dom 27, 09:12"). A title that
does not fit on one line SHALL continue on a second line instead of being cut. Tapping a transfer
SHALL offer to delete it after
confirmation. A transaction SHALL be a `TxRow` as in screen 10 but with, under the amount instead of the account, the group of its envelope ("Día a día") or, for a split, the names of its envelopes joined with " + " ("Farmacia + Súper"); tapping one SHALL open screen 12 Editar movimiento (capability `transactions`), and a transaction that was deleted is not listed.

#### Scenario: Transfer row
- **WHEN** Banco Nación sent 20.000 to Mercado Pago today at 15:04
- **THEN** Banco Nación's 14 shows under "Hoy · <weekday> <day>" a row "Transferencia a Mercado Pago · 15:04" with "−$ 20.000"

#### Scenario: Transactions and transfers interleaved
- **WHEN** Banco Nación has an expense registered at 18:10 and a transfer registered at 15:04 today
- **THEN** 14 lists the expense first and the transfer below it, under the same "Hoy" header

#### Scenario: Backdated movement
- **WHEN** an expense dated three days ago is recorded today on Banco Nación
- **THEN** 14 lists it first under "Hoy" with its own date before the time in the subtitle

#### Scenario: Long transfer title
- **WHEN** the other account's name makes "Transferencia a <account>" wider than the row
- **THEN** the title continues on a second line and no part of the name is replaced by an ellipsis

#### Scenario: Open a transaction from the account
- **WHEN** the user taps the expense row in 14
- **THEN** screen 12 opens with that movement and, after saving, 14 shows the updated row
