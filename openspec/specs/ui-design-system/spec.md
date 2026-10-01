# ui-design-system Specification

## Purpose
TBD - created by archiving change ui-foundation. Update Purpose after archive.

## Requirements

### Requirement: Design tokens match the UX spec
The `packages/ui` package SHALL expose the color tokens of PRD-ux-spec.md §7 with exactly these
values and no others: `bg` `#F5F5F5`, `surface` `#FFFFFF`, `ink` `#212121`, `ink-muted` `#6B6B6B`,
`lavender` `#CFCAEC`, `chartreuse` `#EAFC5F`, `chartreuse-deep` `#D2E83A`, `danger` `#C62828`,
`warning` `#F5C451`, `glass` `#FFFFFF33`. Surfaces derived from these tokens that the design
renders (soft grey `#EDEDED` for IconButton/Soft, SaveBar and Toggle trays) SHALL be named
constants in the same token file, never inline literals inside widgets.

#### Scenario: Token values
- **WHEN** a developer reads the color token file
- **THEN** every §7 token is present with its exact hex value and no additional brand color is defined

#### Scenario: Widgets use tokens
- **WHEN** a widget in `packages/ui` needs a color
- **THEN** it takes it from the token file or from the theme built from it, not from a hex literal in the widget

### Requirement: Forbidden contrast pairs are never rendered
No component SHALL render white text or icons on `lavender` or `chartreuse`, and no component SHALL
render `chartreuse` as text or icon color on a light background. The permitted pairs are those of
the §7 contrast table: `ink` on `bg`/`surface`/`lavender`/`chartreuse`/`warning`, `ink-muted` on
`bg`, `danger` on `surface`, white on `ink`, white on `danger`.

#### Scenario: Content on lavender and chartreuse
- **WHEN** a component paints its foreground over a `lavender` or `chartreuse` background (Chip Selected, Toggle active segment, Key Operator, Button Primary, Toast Success and Info)
- **THEN** the foreground is `ink`

#### Scenario: Chartreuse on dark
- **WHEN** a component needs a chartreuse foreground (Toast Neutral action text and icon circle)
- **THEN** it sits on `ink`, never on a light background

#### Scenario: Toast on danger
- **WHEN** the Error toast is shown
- **THEN** its title and detail are white on `danger` (5.6 : 1)

### Requirement: Urbanist typography scale
The theme SHALL use the bundled Urbanist font family for all text and SHALL define the §7 scale:
`display` 40 Light 300, `headline` 34 Regular 400, `title` 22 Regular 400, `body` 16 Regular 400,
`body-strong` 16 Medium 500, `caption` 13 Regular 400. The font SHALL be bundled as a package
asset (with its OFL license file) and SHALL NOT be fetched at runtime.

#### Scenario: Scale values
- **WHEN** a developer requests the `display` text style
- **THEN** it is Urbanist, 40 logical pixels, weight 300; the other five styles match the §7 table

#### Scenario: Offline rendering
- **WHEN** the app or Widgetbook renders text without network access
- **THEN** Urbanist still renders because the font files ship inside `packages/ui`

### Requirement: Shape rules
Cards SHALL use radius 28. Circular buttons SHALL be 48 to 56 logical pixels in diameter. Chips,
capsules, fields and buttons that are pills SHALL use a fully rounded radius (half their height).
Photos SHALL use radius 32. Icons SHALL be thin-stroke (Lucide, stroke 1.5 look).

#### Scenario: Pill shapes
- **WHEN** a Chip, Button, TextField, SaveBar, Toggle or Key is rendered
- **THEN** its corner radius equals half of its height

#### Scenario: Icon style
- **WHEN** a component shows an icon
- **THEN** it comes from the Lucide-style thin-stroke icon set chosen in the design, never a filled Material icon, unless the documented fallback applies

### Requirement: Touch targets
Every interactive component SHALL expose a hit area of at least 48 x 48 logical pixels, even when
its visual is smaller.

#### Scenario: Compact chip
- **WHEN** a Chip of height 34 is interactive
- **THEN** its tappable area is at least 48 dp tall without changing its 34 dp visual

#### Scenario: Circular buttons
- **WHEN** an IconButton or a NavCluster tab is rendered
- **THEN** its tappable area is at least 48 x 48

### Requirement: NavCluster
`NavCluster` SHALL render the bottom tab bar as circular buttons for Inicio, Plan, Movimientos and
Cuentas with a chartreuse "+" action of 64 dp between Plan and Movimientos, on a translucent glass
tray. Exactly one tab is active: the active circle is `ink` with a white icon, inactive circles
are white with an `ink` icon.

#### Scenario: Active tab
- **WHEN** the active tab is Plan
- **THEN** the Plan circle is `ink` with a white icon, the other three tabs are white, and the "+" action stays chartreuse

#### Scenario: Tab selection
- **WHEN** the user taps a tab or the "+" action
- **THEN** the component reports it through a callback and holds no navigation logic

