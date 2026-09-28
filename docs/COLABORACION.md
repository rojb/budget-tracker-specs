# Guía de colaboración — budget-tracker

Guía operativa para Ruben y nathaliascode. Para quién hace qué change y en qué orden, ver
`docs/ROADMAP.md`. Para las decisiones que fijaron este reparto, ver
`odd/tasks/team-coordination-setup.md`.

---

## 1. Repos y setup inicial (una sola vez por máquina)

Tres repos, clonados **uno al lado del otro**:

```
budget-tracker-specs/   # este repo — OpenSpec + openapi.yaml + PRD + UX spec + design/
budget-tracker-back/    # NestJS
budget-tracker-front/   # Flutter
```

```bash
git clone <url-specs>  budget-tracker-specs
git clone <url-back>   budget-tracker-back
git clone <url-front>  budget-tracker-front
```

Registrar el store de OpenSpec y crear el workset que une los tres repos:

```bash
openspec store register <path-a-budget-tracker-specs> --id budget-tracker-specs

openspec workset create budget-tracker \
  --member specs=<path-a-budget-tracker-specs> \
  --member back=<path-a-budget-tracker-back> \
  --member front=<path-a-budget-tracker-front>

openspec context --store budget-tracker-specs --code-workspace <path-al-.code-workspace-o-carpeta-raiz>
```

Cada dev corre esto una vez. Confirmar la sintaxis exacta de cada comando (opciones, formato de
salida) con `openspec workset --help` y `openspec context --help` antes de la primera vez, porque
puede variar entre versiones de OpenSpec.

---

## 2. Ciclo de vida de un change

1. **Linear → In Progress.** El owner del issue lo mueve a "In Progress" antes de tocar código.
2. **Specs, diseño y tareas (repo `budget-tracker-specs`).** El owner del change completa
   `proposal.md` (ya escrito, ver `openspec/changes/<change>/`), y redacta `specs`, `design` y
   `tasks` para su propio change. Confirmar la secuencia y los comandos exactos con:
   ```bash
   openspec instructions --help
   openspec status --help
   ```
   y luego, por artefacto:
   ```bash
   openspec instructions specs  --change <change>
   openspec instructions design --change <change>
   openspec instructions tasks  --change <change>
   ```
3. **Implementación en `budget-tracker-back` y `budget-tracker-front`**, siguiendo las tareas.
4. **Verificación manual** (sin archivos de test, ver §6): Widgetbook contra
   `design/screens/NN-*.png` para UI, Swagger UI o Prism contra `openapi.yaml` para API.
5. **Pull requests** en cada repo tocado (specs si hubo cambio de contrato, back, front).
6. **Archivar el change:**
   ```bash
   openspec archive <change>
   ```
7. **Linear → Done.**

---

## 3. Ramas y commits

**Nombre de rama = id del issue de Linear**, para que Linear enlace automáticamente. Mismo nombre
en los dos repos de código que toque el change:

```
rrg-12-add-envelopes
```

**Commits:** Conventional Commits, con el id del issue:

```
feat(envelopes): add group reorder endpoint (RRG-12)
fix(envelopes): correct template seed amounts (RRG-12)
```

---

## 4. Protocolo de cambio de contrato

`openapi.yaml` (en `budget-tracker-specs`) es la fuente de verdad del contrato API. Cualquier
cambio (nuevo endpoint, campo, tipo):

1. PR a `budget-tracker-specs` que modifica `openapi.yaml`.
2. **Aprobada por los dos devs** antes de mergear — no solo por el owner del change.
3. CI de `budget-tracker-back` exporta el spec real con `@nestjs/swagger` y lo compara con
   `oasdiff` contra `openapi.yaml`: si divergen, el build falla. Mantener el back implementado
   al día con el contrato aprobado, no al revés.

---

## 5. Protocolo de `packages/ui`

- Las pantallas usan **solo** componentes de `packages/ui`; nada de widgets ad hoc que dupliquen
  un componente ya definido.
- Componente nuevo o modificado = PR chica y separada a `packages/ui`, con su story de
  Widgetbook, revisada por el otro dev — aunque el feature que lo origina tenga un solo owner
  (aplica sobre todo a `GoalCard` en `add-envelope-goals` y a la tarjeta "Listo para asignar" en
  `add-monthly-assignment`).
- Tokens (color, tipografía, radios, elevación): solo los de `PRD-ux-spec.md` §7. No inventar
  valores nuevos.
- Convenciones de pantalla (barra superior, acciones destructivas, `BottomNav`, filas editables,
  agrupadores de fecha, tamaños, selectores, búsqueda): `PRD-ux-spec.md` §6.1.
- Antes de dar por cerrada una pantalla, compararla contra su render en `design/screens/NN-*.png`.

---

## 6. Sin archivos de test

Decisión fija del equipo, sin excepciones:

- Nada de `*.spec.ts` / `*.test.ts` en `budget-tracker-back`, nada de `*_test.dart` ni golden
  tests en `budget-tracker-front`.
- `nest-cli.json` tiene `generateOptions.spec: false`; los archivos de test que un generador
  cree por defecto se borran antes de commitear.
- Los `spec.md` de OpenSpec **no** son tests y se mantienen.
- El chequeo de *contract drift* con `oasdiff` en CI se mantiene: compara documentos, no ejecuta
  tests.
- Verificación de cada change: **manual** — Widgetbook para UI, Swagger UI/Prism para API (ver
  §2, paso 4).

---

## 7. Ritual de sincronía

Chequeo corto cada 1–2 días entre los dos devs (async por Linear/mensaje, o una llamada breve).
Tres preguntas:

1. ¿Hubo o va a haber un cambio de contrato (`openapi.yaml`)?
2. ¿Hubo o va a haber un componente nuevo o modificado en `packages/ui`?
3. ¿Hay algún bloqueo? (change de la otra persona que no cerró, ambigüedad del PRD, dependencia
   que no mergeó todavía)

Puntos de sincronía obligatorios (no esperar al ritual para estos, avisar apenas se sepa): la
interfaz de `CalculationService` (`add-budget-calc-engine`), la entidad `Plan` (antes de abrir
`add-envelopes`), y cualquier PR a `openapi.yaml`. Ver `docs/ROADMAP.md` §5 para el detalle.

---

## 8. Linear

- Proyecto: <LINEAR_PROJECT_URL>
- Un issue por change de OpenSpec, con el owner de `docs/ROADMAP.md` asignado.
- Team: Rrgonaut.
