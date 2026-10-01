# UX Spec — Gestor de Plan de Presupuesto

> Fundamentos de UX y sistema visual derivados de [`PRD.md`](./PRD.md).
> Referencias visuales: `design/inspo1–4.webp` y `design/font-colors.webp`.
> Diseño: `design/app.op` (OpenPencil). Exportaciones: `design/screens/`.

---

## 1. Modelo mental

**Intención principal:** "¿Puedo gastar esto?" — se responde mirando un sobre, no el saldo
de una cuenta.

| El usuario cree… | Realidad | Dónde se corrige |
|---|---|---|
| "El saldo de mi cuenta es lo que puedo gastar" | Lo gastable es el disponible de cada sobre | Inicio muestra primero *Listo para asignar*; Cuentas lo aclara con una nota |
| "Registrar un ingreso ya lo presupuesta" | Entra a *Listo para asignar* hasta repartirlo | Tras un ingreso, Inicio ofrece "Asignar" en la tarjeta principal |
| "Pasarme en un sobre no afecta nada" | El sobregiro se descuenta del mes siguiente | El sobre sobregirado lo dice con texto, no solo con color |
| "Asignar a noviembre es gastar en noviembre" | Es reservar dinero de hoy | El selector de mes dice "Reservás hoy" |
| "Editar un gasto viejo rompe el mes" | Todo se recalcula | Confirmación "Recalculado: N meses actualizados" |

**Principio:** *cada peso tiene un destino antes de gastarse.* Las **metas con foto**
hacen visible el para qué: ahorrar deja de ser un número y pasa a ser un viaje o un auto.

---

## 2. Arquitectura de información

| Concepto | Dónde | Visibilidad |
|---|---|---|
| Listo para asignar + sobres activos | Inicio (tarjeta unida) | **Primario** |
| Metas con foto (carrusel) | Inicio | Primario |
| Sobres del mes, estados y filtros | Plan | **Primario** |
| Registrar movimiento | Botón chartreuse central | **Primario**, siempre visible |
| Asignar / mover dinero | Desde Inicio, Plan y detalle de meta | Secundario |
| Mes futuro | Navegación de meses del Plan | Secundario |
| Detalle de meta (foto, progreso, accesos) | Tocar una meta | Secundario |
| Movimientos con filtros de fecha y hora | Pestaña Movimientos | Primario en su pestaña |
| Cuentas | Pestaña Cuentas | Primario en su pestaña |
| Reportes | Acceso desde Inicio | Secundario |
| Beneficiarios, planes y miembros | Avatar de Inicio | Oculto |

**Navegación:** grupo de círculos solapados abajo, como en la inspiración:
`Inicio` · `Plan` · **`+`** · `Movimientos` · `Cuentas`. Activo = círculo negro;
`+` = chartreuse; el resto, blanco.

---

## 3. Affordances

| Acción | Señal |
|---|---|
| Registrar movimiento | Círculo chartreuse: el único chartreuse de la navegación |
| Asignar a Listo para asignar | Círculo lavanda `+` dentro de la tarjeta unida |
| Abrir una meta | Tarjeta fotográfica con flecha diagonal |
| Elegir monto rápido | Chips; el elegido en lavanda |
| Confirmar guardado | Cápsula "Guardar" con check chartreuse al final del flujo |
| Solo lectura | Texto sin contenedor |
| Destructivo | Ícono rojo en la barra superior + hoja de confirmación |

---

## 4. Carga cognitiva

| Punto de fricción | Resolución |
|---|---|
| Escribir montos | Chips de montos frecuentes + calculadora en el campo |
| Elegir sobre | Carrusel con el sobre sugerido por el beneficiario ya centrado |
| Fecha y hora | Default "Hoy, ahora"; se toca solo para cambiar |
| Gasto o ingreso | Default gasto; alternar con un toque |
| Ingreso: ¿a dónde va? | Default Listo para asignar |
| Dividir pago | Oculto tras "Dividir"; muestra "Restan $ X" en vivo |

**Meta KR3:** registrar un gasto = `+` → monto → beneficiario → sobre → Guardar = **5 toques**.

---

## 5. Diseño de estados

| Elemento | Vacío | Cargando | Éxito | Parcial | Error |
|---|---|---|---|---|---|
| Inicio | Sin metas → tarjeta "Creá tu primera meta" | Esqueleto | Tarjeta + carrusel | — | Reintentar |
| Plan | "Creá tu primer sobre" + plantilla | Esqueleto | Lista | Filtro sin resultados | Reintentar |
| Sobre | Sin asignar → barra de puntos | — | Cubierto → rayas chartreuse completas | Falta → rayas + puntos | Sobregirado → rojo + texto |
| Nuevo movimiento | — | Botón con spinner | "Movimiento guardado" | División incompleta → "Restan $ X" | Suma que no cuadra |
| Movimientos | "Todavía no hay movimientos" | Esqueleto | Lista por día y hora | Filtros sin resultados | Reintentar |
| Cuentas | "Todavía no tenés cuentas" + botón "Agregar cuenta" (→ 28) | Esqueleto | Lista | — | Reintentar |
| Beneficiarios | "Todavía no tenés beneficiarios" + nota "Se crean solos la primera vez que los usás en un movimiento" | Esqueleto | Lista | Búsqueda sin resultados | Reintentar |
| Acceso | — | Spinner | Entra | — | "Email o contraseña incorrectos" |
| Plan compartido | — | — | — | — | "Solo la dueña puede invitar" |

**Desborde:** nombres a una línea con elipsis; montos nunca se truncan.

**Textos P3 (auditoría de navegación, Lote B):**

- **Búsqueda en el lugar.** El ícono de lupa (02, 10, 13, 15, 33) no navega: revela un campo de texto en el mismo encabezado, empujando el título a un costado o arriba. Cerrar el campo (ícono `x` que reemplaza a la lupa) lo colapsa sin perder el resto de la pantalla.
- **Calculadora en el monto.** El ícono de calculadora del `SaveBar` (y de la `AmountCapsule` cuando el flujo lo expone) alterna el teclado de calculadora (`Key/Number · Operator · Del`) sobre el teclado numérico simple, sin cambiar de pantalla. Ver FR-18.
- **Esqueleto de carga.** Mismo alto y forma que el contenido real (tarjeta, fila o lista) relleno con `#EDEDED` y una animación de brillo sutil (`shimmer`) de izquierda a derecha; nunca menos de 3 filas esqueleto para una lista, para que el usuario no confunda "cargando" con "vacío".
- **"Copiado" (21 Invitar miembro).** Tocar el código o el ícono de copia junto a él muestra una etiqueta flotante "Copiado" durante ~1.5 s sobre el propio código, sin tapar el QR ni las acciones.
- **"Guardado" (patrón general tras confirmar).** Cualquier `SaveBar` o botón primario que complete un alta o edición (07, 09, 12, 20, 22 → 23, 28, 31, 41, 42, plus asignaciones en 03/24) muestra una etiqueta flotante "Guardado" (o el texto específico ya definido, p. ej. "Movimiento guardado") durante ~1.5 s antes de volver a la pantalla de origen; no requiere un toque para cerrarse.

---

## 6. Integridad del flujo

| Riesgo | Mitigación |
|---|---|
| Ingreso sin asignar | Tarjeta de Inicio con Listo para asignar destacado y `+` lavanda |
| Asignar de más | Listo para asignar negativo en rojo con el excedente |
| Sobregiro inadvertido | Filtro "Sobregirados (n)" y texto en el sobre |
| Editar el pasado | Aviso de mes cerrado + confirmación de recálculo |
| División que no cuadra | Guardar deshabilitado hasta que la suma sea exacta |
| Perderse entre meses | Mes visible siempre; botón "Hoy" en meses futuros |

**Restricciones para el visual:** Listo para asignar es el primer número de Inicio; el `+`
es visible en todas las pestañas; la hora aparece en cada movimiento; ningún estado se
comunica solo por color.

### 6.1 Convenciones

Una auditoría de consistencia entre pantallas del mismo tipo (`odd/tasks/pattern-consistency.md`)
fijó las siguientes reglas, aprobadas por la usuaria el 2026-09-28:

