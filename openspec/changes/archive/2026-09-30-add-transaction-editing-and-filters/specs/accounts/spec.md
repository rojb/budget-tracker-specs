# Spec Delta

## MODIFIED Requirements

### Requirement: Transfers in the account detail
Screen 14 SHALL list the account's transactions and transfers together among its movements, newest
first, grouped by day ("Hoy · martes 29", "Ayer · lunes 28", then "Sábado 26"). A transfer SHALL
be a `TxRow` with the transfer icon, "Transferencia a <account>" or "Transferencia de <account>",
the time, and the amount with a `−` for money that left; tapping one SHALL offer to delete it after
confirmation. A transaction SHALL be a `TxRow` as in screen 10 but with, under the amount instead of the account, the group of its envelope ("Día a día") or, for a split, the names of its envelopes joined with " + " ("Farmacia + Súper"); tapping one SHALL open screen 12 Editar movimiento (capability `transactions`), and a transaction that was deleted is not listed.

#### Scenario: Transfer row
- **WHEN** Banco Nación sent 20.000 to Mercado Pago today at 15:04
- **THEN** Banco Nación's 14 shows under "Hoy · <weekday> <day>" a row "Transferencia a Mercado Pago · 15:04" with "−$ 20.000"

#### Scenario: Transactions and transfers interleaved
- **WHEN** Banco Nación has an expense at 18:10 and a transfer at 15:04 today
- **THEN** 14 lists the expense first and the transfer below it, under the same "Hoy" header

#### Scenario: Open a transaction from the account
- **WHEN** the user taps the expense row in 14
- **THEN** screen 12 opens with that movement and, after saving, 14 shows the updated row
