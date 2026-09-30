# Spec Delta

## MODIFIED Requirements

### Requirement: Derived account balance
An account's `balanceMinor` SHALL be derived on every read as its opening balance plus the signed
amounts of its transactions (income and incoming transfers add, expenses and outgoing transfers
subtract). It SHALL never be stored.

#### Scenario: Balance of a new account
- **WHEN** an account is created with opening balance 300.000 and has no transactions
- **THEN** its `balanceMinor` is 300.000

#### Scenario: Opening balance edited
- **WHEN** the opening balance of an account with no transactions is changed from 300.000 to 320.000
- **THEN** its `balanceMinor` becomes 320.000

#### Scenario: Balance with transactions
- **WHEN** an account opened with 300.000 receives an income of 850.000 and an expense of 18.450
- **THEN** its `balanceMinor` is 1.131.550

### Requirement: Transfers in balances and monthly flows
Account balances SHALL include transfers (incoming add, outgoing subtract) and transactions (income
adds, expenses subtract), and an account's monthly "entered" and "left" figures SHALL include the
transfers and the transactions of that month in the plan's time zone. In the budget calculation, a
transfer between two active accounts SHALL change no total; a transfer involving an archived
account SHALL count only on the active side.

#### Scenario: Monthly flows
- **WHEN** Banco Nación sends 20.000 to Mercado Pago on 2026-09-29
- **THEN** Banco Nación's September "left" includes 20.000 and Mercado Pago's September "entered" includes 20.000

#### Scenario: Flows with transactions
- **WHEN** Banco Nación records an income of 850.000 and an expense of 18.450 in 2026-09
- **THEN** its September "entered" includes 850.000 and its "left" includes 18.450

### Requirement: Transfers in the account detail
Screen 14 SHALL list the account's transactions and transfers together among its movements, newest
first, grouped by day ("Hoy · martes 29", "Ayer · lunes 28", then "Sábado 26"). A transfer SHALL
be a `TxRow` with the transfer icon, "Transferencia a <account>" or "Transferencia de <account>",
the time, and the amount with a `−` for money that left; tapping one SHALL offer to delete it after
confirmation. A transaction SHALL be a `TxRow` as in screen 10, without its account caption;
opening it belongs to `add-transaction-editing-and-filters`.

#### Scenario: Transfer row
- **WHEN** Banco Nación sent 20.000 to Mercado Pago today at 15:04
- **THEN** Banco Nación's 14 shows under "Hoy · <weekday> <day>" a row "Transferencia a Mercado Pago · 15:04" with "−$ 20.000"

#### Scenario: Transactions and transfers interleaved
- **WHEN** Banco Nación has an expense at 18:10 and a transfer at 15:04 today
- **THEN** 14 lists the expense first and the transfer below it, under the same "Hoy" header
