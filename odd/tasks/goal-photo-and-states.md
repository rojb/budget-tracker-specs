# Goal photo, recalculated state, target progress

## Objective
The user approved these changes on 2026-09-28:
1. Show how a goal's photo is set and changed.
2. Move the "Recalculado" toast out of 12 into its own post-save state.
3. Make the progress bar on 22 show target progress, not the spent share.

## Scope
1. **Goal photo:**
   - **40 Opciones de meta:** add a "Cambiar foto" row (image icon) above Editar meta → 50.
   - **NEW 50 Foto de la meta**, a bottom sheet (clone the 43 or 39 sheet pattern):
     - title "Foto de la meta";
     - a current-photo preview: a rounded image node using the existing vacaciones photo; it must stay an IMAGE NODE, never an image fill;
     - rows "Elegir de la galería" (images icon) and "Sacar una foto" (camera icon);
     - "Fotos sugeridas": a 3x2 grid of rounded thumbnails using the existing photos in design/photos (vacaciones, auto, emergencia, mudanza, plus repeats if needed), with vacaciones selected (lavender ring + check);
     - a red text link "Quitar foto" with the note "La tarjeta usa un color en su lugar.";
     - a primary "Listo".
   - Sheet rules: Dimmed tuned so the sheet ends at the bottom; title 24; close 48. See odd/tasks/pattern-consistency.md.
   - **Creating a goal:** document in the UX-spec navigation map that "+ Nueva meta" on 01 opens 31 with the group Metas preselected, and that 31 shows an optional "Foto" row when the group is Metas (→ 50). No screen redraw is needed; if it fits without clipping, add the row to 31.
   - **Without a photo:** document that the goal card falls back to a lavender tint with an icon.
   - **PRD.md:**
     - new **FR-41 — Foto de meta** (Should Have): the user can attach one photo per goal (gallery, camera or a suggested set) and change or remove it. It is stored through the NestJS backend: upload of up to 5 MB, JPEG/PNG/WebP, resized server-side to a fixed width. Without a photo, the card uses a color.
     - §9 Constraints: a note on image storage (local disk or object storage; no CDN is required for the course).
     - Revision History row 1.6.
2. **Recalculated state:**
   - Remove the "Recalculado" toast from 12 Editar movimiento, so 12 is only the form.
   - **NEW 49 Movimientos · recalculado:** a copy of 10 Movimientos as the list after saving the edit, with the dark toast (the same component and copy as the one removed from 12: "Recalculado · Agosto y septiembre actualizados · Deshacer") floating above the nav.
   - Keep 10's numbers per odd/tasks/canonical-dataset.md.
   - Flows: F6b becomes … 12 → 49, and 27 stays. Navigation map: after saving on 12 → 49; after deleting on 27 → 49 with the copy "Movimiento eliminado · Agosto y septiembre actualizados · Deshacer". Document the copy variant; 49 shows the edit variant.
3. **22 Detalle de sobre:** the target row reads "Objetivo mensual" / "$ 180.000 · 100% asignado". The stripes are fully filled, because Supermercado has 180.000 assigned of a 180.000 target. Spent is already shown in the summary. Nothing else changes.
4. **UX spec:** the inventory gets 49 and 50; update the flows (F8 gains 50 after 40; F6b gains 49); update the navigation map. Write it in Spanish.

## Constraints
- Pipeline: design/app.base.op → design/build-components.js → design/app.op.
- OpenPencil rules:
  - children[0] draws on top;
  - image nodes only;
  - photo frames use the [Overlay, image] order;
  - paths stretch to their box;
  - numeric widths for refs.
- The design/photos/*.jpg files can be embedded as data URIs in image `src` (see design/inject-photos.js for the reading code).

## Tasks
- [x] T1 Apply. Route: delegated writer.
- [x] T2 Verify: render, contact sheets, parent spot check.

## Progress / evidence
- Writer added:
  - 40 "Cambiar foto";
  - new sheet 50 Foto de la meta;
  - new screen 49 Movimientos · recalculado (toast), with the toast removed from 12;
  - 22 target row "$ 180.000 · 100% asignado" with full stripes;
  - PRD FR-41 and a §9 storage note (v1.6);
  - UX-spec inventory, flows and navigation map.
- The GUI loads with the new image nodes (title "app.op - OpenPencil").
- Parent spot check fixed 50: the suggested grid repeated the auto and emergencia photos. It now shows 4 unique photos plus a "Más fotos" tile.
- F8 now has 9 screens; left unsplit.
