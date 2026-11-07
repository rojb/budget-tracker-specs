## ADDED Requirements

### Requirement: Chart months without data
In the bar chart of 17, a month of the range without any movement SHALL be drawn as a thin baseline
tick, not as a bar, and its accessible name SHALL say "sin datos" with the month. A month with a
real value of 0 and a month without data SHALL read the same way. The selected month SHALL keep
showing its value above its bar, and every bar SHALL expose its value in its accessible name.

#### Scenario: Months before the first movement
- **WHEN** the range is the last six months and only the last two have movements
- **THEN** the first four months show a baseline tick and the last two show bars proportional to their values

#### Scenario: Screen reader
- **WHEN** a screen reader focuses a month without data
- **THEN** it announces the month followed by "sin datos"

#### Scenario: Selected month
- **WHEN** the user taps a bar
- **THEN** that bar is highlighted with its value above it and the figure of the screen shows that month
