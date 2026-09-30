# Design

## Context

See proposal.md for the why. `add-plans-and-accounts` created `plans` and `plan_members` (roles
owner/editor/viewer, one owner per plan), `PlanAccessService`, the app-scoped `PlansController`,
screen 16 with read-only members and placeholder routes for 21 and 30. There is no invitation
data yet and no deep link handling in the app.

Sources: FR-27, FR-39 (no email), PRD §7 (up to 5 members per plan), PRD-ux-spec.md §5 ("Solo la
dueña puede invitar"), §5 "Copiado", §7 Moneda (preview shows no amounts), §9.2, §9.3 (45), §9.5;
renders `design/screens/{16,21,30,45}-*.png`; canonical state D (code K7M-4QX, Casa con Juli).

## Goals / Non-Goals

**Goals:**
- `plan_invitations` table; owner endpoints to generate, read and revoke the plan's code; public
  (signed-in) preview and accept by code; member role change, removal and leaving.
- Screens 21, 30, 45, the role sheet in 16, and the `https://sobres.app/unirse/<code>` link.

**Non-Goals:**
- An in-app QR scanner: FR-27 says the QR is read with the phone's camera, which opens the link
  (→ 45). The "Escanear QR" tab of 30 explains that instead of embedding a camera library, which
  could not be verified on a device in this environment.
- Transferring ownership, email invitations (FR-39), rate limiting.
- Test files of any kind.

## API surface

Added to `openapi.yaml`, tag `Sharing`, all bearer-protected:

| Operation | Path | Who | Request | Responses |
|---|---|---|---|---|
| `getInvitation` | `GET /plans/{planId}/invitation` | owner | — | `200 Invitation`, `400`, `401`, `403`, `404` |
| `createInvitation` | `POST /plans/{planId}/invitation` | owner | `CreateInvitationRequest` | `201 Invitation`, `400`, `401`, `403`, `404` |
| `revokeInvitation` | `DELETE /plans/{planId}/invitation` | owner | — | `204`, `400`, `401`, `403`, `404` |
| `previewInvitation` | `GET /invitations/{code}` | any signed-in | — | `200 InvitationPreview`, `400`, `401`, `404` |
| `acceptInvitation` | `POST /invitations/{code}/accept` | any signed-in | — | `200 Plan`, `400`, `401`, `404`, `409` |
| `updateMember` | `PATCH /plans/{planId}/members/{userId}` | owner | `UpdateMemberRequest` | `200 PlanMember`, `400`, `401`, `403`, `404`, `409` |
| `removeMember` | `DELETE /plans/{planId}/members/{userId}` | owner, or the member themself | — | `204`, `400`, `401`, `403`, `404`, `409` |

Schemas: `InvitationRole` enum `editor | viewer`; `Invitation { code, role, expiresAt, createdAt,
link }`; `CreateInvitationRequest { role }`; `InvitationPreview { planName, ownerName, currency,
role, expiresAt }` (no amounts, no emails); `UpdateMemberRequest { role: InvitationRole }`. `code`
path parameter: `^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3}$`. Path parameters per operation (oasdiff).

## Backend design

```
src/sharing/ sharing.module.ts invitations.controller.ts plan-invitation.controller.ts
             members.controller.ts sharing.service.ts invitation-code.ts
             entities/plan-invitation.entity.ts dto/*.dto.ts
src/database/migrations/<ts>-CreatePlanInvitations.ts
```

- **Table.** `plan_invitations(id, plan_id fk cascade, code char(6) unique, role CHECK
  editor/viewer, created_by fk users, created_at, expires_at, used_at null, used_by null fk users
  set null, revoked_at null)`. The code is stored without the dash, uppercase. "Active" means
  `used_at, revoked_at IS NULL AND expires_at > now()`. A partial unique index on `plan_id` where
  `used_at IS NULL AND revoked_at IS NULL` enforces one pending invitation per plan (an expired one
  is revoked when a new one is created).
- **Code.** 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L) with
  `crypto.randomInt`, ~1.07·10^9 combinations; on the rare unique collision it retries. Input is
  normalized (trim, remove the dash and spaces, uppercase) before lookup. Display `XXX-XXX`.