1. **Barra superior:**
   - las pantallas empujadas desde otra pantalla usan volver (chevron-left);
   - los flujos de alta abiertos desde el "+" central usan cerrar (x);
   - pantallas hermanas con la misma entrada usan el mismo control.
2. **Acciones destructivas:**
   - la entrada es siempre un botón de ícono rojo (`IconButton/Danger`: papelera, o archivo para cuentas) en la barra superior, del lado opuesto al "atrás" (12, 23, 41, 42);
   - siempre abre una hoja de confirmación;
   - el `DangerButton` es sólido `#C62828` con texto blanco, alto 56, radio 28;
   - nada se borra ni se archiva sin pasar por esa hoja.
3. **`BottomNav`:** siempre un `BottomNavWrap` hermano de `Content`, fijo; nunca dentro del
   contenido que scrollea.
4. **Filas de valor editable (`Field/*`):** siempre llevan chevron-right al final, tanto en
   alta como en edición.
5. **Agrupadores de fecha:** "Hoy · martes 29", "Ayer · lunes 28", después "Sábado 26".
6. **Monto + palabra:** el monto va primero ("$ 24.000 disponible").
7. **Tamaños:**
   - títulos de pestaña raíz: 36;
   - títulos de hoja: 24;
   - títulos de entidad en detalle: 30;
   - botones de cerrar de hoja: 48×48;
   - botones superiores de pantalla completa: 52×52.
8. **El color de la barra de estado sigue lo que tiene detrás:** oscuro sobre fondos claros,
   blanco (`StatusBar/Light`) sobre fotos.
9. **Selectores ("Elegir X"):** un campo de búsqueda y un indicador de selección (círculo de
   radio, check lavanda cuando está elegido). 38 Fecha y hora es la excepción al indicador: usa
   un "Listo" explícito en vez de seleccionar y cerrar al tocar. 52 Elegir grupo es la excepción
   al buscador: con solo 4 grupos, el campo de búsqueda es opcional y se omite (conserva el
   indicador de radio).
10. **Pantallas de lista:** la búsqueda es un `IconButton` de lupa en el encabezado que abre
    un campo en el lugar; nunca una barra de búsqueda siempre visible.
11. **El título en pantalla coincide con el nombre de la entidad** usado en el mapa de
    navegación.

---

## 7. Sistema visual

**Dirección estética:** *calma luminosa.* Fondo gris muy claro, tarjetas blancas unidas
por curvas, tipografía fina y mucho aire. El color se usa poco y con intención: **lavanda
= lo elegido**, **chartreuse = la acción y el progreso**. Las **fotos** dan emoción a las
metas; todo lo operativo (sobres, movimientos) queda sobrio.

### Tokens de color

| Token | Valor | Rol |
|---|---|---|
| `bg` | `#F5F5F5` | Fondo de pantalla |
| `surface` | `#FFFFFF` | Tarjetas, chips, botones blancos |
| `ink` | `#212121` | Texto principal, círculo activo |
| `ink-muted` | `#6B6B6B` | Texto secundario |
| `lavender` | `#CFCAEC` | Selección, acciones secundarias, meta activa |
| `chartreuse` | `#EAFC5F` | Acción principal, rayas de progreso |
| `chartreuse-deep` | `#D2E83A` | Rayas sobre fondo claro |
| `danger` | `#C62828` | Sobregiro, error, eliminar |
| `warning` | `#F5C451` | Advertencias (toast Warning); siempre con texto `ink` |
| `glass` | `#FFFFFF33` | Paneles sobre fotos |

### Contraste (WCAG 2.1 AA)

| Par | Ratio | Resultado |
|---|---|---|
| `ink` sobre `bg` / `surface` | 15 : 1 | ✅ |
| `ink-muted` sobre `bg` | 4.9 : 1 | ✅ |
| `ink` sobre `lavender` | 10 : 1 | ✅ |
| `ink` sobre `chartreuse` | 15 : 1 | ✅ |
| `danger` sobre `surface` | 5.6 : 1 | ✅ |
| `ink` sobre `warning` | 10 : 1 | ✅ |
| blanco sobre `ink` (toast Neutral) | 16 : 1 | ✅ |
| blanco sobre `danger` (toast Error) | 5.6 : 1 | ✅ |
| blanco sobre `lavender` o `chartreuse` | < 2 : 1 | ❌ **prohibido** |
| `chartreuse` como texto sobre claro | < 1.5 : 1 | ❌ **prohibido** |

> La inspiración usa gris muy claro para etiquetas ("Total savings"). Ese gris no llega a
> 4.5 : 1; acá las etiquetas usan `ink-muted`.

### Tipografía — Urbanist

| Estilo | Tamaño | Peso | Uso |
|---|---|---|---|
| `display` | 40 | Light 300 | Montos principales |
| `headline` | 34 | Regular 400 | Saludo y títulos de flujo |
| `title` | 22 | Regular 400 | Encabezados de sección |
| `body` | 16 | Regular 400 | Filas |
| `body-strong` | 16 | Medium 500 | Montos en filas |
| `caption` | 13 | Regular 400 | Horas, etiquetas |

### Forma

- Tarjetas radio 28; **tarjetas unidas** (dos bloques blancos fusionados con un estrangulamiento curvo).
- Botones circulares 48–56; chips y cápsulas con radio completo.
- Fotos con radio 32; sobre foto, paneles `glass` y texto blanco con sombra suave.
- Progreso: **rayas verticales chartreuse** para lo cubierto y **puntos** para lo que falta.
- Íconos Lucide de trazo fino (1.5).

**Escala de alto de chip:** 44 (default: filtros, chips de tipo como `Chip/Banco`, montos
rápidos) · 34 (chips compactos de previsualización, p. ej. los de la plantilla en 06 Plan
vacío: "Alquiler", "Supermercado", "Salidas", "Emergencia", "+8").

### Montos

`$ 18.300` — separador de miles punto, decimales con coma solo donde importan. Montos
grandes en `display` Light.

### Moneda

Cada plan tiene **una** moneda, elegida al crearlo (20 Nuevo plan) e **inmutable** después
(FR-40). El formato usa siempre el locale es-AR (punto de miles, coma decimal) y la
cantidad de decimales sigue la unidad menor de la moneda: ARS no muestra decimales
(`$ 48.200`), USD, EUR y BOB muestran 2 (`US$ 1.250,50`, `€ 980,00`, `Bs. 1.250,50`). Un monto negativo antepone
el signo `−` al símbolo (`−US$ 12,50`, `−Bs. 12,50`), nunca lo pone después ni lo reemplaza por color solo.

| Dónde aparece un monto | Formato |
|---|---|
| Tarjeta de saldo (`JoinedCard` "Listo para asignar", Inicio y 33) | Símbolo de la moneda del plan + monto en `display`; negativo con `−` antes del símbolo |
| Filas de sobre (`EnvelopeRow`: asignado, gastado y disponible) | Símbolo + monto en cada cifra; "disponible" negativo en rojo con `−`, nunca solo por color |
| Filas de cuenta (`AccountRow`) | Símbolo + saldo derivado de la cuenta, en la moneda del plan |
| Filas de movimiento (`TxRow`) | Símbolo + monto; los ingresos van en la cápsula lavanda, los gastos en texto simple |
| `AmountCapsule` (teclado de monto) | El símbolo va en el badge circular izquierdo; los símbolos de más de un carácter (p. ej. "US$", "Bs.") usan una fuente más chica para entrar en el círculo de 48px |
| Chips de monto rápido (`QuickAmounts`) | Solo el número, **sin símbolo** — ya aparece en la `AmountCapsule` que alimentan |
| Etiquetas de `SaveBar` ("Asignar US$ 6.200", "Mover US$ 6.200") | Símbolo + monto dentro del texto del botón |
| Cierre de mes (25) | Símbolo + monto en el chequeo de cuadre y en cada línea de arrastre o sobregiro |
| Transferencia entre cuentas (29) | Símbolo + monto; origen y destino comparten moneda porque un plan no la mezcla |
| Reportes y gráficos (17) | Símbolo + monto en ejes, totales y tooltips |
| Tarjetas de meta (`GoalCard`) | Símbolo + monto ahorrado y monto objetivo |
| Filtros de la vista de plan (FR-21) | No muestran montos, solo el estado del sobre (Sobregirados, Falta) |
| Lista de planes (`PlanRow`, 16) | No muestra montos; muestra el nombre de la moneda entre paréntesis con su símbolo, p. ej. "pesos ($)", "dólares (US$)", "bolivianos (Bs.)" |
| Vista previa de unión a un plan (30 Unirse a un plan) | No muestra montos: el código de invitación no revela el estado financiero del plan |