### Requirement: IconButton variants
`IconButton` SHALL provide seven variants: White (`surface` bg, `ink` icon), Black (`ink` bg, white
icon), Lavender, Chartreuse, Soft (`#EDEDED` bg), Glass (`glass` bg, white icon) and Danger
(`danger` at 10% alpha bg, `danger` icon). The default size is 52 and sizes 48 to 56 are allowed.

#### Scenario: Every variant renders
- **WHEN** the catalog shows the IconButton component
- **THEN** all seven variants are listed as separate stories with the colors above

#### Scenario: Danger variant
- **WHEN** an IconButton is Danger
- **THEN** it is used as the destructive entry point of §6.1 and its icon is `danger` red

### Requirement: Button variants
`Button` SHALL provide Primary (chartreuse fill, `ink` label 16 Medium, height 56, radius 28,
optional leading icon) and Secondary (`bg` fill, `ink` label 15 Medium, height 52, radius 26,
optional leading icon). Both are full-width pills.

#### Scenario: Primary button
- **WHEN** a Primary button is rendered with label "Guardar" and an icon
- **THEN** it is chartreuse, 56 dp high, with the icon left of the label and `ink` content

#### Scenario: Secondary button
- **WHEN** a Secondary button is rendered with label "Crear sobre vacío"
- **THEN** it is 52 dp high with a `bg` fill

### Requirement: Chip variants and height scale
`Chip` SHALL provide Default (`surface`), Selected (`lavender`) and DefaultIcon (`surface` with a
leading check icon), label 15 Regular, and SHALL support exactly two heights: 44 (default) and 34
(compact preview chips).

#### Scenario: Selected chip
- **WHEN** a Chip is Selected
- **THEN** its fill is `lavender` and its label is `ink`

#### Scenario: Compact chip
- **WHEN** a Chip is created with the compact size
- **THEN** its visual height is 34 and its radius is 17

### Requirement: AmountCapsule
`AmountCapsule` SHALL show a currency symbol in a white circular badge (48 dp inside a 64 dp
lobe) joined to a lavender value lobe showing the amount in `display` Light 40. The symbol SHALL
be overridable; symbols longer than one character (such as "US$") SHALL use a smaller font so they
fit the 48 dp badge.

#### Scenario: Default currency
- **WHEN** the capsule is rendered with symbol "$" and value "0"
- **THEN** the badge shows "$" at 20 and the value lobe shows "0" in display Light

#### Scenario: Multi-character symbol
- **WHEN** the symbol is "US$"
- **THEN** the badge text uses a 14 dp font and stays inside the circle

### Requirement: SaveBar with swipe-to-confirm
`SaveBar` SHALL be a 340 x 68 pill on `#EDEDED` with a black calculator button on the left, a
chartreuse check handle, a label and a white check at the far end. The handle SHALL be draggable
toward the end check and SHALL confirm when released past the confirmation threshold; releasing
before the threshold SHALL return the handle to the start without confirming. Tapping the handle
SHALL also confirm, as the accessible alternative to the drag gesture. Tapping the calculator
button SHALL invoke a separate callback.

#### Scenario: Swipe past threshold
- **WHEN** the user drags the handle to the end check and releases
- **THEN** the confirm callback fires once

#### Scenario: Swipe released early
- **WHEN** the user releases the handle before the threshold
- **THEN** the handle animates back to the start and the confirm callback does not fire

#### Scenario: Tap alternative
- **WHEN** the user taps the handle without dragging
- **THEN** the confirm callback fires once

#### Scenario: Calculator
- **WHEN** the user taps the calculator button
- **THEN** the calculator callback fires and the confirm callback does not

### Requirement: SaveBar disabled state
`SaveBar` SHALL provide a Disabled variant for invalid forms. In Disabled the handle shows a lock
icon on grey instead of the chartreuse check, the label color changes to `ink-muted` and its text
changes to say why (for example "Faltan $ 500"), the end check is drawn at 40% opacity, and neither
swipe nor tap confirms. The state SHALL NOT be distinguishable by color alone.

#### Scenario: Disabled appearance
- **WHEN** the SaveBar is disabled with label "Faltan $ 500"
- **THEN** the handle shows a lock icon, the label is `ink-muted`, and the end check is at 40% opacity

#### Scenario: Disabled interaction
- **WHEN** the user swipes or taps the handle of a disabled SaveBar
- **THEN** the confirm callback does not fire

### Requirement: Toggle
`Toggle` SHALL be a 52 dp high segmented control with two segments (Gasto and Ingreso by
default) on a `#EDEDED` tray. The active segment is filled `lavender` with a Medium label, the
inactive one is transparent with a Regular label.

#### Scenario: Selecting a segment
- **WHEN** the user taps the inactive segment
- **THEN** the change callback reports the new selection and the widget renders the new active segment on the next build

