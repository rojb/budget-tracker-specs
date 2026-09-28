# Component library for the v3 design

## Objective
Add a component sheet with variants to `design/app.op` and use those components in the 18 existing screens.

## Problem / why
The screens repeat the same pieces (buttons, chips, nav cluster, rows, cards) as copied subtrees. When a detail changes, each screen has to be edited by hand, and there is no clear inventory to hand off to Flutter.

## Scope
- New page `Componentes` with reusable masters, grouped by component, one master per variant, plus labels.
- Replace the repeated subtrees in the 18 screens with `ref` instances and `descendants` overrides.
- Keep the screens visually the same, apart from small consistency fixes.
- Out of scope: new screens, visual redesign, Flutter code.

## Constraints (verified in OpenPencil 0.8.4)
- Master: `frame` with `"reusable": true`. Instance: `{"type":"ref","ref":"<masterId>","descendants":{...}}`.
- `descendants[<childId>]` overrides work for `content`, `fill`, `fontSize`, `iconFontName`, `visible:false`, and numeric `width`/`height`.
- `descendants[<masterRootId>]` overrides the instance root (fill and numeric width). `width:"fill_container"` on an instance overflows the parent's padding, so avoid it and use numeric widths.
- Properties set directly on the ref (`width`, `fill`, `overrides`) are dropped.
- Refs can reference masters on another page. The desktop GUI opens files that contain refs.
- Image *fills* break the GUI; photos must remain image nodes.
- Node ids must be unique across the document.

## Checks
- TDD: not applicable (design artifact, no test runner).
- Functional: render every page with the headless server (`op start --headless --file ... --port N` + `export-frames` per page) and compare it against `design/screens/`; open `design/app.op` in the desktop GUI and confirm the title `app.op - OpenPencil`.
- Git: the repo is not initialized yet (the public/private decision is pending), so no work-unit commits are possible. This is recorded as pending.

## Tasks
- [x] T1 Inventory the repeated patterns across the 18 screens → list of components and variants. Route: delegated (the file is about 1 MB with 2961 nodes).
- [x] T2 Build the `Componentes` page with its masters and variants through a reproducible script `design/build-components.js`. Route: delegated writer (same worker).
- [x] T3 Replace the screen subtrees with instances. Route: delegated writer (same worker).
- [x] T4 Verify the exports of every page plus the GUI open. Route: writer self-check plus a parent spot check.
- [x] T5 Add the component inventory to `PRD-ux-spec.md` and update the Engram design-system memory. Route: inline.

- [x] T6 Components page renders empty in the GUI: masters nested inside wrapper frames are not drawn. Move every master to top level at its sheet position and override the root position on each instance with descendants[rootId] {x:0,y:0} (verified in probe wrap3.op). Route: delegated writer.
- [x] T7 Raise coverage. 17 masters were unused (IconButton ×6, Chip ×3, AmountCapsule, Toggle ×2, TextField/Focus, Key ×3, Avatar). Wrap refs that sit in horizontal or justified rows in a plain frame with a fixed numeric size, which was verified in rows using space_between, gap, end, center and after a fill sibling. Route: same writer.
- [x] T8 Verify the GUI: the live canvas must show the masters on the Componentes page, and all 18 screens must match their baselines. Route: writer plus a parent spot check.

- [x] T9 Apply the user-requested shapes, after T6–T8 finish. Use design/shapes.js blobPath (verified in probe blob2.op):
  - BalanceCard (JoinedCard): one white joined-blob path.
  - AmountCapsule: a lavender joined blob, round "$" lobe + long amount lobe.
  - NavCluster: circles on a glassmorphism tray (fill #FFFFFF59, 1px #FFFFFF99 stroke, background_blur 24) with necks between the circles.
  - Constraint: in layout:none frames children[0] renders on top, so the path goes LAST.
  - Route: inline or a delegated writer, depending on the size of the T6 script.

## Progress / evidence
- Backup before changes: scratchpad `app-before-components.op`.
- The writer built 40 masters in 18 groups and placed 73 refs; the build reports 0 duplicate ids and 0 dangling refs.
- Parent spot check round 1 found regressions on screen 02: envelope amounts overflowed and the nav was missing. The writer fixed them with a numeric width override and a wrapper with a pinned height. Screen 11 (clipped buttons) was fixed too.
- Parent spot check round 2 found the nav rendered off-centre, because refs ignore the wrapper padding. Fixed by making the NavCluster masters 390 wide with justifyContent center. Screens 02 and 10 now match their baselines.
- Headless export 18/18 OK; design/screens/ updated; GUI title "app.op - OpenPencil".
- Pending: the 00-componentes.png composite predates the width change to the NavCluster masters. No git commits yet (repo not initialized).

- T6–T8 (writer): all masters are top-level, and every ref carries the root {x:0,y:0} override. Refs went from 73 to 164. Still unused: AmountCapsule (planned in T9) and IconButton/Danger (it has no standalone occurrence).
- Parent found that the photos covered screens 01/05/18: inject-photos.js had put the photo first, and children[0] is drawn on top. Fixed the order in the script and in the backup, rebuilt, and screens 01 and 05 were verified.
- T9 delegated.

- T9 (writer) added the BalanceCard/Default master (5 instances) and the AmountCapsule joined blob (4 instances), and put a glass tray on the NavCluster.
- The parent found three regressions in T9 and fixed them:
  - the card lobes overlapped, so the waist barely showed; lobes now 0–214 and 222–350;
  - the capsule was pinned to the left, because a bare ref ignores centering; it is now in a fixed-size wrapper;
  - the tray was stretched to 390 wide, because paths stretch to their node box; the tray box now matches the lobes span.
- The parent also added a soft shadow to the tray and kept the right content of the card at its original geometry.
- Verified on screens 01, 07, 10 and 13; all 18 exported; GUI title OK.
- Known: in the headless renderer the "1" and "," keypad glyphs render tiny, even with zero refs involved (writer probe), so this is a renderer quirk.
- Pending: 00-componentes.png cannot be rendered as one page. No git commits (repo not initialized).

- User feedback round:
  - The nav circles must not overlap. NAVCLUSTER_GAP changed from -8 to 8, and the glass tray (#FFFFFF8C, stroke #FFFFFFCC) joins the circles.
  - The "Ver 4 movimientos" button overflowed, because resolveWidthForChild counted fit_content siblings as 0. Added estimateFitWidth.
  - Verified on screens 01, 02 and 11; GUI title OK.

- The AmountCapsule "$" now sits on a white 48px Badge circle, like the icon circles on other cards. Verified on screens 03 and 07.

- Contrast pass on the photo screens:
  - 05: dark top scrim in the Overlay gradient, dark glass GlassHeader (#1F223666 + background_blur), subtitle #FFFFFFD9, Panel #1F22364D.
  - 18: stronger bottom scrim on the PhotoHero.
  - New StatusBar/Light variant, picked automatically when the original time text is white. Before this, screen 05 had a dark status bar.
- The base design moved from the scratchpad into the repo as design/app.base.op. Build command: node design/build-components.js design/app.base.op design/app.op.

## Next step
User review.