---

## 8. Componentes

Página `Componentes` en `design/app.op` (generada por `design/build-components.js` a partir del diseño base). Cada variante es un maestro reutilizable `Componente/Variante`; las pantallas usan instancias (`ref`).

| Componente | Variantes | Uso en pantallas |
|---|---|---|
| `StatusBar` | Default | Las 18 |
| `NavCluster` | Inicio · Plan · Movimientos · Cuentas | Pestañas principales |
| `IconButton` | White · Black · Lavender · Chartreuse · Soft · Glass · Danger | Encabezados, acciones |
| `Button` | Primary · Secondary | Guardar, Entrar, Crear sobre |
| `Chip` | Default · Selected · DefaultIcon | Filtros, montos rápidos |
| `AmountCapsule` | Default (símbolo de moneda overridable, p. ej. "US$") | Nuevo movimiento, Asignar, 33 Plan en dólares |
| `SaveBar` | Default · Disabled | Flujos de alta y edición |
| `Toggle` | GastoActive · IngresoActive | Nuevo movimiento |
| `TextField` | Default · Focus · Error | Acceso, formularios |
| `FieldRow` | Default | Detalle de movimiento |
| `Key` | Number · Operator · Del | Teclado calculadora |
| `Avatar` | Default | Inicio, miembros |
| `EnvelopeRow` | Funded · Underfunded · Overspent · Empty | Plan |
| `TxRow` | Expense · Income | Movimientos, detalle de cuenta |
| `AccountRow` · `PayeeRow` · `MemberRow` | Default | Cuentas, beneficiarios, miembros |
| `PlanRow` | Active · Inactive (solo o compartido) | Planes y miembros |
| `Toast` | Neutral · Success · Info · Warning · Error | Feedback de acciones simples (ver abajo) |

**Límites de OpenPencil 0.8.4:** las barras de progreso (rayas/puntos) y los elementos dentro de filas horizontales con varios hijos quedan como capas sueltas: las instancias ahí se posicionan mal. En Flutter todos estos son widgets reutilizables igual.

**`Toast`: feedback de acciones simples.** Cápsula de 350 × 64, radio 32, flotando sobre la `BottomNav` (o sobre el borde inferior si la pantalla no tiene nav), con ícono en círculo, título (15/500), detalle (12) y, solo en Neutral, una acción de texto. Aparece 4 s y se descarta deslizando; nunca bloquea la pantalla y nunca es el único lugar donde queda registrado un error de formulario (los errores de campo siguen en el campo). El color depende del tipo de mensaje, y el ícono también cambia para no depender solo del color:

| Variante | Fondo · ícono | Cuándo | Ejemplos de copy |
|---|---|---|---|
| **Neutral** | `ink` · deshacer, chartreuse | Acción consumada que se puede revertir | "Recalculado · Agosto y septiembre actualizados · Deshacer" (49), "Movimiento eliminado · Deshacer", "Sobre eliminado · Deshacer" |
| **Success** | `chartreuse` · check | Guardado o creado sin nada que revertir | "Movimiento guardado", "Sobre creado", "Te uniste a Casa con Juli", "Cuenta restaurada" |
| **Info** | `lavender` · info | Confirmación de acción menor o dato útil | "Código copiado", "Filtros aplicados", "Mes de octubre abierto" |
| **Warning** | `warning` · triángulo | La acción se hizo pero deja algo pendiente | "Transporte quedó sobregirado · Cubrilo antes de cerrar el mes", "Asignaste más de lo disponible" |
| **Error** | `danger` · cruz | La acción no se pudo hacer | "No se pudo guardar · Revisá tu conexión e intentá de nuevo", "El código venció" |

Reglas: un solo toast a la vez (el nuevo reemplaza al anterior); los mensajes van en voseo y sin signos de exclamación; el título dice qué pasó y el detalle, el dato concreto o el próximo paso.

**`SaveBar`: swipe-to-confirm.** El check chartreuse del medio no es un botón de adorno: es la manija de un control de deslizar para confirmar (arrastrá la manija chartreuse hasta el check del extremo derecho). Tocar la manija también confirma, como alternativa accesible al gesto de arrastre (teclado, lector de pantalla, motricidad reducida). El ícono de la izquierda (calculadora u otro, según la pantalla) abre el teclado de calculadora sobre el monto (P3, ver §5). La variante **Disabled**, agregada en el Lote B de la auditoría de navegación, se usa cuando el formulario todavía no es válido — hoy, únicamente 08 Dividir pago mientras la suma de las partes no cuadra: la manija muestra un candado sobre gris en vez del check chartreuse, la etiqueta pasa a `ink-muted`, y el check del extremo final baja su opacidad al 40 %. Ninguno de los dos estados se distingue solo por color: el ícono de la manija (check vs. candado) y el texto de la etiqueta ("Guardar" vs. "Faltan $ X") también cambian.

**Chevrons en filas (decisión del Lote B).** `EnvelopeRow`, `TxRow` y `AccountRow` no llevan chevron de "ir a": su columna derecha ya es una pila ajustada de dos líneas (monto + estado/subtítulo/porcentaje) que llega hasta el borde interno de la tarjeta sin margen sobrante — medido en los renders de 02, 10, 13 y 14, agregar un chevron ahí recorta el nombre o se superpone al monto. La fila completa es tocable igual (área táctil ≥ 48 dp) y lo demuestra su propio destino (22, 12 o 14). `PayeeRow` sí lleva chevron porque su columna derecha es un único ícono sin monto: hay lugar de sobra y el chevron no compite con ninguna cifra.

**Los tres estilos de etiqueta de grupo.** El diseño usa tres patrones distintos para agrupar,
cada uno con su propio rol — no son intercambiables:

1. **Encabezado de grupo del plan** (02, 04, 33): nombre del grupo en 20, peso 400, `ink`,
   junto al subtotal disponible en 13, `ink-muted`, y un `IconButton/plus` de 32×32 para crear
   un sobre en ese grupo (p. ej. "Día a día" · "$ 85.350 disponible").
2. **Divisor MAYÚSCULA de selector** (26, 36, 37): rótulo de sección en 12, peso 600,
   `ink-muted`, todo en mayúsculas (p. ej. "OBLIGACIONES", "DÍA A DÍA"), sin acción propia.
3. **`GroupRow`** (32 Grupos y las hojas 44/48 que referencian un grupo o cuenta): nombre en
   16, peso 500, `ink`, con la cantidad como subtítulo en 13, `ink-muted` (p. ej. "Día a día" /
   "4 sobres").

---

## 9. Pantallas y flujos