### Requirement: TextField states
`TextField` SHALL be a 60 dp high `surface` pill with a 12 `ink-muted` label above a 16 Medium
value and an optional trailing icon. It SHALL have three states: Default (no border), Focus
(1.5 border `lavender`) and Error (1.5 border `danger`). Focus SHALL be applied when the field has
input focus. Error SHALL also show a message text so the state is not conveyed by color alone.

#### Scenario: Focus state
- **WHEN** the field receives input focus
- **THEN** its border becomes 1.5 dp `lavender`

#### Scenario: Error state
- **WHEN** the field is given an error message
- **THEN** its border is 1.5 dp `danger` and the message is shown below the field

### Requirement: FieldRow
`FieldRow` SHALL show a 14 `ink-muted` label at the start and a 15 Medium value followed by a
chevron-right icon at the end, and SHALL be tappable with a hit area of at least 48 dp.

#### Scenario: Editable value row
- **WHEN** a FieldRow is rendered with label "Campo" and value "Valor"
- **THEN** the chevron is always present at the end, per the §6.1 rule for editable-value rows

### Requirement: Key
`Key` SHALL render calculator keys as pills of height 44: Number (`surface`, 18 text), Operator
(`lavender`, 18 text) and Del (`surface`, backspace icon).

#### Scenario: Operator key
- **WHEN** an Operator key with "+" is rendered
- **THEN** it is lavender with `ink` content

### Requirement: Avatar
`Avatar` SHALL be a 52 dp lavender circle with the person's initials in 17 Medium `ink`.

#### Scenario: Initials
- **WHEN** an Avatar is rendered with initials "SO"
- **THEN** it shows "SO" centered in a lavender circle

### Requirement: Toast
`Toast` SHALL be a 350 x 64 capsule with radius 32 containing an icon circle, a 15 Medium title, a
12 detail and, only in Neutral, a text action. It SHALL provide five variants with distinct
background and icon: Neutral (`ink`, undo icon in a chartreuse circle, chartreuse action), Success
(`chartreuse`, check), Info (`lavender`, info), Warning (`warning`, triangle-alert, `ink` text),
Error (`danger`, x, white text). Only one toast SHALL be visible at a time; showing a new toast
replaces the current one. A toast SHALL auto-dismiss after 4 seconds and SHALL be dismissible by
swiping. It SHALL never block the screen.

#### Scenario: Variant icons differ
- **WHEN** the five variants are shown side by side
- **THEN** each has a different icon, so meaning does not depend on color alone

#### Scenario: Neutral has an action
- **WHEN** the Neutral toast is shown with action "Deshacer"
- **THEN** the action is tappable and reports through a callback; the other four variants show no action

#### Scenario: Auto-dismiss
- **WHEN** a toast is shown and the user does nothing
- **THEN** it disappears after 4 seconds

#### Scenario: Swipe dismiss
- **WHEN** the user swipes the toast horizontally
- **THEN** it is dismissed immediately

#### Scenario: One at a time
- **WHEN** a second toast is shown while the first is visible
- **THEN** the second replaces the first

### Requirement: StatusBar is not a widget
The design's `StatusBar` component SHALL be realized by the operating system status bar. The app
SHALL control its icon brightness through the system UI overlay style (dark icons on light
backgrounds, light icons over photos) and `packages/ui` SHALL NOT draw a fake status bar.

#### Scenario: Light background
- **WHEN** a screen has the `bg` background
- **THEN** the theme sets dark status bar icons

### Requirement: Money formatting
`packages/ui` SHALL provide one pure formatting function for money that every screen uses. It
SHALL take an integer amount in minor units and a currency (`ARS`, `USD` or `EUR`), and return the
es-AR display string: `.` as thousands separator, `,` as decimal separator, the number of decimals
equal to the currency's minor units (ARS 0, USD 2, EUR 2), the currency symbol (`$`, `US$`, `€`)
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

#### Scenario: Negative amount
- **WHEN** formatting `-1250` for USD
- **THEN** the result is `−US$ 12,50`, with the sign before the symbol and no space between sign and symbol

#### Scenario: Zero
- **WHEN** formatting `0` for ARS
- **THEN** the result is `$ 0`

#### Scenario: No floating point
- **WHEN** an amount is formatted
- **THEN** the function takes an integer and does not convert through a double for the decimal part

### Requirement: Presentational package boundary
Widgets in `packages/ui` SHALL be presentational: they receive data and callbacks by constructor,
hold no business logic, and SHALL NOT depend on the app, on any API client or on any feature code.
Widgets SHOULD be `StatelessWidget`; internal `StatefulWidget` is allowed only for local gesture or
focus state (SaveBar drag, TextField focus, Toast timer).

#### Scenario: Dependency direction
- **WHEN** `packages/ui/pubspec.yaml` is inspected
- **THEN** it declares no dependency on the app package or on an API client package

#### Scenario: Catalog coverage
- **WHEN** a component or variant is added to `packages/ui`
- **THEN** a Widgetbook use case for that variant exists in the same change

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
