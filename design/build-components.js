// Builds the "Componentes" master-component page for design/app.op and
// rewires the 18 screens to reference those masters as `ref` instances with
// `descendants` overrides, per OpenPencil 0.8.4's verified component format
// (see odd/tasks/component-library.md).
//
// Usage: node design/build-components.js design/app.base.op design/app.op
// app.base.op holds the hand-edited screens; app.op is generated, never edit it directly.
"use strict";
const fs = require("fs");
const { blobPath } = require("./shapes");

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error("Usage: node build-components.js <input.op> <output.op>");
  process.exit(1);
}

const doc = JSON.parse(fs.readFileSync(input, "utf8"));

// ---------------------------------------------------------------------------
// id allocation - every node id must be unique document-wide
// ---------------------------------------------------------------------------
const usedIds = new Set();
(function collectIds(n) {
  if (Array.isArray(n)) return n.forEach(collectIds);
  if (!n || typeof n !== "object") return;
  if (typeof n.id === "string") usedIds.add(n.id);
  for (const k of Object.keys(n)) collectIds(n[k]);
})(doc);

let idSeq = 0;
function nid(tag) {
  let candidate;
  do {
    idSeq += 1;
    candidate = "cl-" + tag + "-" + idSeq;
  } while (usedIds.has(candidate));
  usedIds.add(candidate);
  return candidate;
}
function reserve(id) {
  if (usedIds.has(id)) throw new Error("id collision: " + id);
  usedIds.add(id);
  return id;
}

// ---------------------------------------------------------------------------
// node factories
// ---------------------------------------------------------------------------
const solid = (color) => [{ type: "solid", color }];