- **Link.** `https://sobres.app/unirse/<CODE>` (constant `INVITE_LINK_BASE`), returned in
  `Invitation.link` so clients never build it themselves.
- **Accept** runs in a transaction: `UPDATE plan_invitations SET used_at = now(), used_by = :user
  WHERE code = :code AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now() RETURNING *`
  (the single-use guarantee under concurrency), then checks existing membership (409, and the update
  is rolled back so the code stays usable) and the 5-member cap (409 "Plan is full"), then inserts
  the membership with the invitation role.
- **Members.** `PATCH` only between editor and viewer; target owner → 409; caller not owner → 403.
  `DELETE`: owner removing another member, or a non-owner removing themself; owner removing self →
  409. A removed member's access disappears immediately (membership is the only check).
- Owner-only routes reuse `PlanAccessService.require(..., OWNER_ROLES)`; the self-leave path uses
  `READ_ROLES` and then compares the user id.

## Frontend design

```
lib/features/sharing/
  sharing_repository.dart        # generated SharingApi (invitation, preview, accept, members)
  invite_page.dart + invite_controller.dart     # 21
  join_page.dart + join_controller.dart         # 30
  join_link_page.dart                           # 45
  member_role_sheet.dart                        # role/remove sheet for 16
  pending_invite.dart                           # code remembered across sign-in/up
```

- New dependencies: `qr_flutter` (QR of `Invitation.link` in 21) and `share_plus` (native share of
  "Unite a <plan> en Sobres con el código K7M-4QX: <link>"). Clipboard via `Clipboard.setData`.
- **Deep link.** Android `intent-filter` (VIEW, BROWSABLE, `https://sobres.app/unirse/*`,
  `autoVerify` off because the domain is not ours) and iOS `FlutterDeepLinkingEnabled`; go_router
  receives `/unirse/:code`. Without a session the router stores the code in `PendingInvite` and
  sends the user to 19 (PRD: "pasa primero por el alta"); after sign-in or sign-up with a pending
  code the router goes to `/unirse/<code>` before 34 or home. `/unirse` is allowed without plans.
- **After joining**, `PlansController.load()` then `select(planId)`, go to `/plan`, toast "Te
  uniste a <plan>" (§8 Success example).
- **16.** For the owner the role pill of other members is tappable (sheet: "Puede editar", "Solo
  lectura", "Quitar del plan" → confirmation). For non-owners a "Salir del plan" button (confirm,
  `DELETE` own membership, reload plans).

## UI components

Existing: `UiIconButton`, `UiChip` (role chips, "Ingresar código"/"Escanear QR" tabs), `UiButton`
primary/white/danger, `UiTextField` (code field with `#` icon and error text), `UiCard`,
`UiInfoNote`, `UiSheet`, `UiToast`, `UiAvatar`, `UiMemberRow`.

New or modified in `packages/ui` (stories, review by the other dev, §5):
- **`UiCodeCard` (new, molecule)**: large code text with a copy `IconButton`, an optional QR slot
  (the app passes the `qr_flutter` widget, so `packages/ui` gains no dependency), a caption, and a
  floating "Copiado" label shown by the parent for ~1.5 s.
- **`UiMemberRow` (modified)**: `onRoleTap` makes the role pill tappable with a chevron-down.
- **`UiIcons` (modified)**: `copy`, `share`, `refresh`, `hash`, `logIn`, `chevronDown`.

## Decisions

**One active invitation per plan.** Matches 21 ("Código activo") and makes revoke unambiguous.
Alternative (many codes) rejected: the design shows a single code and the owner could lose track.

**Code without the dash in storage, dash optional on input.** People dictate codes; accepting
`k7m4qx` avoids a support problem at no security cost.

**Accept is one conditional UPDATE.** The single-use rule holds under concurrency without locks.

**No in-app scanner.** See Non-Goals; the phone camera path is the one FR-27 describes.

## Risks / Trade-offs

- [Brute-forcing codes] -> ~10^9 space, 24 h lifetime, single use; academic scope, no rate limit.
- [Deep links unverifiable without a device] -> the route is exercised by opening `/unirse/<code>`
  in the local web build; the Android manifest entry is compiled into the debug apk.

## Migration Plan

`npm run migration:run` creates `plan_invitations`. Rollback: `npm run migration:revert`.
