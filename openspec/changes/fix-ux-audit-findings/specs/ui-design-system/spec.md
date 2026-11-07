## ADDED Requirements

### Requirement: SaveBar placement
`SaveBar` SHALL place itself: centered horizontally in its parent, with the same width on every
screen, and every screen that shows it SHALL keep it fully visible above the system gesture area,
never clipped by the bottom edge and never scrolled out of reach by the content of a form. In a form
taller than the screen, the content SHALL scroll and the `SaveBar` SHALL stay pinned below it with a
bottom inset of at least 16 dp plus the device's bottom safe area. The swipe-to-confirm interaction,
its handle and its end check are unchanged.

#### Scenario: Same position on every screen
- **WHEN** the `SaveBar` is shown on 07, 20, 24 and 31 on the same device
- **THEN** it has the same width and the same horizontal position on all four

#### Scenario: Long form
- **WHEN** 31 shows its Foto row and the "Fecha límite" row and the content is taller than the screen
- **THEN** the content scrolls above the `SaveBar`, which stays visible at the bottom without being cut

#### Scenario: Gesture area
- **WHEN** the device has a bottom gesture bar
- **THEN** the `SaveBar` sits above it with its full 68 dp height visible

### Requirement: Accessible names of icon-only controls
A control that shows only an icon SHALL expose an accessible name that says its action, and two
controls with different actions SHALL NOT share a name. The leading button of the `SaveBar` SHALL take
its name from the screen that uses it: "Calculadora" where it opens the calculator keypad and "Dividir
pago" where it opens the split screen.

#### Scenario: Split button
- **WHEN** a screen reader focuses the leading button of the `SaveBar` on 07 in Gasto mode
- **THEN** it announces "Dividir pago"

#### Scenario: Calculator button
- **WHEN** a screen reader focuses the leading button of the `SaveBar` on 20 or on 09
- **THEN** it announces "Calculadora"

### Requirement: Chip rows that scroll end visibly
A row of chips that scrolls sideways SHALL end with 20 dp of trailing padding after its last chip and
SHALL fade its right edge while more chips are out of view, so a chip cut by the screen edge reads as
"more to scroll", not as a clipping defect. The chips keep their heights (44 or 34) and their 48 dp
hit area.

#### Scenario: More chips than fit
- **WHEN** the row has four chips and the fourth does not fit
- **THEN** the right edge fades, and scrolling to the end shows the last chip fully with 20 dp after it

#### Scenario: All chips fit
- **WHEN** every chip fits in the width
- **THEN** the row shows no fade

### Requirement: Goal card legibility over photos
On a `GoalCard` with a photo, the glass panel and its two text lines SHALL stay legible over any
photo: the panel SHALL be dark enough that its white title and subtitle keep a contrast of at least
4.5:1 even when the photo behind it is white, and the amount and percent over the progress line SHALL
sit on the scrim. A name that does not fit SHALL end with an ellipsis and the
accessible name SHALL still carry the whole name.

#### Scenario: Bright photo
- **WHEN** the goal's photo is bright at the bottom (water, sky or snow)
- **THEN** the amount, the percent, the title and the subtitle remain readable

#### Scenario: Long name
- **WHEN** the goal is named "Viaje a Bariloche con la familia"
- **THEN** the title ends with an ellipsis and a screen reader reads the whole name

### Requirement: Tab lists end above the navigation
The scrollable lists of the tab screens (01, 02, 10, 13, 17) SHALL end with a fade of about 24 dp
above the `NavCluster` and SHALL leave enough bottom space for their last row to be scrolled fully
clear of the fade.

#### Scenario: Last row
- **WHEN** the user scrolls a tab list to its end
- **THEN** the last row is fully visible above the nav, not cut by a hard edge

### Requirement: Text scaling
Text SHALL follow the system text size. Fixed-height rows SHALL grow with their text (a minimum
height, not a fixed one), and a figure that could outgrow its column (the three figures of 22, the
amounts of the joined card, the quick amounts) SHALL scale down to fit on one line instead of
overflowing or wrapping. At a text scale of 1.3 and of 2.0, screens 01, 22, 24 and 31 SHALL show no
clipped text, no overflow stripe and a reachable `SaveBar`.

#### Scenario: Large text on 22
- **WHEN** the text scale is 2.0 and an envelope shows six-digit figures on 22
- **THEN** Asignado, Disponible and Gastado stay on one line each, none overflows and the screen scrolls

#### Scenario: Large text on a form
- **WHEN** the text scale is 2.0 on 31
- **THEN** every field is readable, the content scrolls and the `SaveBar` stays reachable