function text(content, opts = {}) {
  const t = {
    type: "text",
    id: opts.id || nid("text"),
    width: opts.width !== undefined ? opts.width : "fit_content",
    height: opts.height !== undefined ? opts.height : "fit_content",
    content,
    fontFamily: "Urbanist",
    fontSize: opts.size || 15,
    fontWeight: opts.weight || 400,
    fill: solid(opts.color || "#212121"),
  };
  if (opts.lineHeight) t.lineHeight = opts.lineHeight;
  if (opts.textGrowth) t.textGrowth = opts.textGrowth;
  return t;
}
function iconFont(name, opts = {}) {
  return {
    type: "icon_font",
    id: opts.id || nid("icon"),
    iconFontName: name,
    iconFontFamily: "lucide",
    width: opts.size || 18,
    height: opts.size || 18,
    fill: solid(opts.color || "#212121"),
  };
}
function rect(opts = {}) {
  return {
    type: "rectangle",
    id: opts.id || nid("rect"),
    name: opts.name,
    x: opts.x || 0,
    y: opts.y || 0,
    width: opts.width,
    height: opts.height,
    cornerRadius: opts.cornerRadius || 0,
    fill: solid(opts.color),
    children: [],
  };
}
function frame(name, opts = {}) {
  const f = {
    type: "frame",
    id: opts.id || nid("frame"),
  };
  if (name) f.name = name;
  f.width = opts.width !== undefined ? opts.width : "fit_content";
  f.height = opts.height !== undefined ? opts.height : "fit_content";
  if (opts.x !== undefined) f.x = opts.x;
  if (opts.y !== undefined) f.y = opts.y;
  if (opts.layout) f.layout = opts.layout;
  if (opts.gap !== undefined) f.gap = opts.gap;
  if (opts.padding !== undefined) f.padding = opts.padding;
  if (opts.justifyContent) f.justifyContent = opts.justifyContent;
  if (opts.alignItems) f.alignItems = opts.alignItems;
  if (opts.cornerRadius !== undefined) f.cornerRadius = opts.cornerRadius;
  if (opts.fill) f.fill = opts.fill;
  if (opts.stroke) f.stroke = opts.stroke;
  if (opts.clipContent) f.clipContent = true;
  if (opts.role) f.role = opts.role;
  f.children = opts.children || [];
  if (opts.reusable) f.reusable = true;
  return f;
}
// Joined-blob background shape (see design/shapes.js#blobPath and T9 in
// odd/tasks/component-library.md). In a `layout:"none"` parent, this must be
// the LAST child so it renders BEHIND its siblings (children[0] is on top).
function path(opts = {}) {
  const p = { type: "path", id: opts.id || nid("path") };
  if (opts.name) p.name = opts.name;
  p.x = opts.x || 0;
  p.y = opts.y || 0;
  p.width = opts.width;
  p.height = opts.height;
  p.d = opts.d;
  p.fill = opts.fill;
  if (opts.stroke) p.stroke = opts.stroke;
  if (opts.effects) p.effects = opts.effects;
  return p;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// padding helpers - used to resolve "fill_container" widths to numeric
// widths while walking the 18 screens (see T3 rules in the task file).
// ---------------------------------------------------------------------------
function horizontalPadding(padding) {
  if (padding === undefined || padding === null) return 0;
  if (typeof padding === "number") return padding * 2;
  if (Array.isArray(padding)) {
    if (padding.length === 4) return padding[1] + padding[3]; // top,right,bottom,left
    if (padding.length === 3) return padding[1] * 2; // top, horizontal, bottom
    if (padding.length === 2) return padding[1] * 2; // vertical, horizontal
    if (padding.length === 1) return padding[0] * 2;
  }
  return 0;
}
function verticalPadding(padding) {
  if (padding === undefined || padding === null) return 0;
  if (typeof padding === "number") return padding * 2;
  if (Array.isArray(padding)) {
    if (padding.length === 4) return padding[0] + padding[2]; // top,right,bottom,left
    if (padding.length === 3) return padding[0] + padding[2]; // top, horizontal, bottom
    if (padding.length === 2) return padding[0] * 2; // vertical, horizontal
    if (padding.length === 1) return padding[0] * 2;
  }
  return 0;
}
function resolveWidth(node, availWidth) {
  if (typeof node.width === "number") return node.width;
  if (node.width === "fill_container") return availWidth;
  return availWidth; // fit_content: best-effort, only used as a fallback
}

// ===========================================================================
// MASTER LIBRARY
// ===========================================================================
const masters = []; // ordered list of top-level reusable frames for the sheet
const groups = []; // { title, variants: [{ label, id (master root id) }] }

function addGroup(title, variantEntries) {
  // variantEntries: [{ label, node }]
  variantEntries.forEach((v) => masters.push(v.node));
  groups.push({
    title,
    variants: variantEntries.map((v) => ({ label: v.label, id: v.node.id, w: v.node.width, h: v.node.height })),
  });
}

// ---- StatusBar -------------------------------------------------------------
// Default (ink) for light screens, Light (white) for screens over a photo.
function statusBarMaster(name, rootId, color) {
  return frame(name, {
  id: rootId,
  width: 390,
  height: 50,
  layout: "horizontal",
  padding: [14, 28, 0, 34],
  justifyContent: "space_between",
  alignItems: "center",
  reusable: true,
  children: [
    text("9:41", { size: 16, weight: 600, color }),
    frame("Icons", {
      width: "fit_content",
      height: "fit_content",
      layout: "horizontal",
      gap: 6,
      alignItems: "center",
      children: [
        iconFont("signal", { size: 16, color }),
        iconFont("wifi", { size: 16, color }),
        iconFont("battery-full", { size: 22, color }),
      ],
    }),
  ],
  });
}
const statusBarRoot = reserve("m-statusbar");
const statusBarLightRoot = reserve("m-statusbar-light");
const statusBar = statusBarMaster("StatusBar/Default", statusBarRoot, "#212121");
const statusBarLight = statusBarMaster("StatusBar/Light", statusBarLightRoot, "#FFFFFF");
addGroup("StatusBar", [
  { label: "Default", node: statusBar },
  { label: "Light (over photos)", node: statusBarLight },
]);

// ---- NavCluster (bottom tab bar, overlapping circles) ----------------------
const NAV_TABS = [
  { key: "house", icon: "house", w: 60 },
  { key: "wallet", icon: "wallet", w: 60 },
  { key: "arrow-left-right", icon: "arrow-left-right", w: 60 },
  { key: "credit-card", icon: "credit-card", w: 60 },
];
// T9: the circles keep sitting exactly where the previous `layout:"horizontal"`
// (gap -8, justifyContent center) put them, but that's now replicated as
// explicit x/y positions in a `layout:"none"` root, because the glassmorphism
// tray behind them is a joined-blob `path` that must be the LAST child (see
// the z-order rule in odd/tasks/component-library.md) and paths don't
// participate in flex layout.
const NAVCLUSTER_GAP = 8; // circles sit apart, whole; the glass tray is what joins them
const NAVCLUSTER_W = 390; // full screen width: refs ignore the wrapper padding, so centre inside the master
const NAVCLUSTER_TRAY_MARGIN = 6; // extra room the tray lobe leaves around each circle
const NAVCLUSTER_TRAY_NECK = 10;
function navClusterMaster(activeKey, label) {
  const rootId = reserve("m-navcluster-" + activeKey.replace(/[^a-z-]/g, ""));
  const circles = []; // { w, node }
  NAV_TABS.forEach((tab) => {
    const active = tab.key === activeKey;
    circles.push({
      w: tab.w,
      node: frame("IconButton/" + tab.icon, {
        width: tab.w,
        height: tab.w,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: tab.w / 2,
        fill: solid(active ? "#212121" : "#FFFFFF"),
        children: [iconFont(tab.icon, { size: 22, color: active ? "#FFFFFF" : "#212121" })],
      }),
    });
    if (tab.key === "wallet") {
      // the chartreuse "+" action always sits between Plan and Movimientos
      circles.push({
        w: 64,
        node: frame("IconButton/plus", {
          width: 64,
          height: 64,
          layout: "horizontal",
          justifyContent: "center",
          alignItems: "center",
          cornerRadius: 32,
          fill: solid("#EAFC5F"),
          children: [iconFont("plus", { size: 24, color: "#212121" })],
        }),
      });
    }
  });

  const trayH = Math.max(...circles.map((c) => c.w)) + NAVCLUSTER_TRAY_MARGIN * 2;
  const contentW = circles.reduce((sum, c) => sum + c.w, 0) + NAVCLUSTER_GAP * (circles.length - 1);
  let x = (NAVCLUSTER_W - contentW) / 2;
  const lobes = [];
  const children = [];
  circles.forEach((c) => {
    c.node.x = x;
    c.node.y = (trayH - c.w) / 2; // vertical-centre this circle inside the tray
    children.push(c.node);
    lobes.push({ x: x - NAVCLUSTER_TRAY_MARGIN, w: c.w + NAVCLUSTER_TRAY_MARGIN * 2, r: (c.w + NAVCLUSTER_TRAY_MARGIN * 2) / 2 });
    x += c.w + NAVCLUSTER_GAP;
  });
  // Paths are stretched to their node box, so the tray box must match the lobes span exactly.
  const trayX = lobes[0].x;
  const trayW = lobes[lobes.length - 1].x + lobes[lobes.length - 1].w - trayX;
  const tray = path({
    name: "Tray",
    x: trayX,
    y: 0,
    width: trayW,
    height: trayH,
    d: blobPath(lobes.map((l) => Object.assign({}, l, { x: l.x - trayX })), trayH, NAVCLUSTER_TRAY_NECK),
    fill: solid("#FFFFFF8C"),
    stroke: { thickness: 1, fill: solid("#FFFFFFCC") },
    effects: [
      { type: "background_blur", radius: 24 },
      { type: "shadow", offsetX: 0, offsetY: 8, blur: 24, spread: 0, color: "#0000001F" },
    ],
  });
  children.push(tray); // LAST child: drawn behind the circles (layout:"none" z-order rule)

  return frame("NavCluster/" + label, {
    id: rootId,
    role: "bottom-tab-bar",
    width: NAVCLUSTER_W,
    height: trayH,
    layout: "none",
    reusable: true,
    children,
  });
}
const navInicio = navClusterMaster("house", "Inicio");
const navPlan = navClusterMaster("wallet", "Plan");
const navMovimientos = navClusterMaster("arrow-left-right", "Movimientos");
const navCuentas = navClusterMaster("credit-card", "Cuentas");
addGroup("NavCluster", [
  { label: "Inicio", node: navInicio },
  { label: "Plan", node: navPlan },
  { label: "Movimientos", node: navMovimientos },
  { label: "Cuentas", node: navCuentas },
]);

// ---- IconButton (circular) --------------------------------------------------
const ICONBUTTON_FAMILIES = {
  white: { bg: "#FFFFFF", icon: "#212121" },
  black: { bg: "#212121", icon: "#FFFFFF" },
  lavender: { bg: "#CFCAEC", icon: "#212121" },
  chartreuse: { bg: "#EAFC5F", icon: "#212121" },
  soft: { bg: "#EDEDED", icon: "#212121" },
  glass: { bg: "#FFFFFF33", icon: "#FFFFFF" },
  danger: { bg: "#C628281A", icon: "#C62828" },
};
const iconButtonMasters = {};
const iconButtonVariants = [];
for (const [key, c] of Object.entries(ICONBUTTON_FAMILIES)) {
  const rootId = reserve("m-iconbutton-" + key);
  const iconId = nid("iconbtn-icon-" + key);
  const iconNode = iconFont("star", { size: 20, color: c.icon, id: iconId });
  const master = frame("IconButton/" + cap(key), {
    id: rootId,
    width: 52,
    height: 52,
    layout: "horizontal",
    justifyContent: "center",
    alignItems: "center",
    cornerRadius: 26,
    fill: solid(c.bg),
    reusable: true,
    children: [iconNode],
  });
  iconButtonMasters[key] = { rootId, iconId, bg: c.bg, iconColor: c.icon };
  iconButtonVariants.push({ label: cap(key), node: master });
}
addGroup("IconButton", iconButtonVariants);
function classifyIconButtonFamily(bg) {
  if (bg === "#212121") return "black";
  if (bg === "#EAFC5F") return "chartreuse";
  if (bg === "#CFCAEC") return "lavender";
  if (bg === "#EDEDED") return "soft";
  if (bg === "#C628281A") return "danger";
  if (typeof bg === "string" && /^#FFFFFF[0-9A-Fa-f]{2}$/i.test(bg)) return "glass";
  return "white";
}

// ---- Button (full-width pill) ----------------------------------------------
const buttonPrimaryRoot = reserve("m-button-primary");
const buttonPrimaryIcon = nid("button-primary-icon");
const buttonPrimaryLabel = nid("button-primary-label");
const buttonPrimary = frame("Button/Primary", {
  id: buttonPrimaryRoot,
  width: 340,
  height: 56,
  layout: "horizontal",
  gap: 8,
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 28,
  fill: solid("#EAFC5F"),
  reusable: true,
  children: [
    iconFont("sparkles", { size: 18, color: "#212121", id: buttonPrimaryIcon }),
    text("Guardar", { size: 16, weight: 500, id: buttonPrimaryLabel }),
  ],
});
const buttonSecondaryRoot = reserve("m-button-secondary");
const buttonSecondaryIcon = nid("button-secondary-icon");
const buttonSecondaryLabel = nid("button-secondary-label");
const buttonSecondary = frame("Button/Secondary", {
  id: buttonSecondaryRoot,
  width: 340,
  height: 52,
  layout: "horizontal",
  gap: 8,
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 26,
  fill: solid("#F5F5F5"),
  reusable: true,
  children: [
    iconFont("plus", { size: 18, color: "#212121", id: buttonSecondaryIcon }),
    text("Crear sobre vacío", { size: 15, weight: 500, id: buttonSecondaryLabel }),
  ],
});
addGroup("Button", [
  { label: "Primary", node: buttonPrimary },
  { label: "Secondary", node: buttonSecondary },
]);

// ---- Chip -------------------------------------------------------------------
const chipDefaultRoot = reserve("m-chip-default");
const chipDefaultLabel = nid("chip-default-label");
const chipDefault = frame("Chip/Default", {
  id: chipDefaultRoot,
  width: 100,
  height: 44,
  layout: "horizontal",
  gap: 6,
  padding: [0, 18],
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 22,
  fill: solid("#FFFFFF"),
  reusable: true,
  children: [text("Chip", { size: 15, id: chipDefaultLabel })],
});
const chipSelectedRoot = reserve("m-chip-selected");
const chipSelectedLabel = nid("chip-selected-label");
const chipSelected = frame("Chip/Selected", {
  id: chipSelectedRoot,
  width: 100,
  height: 44,
  layout: "horizontal",
  gap: 6,
  padding: [0, 18],
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 22,
  fill: solid("#CFCAEC"),
  reusable: true,
  children: [text("Chip", { size: 15, id: chipSelectedLabel })],
});
const chipIconRoot = reserve("m-chip-defaulticon");
const chipIconIcon = nid("chip-icon-icon");
const chipIconLabel = nid("chip-icon-label");
const chipDefaultIcon = frame("Chip/DefaultIcon", {
  id: chipIconRoot,
  width: 140,
  height: 44,
  layout: "horizontal",
  gap: 6,
  padding: [0, 18],
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 22,
  fill: solid("#FFFFFF"),
  reusable: true,
  children: [
    iconFont("check", { size: 15, id: chipIconIcon }),
    text("Chip", { size: 15, id: chipIconLabel }),
  ],
});
addGroup("Chip", [
  { label: "Default", node: chipDefault },
  { label: "Selected", node: chipSelected },
  { label: "DefaultIcon", node: chipDefaultIcon },
]);

// ---- AmountCapsule ("$ | value", lavender joined blob) ----------------------
// T9: one fused shape - a round "$" lobe on the left, a long pill lobe on the
// right sized to the amount. The lobes are two transparent layout-only
// wrappers (for centring their text); the actual lavender fill is the single
// `path` LAST child, per the layout:"none" z-order rule.
const AMOUNTCAPSULE_CURRENCY_W = 64;
const AMOUNTCAPSULE_LOBE_GAP = 6; // x gap from the end of the currency lobe to the start of the value lobe
const AMOUNTCAPSULE_R = 32;
const AMOUNTCAPSULE_NECK = 9;
const AMOUNTCAPSULE_VALUE_PAD_LEFT = 26;
const AMOUNTCAPSULE_VALUE_PAD_RIGHT = 30;
const AMOUNTCAPSULE_H = 64;
function amountCapsuleShapeD(valueLobeW) {
  return blobPath(
    [
      { x: 0, w: AMOUNTCAPSULE_CURRENCY_W, r: AMOUNTCAPSULE_R },
      { x: AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP, w: valueLobeW, r: AMOUNTCAPSULE_R },
    ],
    AMOUNTCAPSULE_H,
    AMOUNTCAPSULE_NECK
  );
}
// Rough per-glyph width table for Urbanist at 1px font-size, tuned by eye
// against the amounts actually used on screen (T9); the only purpose is
// sizing the value lobe's FIXED numeric width for a given amount string,
// since a ref's child width must be a plain number (see constraints).
function estimateTextWidth(str, fontSize) {
  let em = 0;
  for (const ch of String(str)) {
    if (ch >= "0" && ch <= "9") em += 0.58;
    else if (ch === ".") em += 0.22;
    else if (ch === "$") em += 0.6;
    else if (ch === " ") em += 0.3;
    else em += 0.55;
  }
  return Math.ceil(em * fontSize);
}
const amountCapsuleRoot = reserve("m-amountcapsule");
const amountCapsuleValue = nid("amountcapsule-value");
const amountCapsuleValueWrap = nid("amountcapsule-valuewrap");
const amountCapsuleShapeId = nid("amountcapsule-shape");
// Plan currency support (currency+envelope task): the currency badge symbol
// ("$") gets an id so per-instance descendants overrides can swap it for
// "US$"/"€" - see the AmountCapsule conversion below, which also shrinks the
// font for multi-character symbols so they still fit the 48px badge circle.
const amountCapsuleCurrencySymbol = nid("amountcapsule-currency-symbol");
const AMOUNTCAPSULE_DEFAULT_VALUE_W = 160;
const amountCapsuleTotalW = AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP + AMOUNTCAPSULE_DEFAULT_VALUE_W;
const amountCapsule = frame("AmountCapsule", {
  id: amountCapsuleRoot,
  width: amountCapsuleTotalW,
  height: AMOUNTCAPSULE_H,
  layout: "none",
  reusable: true,
  children: [
    frame("Currency", {
      x: 0,
      y: 0,
      width: AMOUNTCAPSULE_CURRENCY_W,
      height: AMOUNTCAPSULE_H,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      // White badge behind the currency sign, like the icon circles on the other cards.
      children: [
        frame("Badge", {
          width: 48,
          height: 48,
          cornerRadius: 24,
          fill: solid("#FFFFFF"),
          layout: "horizontal",
          justifyContent: "center",
          alignItems: "center",
          children: [text("$", { size: 20, id: amountCapsuleCurrencySymbol })],
        }),
      ],
    }),
    frame("Value", {
      id: amountCapsuleValueWrap,
      x: AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP,
      y: 0,
      width: AMOUNTCAPSULE_DEFAULT_VALUE_W,
      height: AMOUNTCAPSULE_H,
      layout: "horizontal",
      padding: [0, AMOUNTCAPSULE_VALUE_PAD_RIGHT, 0, AMOUNTCAPSULE_VALUE_PAD_LEFT],
      alignItems: "center",
      children: [text("0", { size: 40, weight: 300, id: amountCapsuleValue })],
    }),
    path({
      id: amountCapsuleShapeId,
      name: "Shape",
      x: 0,
      y: 0,
      width: amountCapsuleTotalW,
      height: AMOUNTCAPSULE_H,
      d: amountCapsuleShapeD(AMOUNTCAPSULE_DEFAULT_VALUE_W),
      fill: solid("#CFCAEC"),
    }),
  ],
});
// Static USD swatch for the Componentes sheet (currency+envelope task): shows
// the same override a USD-plan screen (e.g. 33 Plan en dólares) applies via
// descendants[amountCapsuleCurrencySymbol] - a plain non-reusable display
// copy, not a second master, since a master can only be placed once.
const amountCapsuleUsdValueText = "1.250,50";
const amountCapsuleUsdFontSize = 40;
const amountCapsuleUsdValueLobeW = estimateTextWidth(amountCapsuleUsdValueText, amountCapsuleUsdFontSize) + AMOUNTCAPSULE_VALUE_PAD_LEFT + AMOUNTCAPSULE_VALUE_PAD_RIGHT;
const amountCapsuleUsdTotalW = AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP + amountCapsuleUsdValueLobeW;
const amountCapsuleUsdSwatch = frame("AmountCapsule/USD", {
  width: amountCapsuleUsdTotalW,
  height: AMOUNTCAPSULE_H,
  layout: "none",
  children: [
    frame("Currency", {
      x: 0,
      y: 0,
      width: AMOUNTCAPSULE_CURRENCY_W,
      height: AMOUNTCAPSULE_H,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      children: [frame("Badge", { width: 48, height: 48, cornerRadius: 24, fill: solid("#FFFFFF"), layout: "horizontal", justifyContent: "center", alignItems: "center", children: [text("US$", { size: 14 })] })],
    }),
    frame("Value", {
      x: AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP,
      y: 0,
      width: amountCapsuleUsdValueLobeW,
      height: AMOUNTCAPSULE_H,
      layout: "horizontal",
      padding: [0, AMOUNTCAPSULE_VALUE_PAD_RIGHT, 0, AMOUNTCAPSULE_VALUE_PAD_LEFT],
      alignItems: "center",
      children: [text(amountCapsuleUsdValueText, { size: amountCapsuleUsdFontSize, weight: 300 })],
    }),
    path({ name: "Shape", x: 0, y: 0, width: amountCapsuleUsdTotalW, height: AMOUNTCAPSULE_H, d: amountCapsuleShapeD(amountCapsuleUsdValueLobeW), fill: solid("#CFCAEC") }),
  ],
});
addGroup("AmountCapsule", [
  { label: '"$ | value"', node: amountCapsule },
  { label: '"US$ | value" (plan currency override)', node: amountCapsuleUsdSwatch },
]);

// ---- BalanceCard (JoinedCard: two fused blob lobes) --------------------------
// T9: one continuous white shape - two rounded lobes fused by a concave neck.
// The two content columns keep their ORIGINAL positions/padding from the
// screens (unchanged, so nothing inside needs to be re-fit); only their own
// fill/cornerRadius move to a single `path` LAST child, per the z-order rule.
const BALANCECARD_W = 350;
const BALANCECARD_H = 128;
const BALANCECARD_LEFT_W = 214;
const BALANCECARD_RIGHT_X = 222; // 8px gap after the left lobe: the neck bridges it with a visible waist
const BALANCECARD_RIGHT_W = 128;
const BALANCECARD_R = 30;
const BALANCECARD_NECK = 14;
const balanceCardShapeD = blobPath(
  [
    { x: 0, w: BALANCECARD_LEFT_W, r: BALANCECARD_R },
    { x: BALANCECARD_RIGHT_X, w: BALANCECARD_RIGHT_W, r: BALANCECARD_R },
  ],
  BALANCECARD_H,
  BALANCECARD_NECK
);
const balanceCardRoot = reserve("m-balancecard-default");
const balanceCardAmount = nid("balancecard-amount");
const balanceCardLeftLabel = nid("balancecard-leftlabel");
const balanceCardNumber = nid("balancecard-number");
const balanceCardRightLabel = nid("balancecard-rightlabel");
const balanceCardPlusBtn = nid("balancecard-plusbtn");
const balanceCardPlusIcon = nid("balancecard-plusicon");
const balanceCard = frame("BalanceCard/Default", {
  id: balanceCardRoot,
  width: BALANCECARD_W,
  height: BALANCECARD_H,
  layout: "none",
  reusable: true,
  children: [
    frame("Left", {
      x: 0,
      y: 0,
      width: BALANCECARD_LEFT_W,
      height: BALANCECARD_H,
      layout: "vertical",
      gap: 10,
      padding: [26, 22],
      children: [
        text("$ 48.200", { size: 38, weight: 300, id: balanceCardAmount }),
        text("Listo para asignar", { size: 14, color: "#6B6B6B", id: balanceCardLeftLabel }),
      ],
    }),
    // Content keeps the original right-block geometry (x 196, w 154) so long amounts
    // still fit; only the white shape's lobe moved right to open the waist.
    frame("Right", {
      x: 196,
      y: 0,
      width: 154,
      height: BALANCECARD_H,
      layout: "horizontal",
      gap: 4,
      padding: [12, 12, 20, 20],
      children: [
        frame("Text", {
          width: "fill_container",
          height: "fill_container",
          layout: "vertical",
          gap: 10,
          padding: [14, 0, 0, 0],
          children: [
            text("12", { size: 38, weight: 300, id: balanceCardNumber }),
            text("Sobres activos", { size: 14, color: "#6B6B6B", id: balanceCardRightLabel }),
          ],
        }),
        frame("IconButton/plus", {
          id: balanceCardPlusBtn,
          width: 50,
          height: 50,
          layout: "horizontal",
          justifyContent: "center",
          alignItems: "center",
          cornerRadius: 25,
          fill: solid("#CFCAEC"),
          children: [iconFont("plus", { size: 22, id: balanceCardPlusIcon })],
        }),
      ],
    }),
    path({
      name: "Shape",
      x: 0,
      y: 0,
      width: BALANCECARD_W,
      height: BALANCECARD_H,
      d: balanceCardShapeD,
      fill: solid("#FFFFFF"),
    }),
  ],
});
addGroup("BalanceCard", [{ label: "Default", node: balanceCard }]);

// ---- SaveBar ------------------------------------------------------------
const saveBarRoot = reserve("m-savebar");
const saveBarLeftIcon = nid("savebar-left-icon");
const saveBarLabel = nid("savebar-label");
const saveBar = frame("SaveBar", {
  id: saveBarRoot,
  width: 340,
  height: 68,
  layout: "horizontal",
  padding: [0, 8, 0, 0],
  alignItems: "center",
  cornerRadius: 34,
  fill: solid("#EDEDED"),
  reusable: true,
  children: [
    frame("IconButton/calculator", {
      width: 68,
      height: 68,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 34,
      fill: solid("#212121"),
      children: [iconFont("calculator", { size: 22, color: "#FFFFFF", id: saveBarLeftIcon })],
    }),
    frame("IconButton/check", {
      width: 64,
      height: 64,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 32,
      fill: solid("#EAFC5F"),
      children: [iconFont("check", { size: 22, color: "#212121" })],
    }),
    text("  Guardar", { size: 16, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: saveBarLabel }),
    frame("IconButton/check", {
      width: 52,
      height: 52,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 26,
      fill: solid("#FFFFFF"),
      children: [iconFont("check", { size: 18, color: "#6B6B6B" })],
    }),
  ],
});
// Disabled variant (see odd/tasks/navigation-audit.md Batch B #11): mirrors
// the hand-authored "SaveBar (deshabilitado)" shape already used on 08
// Dividir pago before this master existed - muted knob (lock, not check),
// grey label, end check at low opacity. Same two overridable slots as
// Default (left icon, label) so the handler below can reuse one code path.
const saveBarDisabledRoot = reserve("m-savebar-disabled");
const saveBarDisabledLeftIcon = nid("savebar-disabled-left-icon");
const saveBarDisabledLabel = nid("savebar-disabled-label");
const saveBarDisabled = frame("SaveBar", {
  id: saveBarDisabledRoot,
  width: 340,
  height: 68,
  layout: "horizontal",
  padding: [0, 8, 0, 0],
  alignItems: "center",
  cornerRadius: 34,
  fill: solid("#EDEDED"),
  reusable: true,
  children: [
    frame("IconButton/calculator", {
      width: 68,
      height: 68,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 34,
      fill: solid("#BDBDBD"),
      children: [iconFont("calculator", { size: 22, color: "#FFFFFF", id: saveBarDisabledLeftIcon })],
    }),
    frame("IconButton/lock", {
      width: 64,
      height: 64,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 32,
      fill: solid("#DADADA"),
      children: [iconFont("lock", { size: 22, color: "#6B6B6B" })],
    }),
    text("  Guardar", { size: 16, weight: 500, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: saveBarDisabledLabel }),
    Object.assign(
      frame("IconButton/check", {
        width: 52,
        height: 52,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 26,
        fill: solid("#FFFFFF"),
        children: [iconFont("check", { size: 18, color: "#6B6B6B" })],
      }),
      { opacity: 0.4 }
    ),
  ],
});
addGroup("SaveBar", [
  { label: "Default", node: saveBar },
  { label: "Disabled", node: saveBarDisabled },
]);

// ---- Toggle (segmented Gasto/Ingreso) ---------------------------------------
function toggleMaster(activeLabel, key) {
  const rootId = reserve("m-toggle-" + key);
  function seg(label, active) {
    return frame("Seg/" + label + (active ? " (activo)" : ""), {
      width: "fill_container",
      height: "fill_container",
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 22,
      fill: active ? solid("#CFCAEC") : [],
      children: [text(label, { size: 15, weight: active ? 500 : 400 })],
    });
  }
  return frame("Toggle/" + key, {
    id: rootId,
    width: 340,
    height: 52,
    layout: "horizontal",
    gap: 4,
    padding: 4,
    cornerRadius: 26,
    fill: solid("#EDEDED"),
    reusable: true,
    children: [seg("Gasto", activeLabel === "Gasto"), seg("Ingreso", activeLabel === "Ingreso")],
  });
}
const toggleGasto = toggleMaster("Gasto", "GastoActive");
const toggleIngreso = toggleMaster("Ingreso", "IngresoActive");
addGroup("Toggle", [
  { label: "GastoActive", node: toggleGasto },
  { label: "IngresoActive", node: toggleIngreso },
]);

// ---- TextField (label/value pill with trailing icon) ------------------------
function textFieldMaster(key, { stroke, icon }) {
  const rootId = reserve("m-textfield-" + key);
  const labelId = nid("textfield-label-" + key);
  const valueId = nid("textfield-value-" + key);
  const iconId = nid("textfield-icon-" + key);
  const opts = {
    id: rootId,
    width: 340,
    height: 60,
    layout: "horizontal",
    gap: 8,
    padding: [10, 20],
    alignItems: "center",
    cornerRadius: 30,
    fill: solid("#FFFFFF"),
    reusable: true,
    children: [
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 0,
        children: [
          text("Label", { size: 12, color: "#6B6B6B", id: labelId }),
          text("Value", { size: 16, weight: 500, id: valueId }),
        ],
      }),
      iconFont(icon, { size: 18, id: iconId }),
    ],
  };
  if (stroke) opts.stroke = { thickness: 1.5, fill: solid(stroke) };
  return { master: frame("TextField/" + cap(key), opts), labelId, valueId, iconId, rootId };
}
const textFieldDefault = textFieldMaster("default", { icon: "mail" });
const textFieldError = textFieldMaster("error", { stroke: "#C62828", icon: "eye" });
const textFieldFocus = textFieldMaster("focus", { stroke: "#CFCAEC", icon: "mail" });
addGroup("TextField", [
  { label: "Default", node: textFieldDefault.master },
  { label: "Error", node: textFieldError.master },
  { label: "Focus (synthesized, not used on screens)", node: textFieldFocus.master },
]);

