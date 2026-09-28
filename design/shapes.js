// Joined "blob" outlines: rounded lobes fused by a concave neck, as in the
// inspiration (balance card, amount capsule, nav tray).
//
// blobPath(lobes, height, neck) -> SVG path data
//   lobes:  [{ x, w, r }] left to right, all full height; r = corner radius.
//           Consecutive lobes may overlap or leave a small gap.
//   height: shared height of every lobe.
//   neck:   how far the waist dips in from the top and bottom edges.
function blobPath(lobes, height, neck) {
  const H = height;
  const f = (n) => Math.round(n * 100) / 100;
  const k = 0.5523; // cubic approximation of a quarter circle
  let d = "";

  // Top edge, left to right.
  lobes.forEach((lobe, i) => {
    const { x, w, r } = lobe;
    if (i === 0) {
      d += `M${f(x)} ${f(r)} C${f(x)} ${f(r - r * k)} ${f(x + r - r * k)} 0 ${f(x + r)} 0 `;
    }
    const next = lobes[i + 1];
    if (next) {
      // Waist: leave this lobe's top edge, dip to the neck, and rise onto the next lobe.
      const a = x + w - r; // where this lobe's corner begins
      const b = next.x + next.r; // where the next lobe's corner ends
      const mid = (x + w + next.x) / 2;
      d += `L${f(a)} 0 `;
      d += `C${f(a + r * 0.75)} 0 ${f(mid - r * 0.35)} ${f(neck)} ${f(mid)} ${f(neck)} `;
      d += `C${f(mid + next.r * 0.35)} ${f(neck)} ${f(b - next.r * 0.75)} 0 ${f(b)} 0 `;
    } else {
      d += `L${f(x + w - r)} 0 C${f(x + w - r + r * k)} 0 ${f(x + w)} ${f(r - r * k)} ${f(x + w)} ${f(r)} `;
      d += `L${f(x + w)} ${f(H - r)} C${f(x + w)} ${f(H - r + r * k)} ${f(x + w - r + r * k)} ${f(H)} ${f(x + w - r)} ${f(H)} `;
    }
  });

  // Bottom edge, right to left (mirror of the top).
  for (let i = lobes.length - 1; i >= 0; i--) {
    const { x, r } = lobes[i];
    const prev = lobes[i - 1];
    if (prev) {
      const a = x + r;
      const b = prev.x + prev.w - prev.r;
      const mid = (prev.x + prev.w + x) / 2;
      d += `L${f(a)} ${f(H)} `;
      d += `C${f(a - r * 0.75)} ${f(H)} ${f(mid + r * 0.35)} ${f(H - neck)} ${f(mid)} ${f(H - neck)} `;
      d += `C${f(mid - prev.r * 0.35)} ${f(H - neck)} ${f(b + prev.r * 0.75)} ${f(H)} ${f(b)} ${f(H)} `;
    } else {
      d += `L${f(x + r)} ${f(H)} C${f(x + r - r * k)} ${f(H)} ${f(x)} ${f(H - r + r * k)} ${f(x)} ${f(H - r)} Z`;
    }
  }
  return d;
}

module.exports = { blobPath };
