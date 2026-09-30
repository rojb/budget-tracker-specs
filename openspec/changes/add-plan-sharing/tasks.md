# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: tag `Sharing`; schemas `InvitationRole`, `Invitation`, `CreateInvitationRequest`, `InvitationPreview`, `UpdateMemberRequest`; parameters `InvitationCode`, `UserId`; the seven operations of design "API surface" with path parameters per operation. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Add the `plan_invitations` migration (unique code, role CHECK, partial unique index for one pending invitation per plan) and entity, plus the code generator/normalizer. Verify migration run/revert/run and that a generated code matches `^[A-HJ-KMNP-Z2-9]{6}$`.
- [ ] 2.2 Add `SharingService` and the owner invitation endpoints (`getInvitation`, `createInvitation` replacing the previous code, `revokeInvitation`) and the preview/accept endpoints (single-use conditional update, 409 already member or plan full, 404 invalid/expired/used/revoked). Verify with curl: generate 201 with link, editor 403, regenerate invalidates the old code, preview with lowercase and without dash, preview has no amounts/emails, accept 200 and the plan appears in the joiner's list, second accept 404, owner accept 409, expired code 404 (expiry moved back by SQL), revoke 204 then preview 404.
- [ ] 2.3 Add the members endpoints (`updateMember`, `removeMember` incl. leaving) and update the back README (Spanish); bump `.contract-ref`. Verify with curl: role change to viewer makes writes 403, owner target 409, non-owner managing others 403, member leaves 204 then 404 on the plan, owner leaving 409; `npm run lint`, `npm run build`, drift clean.

## 3. [front]

- [ ] 3.1 `packages/ui`: add `UiCodeCard`, the tappable role of `UiMemberRow` and the icons `copy`, `share`, `refresh`, `hash`, `logIn`, `chevronDown`, with stories. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews).
- [ ] 3.2 Regenerate `packages/api_client` (own commit); add `qr_flutter` and `share_plus`. Verify `flutter analyze` in `packages/api_client` and the app.
- [ ] 3.3 Sharing repository and screen 21 Invitar miembro (role chips, code card with copy/"Copiado", QR, share, generate another, status card with revoke), reachable from 16 for the owner. Verify `flutter analyze` and compare with `design/screens/21-invitar-miembro.png`.
- [ ] 3.4 Screens 30 Unirse a un plan (code input, inline error, "Escanear QR" explanation) and 45 Unirse desde enlace (preview, code, join, "No soy yo"), `/unirse/:code` route with `PendingInvite` through sign-in/up, Android intent filter and iOS deep-link flag; join selects the plan and shows the toast. Verify `flutter analyze`, `flutter build apk --debug`, and compare with `design/screens/30-unirse-a-un-plan.png` and `45-unirse-desde-enlace.png`.
- [ ] 3.5 16: role sheet for the owner (Puede editar / Solo lectura / Quitar del plan with confirmation) and "Salir del plan" for other members; update the front README. Verify `flutter analyze` and compare with `design/screens/16-planes-y-miembros.png`.

## 4. Verification

- [ ] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for the seven sharing operations and their error cases; drift clean; `npx @redocly/cli lint openapi.yaml` clean; `openspec validate add-plan-sharing --strict` passes. Back: lint, build, migration. Front: `flutter analyze` in app, `packages/ui`, `widgetbook/`, `packages/api_client`; `flutter build apk --debug`. App against the real back with two users: owner opens 21 (code, QR, copy, share, regenerate, revoke), second user joins from 30 with the code (and sees the invalid-code error first), a third user opens `/unirse/<code>` signed out → sign up → 45 → joins; owner changes a role and removes a member in 16; a member leaves. No test files anywhere.