Las 18 pantallas originales (01–18) se completan con 15 pantallas nuevas (19–33) que cubren
los flujos que antes no tenían pantalla propia, en particular el saldado de mes (FR-12), la
edición/baja con recálculo (FR-13), la unión a un plan por código o QR (FR-27), la creación y
administración de sobres y grupos en cualquier momento (FR-04) y la moneda del plan (FR-40).
Una auditoría de navegación (`odd/tasks/navigation-audit.md`) encontró pantallas sin punto de
entrada y elementos tocables sin destino; su Lote A agrega 6 pantallas más (34, 35, 36, 37, 38,
45), la tarjeta "Listo para asignar" en 02 y 04, y "Unirme con código" en 16 (ver el detalle en
9.1 y 9.3). Su Lote B agrega 6 pantallas y hojas de confirmación más (39–44): un menú de cuenta,
opciones de meta, el alta/edición de beneficiarios, la edición de cuenta (con archivado en vez de
borrado) y las confirmaciones de "Eliminar sobre" y "Eliminar grupo" — cierra así los entry
points que quedaban pendientes (13, 14, 01/06, 05, 15, 23, 32) y agrega los chevrons y estados
que faltaban (ver 9.1 y el Mapa de navegación en 9.4). Un dataset canónico
(`odd/tasks/canonical-dataset.md`) unificó los números de cada pantalla y agregó **46 Asigná tu
dinero**, la asignación masiva del saldo inicial entre los 12 sobres recién creados, que cierra
el flujo de onboarding (F1) y de plan mensual (F3) entre 35 Plantilla sugerida y 02 Plan del mes.
Una auditoría de consistencia entre pantallas del mismo tipo (`odd/tasks/pattern-consistency.md`,
ver 6.1 Convenciones) agregó **47 Eliminar beneficiario** y **48 Archivar cuenta**, las hojas de
confirmación que faltaban para los links rojos de 41 Beneficiario y 42 Editar cuenta.
`odd/tasks/goal-photo-and-states.md` agregó **49 Movimientos · recalculado**, que separa el
toast «Recalculado» de 12 Editar movimiento en su propio estado posterior al guardado, y
**50 Foto de la meta**, la hoja donde se elige, cambia o quita la foto de una meta (FR-41). La
tarjeta "+ Nueva meta" de 01 abre **31 Nuevo sobre** con el grupo Metas preseleccionado; cuando
el grupo es Metas, 31 muestra además una fila opcional "Foto" (→ 50) junto al resto del
formulario — no se redibujó 31 para este documento porque su demo actual ilustra el grupo Día a
día, y forzar la fila ahí mostraría un estado inconsistente con el grupo elegido. Sin foto, la
tarjeta de la meta (`GoalCard`) usa un tinte lavanda con un ícono en vez de la fotografía.
`design/build-components.js` genera
además una página `Flujos` (después de la página de pantallas) que agrupa las 48 pantallas en 9
franjas (F1–F8, con F6 dividido en F6a/F6b), cada una como una franja horizontal con sus pasos
numerados y flechas entre pasos. Cada paso de un flujo es una **instancia (`ref`) de la pantalla
real**, no una copia: los flujos quedan sincronizados con las pantallas automáticamente.

### 9.1 Inventario de pantallas

| # | Pantalla | Flujo | FRs |
|---|----------|-------|-----|
| 01 | Inicio | F8 · Metas, beneficiarios y reportes | FR-05, FR-19, FR-26 |
| 02 | Plan del mes | F3 · Plan mensual · F4a · Sobres y grupos | FR-09, FR-10, FR-15, FR-16, FR-21, FR-04 |
| 03 | Asignar dinero | F3 · Plan mensual | FR-09, FR-10 |
| 04 | Plan · mes futuro | F3 · Plan mensual | FR-10, FR-15 |
| 05 | Detalle de meta | F8 · Metas, beneficiarios y reportes | FR-19 |
| 06 | Plan vacío | F3 · Plan mensual | FR-16 |
| 07 | Nuevo movimiento | F6 · Movimientos | FR-06, FR-07, FR-18 |
| 08 | Dividir pago | F6 · Movimientos | FR-14 |
| 09 | Registrar ingreso | F6 · Movimientos | FR-08 |
| 10 | Movimientos | F6 · Movimientos | FR-07, FR-22 |
| 11 | Filtrar movimientos | F6 · Movimientos | FR-22 |
| 12 | Editar movimiento | F6 · Movimientos | FR-13 |
| 13 | Cuentas | F7 · Cuentas | FR-03, FR-17 |
| 14 | Detalle de cuenta | F7 · Cuentas | FR-17 |
| 15 | Beneficiarios | F8 · Metas, beneficiarios y reportes | FR-05, FR-23 |
| 16 | Planes y miembros | F2 · Planes | FR-02, FR-40 |
| 17 | Reportes | F8 · Metas, beneficiarios y reportes | FR-26 |
| 18 | Acceso | F1 · Acceso | FR-01 |
| 19 | Crear cuenta **(nueva)** | F1 · Acceso | FR-01 |
| 20 | Nuevo plan **(nueva)** | F2 · Planes | FR-02, FR-40 |
| 21 | Invitar miembro **(rediseñada)** | F2 · Planes | FR-27 |
| 22 | Detalle de sobre **(nueva)** | F4b · Detalle y movimiento de sobre | FR-04, FR-19, FR-24 |
| 23 | Editar sobre **(nueva)** | F4b · Detalle y movimiento de sobre | FR-04, FR-19, FR-20 |
| 24 | Mover dinero **(nueva)** | F4b · Detalle y movimiento de sobre | FR-25 |
| 25 | Cierre de mes **(nueva)** | F5 · Cierre de mes | FR-11, FR-12 |
| 26 | Elegir beneficiario **(nueva)** | F6 · Movimientos | FR-23 |
| 27 | Eliminar movimiento **(nueva)** | F6 · Movimientos | FR-13 |
| 28 | Nueva cuenta **(nueva)** | F7 · Cuentas | FR-03 |
| 29 | Transferencia **(nueva)** | F7 · Cuentas | FR-28 |
| 30 | Unirse a un plan **(nueva)** | F2 · Planes | FR-27 |
| 31 | Nuevo sobre **(nueva)** | F4a · Sobres y grupos | FR-04 |
| 32 | Grupos **(nueva)** | F4a · Sobres y grupos | FR-04 |
| 33 | Plan en dólares **(nueva)** | F2 · Planes | FR-40 |
| 34 | Bienvenida **(nueva)** | F1 · Acceso | FR-01 |
| 35 | Plantilla sugerida **(nueva)** | F3 · Plan mensual | FR-04, FR-16 |
| 36 | Elegir sobre **(nueva)** | F6a · Registrar movimiento | FR-06, FR-18 |
| 37 | Elegir cuenta **(nueva)** | F7 · Cuentas | FR-03, FR-28 |
| 38 | Fecha y hora **(nueva)** | F6a · Registrar movimiento | FR-06 |
| 39 | Menú de cuenta **(nueva, Lote B)** | F8 · Metas, beneficiarios y reportes | FR-05, FR-26, FR-27 |
| 40 | Opciones de meta **(nueva, Lote B)** | F8 · Metas, beneficiarios y reportes | FR-19 |
| 41 | Beneficiario **(nueva, Lote B)** | F8 · Metas, beneficiarios y reportes | FR-05, FR-23 |
| 42 | Editar cuenta **(nueva, Lote B)** | F7 · Cuentas | FR-03 |
| 43 | Eliminar sobre **(nueva, Lote B)** | F4b · Detalle y movimiento de sobre | FR-04 |
| 44 | Eliminar grupo **(nueva, Lote B)** | F4a · Sobres y grupos | FR-04 |
| 45 | Unirse desde enlace **(nueva)** | F2 · Planes | FR-27 |
| 46 | Asigná tu dinero **(nueva)** | F3 · Plan mensual | FR-04, FR-09, FR-16 |
| 47 | Eliminar beneficiario **(nueva)** | F8 · Metas, beneficiarios y reportes | FR-05, FR-23 |
| 48 | Archivar cuenta **(nueva)** | F7 · Cuentas | FR-03 |
| 49 | Movimientos · recalculado **(nueva)** | F6b · Historial de movimientos | FR-13 |
| 50 | Foto de la meta **(nueva)** | F8 · Metas, beneficiarios y reportes | FR-41 |
| 51 | Cuentas archivadas **(nueva)** | F7 · Cuentas | FR-03 |
| 52 | Elegir grupo **(nueva)** | F4a · Sobres y grupos | FR-04 |
| 53 | Asignar · monto propio **(nueva)** | F3 · Plan mensual | FR-09, FR-10 |

Las pantallas 39–48 (Menú de cuenta, Opciones de meta, Beneficiario nuevo/editar, Editar
cuenta, las hojas de confirmación "Eliminar sobre"/"Eliminar grupo", y las hojas 47/48 de la
auditoría de consistencia) ya existen en `design/app.base.op`.

