# Spec Delta

## ADDED Requirements

### Requirement: Goal card
`GoalCard` SHALL be a presentational card of a goal for the carousel of 01. It SHALL provide two
variants. With a photo, the photo fills the card with radius 32 and a scrim keeps the text legible;
without one, the card is filled with `lavender` and shows the goal's icon, never an empty frame.
Both variants SHALL show the saved amount and the percent over a progress line, and a `glass`
panel with the name, a subtitle ("$ 600.000 · diciembre") and an arrow icon. Text over a photo is
white with a soft shadow and text over the lavender tint is `ink`, so no forbidden contrast pair is
rendered. The card receives the image as an image provider and its texts by constructor and holds
no API or navigation logic; the whole card is tappable with a hit area of at least 48 dp.

#### Scenario: With a photo
- **WHEN** a `GoalCard` is built with a photo, "Vacaciones", "$ 360.000", 60 and "$ 600.000 · diciembre"
- **THEN** it draws the photo with radius 32, the saved amount and "60%" over a progress line, and the glass panel with the name and the subtitle in white

#### Scenario: Without a photo
- **WHEN** it is built without a photo
- **THEN** it is filled with `lavender`, shows the goal's icon and its texts are `ink`

#### Scenario: Tap
- **WHEN** the user taps the card
- **THEN** it reports the tap through a callback

### Requirement: Goal progress indicators
`packages/ui` SHALL provide the progress displays of goals following PRD-ux-spec.md §7 "Forma":
chartreuse vertical stripes for what is covered and dots for what is missing (the existing
`StripeBar`), in three presentations: a labeled goal row for 22 ("Objetivo mensual" and its value
over the bar, a red full bar when overspent), a glass summary for 05 (Objetivo, Ya ahorrado and Falta
over the bar, white text on a `glass` panel) and a page indicator for the carousel of 01. The progress
SHALL always be accompanied by text with its value, and an overspent state SHALL use text and red,
never color alone.

#### Scenario: Partial progress
- **WHEN** the goal row is built with a value of 0,6
- **THEN** 60% of the bar is stripes and the rest is dots, with the percent written next to the label

#### Scenario: Overspent
- **WHEN** the goal row is built as overspent
- **THEN** the bar is full and `danger` and the label says "Sobregirado"

#### Scenario: Page indicator
- **WHEN** the indicator is built for 4 pages with the second selected
- **THEN** the second mark is `ink` and wider than the three `ink-muted` ones

### Requirement: Goal screen building blocks
`packages/ui` SHALL provide the pieces that screens 05 and 50 need: a backdrop that fills the screen
with a photo (or the lavender tint and icon) under a scrim, a glass tile (icon, label and a diagonal
arrow, on a `glass` panel, at least 48 dp) and a photo thumbnail for the suggested photos grid with a
selected state (a lavender ring and a check) and a "more" variant. They SHALL be purely
presentational and take images, texts and callbacks by constructor.

#### Scenario: Selected thumbnail
- **WHEN** a thumbnail is selected
- **THEN** it shows a lavender ring and a check, and the others do not

#### Scenario: Glass tile
- **WHEN** a glass tile is built with "Mover dinero"
- **THEN** it shows the icon, the label and the arrow on a `glass` panel and reports taps through a callback

### Requirement: Goal components in the catalog
Every component and variant added for goals (`GoalCard` with and without a photo, the goal row in
its states, the glass summary, the page indicator, the glass tile, the photo thumbnail selected,
unselected and "more") SHALL have its Widgetbook use case in the same change, and the new
components SHALL be flagged for review by the other developer.

#### Scenario: Catalog coverage
- **WHEN** the Widgetbook catalog is opened
- **THEN** each new component and variant above is listed as a separate use case
