## MODIFIED Requirements

### Requirement: New movement screen
Screen 07 Nuevo movimiento SHALL open from the "+" of the `NavCluster` and show the `Toggle`
Gasto/Ingreso with a close button, the amount in the `AmountCapsule` with the plan's currency
symbol, the typed expression under the capsule when it has an operation, a card of `FieldRow`s
Beneficiario (→ 26), Sobre (→ 36), Cuenta (→ 37), Fecha y hora (→ 38, default now) and Descripción,
the calculator keypad and the `SaveBar` "Guardar gasto". The account SHALL default to the plan's
first active account. Confirming with the swipe or a tap SHALL record the expense, show the toast
"Movimiento guardado" and return to the previous screen, and the envelope, account and movement
figures SHALL refresh. The toggle SHALL switch to the income mode (09) keeping the amount, payee,
account, date and description. When the payee has no suggested envelope, or the one it suggests no
longer exists, and the user has not chosen an envelope by hand, the Sobre row SHALL take the envelope
of the payee's most recent expense that has a single portion on an existing envelope; a payee
without such an expense, or one created by typing its name, leaves the row as "Elegir". The payee's
own suggested envelope always wins over this fallback, and an envelope chosen by hand is never
replaced. The messages of the form ("Ingresá un monto mayor a cero.", "Elegí un sobre.", "Revisá la
operación." and the API errors) SHALL appear in a slot above the `SaveBar` whose height is reserved,
so the `SaveBar` does not move when a message appears or goes away. The split button of the `SaveBar`
(expense mode) SHALL be announced as "Dividir pago".

#### Scenario: Record an expense
- **WHEN** the user keys 12300 + 6150, picks Coto, Supermercado and Banco Nación and swipes the SaveBar
- **THEN** the expense of 18.450 is recorded, the toast "Movimiento guardado" shows and screen 10 lists it under "Hoy"

#### Scenario: Missing amount
- **WHEN** the user confirms with an amount of 0
- **THEN** nothing is saved and the form says "Ingresá un monto mayor a cero."

#### Scenario: Missing envelope
- **WHEN** the user confirms an expense without an envelope
- **THEN** nothing is saved and the form says "Elegí un sobre."

#### Scenario: Suggested envelope
- **WHEN** the user picks a payee that has a suggested envelope and has not chosen an envelope by hand
- **THEN** the Sobre row takes the suggested envelope

#### Scenario: Envelope of the last expense
- **WHEN** the user picks Coto, which has no suggested envelope but whose latest expense was a single portion on Supermercado, and has not chosen an envelope by hand
- **THEN** the Sobre row takes Supermercado

#### Scenario: Suggestion wins over history
- **WHEN** Coto suggests Hogar and its latest expense was on Supermercado
- **THEN** the Sobre row takes Hogar

#### Scenario: Latest expense was split
- **WHEN** the payee's latest expense was split between two envelopes and it has no suggested envelope
- **THEN** the Sobre row stays "Elegir"

#### Scenario: Envelope chosen by hand
- **WHEN** the user chose Transporte by hand and then picks a payee whose latest expense was on Supermercado
- **THEN** the Sobre row stays Transporte

#### Scenario: Payee without history
- **WHEN** the user creates a payee by typing its name
- **THEN** the Sobre row stays "Elegir"

#### Scenario: Message does not move the bar
- **WHEN** the user confirms with an amount of 0
- **THEN** the message shows in its reserved slot and the `SaveBar` keeps the position it had

#### Scenario: Split button name
- **WHEN** a screen reader focuses the leading button of the `SaveBar` in Gasto mode
- **THEN** it announces "Dividir pago"

#### Scenario: Toggle keeps the draft
- **WHEN** the user keys 850.000 in Gasto and switches the toggle to Ingreso
- **THEN** the screen becomes 09 with the same amount

#### Scenario: Viewer
- **WHEN** a viewer confirms a movement
- **THEN** the app shows that their role is read-only and nothing is saved

#### Scenario: No active account
- **WHEN** the plan has no active account
- **THEN** screen 07 explains that an account is needed and offers "Agregar cuenta" (→ 28)