// ---- FieldRow (settings-style row with chevron) -----------------------------
const fieldRowRoot = reserve("m-fieldrow");
const fieldRowLabel = nid("fieldrow-label");
const fieldRowValue = nid("fieldrow-value");
const fieldRow = frame("FieldRow", {
  id: fieldRowRoot,
  width: 350,
  height: 42,
  layout: "horizontal",
  gap: 10,
  justifyContent: "space_between",
  alignItems: "center",
  reusable: true,
  children: [
    text("Campo", { size: 14, color: "#6B6B6B", id: fieldRowLabel }),
    frame("Value", {
      width: "fit_content",
      height: "fit_content",
      layout: "horizontal",
      gap: 4,
      alignItems: "center",
      children: [text("Valor", { size: 15, weight: 500, id: fieldRowValue }), iconFont("chevron-right", { size: 14, color: "#6B6B6B" })],
    }),
  ],
});
addGroup("FieldRow", [{ label: "Default", node: fieldRow }]);

// ---- Key (numeric keypad) ----------------------------------------------------
function keyMaster(key, { content, icon, bg }) {
  const rootId = reserve("m-key-" + key);
  const contentId = nid("key-content-" + key);
  const child = icon ? iconFont(icon, { size: 18, id: contentId }) : text(content, { size: 18, id: contentId });
  return { master: frame("Key/" + cap(key), {
    id: rootId,
    width: 100,
    height: 44,
    layout: "horizontal",
    justifyContent: "center",
    alignItems: "center",
    cornerRadius: 22,
    fill: solid(bg),
    reusable: true,
    children: [child],
  }), contentId, rootId };
}
const keyNumber = keyMaster("number", { content: "5", bg: "#FFFFFF" });
const keyOperator = keyMaster("operator", { content: "+", bg: "#CFCAEC" });
const keyDel = keyMaster("del", { icon: "delete", bg: "#FFFFFF" });
addGroup("Key", [
  { label: "Number", node: keyNumber.master },
  { label: "Operator", node: keyOperator.master },
  { label: "Del", node: keyDel.master },
]);

// ---- Avatar -------------------------------------------------------------
const avatarRoot = reserve("m-avatar");
const avatarLabel = nid("avatar-label");
const avatar = frame("Avatar", {
  id: avatarRoot,
  width: 52,
  height: 52,
  layout: "horizontal",
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: 26,
  fill: solid("#CFCAEC"),
  reusable: true,
  children: [text("SO", { size: 17, weight: 500, id: avatarLabel })],
});
addGroup("Avatar", [{ label: "Default", node: avatar }]);

// ---- Toast (feedback for simple actions, colour by message type) -----------
// Neutral carries an undo action; the others are informational. Every pair
// meets AA: ink on chartreuse/lavender/amber, white on ink and on danger.
const TOAST_W = 350;
const TOAST_VARIANTS = [
  { key: "Neutral", bg: "#212121", circle: "#EAFC5F", icon: "rotate-ccw", iconColor: "#212121", titleColor: "#FFFFFF", bodyColor: "#FFFFFFB3", title: "Recalculado", body: "Agosto y septiembre actualizados.", action: "Deshacer", actionColor: "#EAFC5F" },
  { key: "Success", bg: "#EAFC5F", circle: "#212121", icon: "check", iconColor: "#EAFC5F", titleColor: "#212121", bodyColor: "#212121B3", title: "Movimiento guardado", body: "Supermercado · −$ 18.450" },
  { key: "Info", bg: "#CFCAEC", circle: "#FFFFFF", icon: "info", iconColor: "#212121", titleColor: "#212121", bodyColor: "#212121B3", title: "Código copiado", body: "K7M-4QX listo para compartir." },
  { key: "Warning", bg: "#F5C451", circle: "#212121", icon: "triangle-alert", iconColor: "#F5C451", titleColor: "#212121", bodyColor: "#212121B3", title: "Transporte quedó sobregirado", body: "Cubrilo antes de cerrar el mes." },
  { key: "Error", bg: "#C62828", circle: "#FFFFFF", icon: "circle-x", iconColor: "#C62828", titleColor: "#FFFFFF", bodyColor: "#FFFFFF", title: "No se pudo guardar", body: "Revisá tu conexión e intentá de nuevo." },
];
const toastMasters = {};
TOAST_VARIANTS.forEach((v) => {
  const ids = {
    root: reserve("m-toast-" + v.key.toLowerCase()),
    icon: nid("toast-icon-" + v.key.toLowerCase()),
    title: nid("toast-title-" + v.key.toLowerCase()),
    body: nid("toast-body-" + v.key.toLowerCase()),
    action: nid("toast-action-" + v.key.toLowerCase()),
  };
  const children = [
    frame("Icon", {
      width: 40,
      height: 40,
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      cornerRadius: 20,
      fill: solid(v.circle),
      children: [iconFont(v.icon, { size: 18, color: v.iconColor, id: ids.icon })],
    }),
    frame("Text", {
      width: "fill_container",
      height: "fit_content",
      layout: "vertical",
      children: [
        text(v.title, { size: 15, weight: 500, color: v.titleColor, id: ids.title }),
        text(v.body, { size: 12, color: v.bodyColor, id: ids.body, width: "fill_container" }),
      ],
    }),
  ];
  if (v.action) children.push(text(v.action, { size: 14, weight: 500, color: v.actionColor, id: ids.action }));
  const node = frame("Toast/" + v.key, {
    id: ids.root,
    width: TOAST_W,
    height: 64,
    layout: "horizontal",
    gap: 12,
    padding: [12, 16, 12, 12],
    alignItems: "center",
    cornerRadius: 32,
    fill: solid(v.bg),
    reusable: true,
    children,
  });
  toastMasters[v.bg.toUpperCase()] = { node, ids, variant: v };
});
addGroup(
  "Toast",
  TOAST_VARIANTS.map((v) => ({ label: v.key, node: toastMasters[v.bg.toUpperCase()].node }))
);