`odd/tasks/archived-groups-custom-amount.md` cerró tres brechas que el usuario encontró al
revisar el diseño: **51 Cuentas archivadas** (desde la fila muda "Archivadas · 1" al final de
13 Cuentas), con la cuenta Brubank archivada el 12 de agosto en $ 0 y su chip "Restaurar";
**52 Elegir grupo**, la hoja con selección por radio que faltaba para el campo "Grupo" de
31 Nuevo sobre y 23 Editar sobre (solo 4 grupos, así que el buscador de la convención de
selectores es opcional aquí — la misma excepción que 38 Fecha y hora — y su última fila
"+ Nuevo grupo" se muestra ya expandida, con "Hogar" escrito, como estado de referencia); y
**53 Asignar · monto propio**, el estado de 03 Asignar dinero después de tocar el
`AmountCapsule`, con la calculadora visible y el carrusel de sobres y los chips de mes
reemplazados por una tarjeta compacta del sobre elegido. De paso corrigió la etiqueta "Súper"
de 03 a "Supermercado", por la convención de nombres.

### 9.2 Flujos (página `Flujos`)

| Flujo | Pasos | FRs |
|---|---|---|
| **F1 · Acceso** | 18 Acceso → 19 Crear cuenta → 34 Bienvenida → 20 Nuevo plan → 06 Plan vacío → 28 Nueva cuenta | FR-01 |
| **F2 · Planes** | 16 Planes y miembros → 20 Nuevo plan → 33 Plan en dólares → 21 Invitar miembro → 30 Unirse a un plan → 45 Unirse desde enlace | FR-02, FR-27, FR-40 |
| **F3 · Plan mensual** | 06 Plan vacío → 35 Plantilla sugerida → 46 Asigná tu dinero → 02 Plan del mes → 03 Asignar dinero → 53 Asignar · monto propio → 04 Plan · mes futuro | FR-09, FR-10, FR-15, FR-16, FR-21 |
| **F4a · Sobres y grupos** | 02 Plan del mes → 31 Nuevo sobre → 52 Elegir grupo → 32 Grupos → 44 Eliminar grupo | FR-04 |
| **F4b · Detalle y movimiento de sobre** | 22 Detalle de sobre → 23 Editar sobre → 43 Eliminar sobre → 24 Mover dinero | FR-19, FR-20, FR-24, FR-25 |
| **F5 · Cierre de mes** | 25 Cierre de mes | FR-11, FR-12 |
| **F6a · Registrar movimiento** | 07 Nuevo movimiento → 36 Elegir sobre → 38 Fecha y hora → 26 Elegir beneficiario → 08 Dividir pago | FR-06, FR-07, FR-08, FR-18 |
| **F6b · Historial de movimientos** | 09 Registrar ingreso → 10 Movimientos → 11 Filtrar movimientos → 12 Editar movimiento → 49 Movimientos · recalculado → 27 Eliminar movimiento | FR-13, FR-14, FR-22, FR-23 |
| **F7 · Cuentas** | 13 Cuentas → 14 Detalle de cuenta → 42 Editar cuenta → 48 Archivar cuenta → 51 Cuentas archivadas → 28 Nueva cuenta → 37 Elegir cuenta → 29 Transferencia | FR-03, FR-17, FR-28 |
| **F8 · Metas, beneficiarios y reportes** | 01 Inicio → 39 Menú de cuenta → 05 Detalle de meta → 40 Opciones de meta → 50 Foto de la meta → 15 Beneficiarios → 41 Beneficiario → 47 Eliminar beneficiario → 17 Reportes (accesos independientes desde Inicio, no un recorrido lineal; la franja los muestra en secuencia) | FR-05, FR-19, FR-26, FR-41 |

F6 se dividió en dos franjas (F6a/F6b) al superar las ~8 pantallas recomendadas por franja
después de sumar los selectores 36 y 38. El dataset canónico agregó 46 a F3, y la auditoría de
consistencia agregó 47 a F8 (después de 41) y 48 a F7 (después de 42).
`odd/tasks/goal-photo-and-states.md` agregó 49 a F6b (después de 12) y 50 a F8 (después de 40).
F8 queda en 9 pantallas, apenas sobre las ~8 recomendadas; no se dividió porque los tres accesos
que agrupa (menú de cuenta, metas y sus opciones, beneficiarios, reportes) siguen leyéndose como
una sola franja de referencia, no como un recorrido lineal.
`odd/tasks/archived-groups-custom-amount.md` agregó 53 a F3 (después de 03) y 51 a F7 (después de
48); agregar 52 después de 31 llevó a F4 a 9 pantallas, así que esa franja se dividió en **F4a ·
Sobres y grupos** (crear un sobre, elegir su grupo, y administrar los grupos con su confirmación
de borrado) y **F4b · Detalle y movimiento de sobre** (ver el detalle de un sobre, editarlo o
mover dinero entre sobres, con su confirmación de borrado), con el mismo criterio de reparto que
F6a/F6b.

**Notas de diseño de las 15 pantallas nuevas y la rediseñada:**

- Reutilizan los mismos nombres y estructuras de nodo que las 18 originales
  (`StatusBar`, `BottomNav`, `Field/…`, `Input/…`, `Chip/…`, `SaveBar`, `AmountCapsule`,
  `Envelope/…`, `Account/…`, `Tx/…`, `Payee/…`, `Member/…`), así que
  `design/build-components.js` las convierte en instancias de los mismos maestros.
- 23 Editar sobre y 27 Eliminar movimiento muestran la confirmación destructiva
  (texto rojo + paso de confirmación) exigida por el diseño. 25 Cierre de mes muestra el
  chequeo de cuadre con números reales (`$ 1.000.000 − $ 938.000 − $ 20.000 = $ 42.000`, el
  nuevo "Listo para asignar" de octubre tras arrastrar sobrantes y descontar el sobregiro de
  septiembre) y una marca de éxito. 19 Crear cuenta y
  30 Unirse a un plan muestran un estado de error inline.
- 16 Planes y miembros reemplaza el campo y botón de invitación por email por una única
  acción de ancho completo "Invitar con código". 21 Invitar miembro se rediseña alrededor
  del código generado (`K7M-4QX`, con copia) y su QR, con los chips de rol (Editor/Lector),
  el vencimiento a 24 h y las acciones "Compartir código" / "Generar otro código" (FR-27).
  30 Unirse a un plan es la vista de quien se une: ingresa el código o escanea el QR con la
  misma vigencia y validación de uso único.
- 26 Elegir beneficiario y 27 Eliminar movimiento son hojas inferiores (`Dimmed` + `Sheet`),
  con el mismo patrón que 11 Filtrar movimientos.
- 02 Plan del mes agrega un `IconButton/plus` a cada encabezado de grupo (crea un sobre en
  ese grupo, abre 31) y una fila "Nuevo grupo" / "Editar grupos" (abre 32) después del
  último grupo, así que crear o administrar sobres y grupos ya no depende de 06 Plan vacío
  (FR-04). 31 Nuevo sobre reutiliza el selector de ícono y los chips de objetivo de 23
  Editar sobre. 32 Grupos lista los grupos con su cantidad de sobres, acciones de renombrar
  y borrar, un campo para crear uno nuevo y la nota "Al borrar un grupo, sus sobres pasan
  a…".
- 20 Nuevo plan reemplaza el campo de texto de moneda por una tarjeta selectora de 4
  opciones (Pesos $ · Dólares US$ · Euros € · Bolivianos Bs.) con la elegida marcada en lavanda, y la nota
  "No se puede cambiar después de crear el plan." (FR-40). 16 Planes y miembros muestra la
  moneda de cada plan junto a sus miembros, y agrega el plan "Viaje a Chile" (solo Sofía,
  dólares) como ejemplo de un plan en otra moneda. 33 Plan en dólares es la vista de Plan
  del mes de ese plan: el encabezado lleva una cápsula "US$" junto al nombre, la tarjeta
  "Listo para asignar" y los sobres usan `US$` con 2 decimales, y `AmountCapsule` expone el
  símbolo de la moneda del plan como una propiedad más de la instancia (ver §8), en vez de
  tenerlo fijo en "$". La cuarta opción (Bolivianos, RRG-58) repite la fila del selector del
  render de 20, que sigue mostrando tres; un plan en bolivianos usa `Bs.` con 2 decimales en las
  mismas tarjetas que 33.

