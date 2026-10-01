## MODIFIED Requirements

### Requirement: Money formatting
`packages/ui` SHALL provide one pure formatting function for money that every screen uses. It
SHALL take an integer amount in minor units and a currency (`ARS`, `USD`, `EUR` or `BOB`), and return the
es-AR display string: `.` as thousands separator, `,` as decimal separator, the number of decimals
equal to the currency's minor units (ARS 0, USD 2, EUR 2, BOB 2), the currency symbol (`$`, `US$`, `€`, `Bs.`)
followed by a space, and for negative amounts a `−` (U+2212) placed before the symbol.

#### Scenario: ARS has no decimals
- **WHEN** formatting `48200` for ARS
- **THEN** the result is `$ 48.200`

#### Scenario: USD has two decimals
- **WHEN** formatting `125050` for USD
- **THEN** the result is `US$ 1.250,50`

#### Scenario: EUR
- **WHEN** formatting `98000` for EUR
- **THEN** the result is `€ 980,00`

#### Scenario: BOB has two decimals
- **WHEN** formatting `125050` for BOB
- **THEN** the result is `Bs. 1.250,50`

#### Scenario: Negative amount
- **WHEN** formatting `-1250` for USD
- **THEN** the result is `−US$ 12,50`, with the sign before the symbol and no space between sign and symbol

#### Scenario: Negative amount in BOB
- **WHEN** formatting `-1250` for BOB
- **THEN** the result is `−Bs. 12,50`, with the sign before the symbol and no space between sign and symbol

#### Scenario: Zero
- **WHEN** formatting `0` for ARS
- **THEN** the result is `$ 0`

#### Scenario: Zero in BOB
- **WHEN** formatting `0` for BOB
- **THEN** the result is `Bs. 0,00`

#### Scenario: No floating point
- **WHEN** an amount is formatted
- **THEN** the function takes an integer and does not convert through a double for the decimal part