// ---- EnvelopeRow header (icon + title/status + amount) ----------------------
// The stripe/dot progress track underneath is per-instance computed data
// (it encodes an exact percentage with a variable number of 2px segments),
// so it is NOT baked into the ref: only the header row becomes an instance,
// the outer card + its real progress bar stay untouched plain nodes. See the
// report for the reasoning.
function envelopeHeaderMaster(key, { icon, iconBg, iconColor, title, detail, amount, amountColor, status }) {
  const rootId = reserve("m-enveloperow-" + key);
  const iconId = nid("enveloperow-icon-" + key);
  const titleId = nid("enveloperow-title-" + key);
  const detailId = nid("enveloperow-detail-" + key);
  const amountId = nid("enveloperow-amount-" + key);
  const statusId = nid("enveloperow-status-" + key);
  const master = frame("EnvelopeRow/" + cap(key), {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    alignItems: "center",
    reusable: true,
    children: [
      frame("IconButton/" + icon, {
        width: 44,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 22,
        fill: solid(iconBg),
        children: [iconFont(icon, { size: 19, color: iconColor, id: iconId })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [
          text(title, { size: 17, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: titleId }),
          text(detail, { size: 13, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: detailId }),
        ],
      }),
      frame("Right", {
        width: "fit_content",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        alignItems: "end",
        children: [
          text(amount, { size: 18, weight: 500, color: amountColor, id: amountId }),
          text(status, { size: 12, weight: 500, color: amountColor, id: statusId }),
        ],
      }),
    ],
  });
  return { master, iconId, titleId, detailId, amountId, statusId, rootId };
}
const envelopeFunded = envelopeHeaderMaster("funded", {
  icon: "house", iconBg: "#F5F5F5", iconColor: "#212121", title: "Alquiler", detail: "$ 380.000 de $ 380.000", amount: "$ 380.000", amountColor: "#212121", status: "Cubierto",
});
const envelopeUnderfunded = envelopeHeaderMaster("underfunded", {
  icon: "shopping-cart", iconBg: "#F5F5F5", iconColor: "#212121", title: "Supermercado", detail: "$ 132.450 de $ 180.000", amount: "$ 47.550", amountColor: "#212121", status: "Disponible",
});
const envelopeOverspent = envelopeHeaderMaster("overspent", {
  icon: "bus", iconBg: "#C628281A", iconColor: "#C62828", title: "Transporte", detail: "$ 51.200 de $ 45.000", amount: "−$ 6.200", amountColor: "#C62828", status: "Sobregirado",
});
const envelopeEmpty = envelopeHeaderMaster("empty", {
  icon: "house", iconBg: "#F5F5F5", iconColor: "#212121", title: "Alquiler", detail: "$ 0 de $ 0", amount: "$ 0", amountColor: "#212121", status: "Sin asignar",
});
addGroup("EnvelopeRow (header only, see report for the progress track)", [
  { label: "Funded", node: envelopeFunded.master },
  { label: "Underfunded", node: envelopeUnderfunded.master },
  { label: "Overspent", node: envelopeOverspent.master },
  { label: "Empty", node: envelopeEmpty.master },
]);

// ---- TxRow (transaction list row) -------------------------------------------
function txRowMaster(key, { icon, title, subtitle, amount, incomePill }) {
  const rootId = reserve("m-txrow-" + key);
  const iconId = nid("txrow-icon-" + key);
  const titleId = nid("txrow-title-" + key);
  const subtitleId = nid("txrow-subtitle-" + key);
  const amountId = nid("txrow-amount-" + key);
  const rightSubId = nid("txrow-rightsub-" + key);
  let rightChild;
  if (incomePill) {
    rightChild = [
      frame("IncomePill", {
        width: "fit_content",
        height: 28,
        layout: "horizontal",
        padding: [0, 10],
        alignItems: "center",
        cornerRadius: 14,
        fill: solid("#CFCAEC"),
        children: [text(amount, { size: 15, weight: 500, id: amountId })],
      }),
      text(incomePill, { size: 12, color: "#6B6B6B", id: rightSubId }),
    ];
  } else {
    rightChild = [text(amount, { size: 16, weight: 500, id: amountId }), text("Cuenta", { size: 12, color: "#6B6B6B", id: rightSubId })];
  }
  const master = frame("TxRow/" + cap(key), {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    padding: [12, 14],
    alignItems: "center",
    cornerRadius: 26,
    fill: solid("#FFFFFF"),
    reusable: true,
    children: [
      frame("IconButton/" + icon, {
        width: 44,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 22,
        fill: solid("#F5F5F5"),
        children: [iconFont(icon, { size: 18, id: iconId })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [
          text(title, { size: 16, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: titleId }),
          text(subtitle, { size: 13, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: subtitleId }),
        ],
      }),
      frame("Right", { width: "fit_content", height: "fit_content", layout: "vertical", gap: 3, alignItems: "end", children: rightChild }),
    ],
  });
  return { master, iconId, titleId, subtitleId, amountId, rightSubId, rootId };
}
const txExpense = txRowMaster("expense", { icon: "shopping-cart", title: "Coto", subtitle: "Día a día", amount: "−$ 18.450" });
const txIncome = txRowMaster("income", { icon: "arrow-down-left", title: "Reintegro", subtitle: "Farmacia · 19:10", amount: "+$ 3.500", incomePill: "Banco Nación" });
addGroup("TxRow", [
  { label: "Expense", node: txExpense.master },
  { label: "Income", node: txIncome.master },
]);

// ---- AccountRow header (icon + title/subtitle + balance/%) ------------------
const accountRow = (function () {
  const rootId = reserve("m-accountrow");
  const iconId = nid("accountrow-icon");
  const titleId = nid("accountrow-title");
  const subtitleId = nid("accountrow-subtitle");
  const amountId = nid("accountrow-amount");
  const percentId = nid("accountrow-percent");
  const master = frame("AccountRow", {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    alignItems: "center",
    reusable: true,
    children: [
      frame("IconButton/landmark", {
        width: 44,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 22,
        fill: solid("#F5F5F5"),
        children: [iconFont("landmark", { size: 19, id: iconId })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [
          text("Banco Nación", { size: 17, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: titleId }),
          text("Cuenta sueldo", { size: 13, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: subtitleId }),
        ],
      }),
      frame("Right", {
        width: "fit_content",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        alignItems: "end",
        children: [text("$ 842.300", { size: 17, weight: 500, id: amountId }), text("84% del total", { size: 12, color: "#6B6B6B", id: percentId })],
      }),
    ],
  });
  return { master, iconId, titleId, subtitleId, amountId, percentId, rootId };
})();
addGroup("AccountRow (header only)", [{ label: "Default", node: accountRow.master }]);

// ---- PayeeRow -----------------------------------------------------------
const payeeRow = (function () {
  const rootId = reserve("m-payeerow");
  const avatarBgId = nid("payeerow-avatarbg");
  const avatarLabelId = nid("payeerow-avatarlabel");
  const titleId = nid("payeerow-title");
  const subtitleId = nid("payeerow-subtitle");
  const master = frame("PayeeRow", {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    padding: [10, 0],
    alignItems: "center",
    reusable: true,
    children: [
      frame("Avatar", {
        id: avatarBgId,
        width: 44,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 22,
        fill: solid("#CFCAEC"),
        children: [text("CO", { size: 14, weight: 500, id: avatarLabelId })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [
          text("Coto", { size: 16, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: titleId }),
          text("Supermercado · 14 movimientos", { size: 13, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: subtitleId }),
        ],
      }),
      iconFont("chevron-right", { size: 18, color: "#6B6B6B" }),
    ],
  });
  return { master, avatarBgId, avatarLabelId, titleId, subtitleId, rootId };
})();
addGroup("PayeeRow", [{ label: "Default", node: payeeRow.master }]);

// ---- MemberRow ------------------------------------------------------------
const memberRow = (function () {
  const rootId = reserve("m-memberrow");
  const avatarBgId = nid("memberrow-avatarbg");
  const avatarLabelId = nid("memberrow-avatarlabel");
  const titleId = nid("memberrow-title");
  const subtitleId = nid("memberrow-subtitle");
  const chipLabelId = nid("memberrow-chiplabel");
  const master = frame("MemberRow", {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    padding: [6, 0],
    alignItems: "center",
    reusable: true,
    children: [
      frame("Avatar", {
        id: avatarBgId,
        width: 44,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 22,
        fill: solid("#CFCAEC"),
        children: [text("SO", { size: 14, weight: 500, id: avatarLabelId })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [
          text("Sofía (vos)", { size: 16, weight: 500, width: "fill_container", textGrowth: "fixed-width", id: titleId }),
          text("sofia@correo.com", { size: 12, color: "#6B6B6B", width: "fill_container", textGrowth: "fixed-width", id: subtitleId }),
        ],
      }),
      frame("Chip/Dueña", {
        width: "fit_content",
        height: 32,
        layout: "horizontal",
        gap: 6,
        padding: [0, 12],
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 16,
        fill: solid("#F5F5F5"),
        children: [text("Dueña", { size: 13, id: chipLabelId })],
      }),
    ],
  });
  return { master, avatarBgId, avatarLabelId, titleId, subtitleId, chipLabelId, rootId };
})();
addGroup("MemberRow", [{ label: "Default", node: memberRow.master }]);

// ---- PlanRow (active uses an icon, inactive uses stacked avatars) ----------
const planRowActive = (function () {
  const rootId = reserve("m-planrow-active");
  const titleId = nid("planrow-active-title");
  const subtitleId = nid("planrow-active-subtitle");
  const master = frame("PlanRow/Active", {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    padding: [14, 14],
    alignItems: "center",
    cornerRadius: 30,
    fill: solid("#CFCAEC"),
    reusable: true,
    children: [
      frame("IconButton/wallet", {
        width: 48,
        height: 48,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 24,
        fill: solid("#FFFFFF99"),
        children: [iconFont("wallet", { size: 20 })],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [text("Mi plan", { size: 16, weight: 500, width: "fill_container", id: titleId }), text("Solo vos · pesos", { size: 13, color: "#212121", width: "fill_container", id: subtitleId })],
      }),
      frame("IconButton/check", {
        width: 36,
        height: 36,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        cornerRadius: 18,
        fill: solid("#212121"),
        children: [iconFont("check", { size: 16, color: "#FFFFFF" })],
      }),
    ],
  });
  return { master, titleId, subtitleId, rootId };
})();
const planRowInactive = (function () {
  const rootId = reserve("m-planrow-inactive");
  const titleId = nid("planrow-inactive-title");
  const subtitleId = nid("planrow-inactive-subtitle");
  // Plan currency support: a solo (not-yet-active) plan, e.g. "Viaje a Chile",
  // has only one member, so the second avatar must be hideable and the first
  // avatar's initials overridable - otherwise every inactive PlanRow would be
  // stuck showing the hardcoded "SO"/"JU" pair regardless of its own plan.
  const avatarALabelId = nid("planrow-inactive-avatar-a-label");
  const avatarBId = nid("planrow-inactive-avatar-b");
  const master = frame("PlanRow/Inactive", {
    id: rootId,
    width: 350,
    height: "fit_content",
    layout: "horizontal",
    gap: 12,
    padding: [14, 14],
    alignItems: "center",
    cornerRadius: 30,
    fill: solid("#FFFFFF"),
    reusable: true,
    children: [
      frame("Avatars", {
        width: "fit_content",
        height: "fit_content",
        layout: "horizontal",
        gap: -12,
        children: [
          frame("Avatar/SO", { width: 44, height: 44, layout: "horizontal", justifyContent: "center", alignItems: "center", cornerRadius: 22, fill: solid("#CFCAEC"), children: [text("SO", { size: 14, weight: 500, id: avatarALabelId })] }),
          frame("Avatar/JU", { id: avatarBId, width: 44, height: 44, layout: "horizontal", justifyContent: "center", alignItems: "center", cornerRadius: 22, fill: solid("#F5F5F5"), children: [text("JU", { size: 14, weight: 500 })] }),
        ],
      }),
      frame(undefined, {
        width: "fill_container",
        height: "fit_content",
        layout: "vertical",
        gap: 2,
        children: [text("Casa con Juli", { size: 16, weight: 500, width: "fill_container", id: titleId }), text("2 miembros", { size: 13, color: "#6B6B6B", width: "fill_container", id: subtitleId })],
      }),
      iconFont("chevron-right", { size: 18, color: "#6B6B6B" }),
    ],
  });
  return { master, titleId, subtitleId, rootId, avatarALabelId, avatarBId };
})();
addGroup("PlanRow", [
  { label: "Active", node: planRowActive.master },
  { label: "Inactive", node: planRowInactive.master },
]);

console.log("Built", masters.length, "component masters across", groups.length, "groups.");

// ===========================================================================
// COMPONENTES PAGE LAYOUT
// ===========================================================================
const MARGIN_X = 60;
const MARGIN_TOP = 60;
const GROUP_GAP = 56;
const CAPTION_GAP = 10;
const VARIANT_GAP = 36;

let cursorY = MARGIN_TOP;
let pageWidth = 800;
const pageChildren = [];
const placedMasters = []; // sheet placement geometry, one entry per master, for the manifest

groups.forEach((g) => {
  const titleNode = text(g.title, { size: 22, color: "#212121", weight: 600 });
  titleNode.x = MARGIN_X;
  titleNode.y = cursorY;
  pageChildren.push(titleNode);
  cursorY += 60; // room for the GUI frame-name label drawn above each master

  let x = MARGIN_X;
  let rowHeight = 0;
  g.variants.forEach((v) => {
    const master = masters.find((m) => m.id === v.id);
    const w = typeof master.width === "number" ? master.width : 200;
    const h = typeof master.height === "number" ? master.height : 60;
    rowHeight = Math.max(rowHeight, h);

    // T6 fix (see odd/tasks/component-library.md): OpenPencil 0.8.4 does not
    // draw a reusable master when it sits nested inside another frame - only
    // a master at TOP LEVEL of the page gets drawn. So the master sits
    // directly at its real sheet position, with no wrapper. A master's own
    // (x, y) would otherwise leak into how its `ref` instances are measured
    // on other pages, but every `ref` created below (see `makeRef`) carries
    // a `descendants[<masterRootId>] = {x:0, y:0}` override that cancels
    // that leak completely (verified in probe wrap3.op).
    master.x = x;
    master.y = cursorY;
    placedMasters.push({ x, y: cursorY, width: w, height: h });

    const caption = text(v.label, { size: 13, color: "#6B6B6B" });
    caption.x = x;
    caption.y = cursorY + h + CAPTION_GAP;
    pageChildren.push(caption);

    x += w + VARIANT_GAP;
  });
  pageWidth = Math.max(pageWidth, x);
  cursorY += rowHeight + CAPTION_GAP + 20 + GROUP_GAP;
});

const pageHeight = cursorY + MARGIN_TOP;

const background = frame("Background", {
  x: 0,
  y: 0,
  width: pageWidth + MARGIN_X,
  height: pageHeight,
  fill: solid("#F5F5F5"),
});

const componentesPage = {
  id: reserve("cl-page-componentes"),
  name: "Componentes",
  // Page children stack like layout:none frames: children[0] is on top, so the background goes last.
  children: [...pageChildren, ...masters, background],
};

// Manifest for stitching a single documentation screenshot of the sheet, kept
// as a fallback in case a real whole-page render is still not obtainable
// (see T8). compose-componentes-sheet.js can replay this manifest with a
// per-master export of each Slot PNG to build one composite image.
const manifest = {
  width: pageWidth + MARGIN_X,
  height: pageHeight,
  texts: pageChildren.map((t) => ({ x: t.x, y: t.y, size: t.fontSize, weight: t.fontWeight, color: t.fill[0].color, content: t.content })),
  slots: placedMasters,
};
const manifestPath = process.env.CL_MANIFEST_PATH;
if (manifestPath) fs.writeFileSync(manifestPath, JSON.stringify(manifest));

doc.pages.unshift(componentesPage);

// ===========================================================================
// SCREEN REWIRING (T3) - replace repeated subtrees with `ref` instances
// ===========================================================================
const stats = {}; // component name -> count of refs created across the screens
function bump(name) {
  stats[name] = (stats[name] || 0) + 1;
}
const leftAsIs = []; // human-readable notes about intentionally-skipped subtrees

function makeRef(masterId, descendants) {
  // Every instance root gets an {x:0, y:0} override merged in, cancelling
  // the sheet-position offset that now lives on the master itself (T6 fix,
  // verified in probe wrap3.op). Any other root override (width, fill, ...)
  // set by a specific component's conversion code is preserved alongside it.
  const merged = Object.assign({}, descendants);
  merged[masterId] = Object.assign({ x: 0, y: 0 }, merged[masterId]);
  const r = { type: "ref", id: nid("ref"), ref: masterId, descendants: merged };
  return r;
}

// -- IconButton replacement (used both standalone and nested inside rows) ---
function iconButtonOverride(node, availWidth) {
  const bg = node.fill && node.fill[0] && node.fill[0].color;
  const iconNode = (node.children || []).find((c) => c.type === "icon_font");
  if (!iconNode) return null;
  const family = classifyIconButtonFamily(bg);
  const fam = iconButtonMasters[family];
  const descendants = {};
  const rootOverride = {};
  if (typeof node.width === "number" && node.width !== 52) rootOverride.width = node.width;
  if (typeof node.height === "number" && node.height !== 52) rootOverride.height = node.height;
  if (bg && bg !== fam.bg) rootOverride.fill = node.fill;
  if (Object.keys(rootOverride).length) descendants[fam.rootId] = rootOverride;
  const iconOverride = {};
  if (iconNode.iconFontName !== "star") iconOverride.iconFontName = iconNode.iconFontName;
  const iconColor = iconNode.fill && iconNode.fill[0] && iconNode.fill[0].color;
  if (iconColor && iconColor !== fam.iconColor) iconOverride.fill = iconNode.fill;
  if (typeof iconNode.width === "number" && iconNode.width !== 20) {
    iconOverride.width = iconNode.width;
    iconOverride.height = iconNode.height;
  }
  if (Object.keys(iconOverride).length) descendants[fam.iconId] = iconOverride;
  bump("IconButton/" + cap(family));
  return makeRef(fam.rootId, descendants);
}

// -- generic walker --------------------------------------------------------
// visits every node reachable from a screen root; availWidth is the number
// of px available to `node` itself (see resolveWidth/horizontalPadding).
// Empirically confirmed during a parent spot check: when a plain
// `height:"fit_content"` wrapper's ONLY child becomes a `ref` (e.g.
// BottomNavWrap around the NavCluster ref), and a SIBLING elsewhere in the
// same vertical flow uses `height:"fill_container"` (e.g. the screen's
// "Content" frame, which needs to know how much space the nav bar takes to
// fill the rest), the engine fails to measure the ref's height for that
// fit_content computation - the wrapper (and therefore the whole ref)
// silently disappears from the rendered screen even though the ref renders
// fine in isolation. Overriding height on the ref itself does NOT fix this
// (only "fill and numeric width" are documented as overridable on the
// instance root). The fix is to give the WRAPPER an explicit numeric height
// computed from the master's own height + the wrapper's padding, so the
// engine never needs to measure the ref at all.
function masterById(id) {
  return masters.find((m) => m.id === id);
}
function pinWrapperHeightIfNeeded(parent, replacement) {
  if (!parent || parent.height !== "fit_content") return;
  if (!Array.isArray(parent.children) || parent.children.length !== 1) return;
  if (!replacement || replacement.type !== "ref") return;
  const master = masterById(replacement.ref);
  if (!master || typeof master.height !== "number") return;
  const override = replacement.descendants && replacement.descendants[replacement.ref];
  const refHeight = override && typeof override.height === "number" ? override.height : master.height;
  parent.height = refHeight + verticalPadding(parent.padding);
}

// T7 fix (see odd/tasks/component-library.md, finding 2): a plain node's
// `fill_container` width can no longer be resolved by just handing it the
// parent's whole available width, now that replacements are allowed inside
// multi-child horizontal rows (see siblingRiskyContext below) - a
// `fill_container` sibling must split the row's remaining space (after gaps
// and any fixed-width siblings) with the other `fill_container` siblings, or
// it would be measured far too wide and overlap them. Vertical parents are
// unaffected: every child there already gets the parent's full width.
function resolveWidthForChild(node, parent, availWidth, index) {
  if (typeof node.width === "number") return node.width;
  if (node.width !== "fill_container") return availWidth; // fit_content: best-effort fallback
  if (!parent || parent.layout !== "horizontal" || !Array.isArray(parent.children) || parent.children.length <= 1) {
    return availWidth;
  }
  const gap = typeof parent.gap === "number" ? parent.gap : 0;
  const gapTotal = gap * (parent.children.length - 1);
  // fit_content siblings take their content width, so estimate it instead of counting them as 0.
  const fixedWidths = parent.children.reduce((sum, c) => {
    if (!c || c === node || c.width === "fill_container") return sum;
    return sum + (typeof c.width === "number" ? c.width : estimateFitWidth(c));
  }, 0);
  const fillCount = parent.children.filter((c) => c && c.width === "fill_container").length;
  const remaining = availWidth - gapTotal - fixedWidths;
  if (fillCount > 0) return Math.max(0, remaining / fillCount);
  return availWidth;
}

// Rough content width of a fit_content node (Urbanist metrics), used when
// splitting a row between fit_content and fill_container children.
function estimateFitWidth(node) {
  if (!node) return 0;
  if (typeof node.width === "number") return node.width;
  if (node.type === "text") {
    const size = typeof node.fontSize === "number" ? node.fontSize : 16;
    let em = 0;
    for (const ch of String(node.content || "")) {
      if (ch >= "a" && ch <= "z") em += 0.47;
      else if (ch >= "A" && ch <= "Z") em += 0.62;
      else if (ch >= "0" && ch <= "9") em += 0.58;
      else if (ch === " ") em += 0.25;
      else em += 0.5;
    }
    return Math.ceil(em * size);
  }
  const kids = (node.children || []).filter((c) => c && c.visible !== false);
  const gap = typeof node.gap === "number" ? node.gap : 0;
  const inner =
    node.layout === "horizontal"
      ? kids.reduce((sum, c) => sum + estimateFitWidth(c), 0) + gap * Math.max(0, kids.length - 1)
      : kids.reduce((max, c) => Math.max(max, estimateFitWidth(c)), 0);
  return inner + horizontalPadding(node.padding);
}

function walkChildren(node, availWidth) {
  if (!node.children || !node.children.length) return;
  const resolved = resolveWidth(node, availWidth);
  const childAvail = resolved - horizontalPadding(node.padding);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child || typeof child !== "object") continue;
    const childResolved = resolveWidthForChild(child, node, childAvail, i);
    const replacement = tryReplace(child, childResolved, node);
    if (replacement) {
      node.children[i] = replacement;
      pinWrapperHeightIfNeeded(node, replacement);
      continue; // do not recurse into a replaced subtree
    }
    walkChildren(child, childResolved);
  }
}

// Empirically confirmed during T4 rendering: a bare `ref` sitting alongside a
// sibling in the SAME horizontal flex row, or alone under `justifyContent:
// "end"/"space_between"/"space_around"`, breaks that row's layout - the
// engine doesn't seem to know the ref's size when it distributes space or
// sizes a `fill_container` sibling next to it, and it doesn't reposition a
// ref for end/space_between/space_around alignment either.
// T7 fix (finding 2, see odd/tasks/component-library.md): wrapping that same
// ref in a plain, non-reusable frame with a FIXED numeric width/height and
// `layout: "none"`, as the wrapper's only child, positions correctly in
// every one of those risky contexts (verified in probe wrap3.op: rows using
// space_between, gap, end, center, and a row after a fill_container
// sibling). So instead of refusing the replacement outright, wrap it.
const RISKY_JUSTIFY = new Set(["end", "flex_end", "space_between", "space_around"]);
function siblingRiskyContext(parent) {
  if (!parent || parent.layout !== "horizontal" || !Array.isArray(parent.children)) return false;
  if (parent.children.length > 1) return true;
  if (RISKY_JUSTIFY.has(parent.justifyContent)) return true;
  return false;
}
function wrapRefIfRisky(replacement, node, parent, availWidth) {
  if (!replacement || replacement.type !== "ref") return replacement;
  if (!siblingRiskyContext(parent)) return replacement;
  const master = masterById(replacement.ref);
  const w = typeof availWidth === "number" ? availWidth : typeof node.width === "number" ? node.width : master && typeof master.width === "number" ? master.width : null;
  const h = typeof node.height === "number" ? node.height : master && typeof master.height === "number" ? master.height : null;
  if (typeof w !== "number" || typeof h !== "number") {
    leftAsIs.push(node.name + ": sits beside a sibling in a multi-child horizontal row (parent " + (parent.name || parent.id) + ") and has no numeric width/height to give a fixed-size wrapper, left as a plain subtree.");
    return null;
  }
  return frame(undefined, { width: w, height: h, layout: "none", children: [replacement] });
}

function tryReplace(node, availWidth, parent) {
  if (!node || node.type !== "frame" || !node.name) return null;
  const replacement = buildReplacement(node, availWidth, parent);
  return wrapRefIfRisky(replacement, node, parent, availWidth);
}

function buildReplacement(node, availWidth, parent) {
  const name = node.name;

  // -- Toast: variant picked by background colour, copy carried as overrides --
  if (typeof name === "string" && name.startsWith("Toast/") && node.fill && node.fill[0]) {
    const m = toastMasters[String(node.fill[0].color).toUpperCase()];
    if (m) {
      const texts = [];
      (function walk(n) {
        if (n.type === "text") texts.push(n);
        (n.children || []).forEach(walk);
      })(node);
      const icon = (function find(n) {
        if (n.type === "icon_font") return n;
        for (const c of n.children || []) {
          const r = find(c);
          if (r) return r;
        }
        return null;
      })(node);
      const w = typeof availWidth === "number" ? availWidth : TOAST_W;
      const descendants = {};
      if (w !== TOAST_W) descendants[m.ids.root] = { width: w };
      if (texts[0]) descendants[m.ids.title] = { content: texts[0].content };
      if (texts[1]) descendants[m.ids.body] = { content: texts[1].content };
      if (m.variant.action && texts[2]) descendants[m.ids.action] = { content: texts[2].content };
      if (icon && icon.iconFontName !== m.variant.icon) descendants[m.ids.icon] = { iconFontName: icon.iconFontName };
      bump("Toast/" + m.variant.key);
      // Fixed-size plain wrapper: a bare ref ignores its parent's layout.
      return frame(undefined, { width: w, height: 64, layout: "none", children: [makeRef(m.ids.root, descendants)] });
    }
  }

  // -- StatusBar: always "9:41" + signal/wifi/battery, zero drift -----------
  if (name === "StatusBar") {
    const descendants = {};
    const w = typeof availWidth === "number" ? availWidth : 390;
    const timeNode = (node.children || []).find((c) => c.type === "text");
    const timeColor = timeNode && timeNode.fill && timeNode.fill[0] && timeNode.fill[0].color;
    const light = typeof timeColor === "string" && timeColor.toUpperCase().startsWith("#FFFFFF");
    const root = light ? statusBarLightRoot : statusBarRoot;
    if (w !== 390) descendants[root] = { width: w };
    bump(light ? "StatusBar/Light" : "StatusBar/Default");
    // Wrapped in a plain frame with an explicit numeric height: confirmed
    // during a parent spot check that a bare ref directly beside a
    // `height:"fill_container"` sibling (e.g. a modal's "Dimmed" overlay)
    // makes that sibling's fill computation come out wrong, silently
    // pushing everything after it down and clipping content at the bottom
    // of the screen - even though the ref's own height (50) is fixed. The
    // wrapper gives the engine a known height so it never has to measure
    // the ref for that computation. See the report.
    return frame(undefined, { width: w, height: 50, layout: "none", children: [makeRef(root, descendants)] });
  }

  // -- NavCluster: whole BottomNav frame -> one ref, zero drift ------------
  if (name === "BottomNav") {
    const active = (node.children || []).find((c) => c.fill && c.fill[0] && c.fill[0].color === "#212121");
    const activeIcon = active && active.children && active.children[0] && active.children[0].iconFontName;
    const map = { house: navInicio, wallet: navPlan, "arrow-left-right": navMovimientos, "credit-card": navCuentas };
    const target = map[activeIcon] || navInicio;
    bump("NavCluster/" + target.name.split("/")[1]);
    return makeRef(target.id, {});
  }

  // -- SaveBar --------------------------------------------------------------
  if (name === "SaveBar") {
    const leftBtn = node.children && node.children[0];
    const leftIcon = leftBtn && leftBtn.children && leftBtn.children[0];
    const knobBtn = node.children && node.children[1];
    const labelNode = node.children && node.children[2];
    if (!leftIcon || !labelNode || labelNode.type !== "text") {
      leftAsIs.push(name + ": shape did not match the expected 4-child SaveBar layout, left as plain subtree.");
      return null;
    }
    // Disabled state: the knob (children[1]) is not the chartreuse check -
    // see 08 Dividir pago's hand-authored "SaveBar (deshabilitado)", now
    // renamed to "SaveBar" so it converts through this same path.
    const knobFill = knobBtn && knobBtn.fill && knobBtn.fill[0] && knobBtn.fill[0].color;
    const disabled = knobFill !== "#EAFC5F";
    const root = disabled ? saveBarDisabledRoot : saveBarRoot;
    const leftIconSlot = disabled ? saveBarDisabledLeftIcon : saveBarLeftIcon;
    const labelSlot = disabled ? saveBarDisabledLabel : saveBarLabel;
    const descendants = {};
    if (leftIcon.iconFontName !== "calculator") descendants[leftIconSlot] = { iconFontName: leftIcon.iconFontName };
    descendants[labelSlot] = { content: labelNode.content };
    bump(disabled ? "SaveBar/Disabled" : "SaveBar/Default");
    return makeRef(root, descendants);
  }

  // -- Envelope/<name>: replace only the header (children[0]) -------------
  if (name.startsWith("Envelope/")) {
    const header = node.children && node.children[0];
    const progress = node.children && node.children[1];
    if (!header || header.type !== "frame") return null;
    const iconBtn = header.children[0];
    const iconNode = iconBtn && iconBtn.children && iconBtn.children[0];
    const textGroup = header.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const detailNode = textGroup && textGroup.children[1];
    const right = header.children[2];
    const amountNode = right && right.children[0];
    const statusNode = right && right.children[1];
    if (!iconNode || !titleNode || !detailNode || !amountNode || !statusNode) {
      leftAsIs.push(name + ": header shape did not match the expected EnvelopeRow layout, left as plain subtree.");
      return null;
    }
    // classify state from the progress track shape
    let state = "underfunded";
    if (progress && progress.children.length === 1 && progress.children[0].name === "Over") state = "overspent";
    else if (progress && progress.children.every((c) => c.name === "Dot")) state = "empty";
    else if (progress && progress.children.every((c) => c.name === "Stripe")) state = "funded";
    const target = { funded: envelopeFunded, underfunded: envelopeUnderfunded, overspent: envelopeOverspent, empty: envelopeEmpty }[state];
    const descendants = {};
    const iconBg = iconBtn.fill[0].color;
    if (iconNode.iconFontName !== target.master.children[0].children[0].iconFontName) descendants[target.iconId] = { iconFontName: iconNode.iconFontName };
    descendants[target.titleId] = { content: titleNode.content };
    descendants[target.detailId] = { content: detailNode.content };
    descendants[target.amountId] = { content: amountNode.content, fill: amountNode.fill };
    descendants[target.statusId] = { content: statusNode.content, fill: statusNode.fill };
    // reproduce icon bg/icon colour exactly if they differ from the template
    const iconBtnMasterBg = target.master.children[0].fill[0].color;
    if (iconBg !== iconBtnMasterBg) {
      leftAsIs.push(name + ": icon background colour differs from the " + state + " template (" + iconBg + " vs " + iconBtnMasterBg + "); left the icon colour on the template (small consistency fix).");
    }
    // the header's own available width is the CARD's width minus the
    // card's own padding, not the availWidth passed in for the whole card -
    // omitting this let the ref keep the master's fixed 350px width and
    // overflow past the card's right padding (confirmed during a spot
    // check).
    const cardResolvedWidth = resolveWidth(node, availWidth);
    const headerAvail = cardResolvedWidth - horizontalPadding(node.padding);
    if (headerAvail !== target.master.width) descendants[target.rootId] = { width: headerAvail };
    bump("EnvelopeRow/" + cap(state));
    const ref = makeRef(target.rootId, descendants);
    node.children[0] = ref;
    return null; // keep the outer Envelope/<name> card + its real Progress bar untouched
  }

  // -- Account/<name>: replace only the header (children[0]) ---------------
  if (name.startsWith("Account/")) {
    const header = node.children && node.children[0];
    if (!header || header.type !== "frame") return null;
    const iconBtn = header.children[0];
    const iconNode = iconBtn && iconBtn.children && iconBtn.children[0];
    const textGroup = header.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const subtitleNode = textGroup && textGroup.children[1];
    const right = header.children[2];
    const amountNode = right && right.children[0];
    const percentNode = right && right.children[1];
    if (!iconNode || !titleNode || !subtitleNode || !amountNode || !percentNode) {
      leftAsIs.push(name + ": header shape did not match AccountRow, left as plain subtree.");
      return null;
    }
    const descendants = {};
    if (iconNode.iconFontName !== "landmark") descendants[accountRow.iconId] = { iconFontName: iconNode.iconFontName };
    if (titleNode.content !== "Banco Nación") descendants[accountRow.titleId] = { content: titleNode.content };
    if (subtitleNode.content !== "Cuenta sueldo") descendants[accountRow.subtitleId] = { content: subtitleNode.content };
    if (amountNode.content !== "$ 842.300") descendants[accountRow.amountId] = { content: amountNode.content };
    if (percentNode.content !== "84% del total") descendants[accountRow.percentId] = { content: percentNode.content };
    const cardResolvedWidth2 = resolveWidth(node, availWidth);
    const headerAvail2 = cardResolvedWidth2 - horizontalPadding(node.padding);
    if (headerAvail2 !== accountRow.master.width) descendants[accountRow.rootId] = { width: headerAvail2 };
    bump("AccountRow/Default");
    node.children[0] = makeRef(accountRow.rootId, descendants);
    return null; // outer card + real Progress bar stay untouched
  }

  // -- Tx/<name>: whole row -> ref -------------------------------------------
  if (name.startsWith("Tx/")) {
    const iconBtn = node.children[0];
    const iconNode = iconBtn && iconBtn.children && iconBtn.children[0];
    const textGroup = node.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const subtitleNode = textGroup && textGroup.children[1];
    const right = node.children[2];
    if (!iconNode || !titleNode || !subtitleNode || !right) {
      leftAsIs.push(name + ": row shape did not match TxRow, left as plain subtree.");
      return null;
    }
    const isIncome = right.children[0] && right.children[0].name === "IncomePill";
    const target = isIncome ? txIncome : txExpense;
    const descendants = {};
    if (iconNode.iconFontName !== (isIncome ? "arrow-down-left" : "shopping-cart")) descendants[target.iconId] = { iconFontName: iconNode.iconFontName };
    if (titleNode.content !== (isIncome ? "Reintegro" : "Coto")) descendants[target.titleId] = { content: titleNode.content };
    if (subtitleNode.content) descendants[target.subtitleId] = { content: subtitleNode.content };
    const amountText = isIncome ? right.children[0].children[0] : right.children[0];
    const rightSubText = isIncome ? right.children[1] : right.children[1];
    if (amountText) descendants[target.amountId] = { content: amountText.content };
    if (rightSubText) descendants[target.rightSubId] = { content: rightSubText.content };
    if (typeof node.width === "number" && node.width !== target.master.width) descendants[target.rootId] = { width: node.width };
    else if (availWidth && availWidth !== target.master.width) descendants[target.rootId] = { width: availWidth };
    bump("TxRow/" + cap(isIncome ? "income" : "expense"));
    return makeRef(target.rootId, descendants);
  }

  // -- Payee/<name> -----------------------------------------------------------
  if (name.startsWith("Payee/")) {
    const av = node.children[0];
    const avLabel = av && av.children[0];
    const textGroup = node.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const subtitleNode = textGroup && textGroup.children[1];
    if (!av || !avLabel || !titleNode || !subtitleNode) {
      leftAsIs.push(name + ": row shape did not match PayeeRow, left as plain subtree.");
      return null;
    }
    const descendants = {};
    if (avLabel.content !== "CO") descendants[payeeRow.avatarLabelId] = { content: avLabel.content };
    if (av.fill[0].color !== "#CFCAEC") descendants[payeeRow.avatarBgId] = { fill: av.fill };
    if (titleNode.content !== "Coto") descendants[payeeRow.titleId] = { content: titleNode.content };
    if (subtitleNode.content) descendants[payeeRow.subtitleId] = { content: subtitleNode.content };
    // T10 fix (see odd/tasks/user-flows.md): the row sits directly inside its
    // list card (PayeesCard) with the card's own padding already subtracted
    // by walkChildren's availWidth, so - unlike Envelope/Account, which are
    // the CARD itself - PayeeRow just needs availWidth applied straight to
    // the root, instead of silently keeping the master's fixed 350px width.
    if (typeof availWidth === "number" && availWidth !== payeeRow.master.width) descendants[payeeRow.rootId] = { width: availWidth };
    bump("PayeeRow/Default");
    return makeRef(payeeRow.rootId, descendants);
  }

  // -- Member/<name> -----------------------------------------------------------
  if (name.startsWith("Member/")) {
    const av = node.children[0];
    const avLabel = av && av.children[0];
    const textGroup = node.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const subtitleNode = textGroup && textGroup.children[1];
    const chip = node.children[2];
    const chipLabel = chip && chip.children && chip.children[0];
    if (!av || !avLabel || !titleNode || !subtitleNode || !chip || !chipLabel) {
      leftAsIs.push(name + ": row shape did not match MemberRow, left as plain subtree.");
      return null;
    }
    if (chip.children.length !== 1) {
      leftAsIs.push(name + ": role chip has a trailing dropdown icon that the MemberRow template doesn't model, left as plain subtree to avoid dropping it.");
      return null;
    }
    const descendants = {};
    if (avLabel.content !== "SO") descendants[memberRow.avatarLabelId] = { content: avLabel.content };
    if (av.fill[0].color !== "#CFCAEC") descendants[memberRow.avatarBgId] = { fill: av.fill };
    if (titleNode.content !== "Sofía (vos)") descendants[memberRow.titleId] = { content: titleNode.content };
    if (subtitleNode.content) descendants[memberRow.subtitleId] = { content: subtitleNode.content };
    if (chipLabel.content !== "Dueña") descendants[memberRow.chipLabelId] = { content: chipLabel.content };
    // T10 fix (user report on screen 16 · Planes y miembros): the "Dueña" role
    // chip overflowed past MembersCard's right edge because the ref kept the
    // master's fixed 350px width instead of the card's actual content width
    // (390 - 20*2 screen padding - 32 card padding = 318px). Same class of
    // bug as the old EnvelopeRow/AccountRow overflow, same fix: override the
    // root width with availWidth whenever it differs from the master's.
    if (typeof availWidth === "number" && availWidth !== memberRow.master.width) descendants[memberRow.rootId] = { width: availWidth };
    bump("MemberRow/Default");
    return makeRef(memberRow.rootId, descendants);
  }

  // -- Plan/<name> ---------------------------------------------------------
  if (name.startsWith("Plan/")) {
    const bg = node.fill && node.fill[0] && node.fill[0].color;
    const active = bg === "#CFCAEC";
    const target = active ? planRowActive : planRowInactive;
    const textGroup = node.children[1];
    const titleNode = textGroup && textGroup.children[0];
    const subtitleNode = textGroup && textGroup.children[1];
    if (!titleNode || !subtitleNode) {
      leftAsIs.push(name + ": row shape did not match PlanRow, left as plain subtree.");
      return null;
    }
    const descendants = {};
    if (titleNode.content !== target.master.children[1].children[0].content) descendants[target.titleId] = { content: titleNode.content };
    if (subtitleNode.content !== target.master.children[1].children[1].content) descendants[target.subtitleId] = { content: subtitleNode.content };
    // Plan currency support: a solo inactive plan (single Avatar/<label> child
    // in its own Avatars group, e.g. "Viaje a Chile") hides the master's
    // second, hardcoded "JU" avatar and relabels the first one instead of
    // always showing the "SO"/"JU" pair meant for a 2-member plan.
    if (!active) {
      const avatarsNode = node.children[0];
      const avatarList = (avatarsNode && avatarsNode.children) || [];
      if (avatarList.length === 1) {
        const soloLabelNode = avatarList[0].children && avatarList[0].children[0];
        descendants[target.avatarBId] = { visible: false };
        if (soloLabelNode && soloLabelNode.content && soloLabelNode.content !== "SO") descendants[target.avatarALabelId] = { content: soloLabelNode.content };
      }
    }
    // T10 fix: same width-override rule as Payee/Member above.
    if (typeof availWidth === "number" && availWidth !== target.master.width) descendants[target.rootId] = { width: availWidth };
    bump("PlanRow/" + (active ? "Active" : "Inactive"));
    return makeRef(target.rootId, descendants);
  }

  // -- Toggle (segmented Gasto/Ingreso) --------------------------------------
  if (name === "Toggle") {
    const segs = node.children || [];
    const activeSeg = segs.find((s) => Array.isArray(s.fill) && s.fill.length > 0);
    const activeLabel = activeSeg && activeSeg.children[0] && activeSeg.children[0].content;
    const target = activeLabel === "Ingreso" ? toggleIngreso : toggleGasto;
    const descendants = {};
    if (typeof availWidth === "number" && availWidth !== target.width) descendants[target.id] = { width: availWidth };
    bump("Toggle/" + (activeLabel === "Ingreso" ? "IngresoActive" : "GastoActive"));
    return makeRef(target.id, descendants);
  }

  // -- BalanceCard (JoinedCard: two fused blob lobes) ------------------------
  if (name === "JoinedCard") {
    const left = node.children && node.children[0];
    const right = node.children && node.children[1];
    const leftAmount = left && left.children && left.children[0];
    const leftLabel = left && left.children && left.children[1];
    const rightText = right && right.children && right.children[0];
    const rightNumber = rightText && rightText.children && rightText.children[0];
    const rightLabel = rightText && rightText.children && rightText.children[1];
    const rightBtn = right && right.children && right.children[1];
    if (!leftAmount || !leftLabel || !rightNumber || !rightLabel) {
      leftAsIs.push(name + ": subtree did not match the BalanceCard template (amount+label / number+label), left as plain subtree.");
      return null;
    }
    if (typeof availWidth === "number" && availWidth !== BALANCECARD_W) {
      leftAsIs.push(name + ": available width " + availWidth + " differs from the master's fixed " + BALANCECARD_W + "px, and the blob path does not resize; left as plain subtree to avoid a mismatched shape.");
      return null;
    }
    const descendants = {};
    const amountOverride = {};
    if (leftAmount.content !== "$ 48.200") amountOverride.content = leftAmount.content;
    if (typeof leftAmount.fontSize === "number" && leftAmount.fontSize !== 38) amountOverride.fontSize = leftAmount.fontSize;
    if (Object.keys(amountOverride).length) descendants[balanceCardAmount] = amountOverride;
    if (leftLabel.content !== "Listo para asignar") descendants[balanceCardLeftLabel] = { content: leftLabel.content };
    const numberOverride = {};
    if (rightNumber.content !== "12") numberOverride.content = rightNumber.content;
    if (typeof rightNumber.fontSize === "number" && rightNumber.fontSize !== 38) numberOverride.fontSize = rightNumber.fontSize;
    if (Object.keys(numberOverride).length) descendants[balanceCardNumber] = numberOverride;
    if (rightLabel.content !== "Sobres activos") descendants[balanceCardRightLabel] = { content: rightLabel.content };
    if (!rightBtn) descendants[balanceCardPlusBtn] = { visible: false };
    else {
      // Carry a disabled look (e.g. 06 with 0 envelopes) through to the instance.
      const btnFill = rightBtn.fill && rightBtn.fill[0] && rightBtn.fill[0].color;
      if (btnFill && btnFill.toUpperCase() !== "#CFCAEC") {
        descendants[balanceCardPlusBtn] = { fill: rightBtn.fill };
        const icon = (rightBtn.children || []).find((c) => c.type === "icon_font");
        if (icon && icon.fill) descendants[balanceCardPlusIcon] = { fill: icon.fill };
      }
    }
    bump("BalanceCard/Default");
    return makeRef(balanceCardRoot, descendants);
  }

  // -- AmountCapsule ("$ | value", lavender joined blob) ---------------------
  // T9: converted to a ref with a FIXED numeric width per instance (the
  // amount's digit count is known at build time), replacing the previous
  // "left as plain subtree" decision (T7 finding 2) - the master's own
  // internal Value lobe and background path are resized to match via
  // descendants overrides, computed with estimateTextWidth.
  if (name === "AmountCapsule") {
    const currencyNode = node.children && node.children[0];
    const valueGroup = node.children && node.children[1];
    const valueNode = valueGroup && valueGroup.children && valueGroup.children[0];
    if (!currencyNode || !valueNode || typeof valueNode.content !== "string") {
      leftAsIs.push(name + ": no numeric value text found, left as plain subtree.");
      return null;
    }
    const fontSize = typeof valueNode.fontSize === "number" ? valueNode.fontSize : 40;
    const textW = estimateTextWidth(valueNode.content, fontSize);
    const valueLobeW = textW + AMOUNTCAPSULE_VALUE_PAD_LEFT + AMOUNTCAPSULE_VALUE_PAD_RIGHT;
    const totalW = AMOUNTCAPSULE_CURRENCY_W + AMOUNTCAPSULE_LOBE_GAP + valueLobeW;
    const descendants = {};
    const valueOverride = { content: valueNode.content };
    if (fontSize !== 40) valueOverride.fontSize = fontSize;
    descendants[amountCapsuleValue] = valueOverride;
    descendants[amountCapsuleValueWrap] = { width: valueLobeW };
    descendants[amountCapsuleShapeId] = { width: totalW, d: amountCapsuleShapeD(valueLobeW) };
    descendants[amountCapsuleRoot] = { width: totalW };
    // Plan currency support: the base screen's own Currency>Badge>text carries
    // the plan's symbol ("$", "US$", "€" - see PRD-ux-spec.md §7 "Moneda").
    // Multi-character symbols (e.g. "US$") are shrunk so they still fit the
    // fixed 48px badge circle instead of overflowing it.
    const badgeNode = currencyNode.children && currencyNode.children[0];
    const symbolNode = badgeNode && badgeNode.children && badgeNode.children[0];
    if (symbolNode && typeof symbolNode.content === "string" && symbolNode.content !== "$") {
      const symbolOverride = { content: symbolNode.content };
      const baseSymbolFontSize = typeof symbolNode.fontSize === "number" ? symbolNode.fontSize : 20;
      symbolOverride.fontSize = symbolNode.content.length > 1 ? Math.min(baseSymbolFontSize, 14) : baseSymbolFontSize;
      descendants[amountCapsuleCurrencySymbol] = symbolOverride;
    }
    bump('AmountCapsule/"$ | value"');
    // A bare ref ignores its parent's centering; a fixed-size plain wrapper gets centred instead.
    return frame(undefined, { width: totalW, height: amountCapsule.height, layout: "none", children: [makeRef(amountCapsuleRoot, descendants)] });
  }

  // -- Button (full-width pill: Primary or Secondary) -------------------------
  if (name === "PrimaryButton" || name === "AssignButton" || name === "ApplyButton" || name === "SecondaryButton") {
    const isSecondary = name === "SecondaryButton";
    const target = isSecondary ? { root: buttonSecondaryRoot, icon: buttonSecondaryIcon, label: buttonSecondaryLabel, w: buttonSecondary.width } : { root: buttonPrimaryRoot, icon: buttonPrimaryIcon, label: buttonPrimaryLabel, w: buttonPrimary.width };
    const iconNode = (node.children || []).find((c) => c.type === "icon_font");
    const labelNode = (node.children || []).find((c) => c.type === "text");
    if (!labelNode) {
      leftAsIs.push(name + ": no label text found, left as plain subtree.");
      return null;
    }
    const descendants = {};
    if (iconNode && iconNode.iconFontName !== "sparkles" && iconNode.iconFontName !== "plus") descendants[target.icon] = { iconFontName: iconNode.iconFontName };
    if (!iconNode) descendants[target.icon] = { visible: false };
    descendants[target.label] = { content: labelNode.content };
    if (typeof availWidth === "number" && availWidth !== target.w) descendants[target.root] = { width: availWidth };
    bump("Button/" + (isSecondary ? "Secondary" : "Primary"));
    return makeRef(target.root, descendants);
  }

  // -- Chip ---------------------------------------------------------------
  // `fill_container` chips sit in an equal-width grid (e.g. QuickAmounts) or
  // alone in a fill_container column; resolveWidthForChild (T7) now computes
  // their exact per-cell width, so the root gets a numeric width override.
  // `fit_content` chips hug a variable-length label (a tag, a filter pill, a
  // date range); the Chip masters are fixed-width, and there is no reliable
  // way to precompute the exact pixel width of an arbitrary label without
  // measuring it live, so converting one risks clipping or slack - left as a
  // plain subtree, same reasoning as AmountCapsule above.
  if (name.startsWith("Chip/")) {
    if (!node.children || node.children.length > 2) {
      leftAsIs.push(name + ": chip has more than an icon+label (e.g. a trailing clear icon) that the Chip templates don't model, left as plain subtree to avoid dropping it.");
      return null;
    }
    if (node.width !== "fill_container") {
      leftAsIs.push(name + ": fit_content label width varies per text and the Chip masters are fixed-width; converting risks a size mismatch that can't be checked without live font metrics, left as plain subtree.");
      return null;
    }
    const iconNode = (node.children || []).find((c) => c.type === "icon_font");
    const labelNode = (node.children || []).find((c) => c.type === "text");
    if (!labelNode) return null;
    const bg = node.fill && node.fill[0] && node.fill[0].color;
    let target, defaultBg, iconId, labelId;
    if (iconNode) {
      target = chipIconRoot; defaultBg = "#FFFFFF"; iconId = chipIconIcon; labelId = chipIconLabel;
    } else if (bg === "#CFCAEC") {
      target = chipSelectedRoot; defaultBg = "#CFCAEC"; labelId = chipSelectedLabel;
    } else {
      target = chipDefaultRoot; defaultBg = "#FFFFFF"; labelId = chipDefaultLabel;
    }
    const descendants = {};
    descendants[labelId] = { content: labelNode.content };
    if (iconNode && iconId) descendants[iconId] = { iconFontName: iconNode.iconFontName };
    const rootOverride = {};
    if (bg && bg !== defaultBg) rootOverride.fill = node.fill;
    if (typeof availWidth === "number") rootOverride.width = availWidth;
    if (typeof node.height === "number" && node.height !== 44) rootOverride.height = node.height;
    if (Object.keys(rootOverride).length) descendants[target] = rootOverride;
    bump("Chip/" + (iconNode ? "DefaultIcon" : bg === "#CFCAEC" ? "Selected" : "Default"));
    return makeRef(target, descendants);
  }

  // -- Key (numeric keypad) -------------------------------------------------
  if (name.startsWith("Key/")) {
    const child = node.children && node.children[0];
    if (!child) {
      leftAsIs.push(name + ": empty key, left as plain subtree.");
      return null;
    }
    const isIcon = child.type === "icon_font";
    const bg = node.fill && node.fill[0] && node.fill[0].color;
    const target = isIcon ? keyDel : bg === "#CFCAEC" ? keyOperator : keyNumber;
    const defaultBg = target === keyOperator ? "#CFCAEC" : "#FFFFFF";
    const descendants = {};
    if (isIcon) {
      if (child.iconFontName !== "delete") descendants[target.contentId] = { iconFontName: child.iconFontName };
    } else if (child.content !== undefined) {
      descendants[target.contentId] = { content: child.content };
    }
    if (bg && bg !== defaultBg) descendants[target.rootId] = { fill: node.fill };
    if (typeof availWidth === "number" && availWidth !== target.master.width) {
      descendants[target.rootId] = Object.assign({}, descendants[target.rootId], { width: availWidth });
    }
    bump("Key/" + cap(isIcon ? "del" : bg === "#CFCAEC" ? "operator" : "number"));
    return makeRef(target.rootId, descendants);
  }

  // -- FieldRow (settings-style row with chevron) ----------------------------
  if (name.startsWith("Field/")) {
    const labelNode = node.children[0];
    const valueGroup = node.children[1];
    const valueNode = valueGroup && valueGroup.children[0];
    if (!labelNode || !valueNode) {
      leftAsIs.push(name + ": row shape did not match FieldRow, left as plain subtree.");
      return null;
    }
    const descendants = {};
    if (labelNode.content) descendants[fieldRowLabel] = { content: labelNode.content };
    if (valueNode.content) descendants[fieldRowValue] = { content: valueNode.content };
    if (typeof availWidth === "number" && availWidth !== fieldRow.width) descendants[fieldRowRoot] = { width: availWidth };
    bump("FieldRow/Default");
    return makeRef(fieldRowRoot, descendants);
  }

  // -- TextField (Input/<name>: default or error by presence of `stroke`) ---
  if (name.startsWith("Input/")) {
    const textGroup = node.children[0];
    const labelNode = textGroup && textGroup.children[0];
    const valueNode = textGroup && textGroup.children[1];
    const iconNode = node.children[1];
    if (!labelNode || !valueNode || !iconNode) {
      leftAsIs.push(name + ": row shape did not match TextField, left as plain subtree.");
      return null;
    }
    const isError = !!node.stroke;
    const target = isError ? textFieldError : textFieldDefault;
    const descendants = {};
    descendants[target.labelId] = { content: labelNode.content };
    descendants[target.valueId] = { content: valueNode.content };
    if (iconNode.iconFontName) descendants[target.iconId] = { iconFontName: iconNode.iconFontName };
    if (typeof availWidth === "number" && availWidth !== target.master.width) descendants[target.rootId] = { width: availWidth };
    bump("TextField/" + (isError ? "Error" : "Default"));
    return makeRef(target.rootId, descendants);
  }

  // -- standalone Avatar (only reached when not already consumed by a
  //    bigger row match, e.g. the greeting header avatar) -------------------
  if (name === "Avatar" || name.startsWith("Avatar/")) {
    const labelNode = node.children && node.children[0];
    if (!labelNode) return null;
    const descendants = {};
    if (labelNode.content !== "SO") descendants[avatarLabel] = { content: labelNode.content };
    const bg = node.fill && node.fill[0] && node.fill[0].color;
    if (bg && bg !== "#CFCAEC") descendants[avatarRoot] = { fill: node.fill };
    if (typeof node.width === "number" && node.width !== 52) {
      descendants[avatarRoot] = Object.assign(descendants[avatarRoot] || {}, { width: node.width, height: node.height });
    }
    bump("Avatar/Default");
    return makeRef(avatarRoot, descendants);
  }

  // -- standalone IconButton (leaf) -----------------------------------------
  if (name.startsWith("IconButton/")) {
    const ref = iconButtonOverride(node, availWidth);
    if (ref) return ref;
  }

  return null;
}

const screenPage = doc.pages.find((p) => p.name !== "Componentes");
screenPage.children.forEach((screen) => {
  walkChildren(screen, typeof screen.width === "number" ? screen.width : 390);
});

// ===========================================================================
// ROW WIDTH AUDIT (regression guard) - the EnvelopeRow/AccountRow overflow
// (T6-era) and the PayeeRow/MemberRow overflow (user-reported on screens 15
// and 16) were both the same bug: a row-type ref kept its master's fixed
// width instead of its container's real content width. Both are now fixed
// at the source (see the width-override lines in each "-- <Row> --" handler
// above), but a future row-type component could reintroduce the same class
// of bug silently. This is a second, independent pass over the FINAL,
// already-converted tree: for every `ref` to a row-type master, it
// recomputes the actual content width available inside the ref's parent
// (the same resolveWidth/horizontalPadding/resolveWidthForChild logic
// walkChildren uses) and compares it against the ref's effective width (its
// root override, or the master's own width if there is none). A mismatch is
// auto-fixed (the override is corrected in place) and logged, so a broken
// build never silently ships a clipped or gapped row.
// ===========================================================================
const ROW_MASTER_IDS = new Set([
  fieldRowRoot,
  saveBarRoot,
  textFieldDefault.rootId,
  textFieldError.rootId,
  accountRow.rootId,
  payeeRow.rootId,
  memberRow.rootId,
  planRowActive.rootId,
  planRowInactive.rootId,
  txExpense.rootId,
  txIncome.rootId,
  envelopeFunded.rootId,
  envelopeUnderfunded.rootId,
  envelopeOverspent.rootId,
  envelopeEmpty.rootId,
]);
const widthAuditIssues = [];
function auditRowWidths(node, availWidth) {
  if (!node || typeof node !== "object") return;
  if (node.type === "ref" && ROW_MASTER_IDS.has(node.ref)) {
    const master = masterById(node.ref);
    const override = node.descendants && node.descendants[node.ref];
    const effectiveWidth = override && typeof override.width === "number" ? override.width : master && typeof master.width === "number" ? master.width : null;
    if (typeof effectiveWidth === "number" && typeof availWidth === "number" && effectiveWidth !== availWidth) {
      widthAuditIssues.push({ master: master && master.name, ref: node.id, expected: availWidth, was: effectiveWidth });
      // Auto-fix: correct the override in place so the shipped build never
      // carries a row that overflows or falls short of its container.
      node.descendants = node.descendants || {};
      node.descendants[node.ref] = Object.assign({}, node.descendants[node.ref], { width: availWidth });
    }
  }
  if (!node.children || !node.children.length) return;
  // A `ref` itself has no usable width/padding (see the T6/T7 constraints
  // above: properties set directly on a ref are dropped) - walk into it with
  // the same availWidth its parent gave it, same as the "fit_content
  // best-effort fallback" branch of resolveWidth already does for any node
  // without a real width.
  const resolved = node.type === "ref" ? availWidth : resolveWidth(node, availWidth);
  const childAvail = resolved - horizontalPadding(node.padding);
  node.children.forEach((child, i) => {
    if (!child) return;
    const childResolved = node.type === "ref" ? availWidth : resolveWidthForChild(child, node, childAvail, i);
    auditRowWidths(child, childResolved);
  });
}
screenPage.children.forEach((screen) => {
  auditRowWidths(screen, typeof screen.width === "number" ? screen.width : 390);
});
console.log("\n--- row width audit (" + widthAuditIssues.length + " issue(s)" + (widthAuditIssues.length ? ", auto-fixed" : "") + ") ---");
widthAuditIssues.forEach((i) => console.log("- " + i.master + " ref " + i.ref + ": was " + i.was + "px, container needs " + i.expected + "px - corrected."));

// ===========================================================================
// FLUJOS PAGE (T2, see odd/tasks/user-flows.md) - one horizontal band per
// flow in the PRD -> screens map, each step a `ref` to the real screen frame.
// ===========================================================================
// Probed in a small file (see the report): a `ref` to a whole screen frame -
// marked `reusable: true` like a component master, nested refs and photos
// included - renders identically to the original screen, both alone and
// nested inside a plain wrapper frame that export-frames captures as one
// image. So flows stay in sync with the real screens instead of drifting
// clones: every step below is a live reference, never a copy.
screenPage.children.forEach((screen) => {
  screen.reusable = true;
});
function screenByNumber(num) {
  const screen = screenPage.children.find((s) => s.name.startsWith(num + " · "));
  if (!screen) throw new Error("Flujos: no screen numbered " + num);
  return screen;
}

const FLOWS = [
  { id: "F1", title: "F1 · Acceso", frs: ["FR-01"], desc: "Iniciar sesión o crear una cuenta nueva, elegir cómo empezar y llegar al plan recién creado.", steps: ["18", "19", "34", "20", "06", "28"] },
  { id: "F2", title: "F2 · Planes", frs: ["FR-02", "FR-27", "FR-40"], desc: "Crear un plan con su moneda y su primera cuenta, invitar miembros con un código y su QR, y unirse a uno ajeno (por código o por enlace).", steps: ["16", "20", "33", "21", "30", "45"] },
  { id: "F3", title: "F3 · Plan mensual", frs: ["FR-09", "FR-10", "FR-15", "FR-16", "FR-21"], desc: "Usar la plantilla sugerida, asignar el dinero por primera vez o escribir un monto propio en la calculadora, ver el plan en curso y navegar hacia meses futuros.", steps: ["06", "35", "46", "02", "03", "53", "04"] },
  { id: "F4a", title: "F4a · Sobres y grupos", frs: ["FR-04"], desc: "Crear un sobre, elegir su grupo desde una hoja con radio, y administrar los grupos, con su confirmación de borrado.", steps: ["02", "31", "52", "32", "44"] },
  { id: "F4b", title: "F4b · Detalle y movimiento de sobre", frs: ["FR-19", "FR-20", "FR-24", "FR-25"], desc: "Ver el detalle de un sobre, editarlo o mover dinero entre sobres, con su confirmación de borrado.", steps: ["22", "23", "43", "24"] },
  { id: "F5", title: "F5 · Cierre de mes", frs: ["FR-11", "FR-12"], desc: "Saldar el mes: arrastre de sobrantes, descuento de sobregiros, invariante verificado.", steps: ["25"] },
  { id: "F6a", title: "F6a · Registrar movimiento", frs: ["FR-06", "FR-07", "FR-08", "FR-18"], desc: "Cargar un gasto eligiendo beneficiario, sobre, cuenta y fecha, y dividirlo si hace falta.", steps: ["07", "36", "38", "26", "08"] },
  { id: "F6b", title: "F6b · Historial de movimientos", frs: ["FR-13", "FR-14", "FR-22", "FR-23"], desc: "Registrar un ingreso, listar, filtrar, editar y eliminar movimientos, con recálculo.", steps: ["09", "10", "11", "12", "49", "27"] },
  { id: "F7", title: "F7 · Cuentas", frs: ["FR-03", "FR-17", "FR-28"], desc: "Administrar cuentas y transferir dinero entre ellas, eligiendo la cuenta destino, sin pasar por un sobre; editar, archivar o ver las cuentas archivadas.", steps: ["13", "14", "42", "48", "51", "28", "37", "29"] },
  { id: "F8", title: "F8 · Metas, beneficiarios y reportes", frs: ["FR-05", "FR-19", "FR-26"], desc: "Tres accesos independientes desde Inicio: menú de cuenta, metas con foto (y sus opciones), beneficiarios (con alta/edición) y reportes.", steps: ["01", "39", "05", "40", "50", "15", "41", "47", "17"] },
];

const FLOW_SCREEN_W = 390;
const FLOW_SCREEN_H = 844;
const FLOW_ARROW_LANE = 72;
const FLOW_STEP = FLOW_SCREEN_W + FLOW_ARROW_LANE;
const FLOW_MARGIN_X = 48;
const FLOW_SCREENS_Y = 156;
const FLOW_CAPTION_GAP = 16;
const FLOW_BAND_GAP = 64;

// A single filled polygon (shaft + head) - simpler than mixing a stroked
// line with a filled triangle in one path, and it still stretches cleanly
// to its own node box, per the path-stretching gotcha in
// odd/tasks/component-library.md.
function arrowPath(w, h, color) {
  const midY = h / 2;
  const shaftHalf = 1.5;
  const headW = 16;
  const headHalf = 7;
  const shaftEndX = w - headW;
  const d = [
    `M0 ${midY - shaftHalf}`,
    `L${shaftEndX} ${midY - shaftHalf}`,
    `L${shaftEndX} ${midY - headHalf}`,
    `L${w} ${midY}`,
    `L${shaftEndX} ${midY + headHalf}`,
    `L${shaftEndX} ${midY + shaftHalf}`,
    `L0 ${midY + shaftHalf}`,
    "Z",
  ].join(" ");
  return path({ name: "Arrow", x: 0, y: 0, width: w, height: h, d, fill: solid(color) });
}

function frTag(fr) {
  return frame("FR", {
    height: 26,
    layout: "horizontal",
    padding: [0, 12],
    justifyContent: "center",
    alignItems: "center",
    cornerRadius: 13,
    fill: solid("#CFCAEC"),
    children: [text(fr, { size: 12, weight: 500 })],
  });
}

function flowBand(flow, yOffset) {
  const n = flow.steps.length;
  let bandWidth = FLOW_MARGIN_X * 2 + n * FLOW_SCREEN_W + (n - 1) * FLOW_ARROW_LANE;
  const bandHeight = FLOW_SCREENS_Y + FLOW_SCREEN_H + FLOW_CAPTION_GAP + 34 + 40;
  // Band uses layout:"none", so - per the z-order rule in
  // odd/tasks/component-library.md (children[0] renders on TOP in a
  // layout:"none" frame) - the Background rect is pushed in LAST, below.
  // text() (see the shared factories above) has no x/y options - like the
  // Componentes page layout code above, position it by assigning .x/.y
  // directly on the returned node.
  const titleNode = text(flow.title, { size: 28, weight: 600 });
  titleNode.x = FLOW_MARGIN_X;
  titleNode.y = 28;
  const children = [titleNode];
  const descRow = frame("DescRow", {
    x: FLOW_MARGIN_X,
    y: 78,
    layout: "horizontal",
    gap: 12,
    alignItems: "center",
    children: [text(flow.desc, { size: 15, color: "#6B6B6B" }), ...flow.frs.map(frTag)],
  });
  children.push(descRow);
  // A short flow (e.g. one screen) must still fit its description and FR tags.
  bandWidth = Math.max(bandWidth, FLOW_MARGIN_X * 2 + estimateFitWidth(descRow));

  flow.steps.forEach((num, i) => {
    const x = FLOW_MARGIN_X + i * FLOW_STEP;
    const screen = screenByNumber(num);
    // Plain, non-reusable wrapper: it is the ref's fixed-size position slot
    // (bare refs mis-measure inside flex rows - see makeRef/wrapRefIfRisky
    // above), and per the T3 export rule, no reusable master may nest inside
    // a frame meant to export as a single image - only the wrapper itself is
    // plain, the ref inside it is an ordinary instance, not a master.
    const slot = frame("Step", {
      x,
      y: FLOW_SCREENS_Y,
      width: FLOW_SCREEN_W,
      height: FLOW_SCREEN_H,
      layout: "none",
      children: [makeRef(screen.id, { [screen.id]: { x: 0, y: 0 } })],
    });
    children.push(slot);
    const caption = text(i + 1 + " · " + screen.name.replace(/^\d+\s*·\s*/, ""), { size: 15, weight: 500, width: FLOW_SCREEN_W, textGrowth: "fixed-width" });
    caption.x = x;
    caption.y = FLOW_SCREENS_Y + FLOW_SCREEN_H + FLOW_CAPTION_GAP;
    children.push(caption);
    if (i < n - 1) {
      const arrowX = x + FLOW_SCREEN_W;
      children.push(frame(undefined, { x: arrowX, y: FLOW_SCREENS_Y + FLOW_SCREEN_H / 2 - 12, width: FLOW_ARROW_LANE, height: 24, layout: "none", children: [arrowPath(FLOW_ARROW_LANE, 24, "#6B6B6B")] }));
    }
  });

  children.push(rect({ name: "Background", x: 0, y: 0, width: bandWidth, height: bandHeight, color: "#EDEDED" }));
  return { frame: frame(flow.title, { x: 0, y: yOffset, width: bandWidth, height: bandHeight, layout: "none", children }), width: bandWidth, height: bandHeight };
}

let flowY = 60;
let flowPageWidth = 0;
const flowChildren = [];
FLOWS.forEach((flow) => {
  const band = flowBand(flow, flowY);
  flowChildren.push(band.frame);
  flowPageWidth = Math.max(flowPageWidth, band.width);
  flowY += band.height + FLOW_BAND_GAP;
});
const flowsPage = {
  id: reserve("cl-page-flujos"),
  name: "Flujos",
  children: [...flowChildren, rect({ name: "Background", x: 0, y: 0, width: flowPageWidth + 96, height: flowY, color: "#F5F5F5" })],
};
// Insert right after the screens page (Componentes, Diseño, Flujos - in that
// document order), per the task's "a page named Flujos after the screens page".
const screenPageIndex = doc.pages.indexOf(screenPage);
doc.pages.splice(screenPageIndex + 1, 0, flowsPage);

// ===========================================================================
// write output + report
// ===========================================================================
fs.writeFileSync(output, JSON.stringify(doc));

console.log("\n--- ref instances created ---");
Object.entries(stats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(v, k));
console.log("\n--- left as plain subtrees (see report) ---");
leftAsIs.forEach((l) => console.log("- " + l));
console.log("\nWrote", output);