### 9.3 Lote A de la auditoría de navegación (pantallas 34–38, 45)

`odd/tasks/navigation-audit.md` detectó pantallas y acciones sin punto de entrada. Este lote
agrega las siguientes piezas:

- **02 Plan del mes y 04 Plan · mes futuro** muestran ahora la tarjeta `JoinedCard`
  ("Listo para asignar") justo debajo del selector de mes, con el mismo monto que 01 Inicio
  en 02 ($ 48.200 para septiembre) y el "+" lavanda que abre 03 Asignar dinero. En 04 la
  tarjeta muestra el Listo para asignar de ese mes futuro ($ 120.000), que coincide con el
  monto "Reservado desde septiembre" del aviso debajo: ese Listo para asignar es justamente
  lo reservado con anticipación. Para que entre sin recortarse, 02 quita la fila de chips de
  filtro (Todos/Sobregirados/Falta/Cubiertos, de valor bajo en esta pantalla) y ajusta
  espaciados.
- **34 Bienvenida** aparece después de 19 Crear cuenta y antes de 20 Nuevo plan (F1). Pregunta
  "¿Cómo querés empezar?" con dos tarjetas grandes: "Crear mi plan" (→ 20 Nuevo plan, resaltada
  en lavanda) y "Tengo un código" (→ 30 Unirse a un plan), más una nota de que el QR también
  funciona con la cámara del teléfono.
- **35 Plantilla sugerida** se abre desde "Usar plantilla sugerida" en 06 Plan vacío. Muestra
  los 4 grupos y 12 sobres de la plantilla aprobada (Obligaciones: Alquiler, Servicios,
  Internet y celular · Día a día: Transporte, Supermercado, Farmacia, Comida afuera ·
  Disfrutar: Salidas, Suscripciones, Regalos · Metas: Emergencia, Vacaciones), todos
  tildados por defecto (los 12) y desmarcables uno por uno; la nota "Se crean sin objetivo y en
  $ 0. Después los ajustás."; y un botón primario cuyo texto refleja la cantidad tildada
  ("Crear 12 sobres" con todo tildado, o "Crear 11 sobres" si se desmarcó uno). La lista es
  más alta que la pantalla: se recorta a una altura fija con un degradado (fade) que insinúa
  que hay más sobres debajo, en vez de cortarse en seco; el botón y la nota quedan siempre
  visibles, fuera del área recortada. Los chips de vista previa en 06 se actualizaron para
  reflejar la plantilla ("Alquiler · Supermercado · Salidas · Emergencia · +8"). Desde 06, "Usar
  plantilla sugerida" también lleva a **46 Asigná tu dinero** después de crear los 12 sobres,
  para repartir de una vez el saldo inicial del plan entre ellos (ver el dataset canónico en
  `odd/tasks/canonical-dataset.md`).
- **36 Elegir sobre**, **37 Elegir cuenta** y **38 Fecha y hora** son las hojas inferiores que
  faltaban para los campos "Sobre", "Cuenta" y "Fecha y hora" de 07/09/12/29 y el filtro de 11
  y 24. Siguen el mismo patrón de picker que 26 Elegir beneficiario: `StatusBar` + `Dimmed`
  (con la altura numérica ajustada para que la hoja llegue al borde inferior) + `Sheet` con
  manija, título y acción de cerrar.
  - 36 agrupa los sobres por grupo con su monto Disponible; un sobre sobregirado se ve en
    rojo (Transporte, −$ 6.200) y el sobre actual queda tildado (Supermercado).
  - 37 lista las cuentas con su saldo (Banco Nación, Mercado Pago, Efectivo) y tilda la
    cuenta actual (Banco Nación).
  - 38 combina un calendario mensual (con el día actual resaltado) y un selector de hora y
    minuto, con el valor actual "Hoy, 14:32" arriba y un botón "Listo" para confirmar.
  - Estas tres pantallas quedan conectadas en las franjas F6a (36, 38) y F7 (37); la conexión
    explícita de los campos de 07/09/11/12/24/29 a estas hojas está documentada en el Mapa de
    navegación (9.5), agregado en el Lote B.
- **25 Cierre de mes** no tiene un tap que la abra: se muestra automáticamente la primera vez
  que el usuario abre un mes cuyo mes anterior todavía necesita saldarse (FR-11/FR-12). Es un
  trigger de sistema, no una navegación manual, así que no aparece como "elemento → 25" en
  ningún otro lienzo.
- **16 Planes y miembros** agrega la acción "Unirme con código" (→ 30 Unirse a un plan) al
  lado de "Nuevo plan", como una fila de dos chips de igual ancho en vez del chip de ancho
  completo anterior; el cambio no agrega alto, así que no hay riesgo de recorte.
- **45 Unirse desde enlace** cubre el caso de enlace profundo (`sobres.app/unirse/<code>`):
  la app abre con el código ya prefilado. Muestra la vista previa del plan
  ("Casa con Juli · administrado por Sofía · pesos ($) · rol Editor"), el código `K7M-4QX` ya
  cargado, la acción primaria "Unirme a Casa con Juli" y la secundaria
  "No soy yo / usar otro código" para el caso de que el enlace no sea para quien lo abrió.

**Patrón de selector (picker)**: cuando un campo de formulario necesita un selector de una
lista (sobre, cuenta, beneficiario, fecha y hora, grupo), se resuelve siempre como una hoja
inferior sobre fondo atenuado (`Dimmed` + `Sheet`, con manija y cierre en la esquina superior
derecha), nunca como una navegación de página completa ni como un menú flotante. 26, 27, 36, 37
y 38 comparten esta convención, y el Lote B la reutiliza en 39, 40, 43 y 44 (menús y
confirmaciones, ver 9.4). `odd/tasks/archived-groups-custom-amount.md` agregó **52 Elegir
grupo**, que también la sigue pero sin buscador (ver la convención 9 en 6.1): además de las
filas con radio, su última fila "+ Nuevo grupo" se muestra expandida en el mismo lugar en vez de
navegar a otra pantalla, con un campo de nombre y un `PrimaryButton` "Crear".

### 9.4 Lote B de la auditoría de navegación (pantallas 39–44)

El Lote B cierra los entry points y taps sin destino que quedaban del Lote A (ver el Mapa de
navegación en 9.5 para el detalle completo elemento → destino). Agrega:

- **39 Menú de cuenta**: hoja abierta desde el Avatar de 01 y 06 (antes sin destino). Muestra el
  nombre y el email de la usuaria, y tres accesos — "Planes y miembros" (→ 16), "Beneficiarios"
  (→ 15), "Unirme con código" (→ 30) — más un "Cerrar sesión" en rojo, sin confirmación
  adicional (es una acción reversible con solo volver a iniciar sesión).
- Se quita la campana de 01 y 06. En 01, un `IconButton/bar-chart` (Reportes, → 17) ocupa su
  lugar en el encabezado, así el layout queda balanceado; en 06 el encabezado se queda solo con
  el Avatar.
- **13 Cuentas**: el "+" lavanda de su `JoinedCard` (ya existía visualmente) queda conectado a
  28 Nueva cuenta.
- **14 Detalle de cuenta**: se agrega una acción "Transferir" (ícono `arrow-left-right`, →
  29 Transferencia) agrupada junto al lápiz de edición (→ **42 Editar cuenta**, nueva) en la
  esquina superior derecha.
- **42 Editar cuenta**: el formulario de 28 prefilado (nombre, tipo, saldo inicial), más un
  link rojo "Archivar cuenta" (la auditoría de consistencia reemplazó la nota desplegable
  original por el mismo patrón de link + hoja de confirmación que 41/23/32) que abre **48
  Archivar cuenta**, en vez de un borrado real, porque el saldo se deriva de las transacciones
  (FR-03; ver también PRD.md).
