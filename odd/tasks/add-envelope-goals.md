# add-envelope-goals (RRG-52)

## Objective
FR-19 envelope goals (monthly amount, or amount by a date), FR-20 derived states
(Funded/Underfunded/Overspent), FR-24 envelope detail, FR-25 move money between envelopes within a
month, FR-41 goal photo (upload, change, remove; server-side resize). Screens 22 Detalle de sobre,
23 Editar sobre, 05 Detalle de meta, 40 Opciones de meta, 50 Foto de la meta, 24 Mover dinero, and the
goals carousel on 01 Inicio.

## Constraints / integration points
- FR-20 states feed RRG-51 (nathaliascode) filter chips FR-21 and the EnvelopeRow variants already in
  packages/ui — compute states server-side from goal + calc engine values; one definition only.
- FR-25 move money reuses the assignment facts of the budget module (nathaliascode): moving X from A to
  B in month M = assignment(A,M) −X and assignment(B,M) +X, atomically; RTA unchanged.
- Screen 01 Inicio: this change owns the goals carousel (GoalCard → 05, "+ Nueva meta" → 31 with group
  Metas preselected). Other 01 parts (JoinedCard "+" → 03 is RRG-51, Reportes → 17 is RRG-54, avatar →
  39) — check what exists; build only the goals part and leave clear placeholders/disabled affordances.
- Replace the temporary "long-press on 02 row → 43" with the real 02 row → 22 detail, and 22 → 23 edit
  (keep delete reachable from 23 per nav map).
- Goal photo (PRD §9): local disk storage under a configurable dir (gitignored), multipart upload
  ≤ 5 MB, JPEG/PNG/WebP only (validate magic bytes, not just mime), resize server-side, served only to
  plan members (authenticated), suggested photo set from design/photos. No photo → lavender tint + icon.
- Progress indicator (chartreuse stripes / dots) per UX spec §7 Forma.
- AuthZ: members read; editors/owners write; 404 non-member, 403 viewer.
- Contract first; bump back `.contract-ref`; regenerate api_client. Nested repo layout.
- adb safety: bring target app to foreground + screenshot before every input burst.
- Never tick a verification task with caveats. No test files. Local Android builds need temporary
  `kotlin.incremental=false` (revert).

## Tasks
- [x] T1 Specs: specs → design → tasks, one commit per phase (delegated writer)
- [x] T2 Contract + back + client + front, one commit per task
- [x] T3 Verify (lint/build/analyze, drift, live API matrix, upload security, device flows vs design)
- [ ] T4 Review gate; merge (specs first); archive; CI; Linear Done; handoff to nathaliascode

## Progress
- RRG-52 In Progress. Dependencies RRG-47/49 merged.
- Specs 4add2c8 specs, 88bc6c1 design, 7d2a89c tasks, b14ca0b openapi, f50a47e design align, 3034f63 ticked, 8d5d30f reopen (01/05/lock), 37cf285 re-tick, d6d8c2a device verification. Back a5dba73..4151240 + 8d2c664 + 627620b (FOR UPDATE NOWAIT). Front f049f3d..015c29f + fixes (b0b7cca scrim, ac7038d/60bbe5b/fc00ab2 home).
- Evidence: states matrix, move money (20 concurrent: 12 ok / 8 409), photo security (413/415/401/404/403, resize 1080 JPEG, old file removed), drift 0, Swagger; device by writer + manual by Ruben (23 trash -> 43, gallery + camera, on dev52@t.com). Parent reviewed side-01/05/01b/05b.
- Decisions: move > available -> 409; carousel = goals with date; goal/photo columns on envelopes; 05 "Asignar a esta meta" disabled until RRG-51; 01 + and Reportes disabled until RRG-51/RRG-54.
- Incidents: writer adb input strayed again (Chrome/YouTube/music app force-stopped). Decision: remaining device checks done manually by user; user photo deleted from disk after verification.
