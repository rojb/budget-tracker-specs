# Join a plan by code or QR (no email)

## Objective
Replace email invitations with a generated join code and its QR. The other person types the code or scans the QR to join the plan as a member.

## Why
The user decided that this version sends no emails.

## Scope
- PRD.md:
  - FR-27 says invitations use a generated code and QR with a role and an expiry.
  - Email delivery is added to Won't Have.
  - Revision History gets an entry.
  - Mentions of an email invitation elsewhere are reworded.
- 16 Planes y miembros: the "Invitar por email" field and send button become an "Invitar con código" action.
- 21 Invitar miembro, redesigned:
  - role chips (Editor / Lector);
  - a large code like `K7M-4QX` with copy;
  - its QR;
  - "Vence en 24 h" and "Generar otro código";
  - a "Compartir" action;
  - a note saying the code works once.
- NEW 30 Unirse a un plan, for the person joining:
  - a code field (typed, partially filled);
  - a "Escanear QR" option with a camera frame;
  - an error state ("Código vencido o inválido");
  - a "Unirme" primary action.
- Flow F2: 16 → 20 → 21 → 30. PRD-ux-spec.md §9 is updated.

## Constraints
- The screens are edited in design/app.base.op. design/build-components.js generates design/app.op.
- The OpenPencil 0.8.4 rules are listed in odd/tasks/component-library.md.
- Z-order: children[0] is drawn on top, at page level too.
- The QR is one path node whose box equals its bbox (finder squares at the corners guarantee that).

## Checks
- Headless render and a PrintWindow capture of the GUI window.
- TDD: not applicable.
- Git: not initialized.

## Tasks
- [x] T1 PRD + UX spec wording. Route: delegated writer.
- [x] T2 Screens 16, 21 and new 30, plus the F2 update in the build. Route: same writer.
- [x] T3 Verify. Route: writer plus a parent spot check.

## Progress / evidence
- Writer:
  - PRD: FR-27 rewritten; FR-39 (no email sending) added to Won't Have and §8; revision 1.1.
  - 16: "Invitar con código" button.
  - 21: redesigned with the code K7M-4QX and a 25x25 QR path.
  - New 30 "Unirse a un plan": code field with an error state, plus a QR scan preview.
  - F2 = 16 → 20 → 21 → 30; PRD-ux-spec §9 updated.
- Parent spot check: on 21 the "Código activo" row was clipped at the bottom, although the writer reported no clipping. Fixed by shrinking the QR from 200 to 160; verified with a bottom crop. Renders and F2 band refreshed; GUI title OK.

## Next step
User review.