- **05 Detalle de meta**: el "…" (ya existía) queda conectado a **40 Opciones de meta**, hoja
  con "Editar meta" (→ 23 Editar sobre, que ya cubre el objetivo de una meta) y un "Eliminar
  meta" en rojo, que dispara la misma confirmación que 27 Eliminar movimiento (mismo patrón,
  sin una pantalla numerada propia). Los tiles "Últimos aportes" y "Plan de aportes" (→ 22
  Detalle de sobre) ya llevaban su propio ícono `arrow-up-right` como pista visual: no hizo
  falta agregar un chevron.
- **23 Editar sobre**: se quita la `x`, queda solo la flecha atrás (consistente con 06, 31 y
  32). "Eliminar sobre" abre **43 Eliminar sobre**, una hoja de confirmación como 27: pregunta
  "¿Eliminar "Supermercado"?", muestra el sobre y aclara que sus movimientos pasan a «Sin sobre»
  y que su disponible ($ 47.550) vuelve a Listo para asignar, con Cancelar / Eliminar (rojo).
- **32 Grupos**: el ícono de basura por grupo (ya existía) queda conectado a **44 Eliminar
  grupo**, la misma confirmación aplicada a un grupo: "¿Eliminar "Día a día"?", con la nota de
  que sus 2 sobres pasan a «Sin grupo» sin perder dinero ni movimientos.
- **15 Beneficiarios**: el "+" y las filas (ya existían, con su chevron) quedan conectados a
  **41 Beneficiario**, un formulario con el nombre, un sobre sugerido (`Field/Sobre` → 36
  Elegir sobre), la cantidad de movimientos con un link "Ver movimientos" (→ 10), y un
  "Eliminar beneficiario" en rojo que abre **47 Eliminar beneficiario** (la auditoría de
  consistencia agregó esta hoja: conserva los movimientos pasados, sin beneficiario asignado,
  FR-05).
- **06 Plan vacío**: el estado activo de `NavCluster` pasa de Inicio a Plan (billetera), y el
  "+" del `JoinedCard` se ve mudo (gris `#EDEDED`/`#ABABAB`, no lavanda) porque hay 0 sobres. La
  auditoría de consistencia reemplazó luego el encabezado de Avatar/saludo (que pertenecía a 01)
  por el mismo encabezado de pestaña que 02 (título "Plan", `layers` + lupa, `MonthSwitch`); ver
  6.1 Convenciones.
- **31 Nuevo sobre**: se selecciona "Mensual" (antes "Sin objetivo") para mostrar el campo de
  seguimiento — el mismo `AmountCapsule` de objetivo que usa 23 — entre los chips y el
  `SaveBar`, sin recortarse en el fondo.
- **33 Plan en dólares**: agrega el mismo `IconButton/layers` (→ 32 Grupos) que 02 ya tiene en
  su encabezado junto a la lupa, para administrar grupos también en un plan en otra moneda.
- **Chevrons de fila**: ver la decisión en §8 (ninguno en `EnvelopeRow`/`TxRow`/`AccountRow`;
  `PayeeRow` ya lo tenía).
- **`SaveBar` Disabled**: ver §8.

### 9.5 Mapa de navegación

Para que nada aparezca de la nada: cada pantalla, su punto (o puntos) de entrada, y el destino
de cada elemento tocable. Los estados internos (chips, filtros, toggles, pickers de ícono) que
no navegan se marcan "en el lugar"; el picker de sobre/cuenta/fecha se abrevia 36/37/38.

