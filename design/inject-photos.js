// Embeds the goal photos into an OpenPencil .op file.
//
// OpenPencil desktop 0.8.4 cannot open files that use image *fills*, but it does
// open image *nodes*. The design is authored with image fills (`PHOTO:<key>`
// placeholders or data URIs); this script rewrites every frame that has an image
// fill into:
//   frame (layout none, base colour)
//     ├─ "Overlay" frame (original layout, gradient fills, original children)
//     └─ image node (the photo, full size; last child = bottom of the stack)
//
// Usage: node design/inject-photos.js <input.op> [output.op]
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
const output = process.argv[3] || input;
if (!input) {
  console.error("Usage: node inject-photos.js <input.op> [output.op]");
  process.exit(1);
}

const photosDir = path.join(__dirname, "photos");
const cache = {};
function dataUri(key) {
  if (!cache[key]) {
    const file = path.join(photosDir, key + ".jpg");
    if (!fs.existsSync(file)) throw new Error("Missing photo: " + file);
    cache[key] = "data:image/jpeg;base64," + fs.readFileSync(file).toString("base64");
  }
  return cache[key];
}

// Frames whose width/height are layout-driven need numeric sizes for the
// absolutely positioned photo and overlay.
const FALLBACK_SIZE = { PhotoHero: { width: 362, height: 320 } };

function photoKey(fill, frame) {
  if (fill.url && fill.url.startsWith("PHOTO:")) return fill.url.slice("PHOTO:".length);
  if (frame.__photoKey) return frame.__photoKey;
  const name = frame.name || "";
  if (/auto/i.test(name)) return "auto";
  if (/emergencia|PhotoHero/i.test(name)) return "emergencia";
  if (/mudanza/i.test(name)) return "mudanza";
  return "vacaciones";
}

const LAYOUT_KEYS = ["layout", "gap", "padding", "justifyContent", "alignItems"];
let converted = 0;

function convert(frame) {
  const fills = Array.isArray(frame.fill) ? frame.fill : [];
  const img = fills.find((f) => f.type === "image");
  if (!img) return;
  const key = photoKey(img, frame);
  const size = FALLBACK_SIZE[frame.name] || {};
  const width = typeof frame.width === "number" ? frame.width : size.width;
  const height = typeof frame.height === "number" ? frame.height : size.height;
  if (typeof width !== "number" || typeof height !== "number") {
    throw new Error(`Frame ${frame.id} (${frame.name}) needs a numeric size`);
  }

  const solids = fills.filter((f) => f.type === "solid");
  const overlayFills = fills.filter((f) => f.type !== "solid" && f.type !== "image");

  const overlay = { type: "frame", id: frame.id + "-overlay", name: "Overlay", x: 0, y: 0, width, height };
  for (const k of LAYOUT_KEYS) if (k in frame) overlay[k] = frame[k];
  overlay.fill = overlayFills;
  overlay.children = frame.children || [];

  const photo = {
    type: "image",
    id: frame.id + "-photo",
    name: "Photo/" + key,
    x: 0,
    y: 0,
    width,
    height,
    src: dataUri(key),
    objectFit: "fill",
  };

  for (const k of LAYOUT_KEYS) delete frame[k];
  frame.layout = "none";
  frame.fill = solids;
  // OpenPencil draws children[0] of a layout:none frame on top, so the photo goes last.
  frame.children = [overlay, photo];
  frame.clipContent = true;
  converted++;
}

const doc = JSON.parse(fs.readFileSync(input, "utf8"));
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== "object") return;
  if (node.type === "frame") convert(node);
  for (const key of Object.keys(node)) walk(node[key]);
})(doc);

fs.writeFileSync(output, JSON.stringify(doc));
console.log(`Converted ${converted} photo frames -> ${output}`);