| # | Pantalla | Entra desde | Elemento → Destino |
|---|---|---|---|
| 01 | Inicio | `NavCluster` (Inicio); tras 18/20/30/34/45 | Avatar → 39 · Reportes (bar-chart) → 17 · `JoinedCard` "+" → 03 · `GoalCard` → 05 · "+ Nueva meta" → 31 (grupo Metas preseleccionado) · `NavCluster` → 02 / 07 / 10 / 13 |
| 02 | Plan del mes | `NavCluster` (Plan); tras 03/06/24/31/35 | `layers` → 32 · lupa → busca en el lugar · Filtros → filtra en el lugar · mes ‹/› → cambia de mes en el lugar · `JoinedCard` "+" → 03 · "+" por grupo → 31 · `EnvelopeRow` → 22 · `NavCluster` → 01 / 07 / 10 / 13 |
| 03 | Asignar dinero | `JoinedCard` "+" en 02/04 | atrás → 02/04 · `AmountCapsule` → 53 (monto propio, con calculadora) · `SaveBar` "Asignar" → confirma, vuelve a 02/04 |
| 04 | Plan · mes futuro | Navegación a un mes futuro desde 02 | mes ‹/› → cambia de mes en el lugar · `JoinedCard` "+" → 03 · `EnvelopeRow` → 22 · `NavCluster` → 01 / 07 / 10 / 13 |
| 05 | Detalle de meta | `GoalCard` en 01 | atrás → 01 · "…" → 40 · Tiles (Últimos aportes / Plan de aportes) → 22 · "Asignar a esta meta" → 03 |
| 06 | Plan vacío | `NavCluster` (Plan) con 0 sobres | `layers` → 32 · lupa → busca en el lugar · mes ‹/› → cambia de mes en el lugar · `JoinedCard` "+" → mudo (0 sobres) · "Usar plantilla sugerida" → 35 · "Crear sobre vacío" → 31 · `NavCluster` → 01 / 07 / 10 / 13 |
| 07 | Nuevo movimiento | `NavCluster` "+" | atrás/x → cancela · Toggle Gasto/Ingreso → 09 (modo Ingreso) · Sobre → 36 · Cuenta → 37 · Fecha y hora → 38 · Beneficiario → 26 · "Dividir" → 08 · calculadora → teclado en el lugar · `SaveBar` → guarda, toast "Movimiento guardado" |
| 08 | Dividir pago | "Dividir" en 07 | atrás/x → 07 · fila "Elegí un sobre" → 36 · `SaveBar` (Disabled hasta cuadrar) → confirma |
| 09 | Registrar ingreso | `NavCluster` "+" con Toggle → Ingreso | Toggle → 07 (modo Gasto) · Sobre/Listo para asignar → 36 · Cuenta → 37 · Fecha y hora → 38 · `SaveBar` → guarda |
| 10 | Movimientos | `NavCluster` (Movimientos) | lupa → busca en el lugar · sliders → 11 · `TxRow` → 12 · `NavCluster` → 01 / 02 / 07 / 13 |
| 11 | Filtrar movimientos | ícono de filtros en 10 | Sobre → 36 · Cuenta → 37 · Fecha y hora → 38 · cerrar → 10 (aplica filtros) |
| 12 | Editar movimiento | `TxRow` en 10/14 | atrás → cancela · Sobre → 36 · Cuenta → 37 · Fecha y hora → 38 · `SaveBar` → guarda, vuelve a 49 con el toast «Recalculado» · papelera (arriba a la derecha) → 27 |
| 13 | Cuentas | `NavCluster` (Cuentas) | lupa → busca en el lugar · `JoinedCard` "+" → 28 · `AccountRow` → 14 · "Archivadas · 1" → 51 · `NavCluster` → 01 / 02 / 07 / 10 |
| 14 | Detalle de cuenta | `AccountRow` en 13 | atrás → 13 · Transferir → 29 · lápiz → 42 · `TxRow` → 12 · `NavCluster` → 01 / 02 / 07 / 10 |
| 15 | Beneficiarios | "Beneficiarios" en 39 | atrás → 39 · "+" → 41 (nuevo) · fila (con chevron) → 41 (editar) · lupa → busca en el lugar |
| 16 | Planes y miembros | "Planes y miembros" en 39 | atrás → 39 · `PlanRow` → 02/33 del plan · "Nuevo plan" → 20 · "Unirme con código" → 30 |
| 17 | Reportes | Reportes en 01 | atrás → 01 · rango de fecha → filtra en el lugar · tabs Gastos/Ingresos/Patrimonio → cambia en el lugar |
| 18 | Acceso | Apertura sin sesión | "Iniciar sesión" → 01/02 · "Crear cuenta" → 19 |
| 19 | Crear cuenta | "Crear cuenta" en 18; QR sin cuenta | "Crear cuenta" → 34 · "Iniciar sesión" → 18 |
| 20 | Nuevo plan | 34 "Crear mi plan"; 16 "Nuevo plan" | Moneda → elige en el lugar · `SaveBar` "Crear plan" → 02 |
| 21 | Invitar miembro | Gestión del plan desde 16 | "Compartir código" → hoja nativa · "Generar otro código" → regenera en el lugar, toast "Copiado" al tocar el código · atrás → 16 |
| 22 | Detalle de sobre | `EnvelopeRow` en 02/04; Tiles en 05 | atrás → 02 · lápiz → 23 · "Mover dinero" → 24 · `TxRow` → 12 |
| 23 | Editar sobre | lápiz en 22; "Editar meta" en 40 | atrás → 22 (sin `x`, Lote B) · Grupo → 52 · Tipo de objetivo → en el lugar · chips de monto → fijan el objetivo · cápsula → teclado para monto propio (como 53) · `SaveBar` → guarda, vuelve a 22 · papelera (arriba a la derecha) → 43 |
| 24 | Mover dinero | "Mover dinero" en 22 | atrás/x → 22 · sobres Desde/Hacia → 36 · `SaveBar` → confirma, vuelve a 22/02 |
| 25 | Cierre de mes | Trigger de sistema (mes sin saldar) | "Empezar [mes]" → confirma, vuelve a 02 |
| 26 | Elegir beneficiario | Beneficiario en 07/09/12 | fila → selecciona y vuelve · "Crear…" → crea y vuelve |
| 27 | Eliminar movimiento | eliminar en 12 | Cancelar → 12 · Eliminar → confirma, vuelve a 49 con el toast «Movimiento eliminado · Agosto y septiembre actualizados · Deshacer» |
| 28 | Nueva cuenta | "+" del `JoinedCard` en 13 | atrás → 13 · Tipo → en el lugar · `SaveBar` "Crear cuenta" → 13 |
| 29 | Transferencia | "Transferir" en 14 | atrás/x → 14 · Desde/Hacia → 37 · Fecha y hora → 38 · `SaveBar` "Transferir" → 14 |
| 30 | Unirse a un plan | 34 "Tengo un código"; 16 "Unirme con código" | código → ingresa en el lugar · "Escanear QR" → cámara nativa · "Unirme" → 02 |
| 31 | Nuevo sobre | "+" por grupo en 02; "Crear sobre vacío" en 06; "+ Nueva meta" en 01 (grupo Metas preseleccionado) | atrás → 02/06 · Ícono → elige en el lugar · Grupo → 52 · Objetivo (Sin objetivo/Mensual/Con fecha) → revela campo en el lugar · chips de monto → fijan el objetivo · cápsula → teclado para monto propio (como 53) · Foto (solo si Grupo = Metas) → 50 · `SaveBar` "Crear sobre" → 02 |
| 32 | Grupos | `layers` en 02/33 | atrás → 02/33 · lápiz por grupo → renombra en el lugar · basura por grupo → 44 · "Nuevo grupo" → crea en el lugar |
| 33 | Plan en dólares | `PlanRow` de un plan en otra moneda, en 16 | `layers` → 32 · lupa → busca en el lugar · `JoinedCard` "+" → 03 · "+" por grupo → 31 · `EnvelopeRow` → 22 · `NavCluster` → 01 / 07 / 10 / 13 del plan |
| 34 | Bienvenida | tras 19 Crear cuenta | "Crear mi plan" → 20 · "Tengo un código" → 30 |
| 35 | Plantilla sugerida | "Usar plantilla sugerida" en 06 | atrás → 06 · fila → tilda/destilda en el lugar · "Crear N sobres" → 46 |
| 36 | Elegir sobre | Sobre en 07/09/12/24; filtro en 11 | lupa → filtra en el lugar · fila → selecciona y vuelve |
| 37 | Elegir cuenta | Cuenta en 07/09/12/29; filtro en 11 | fila → selecciona y vuelve |
| 38 | Fecha y hora | Fecha y hora en 07/09/12/29; filtro en 11 | día → elige en el lugar · steppers → ajustan en el lugar · "Listo" → confirma y vuelve |
| 39 | Menú de cuenta **(Lote B)** | Avatar en 01 | cerrar → vuelve · "Planes y miembros" → 16 · "Beneficiarios" → 15 · "Unirme con código" → 30 · "Cerrar sesión" → 18 |
| 40 | Opciones de meta **(Lote B)** | "…" en 05 | cerrar → 05 · "Cambiar foto" → 50 · "Editar meta" → 23 · "Eliminar meta" → confirmación (patrón de 27) |
| 41 | Beneficiario **(Lote B)** | "+" y filas en 15 | atrás → 15 · Nombre → en el lugar (con chevron, fila editable) · Sobre → 36 · "Ver movimientos" → 10 (filtrado) · `SaveBar` "Guardar cambios" → 15 · papelera (arriba a la derecha) → 47 |
| 42 | Editar cuenta **(Lote B)** | lápiz en 14 | atrás → 14 · Nombre → en el lugar (con chevron, fila editable) · Tipo → en el lugar · `SaveBar` "Guardar cambios" → 14 · ícono de archivo (arriba a la derecha) → 48 |
| 43 | Eliminar sobre **(Lote B)** | "Eliminar sobre" en 23 | Cancelar → 23 · Eliminar → confirma, vuelve a 02 |
| 44 | Eliminar grupo **(Lote B)** | basura por grupo en 32 | Cancelar → 32 · Eliminar → confirma, vuelve a 32 |
| 46 | Asigná tu dinero **(nueva)** | "Crear N sobres" en 35 | atrás/x → 02 · campo de monto por sobre → edita en el lugar (recalcula "Te quedan…") · `PrimaryButton` "Listo" → 02 |
| 45 | Unirse desde enlace | enlace `sobres.app/unirse/<code>` con cuenta ya creada | "Unirme a [Plan]" → 02 · "No soy yo / usar otro código" → 30 |
| 47 | Eliminar beneficiario **(nueva)** | "Eliminar beneficiario" en 41 | Cancelar → 41 · Eliminar → confirma, vuelve a 15 |
| 48 | Archivar cuenta **(nueva)** | "Archivar cuenta" en 42 | Cancelar → 42 · Archivar → confirma, vuelve a 13 |
| 49 | Movimientos · recalculado **(nueva)** | tras guardar en 12; tras eliminar en 27 | Mismo comportamiento que 10, con el toast flotando sobre el `NavCluster` («Recalculado» si viene de 12, «Movimiento eliminado» si viene de 27) · `NavCluster` → 01 / 02 / 07 / 13 |
| 50 | Foto de la meta **(nueva)** | "Cambiar foto" en 40 | cerrar → 40 · "Elegir de la galería" → selector nativo (fuera de alcance del mockup) · "Sacar una foto" → cámara nativa (fuera de alcance del mockup) · miniatura de la grilla → selecciona en el lugar · "Quitar foto" → confirma en el lugar y vuelve a 40 · `PrimaryButton` "Listo" → 40 |
| 51 | Cuentas archivadas **(nueva)** | "Archivadas · 1" en 13 | atrás → 13 · "Restaurar" → restaura en el lugar (vuelve a sumar al saldo total) · "Ver movimientos" → 10 (filtrado) |
| 52 | Elegir grupo **(nueva)** | Grupo en 31/23 | cerrar → vuelve sin cambiar · fila → selecciona (radio) y vuelve · "+ Nuevo grupo" → expande el campo en el lugar · `PrimaryButton` "Crear" → crea, selecciona el grupo nuevo y vuelve |
| 53 | Asignar · monto propio **(nueva)** | `AmountCapsule` en 03 | atrás/x → 02/04 · calculadora → edita el monto en el lugar · `SaveBar` "Asignar" → confirma, vuelve a 02/04 |
