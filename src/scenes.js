// 장소(씬) 배경 픽셀 아트. 전부 코드로 찍는 절차적 픽셀 그림.
import { W, H, makeCanvas, rect, px, line, ellipse, vgrad, noise1, mulberry32, hashStr, shade, mix, bayer, pick, clamp } from './util.js';

// ───────── 공용 프리미티브 ─────────
function clouds(x, r, n, y0, y1, col = '#ffffff') {
  for (let i = 0; i < n; i++) {
    const cx = r() * W, cy = y0 + r() * (y1 - y0), w = 18 + r() * 40;
    for (let j = 0; j < 4; j++) ellipse(x, cx + (j - 1.5) * w * 0.3, cy - (j % 2) * 3, w * 0.28, 4 + (j % 2) * 2, col);
    rect(x, cx - w * 0.6, cy + 3, w * 1.2, 2, shade(col, 0.9));
  }
}
function ridge(x, seed, baseY, amp, col, freq = 0.02, o = {}) {
  const n1 = noise1(seed, freq), n2 = noise1(seed + 9, freq * 3.1);
  const light = o.light || shade(col, 1.15);
  let prev = 0;
  for (let X = 0; X < W; X++) {
    const h = amp * (n1(X) * 0.75 + n2(X) * 0.25);
    const top = Math.round(baseY - h);
    rect(x, X, top, 1, (o.bottom || H) - top, col);
    if (h >= prev) px(x, X, top, light);
    if (o.snow && top < baseY - amp * o.snow) { const sd = Math.round((baseY - amp * o.snow - top) * 0.7) + 1; rect(x, X, top, 1, sd, (X + top) % 3 ? '#f4f6fa' : '#dfe6f0'); }
    prev = h;
  }
}
function building(x, r, bx, gy, w, h, wall, o = {}) {
  rect(x, bx, gy - h, w, h, wall);
  rect(x, bx + w - 2, gy - h, 2, h, shade(wall, 0.82));
  rect(x, bx, gy - h, w, 1, shade(wall, 1.15));
  if (o.roof) rect(x, bx - 1, gy - h - 2, w + 2, 2, o.roof);
  const wc = o.win || shade(wall, 0.6), lit = o.lit || '#f8e8a0';
  const sx = o.sx || 4, sy = o.sy || 5;
  for (let yy = gy - h + 3; yy < gy - 5; yy += sy) for (let xx = bx + 2; xx < bx + w - 3; xx += sx) rect(x, xx, yy, 2, 2, r() < (o.litP ?? 0.15) ? lit : wc);
}
function pine(x, cx, by, s, col = '#2f6a3a') {
  const d = shade(col, 0.75);
  for (let i = 0; i < s * 3; i++) { const hw = Math.floor(((i % s) + 1 + Math.floor(i / s)) * 0.8); rect(x, cx - hw, by - s * 3 - 2 + i, hw * 2 + 1, 1, i % s === s - 1 ? d : col); }
  rect(x, cx, by - 2, 1, 2, '#5a3a20');
}
function roundTree(x, cx, by, s, col = '#4a9a48') {
  ellipse(x, cx, by - s - 3, s, s, shade(col, 0.8));
  ellipse(x, cx - 1, by - s - 4, s - 1, s - 1, col);
  px(x, cx - 2, by - s - 6, shade(col, 1.3));
  rect(x, cx, by - 3, 1, 3, '#5a3a20');
}
function flag(x, cx, top, kind) {
  rect(x, cx, top, 1, 22, '#cfcfcf');
  const f = { nk: ['#2a4ea0', '#ffffff', '#d0302a', '#ffffff', '#2a4ea0'], ru: ['#ffffff', '#ffffff', '#2a4ea0', '#d0302a', '#d0302a'], cn: ['#d0302a', '#d0302a', '#d0302a', '#d0302a', '#d0302a'], kr: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'], red: ['#d0302a', '#d0302a', '#d0302a', '#d0302a', '#d0302a'] }[kind];
  const rows = kind === 'nk' ? [0, 1, 2, 2, 2, 3, 4] : [0, 1, 2, 2, 3, 4, 4];
  rows.forEach((c, i) => rect(x, cx + 1, top + i, 11, 1, f[c]));
  if (kind === 'nk') { rect(x, cx + 3, top + 2, 3, 3, '#ffffff'); px(x, cx + 4, top + 3, '#d0302a'); }
  if (kind === 'cn') { px(x, cx + 2, top + 1, '#f5d03a'); px(x, cx + 3, top + 2, '#f5d03a'); }
  if (kind === 'kr') { px(x, cx + 5, top + 2, '#d0302a'); px(x, cx + 6, top + 2, '#d0302a'); px(x, cx + 5, top + 3, '#2a4ea0'); px(x, cx + 6, top + 3, '#2a4ea0'); }
}
function lamp(x, cx, by) { rect(x, cx, by - 20, 1, 20, '#3a3a44'); rect(x, cx - 1, by - 21, 4, 2, '#3a3a44'); px(x, cx + 1, by - 19, '#f8e8a0'); px(x, cx + 2, by - 19, '#f8e8a0'); }
export function car(x, cx, by, col, long = false) {
  const w = long ? 26 : 16;
  rect(x, cx, by - 5, w, 4, col); rect(x, cx + 3, by - 8, w - 7, 3, shade(col, 0.9));
  rect(x, cx + 4, by - 7, w - 9, 2, '#9ec4e0'); if (long) rect(x, cx + 12, by - 7, 1, 2, col);
  rect(x, cx + 2, by - 1, 3, 1, '#101010'); rect(x, cx + w - 5, by - 1, 3, 1, '#101010');
  px(x, cx + w - 1, by - 4, '#f8e8a0');
}
function tiles(x, y0, y1, c1, c2, step = 16) {
  rect(x, 0, y0, W, y1 - y0, c1);
  for (let y = y0 + 4; y < y1; y += Math.max(4, Math.round(step * (0.5 + (y - y0) / (y1 - y0))))) rect(x, 0, y, W, 1, c2);
  for (let X = 0; X < W; X += step * 2) line(x, W / 2 + (X - W / 2) * 0.55, y0, X, y1, c2);
}
function dither(x, x0, y0, w, h, c1, c2, p = 0.5) {
  for (let y = y0; y < y0 + h; y++) for (let X = x0; X < x0 + w; X++) px(x, X, y, bayer(X, y) < p ? c2 : c1);
}
function noiseGround(x, r, y0, y1, cols) {
  for (let y = y0; y < y1; y++) for (let X = 0; X < W; X++) {
    const v = (hashStr(X + ',' + y) % 1000) / 1000;
    px(x, X, y, v < 0.08 ? cols[2] : v < 0.5 ? cols[0] : cols[1]);
  }
}
// 전통 지붕 (끝이 살짝 들린 기와 지붕)
function roof(x, cx, y, w, h, col, dark) {
  for (let i = 0; i < h; i++) { const ww = w - (h - 1 - i) * 6; rect(x, cx - ww / 2, y + i, ww, 1, i === h - 1 ? dark : i % 2 ? shade(col, 0.9) : col); }
  px(x, cx - w / 2 - 1, y + h - 2, dark); px(x, cx + w / 2, y + h - 2, dark);
  px(x, cx - w / 2 - 2, y + h - 3, dark); px(x, cx + w / 2 + 1, y + h - 3, dark);
}

// 3x5 픽셀 글자
const GLYPH = { T: ['111', '010', '010', '010', '010'], R: ['110', '101', '110', '101', '101'], U: ['101', '101', '101', '101', '111'], M: ['101', '111', '111', '101', '101'], P: ['110', '101', '110', '100', '100'] };
function pixelText(x, str, px0, py0, col) {
  let cx = px0;
  for (const ch of str) { const g = GLYPH[ch]; if (g) g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x, cx + i, py0 + j, col); })); cx += 4; }
}
function trumpTower(x, r) {
  const tx = 200, tw = 56;
  for (let y = 16; y < 150; y++) {
    const inset = y < 50 ? 12 : y < 80 ? 6 : 0;
    const saw = (y % 6 < 3) ? 1 : 0;
    rect(x, tx + inset + saw, y, tw - inset * 2 - saw * 2, 1, y % 4 === 0 ? '#2e3440' : '#1e2228');
    px(x, tx + inset + saw + 2, y, '#4a5868');
  }
  for (let y = 18; y < 150; y += 4) for (let X = tx + 4; X < tx + tw - 4; X += 5) if (r() < 0.25) px(x, X, y, '#f8e8a0');
  for (let k = 0; k < 3; k++) { rect(x, tx - 10 + k * 3, 118 + k * 10, 8, 3, '#4a8a3a'); rect(x, tx + tw + 2 - k * 3, 118 + k * 10, 8, 3, '#4a8a3a'); }
  rect(x, tx + 4, 136, tw - 8, 9, '#141418');
  rect(x, tx + 4, 136, tw - 8, 1, '#c8a040'); rect(x, tx + 4, 144, tw - 8, 1, '#c8a040');
  pixelText(x, 'TRUMP', tx + 18, 138, '#f8d868');
}
function palm(x, px0, by, h = 36) {
  let cx = px0;
  for (let i = 0; i < h; i++) { rect(x, Math.round(cx), by - i, 2, 1, i % 3 ? '#8a6a3a' : '#6a4a2a'); cx += Math.sin(i / h * 1.4) * 0.35; }
  const tx = Math.round(cx), ty = by - h;
  for (const [dx, dy] of [[-10, 4], [10, 4], [-7, -3], [7, -3], [-12, 8], [12, 8], [0, -5]]) line(x, tx, ty, tx + dx, ty + dy, '#3a8a3a');
  for (const [dx, dy] of [[-9, 5], [9, 5], [-6, -2], [6, -2]]) line(x, tx, ty + 1, tx + dx, ty + dy + 1, '#2a6a2a');
}
function cart(x, cx, by) {
  rect(x, cx, by - 6, 14, 5, '#f4f4f4'); rect(x, cx + 1, by - 11, 12, 1, '#e8e8e8');
  rect(x, cx + 2, by - 10, 1, 4, '#8a8a8a'); rect(x, cx + 11, by - 10, 1, 4, '#8a8a8a');
  rect(x, cx + 2, by - 1, 3, 1, '#101010'); rect(x, cx + 9, by - 1, 3, 1, '#101010');
}

// ───────── 씬별 페인터 ─────────
const P = {};

P.square = (x, r) => {
  vgrad(x, 0, 0, W, 132, ['#6fa8e0', '#9cc6ec', '#cfe4f4']);
  clouds(x, r, 5, 12, 60);
  for (let X = 0; X < W; X += 8 + Math.floor(r() * 10)) rect(x, X, 108 - r() * 14, 8 + r() * 8, 30, mix('#9cb4cc', '#cfe4f4', r() * 0.4));
  rect(x, 0, 122, W, 8, '#5a8ec0');
  // 주체사상탑
  for (let y = 34; y < 128; y++) { const w = Math.round(3 + ((y - 34) / 94) * 5); rect(x, 58 - w / 2, y, w, 1, '#ece4d0'); px(x, 58 + w / 2 - 1, y, '#c8bea8'); }
  rect(x, 50, 124, 17, 6, '#d8d0bc');
  const monu = [];
  // 인민대학습당
  rect(x, 150, 96, 180, 46, '#efe6cf');
  for (let X = 154; X < 326; X += 6) rect(x, X, 100, 1, 42, '#ddd2b8');
  for (let yy = 104; yy < 138; yy += 9) for (let X = 156; X < 324; X += 6) rect(x, X + 1, yy, 3, 5, '#5a7a70');
  rect(x, 226, 124, 28, 18, '#4a3a30');
  roof(x, 240, 88, 200, 8, '#3f9b7a', '#245a48');
  rect(x, 188, 76, 104, 12, '#efe6cf'); for (let X = 192; X < 290; X += 6) rect(x, X, 79, 3, 5, '#5a7a70');
  roof(x, 240, 68, 128, 8, '#3f9b7a', '#245a48');
  rect(x, 212, 58, 56, 10, '#efe6cf');
  roof(x, 240, 50, 76, 8, '#3f9b7a', '#245a48');
  // 양옆 건물 + 붉은 구호판
  building(x, r, 0, 142, 140, 38, '#d8d0bc', { roof: '#b8b0a0', win: '#7a8a88', litP: 0 });
  building(x, r, 340, 142, 140, 38, '#d8d0bc', { roof: '#b8b0a0', win: '#7a8a88', litP: 0 });
  for (const bx of [24, 356]) { rect(x, bx, 110, 100, 8, '#c8302a'); for (let X = bx + 6; X < bx + 94; X += 8) rect(x, X, 112, 5, 4, '#f5d03a'); }
  for (let X = 150; X <= 330; X += 30) flag(x, X, 124, 'nk');
  // 광장
  rect(x, 0, 142, W, H - 142, '#c9c6bd');
  for (let y = 150; y < H; y += 12) rect(x, 0, y, W, 1, '#bab6ab');
  for (let y = 154; y < H; y += 12) for (let X = 6; X < W; X += 14) px(x, X + ((y / 12) % 2) * 7, y, '#f4f2ea');
  return { walk: [12, 150, 468, 262], monu };
};

const CITY = {
  seoul: { sky: ['#78b0e8', '#a8d0f0', '#dcecf8'], far: '#a8bcd0', walls: ['#7890a8', '#5a6e88', '#98a8b8', '#6a8098', '#b8c0c8'], lit: '#cfe8ff', road: '#3a3a42', side: '#b4aca0', mark: 'namsan', cars: ['#f0f0f0', '#2a2a2a', '#5a6a8a', '#c83a3a'] },
  tokyo: { sky: ['#e8a870', '#f0c898', '#f8e4c8'], far: '#c8a898', walls: ['#6a6070', '#8a7a80', '#4a4a58', '#a89088', '#5a5a68'], lit: '#fff0a0', road: '#35343a', side: '#aaa49c', mark: 'tokyotower', neon: true, cars: ['#f0f0f0', '#2a2a2a', '#3a6ab0', '#e8e8e8'] },
  ny: { sky: ['#6aa0d8', '#98c0e8', '#d0e4f4'], far: '#98a8c0', walls: ['#8a7a6a', '#6a6a78', '#a09080', '#5a5a64', '#b8a890'], lit: '#fff0b0', road: '#303036', side: '#a8a8a0', billboard: true, cars: ['#f0c020', '#f0c020', '#2a2a2a', '#f0c020'] },
  shanghai: { sky: ['#a0b8d0', '#c0d0e0', '#e0e8f0'], far: '#a8b8c8', walls: ['#7a8898', '#5a6878', '#9aa8b8', '#b0b8c0'], lit: '#e8f4ff', road: '#3a3a40', side: '#b0aaa0', mark: 'pearl', cars: ['#2a2a2a', '#e8e8e8', '#8a2a2a'] },
  hanoi: { sky: ['#88b8e0', '#b0d0ec', '#e4f0f8'], far: '#b8c8c0', walls: ['#e8c860', '#d8a050', '#88b890', '#e8d8b0', '#c87858'], lit: '#fff0b0', road: '#4a4844', side: '#b8a888', low: true, cars: ['#c83a3a', '#2a2a2a', '#3a6ab0'] },
  nk: { sky: ['#7ab0e0', '#a8cce8', '#d8e8f4'], far: '#b8c8d8', walls: ['#9ad1c9', '#f2c6a0', '#c7d3ef', '#e8e0c8', '#b8d8a8'], lit: '#fff8d0', road: '#4a4a50', side: '#bcb6aa', sparse: true, cars: ['#2a2a2a', '#e8e8e8'] },
  trumptower: { sky: ['#6aa0d8', '#98c0e8', '#d0e4f4'], far: '#98a8c0', walls: ['#8a7a6a', '#6a6a78', '#a09080', '#5a5a64', '#b8a890'], lit: '#fff0b0', road: '#303036', side: '#a8a8a0', mark: 'trumptower', cars: ['#f0c020', '#2a2a2a', '#f0c020', '#141418'] },
  old: { sky: ['#8ab0d0', '#b0c8dc', '#dce4ec'], far: '#a8b0b8', walls: ['#8a7a68', '#6e6458', '#9a8a76', '#7a6e62', '#a89a88'], lit: '#e8d8a0', road: '#5a544c', side: '#9a9284', low: true, cars: ['#2a2a2a', '#3a3630', '#2a3028'] },
  generic: { sky: ['#78b0e0', '#a8cce8', '#dcecf6'], far: '#a8b8c8', walls: ['#a89888', '#8a8a98', '#c0b0a0', '#788898', '#d0c8b8'], lit: '#fff0b0', road: '#3a3a40', side: '#b4aca0', mark: 'obelisk', cars: ['#c83a3a', '#2a2a2a', '#e8e8e8', '#3a6ab0'] },
};
P.city = (x, r, style = 'generic') => {
  const c = CITY[style] || CITY.generic;
  vgrad(x, 0, 0, W, 150, c.sky);
  clouds(x, r, 4, 10, 50);
  for (let X = -4; X < W; X += 10 + Math.floor(r() * 16)) { const h = c.low ? 30 + r() * 20 : 40 + r() * 70; rect(x, X, 150 - h, 12 + r() * 14, h, c.far); }
  if (c.mark === 'namsan') { ellipse(x, 380, 150, 90, 38, '#4a7a4a'); ellipse(x, 380, 150, 80, 32, '#5a8a52'); rect(x, 378, 60, 4, 60, '#e8e8e8'); rect(x, 374, 76, 12, 6, '#d8d8d8'); rect(x, 373, 80, 14, 2, '#8a8a8a'); rect(x, 379, 44, 2, 16, '#c83a3a'); }
  if (c.mark === 'tokyotower') { for (let y = 30; y < 150; y++) { const w = Math.round(2 + ((y - 30) / 120) ** 1.4 * 40); const col = Math.floor((y - 30) / 12) % 2 ? '#f4f4f4' : '#e0402a'; rect(x, 400 - w / 2, y, 1, 1, col); rect(x, 400 + w / 2, y, 1, 1, col); if (y % 6 === 0) line(x, 400 - w / 2, y, 400 + w / 2, y, col); } rect(x, 392, 90, 17, 4, '#e0402a'); rect(x, 395, 62, 11, 3, '#f4f4f4'); }
  if (c.mark === 'pearl') { rect(x, 396, 30, 3, 120, '#c8c0c8'); rect(x, 386, 80, 2, 70, '#c8c0c8'); rect(x, 407, 80, 2, 70, '#c8c0c8'); ellipse(x, 397, 100, 13, 13, '#d8588a'); ellipse(x, 397, 62, 8, 8, '#d8588a'); ellipse(x, 395, 98, 4, 4, '#f0a0c0'); ellipse(x, 397, 40, 3, 3, '#d8588a'); }
  if (c.mark === 'obelisk') { for (let y = 60; y < 150; y++) rect(x, 380 - Math.round(2 + (y - 60) / 30), y, Math.round(4 + (y - 60) / 15), 1, '#e0dccc'); }
  // 앞쪽 건물들
  let X = -6;
  while (X < W) {
    const w = c.low ? 26 + Math.floor(r() * 16) : 28 + Math.floor(r() * 30);
    if (c.sparse && r() < 0.3) { X += w; continue; }
    let h = c.low ? 36 + r() * 30 : 50 + r() * 76;
    if (c.mark && c.mark !== 'obelisk' && X + w > 330 && X < 450) h = Math.min(h, 34);
    const wall = pick(r, c.walls);
    building(x, r, X, 150, w, h, wall, { lit: c.lit, litP: 0.2, roof: c.low ? shade(wall, 0.7) : null });
    if (c.low) { for (let yy = 150 - h + 10; yy < 146; yy += 14) rect(x, X + 2, yy, w - 4, 1, '#3a3a3a'); }
    if (c.neon && r() < 0.7) { const nc = pick(r, ['#ff4aa0', '#4ae0ff', '#ffe04a', '#8aff6a']); rect(x, X + 3, 150 - h + 8 + r() * 30, 5, 18, nc); }
    if (c.billboard && r() < 0.8) { const bc = pick(r, ['#e83a3a', '#3a8ae8', '#f0c020', '#e84ac0', '#3ac870']); const by = 150 - h + 6; rect(x, X + 2, by, w - 5, 16, bc); rect(x, X + 5, by + 5, w - 12, 2, '#ffffff'); rect(x, X + 5, by + 9, w - 18, 2, '#ffffff'); }
    X += w + (c.sparse ? 6 : 0);
  }
  if (style === 'trumptower') trumpTower(x, r);
  if (style === 'nk') { rect(x, 180, 100, 120, 14, '#c8302a'); for (let k = 186; k < 294; k += 9) rect(x, k, 104, 6, 6, '#f5d03a'); }
  // 도로
  rect(x, 0, 150, W, 26, c.road);
  for (let k = 0; k < W; k += 14) rect(x, k, 162, 7, 1, '#e8e8e0');
  const nCars = c.sparse ? 2 : 7;
  for (let i = 0; i < nCars; i++) car(x, r() * (W - 20), 158 + (i % 2) * 12, pick(r, c.cars));
  rect(x, 0, 176, W, 2, '#8a8a8a');
  tiles(x, 178, H, c.side, shade(c.side, 0.9), 14);
  for (let k = 20; k < W; k += 80) { roundTree(x, k, 184, 6, style === 'nk' ? '#5aa05a' : '#4a9a48'); lamp(x, k + 40, 184); }
  return { walk: [8, 186, 472, 262] };
};

P.beach = (x, r, style = 'wonsan') => {
  vgrad(x, 0, 0, W, 102, ['#58a6e6', '#8cc8f0', '#d4ecf8']);
  clouds(x, r, 4, 10, 50);
  ridge(x, 11, 100, 22, '#8aa8c8', 0.015, { bottom: 102 });
  if (style === 'haeundae') for (let X = 250; X < W; X += 18) building(x, r, X, 100, 14, 30 + r() * 44, pick(r, ['#c8d4e0', '#a8b8cc', '#e0e4e8']), { litP: 0.05 });
  else { for (let X = 20; X < 200; X += 22) building(x, r, X, 100, 16, 22 + r() * 30, pick(r, ['#f4f0e8', '#f8d8c8', '#d8e8f0', '#e8f4d8']), { litP: 0.05, roof: '#c86a4a' }); }
  vgrad(x, 0, 100, W, 58, ['#2f7fc0', '#3a92d0', '#58b0e0']);
  dither(x, 0, 154, W, 6, '#e8f4fa', '#8ac8e8', 0.5);
  noiseGround(x, r, 160, H, ['#ecd9a4', '#dcc58c', '#c8ae78']);
  for (let i = 0; i < 7; i++) {
    const ux = 20 + r() * 440, uy = 190 + r() * 60, col = pick(r, ['#e83a3a', '#3a8ae8', '#f0c020', '#3ac870']);
    rect(x, ux, uy - 14, 1, 14, '#6a5a4a');
    for (let k = 0; k < 5; k++) { const hw = 3 + k * 2; for (let i = -hw; i < hw; i++) px(x, ux + i, uy - 19 + k, Math.floor((i + hw) / 3) % 2 ? '#ffffff' : col); }
    rect(x, ux - 11, uy - 14, 22, 1, shade(col, 0.7));
    rect(x, ux + 4, uy - 2, 12, 3, pick(r, ['#f4f4f4', '#f0a0c0', '#8ac8f0']));
  }
  if (style === 'wonsan') for (let k = 0; k < 6; k++) pine(x, 8 + k * 9, 172, 3, '#2e6a3a');
  return {
    walk: [10, 170, 470, 262],
    anim: (ctx, t) => { for (let i = 0; i < 26; i++) { const wx = (i * 53 + t * 8) % W, wy = 106 + ((i * 17) % 46); rect(ctx, wx, wy, 4, 1, 'rgba(255,255,255,0.7)'); } },
  };
};

P.mountain = (x, r, style = 'green') => {
  if (style === 'paektu') {
    vgrad(x, 0, 0, W, 110, ['#2f62c0', '#5a8ee0', '#a8ccf0']);
    clouds(x, r, 3, 10, 40);
    ridge(x, 21, 104, 44, '#8a7c70', 0.012, { snow: 0.45, bottom: 124 });
    ridge(x, 22, 116, 18, '#6f6258', 0.02, { snow: 0.7, bottom: 124 });
    ellipse(x, 240, 122, 200, 12, '#23549a');
    for (let i = 0; i < 20; i++) rect(x, 60 + r() * 360, 116 + r() * 12, 6, 1, '#4a80c8');
    ridge(x, 23, 150, 22, '#7a6a5a', 0.01, { snow: 0.8 });
    noiseGround(x, r, 150, H, ['#8a7a68', '#7a6a58', '#9a8a78']);
    for (let i = 0; i < 40; i++) ellipse(x, r() * W, 160 + r() * 100, 3 + r() * 4, 1 + r() * 2, pick(r, ['#6a5a4a', '#f0f4f8', '#5a4a3a']));
    for (let X = 4; X < W; X += 20) rect(x, X, 150, 2, 12, '#6a4a2a');
    rect(x, 0, 152, W, 1, '#8a6a3a');
    return { walk: [10, 162, 470, 262] };
  }
  if (style === 'fuji') {
    vgrad(x, 0, 0, W, 150, ['#6aa6e0', '#98c4ec', '#d8ecf8']);
    for (let y = 40; y < 150; y++) { const w = 22 + ((y - 40) / 110) ** 1.3 * 380; rect(x, 240 - w / 2, y, w, 1, y < 76 ? (y % 3 ? '#f4f6fa' : '#dfe6f0') : y < 84 && bayer(y, y) > 0.5 ? '#f0f4f8' : '#5a6a9a'); rect(x, 240 + w / 4, y, w / 4, 1, y < 76 ? '#d0dae8' : '#4a5a88'); }
    vgrad(x, 0, 150, W, 26, ['#6a90c0', '#8ab0d8']);
    noiseGround(x, r, 176, H, ['#7ab85a', '#6aa84a', '#8ac86a']);
    for (let k = 0; k < 8; k++) roundTree(x, 20 + k * 60 + r() * 20, 184, 7, '#f0a0c0');
    return { walk: [10, 186, 470, 262] };
  }
  if (style === 'canyon') {
    vgrad(x, 0, 0, W, 120, ['#5a98d8', '#98c0e0', '#f0d8b0']);
    for (let L = 0; L < 3; L++) ridge(x, 40 + L, 110 + L * 18, 40 - L * 8, ['#c87a4a', '#b8643a', '#a85a30'][L], 0.008, { light: '#e8a070' });
    noiseGround(x, r, 166, H, ['#d89a68', '#c88a58', '#b87a48']);
    return { walk: [10, 172, 470, 262] };
  }
  if (style === 'alps') {
    vgrad(x, 0, 0, W, 140, ['#5a90d0', '#8ab8e4', '#d0e6f6']);
    clouds(x, r, 3, 10, 40);
    ridge(x, 131, 112, 72, '#8a9ab0', 0.012, { snow: 0.35, bottom: 150 });
    ridge(x, 132, 146, 38, '#5a7a5a', 0.018, { snow: 0.9, light: '#6a8a64' });
    rect(x, 280, 112, 120, 38, '#d8d0c0'); rect(x, 280, 96, 120, 16, '#7a5a3a');
    for (let i = 0; i < 8; i++) rect(x, 272 + i, 88 + i, 136 - i * 2, 1, i % 2 ? '#4a3a2a' : '#3a2e22');
    rect(x, 300, 116, 60, 24, '#3a4a5a'); for (let X = 300; X < 360; X += 10) rect(x, X, 116, 1, 24, '#6a5a4a');
    for (let X = 286; X < 396; X += 14) rect(x, X, 100, 6, 8, '#3a4a5a');
    rect(x, 270, 148, 140, 3, '#8a7a6a');
    for (let k = 0; k < 18; k++) pine(x, r() * W, 150 + r() * 8, 3 + Math.floor(r() * 2), '#2a5a3a');
    noiseGround(x, r, 152, H, ['#7a9a5a', '#6a8a4a', '#9a9a8a']);
    return { walk: [10, 162, 470, 262] };
  }
  if (style === 'lake') {
    vgrad(x, 0, 0, W, 110, ['#5a8ed0', '#8ab4e0', '#c8e0f4']);
    ridge(x, 51, 108, 30, '#7890b0', 0.012, { snow: 0.6, bottom: 112 });
    vgrad(x, 0, 110, W, 58, ['#1e4a8a', '#2e62a8', '#4a80c0']);
    noiseGround(x, r, 168, H, ['#9a9a98', '#8a8a88', '#b0b0ac']);
    for (let k = 0; k < 10; k++) pine(x, r() * W, 180, 4, '#2a5a3a');
    return { walk: [10, 180, 470, 262], anim: (ctx, t) => { for (let i = 0; i < 20; i++) rect(ctx, (i * 71 + t * 5) % W, 116 + ((i * 13) % 48), 5, 1, 'rgba(200,230,255,0.5)'); } };
  }
  // green / greatwall
  vgrad(x, 0, 0, W, 130, ['#6aa8e0', '#9cc8ec', '#d8ecf6']);
  clouds(x, r, 4, 10, 50);
  ridge(x, 31, 110, 50, '#9ab8c8', 0.01);
  ridge(x, 32, 140, 50, '#5a8a5a', 0.013, { light: '#7aa86a' });
  if (style === 'greatwall') {
    const n = noise1(32, 0.013), n2 = noise1(41, 0.013 * 3.1);
    let prev = null;
    for (let X = 0; X < W; X++) {
      const top = Math.round(140 - 50 * (n(X) * 0.75 + n2(X) * 0.25));
      rect(x, X, top - 5, 1, 5, '#b8b0a0'); px(x, X, top - 5, '#8a8274'); if (X % 4 < 2) px(x, X, top - 6, '#b8b0a0');
      if (X % 90 === 30) { rect(x, X - 5, top - 14, 11, 10, '#a8a090'); rect(x, X - 2, top - 11, 2, 3, '#4a4a44'); }
      prev = top;
    }
    ridge(x, 33, 176, 26, '#3a6a3a', 0.02, { light: '#4a7a44' });
    tiles(x, 176, H, '#a8a090', '#8a8274', 12);
    rect(x, 0, 176, W, 4, '#8a8274');
    for (let X = 0; X < W; X += 6) rect(x, X, 172, 4, 4, '#a8a090');
    return { walk: [10, 184, 470, 262] };
  }
  const templeX = 120 + r() * 240;
  roof(x, templeX, 92, 30, 4, '#3a3a40', '#22222a'); rect(x, templeX - 11, 96, 22, 6, '#a83a2a');
  ridge(x, 33, 176, 34, '#3a6a3a', 0.02, { light: '#4a7a44' });
  for (let k = 0; k < 24; k++) pine(x, r() * W, 150 + r() * 26, 3 + Math.floor(r() * 2), pick(r, ['#2e5e36', '#3a6e3e', '#2a5230']));
  noiseGround(x, r, 176, H, ['#8a7050', '#7a6040', '#6a8a48']);
  return { walk: [10, 184, 470, 262] };
};

P.ski = (x, r) => {
  vgrad(x, 0, 0, W, 110, ['#4a86d8', '#88b8e8', '#d0e6f8']);
  ridge(x, 61, 96, 40, '#c8d8e8', 0.012, { snow: 0.1 });
  ridge(x, 62, 118, 22, '#a8bcd0', 0.02, { snow: 0.3 });
  for (let y = 70; y < H; y++) for (let X = 0; X < W; X++) {
    const slope = 70 + (W - X) * 0.22;
    if (y >= slope) px(x, X, y, bayer(X, y) < 0.15 ? '#dce8f4' : '#f4f8fc');
  }
  for (let k = 0; k < 30; k++) { const X = r() * W; const y = 74 + (W - X) * 0.22 + r() * 40; if (y < 176) pine(x, X, y, 3, '#2a5a3a'); }
  for (let X = 40; X < W; X += 90) { const by = 186 - X * 0.26; rect(x, X, by - 34, 2, 34, '#5a5a64'); rect(x, X - 4, by - 36, 10, 2, '#5a5a64'); }
  line(x, 40, 150, 490, 33, '#303038');
  building(x, r, 360, 196, 90, 34, '#8a5a38', { win: '#f8e8a0', litP: 0.6, roof: '#f4f8fc' });
  rect(x, 356, 160, 98, 4, '#ffffff');
  return {
    walk: [10, 190, 470, 262],
    anim: (ctx, t) => { for (let i = 0; i < 6; i++) { const f = (t * 0.03 + i / 6) % 1; const cx = 40 + f * 450, cy = 150 - f * 117; rect(ctx, cx, cy, 1, 5, '#303038'); rect(ctx, cx - 3, cy + 5, 7, 3, '#c83a3a'); } },
  };
};

P.factory = (x, r) => {
  vgrad(x, 0, 0, W, 150, ['#8a9aac', '#aab6c4', '#ccd4dc']);
  const chim = [];
  for (const cx of [70, 110, 400]) { for (let y = 20; y < 110; y++) rect(x, cx, y, 8, 1, Math.floor(y / 10) % 2 ? '#e8e8e8' : '#c83a3a'); chim.push(cx + 4); }
  for (let X = 0; X < W; X += 60) {
    rect(x, X, 90, 60, 60, '#8a8478');
    for (let k = 0; k < 4; k++) for (let i = 0; i < 10; i++) rect(x, X + k * 15 + i, 90 - i, 1, i, i < 2 ? '#c8d8e8' : '#6a665e');
    for (let yy = 100; yy < 140; yy += 10) for (let xx = X + 4; xx < X + 56; xx += 8) rect(x, xx, yy, 5, 5, '#4a5a68');
  }
  rect(x, 0, 116, W, 3, '#6a6a70'); rect(x, 0, 124, W, 2, '#5a5a60');
  rect(x, 150, 70, 180, 14, '#c8302a'); for (let k = 156; k < 324; k += 9) rect(x, k, 74, 6, 6, '#f5d03a');
  rect(x, 0, 150, W, H - 150, '#8f8f88');
  for (let y = 150; y < H; y += 2) for (let X = 0; X < W; X += 1) if (bayer(X, y) < 0.08) px(x, X, y, '#7a7a74');
  for (let X = 0; X < W; X += 30) rect(x, X, 200, 18, 2, '#e8c030');
  car(x, 30, 172, '#3a6a4a', true); car(x, 420, 176, '#3a5a8a', true);
  return {
    walk: [10, 158, 470, 262],
    anim: (ctx, t) => { for (const cx of chim) for (let i = 0; i < 6; i++) { const f = (t * 0.25 + i / 6) % 1; ellipse(ctx, cx + f * 40, 18 - f * 16, 3 + f * 6, 2 + f * 3, `rgba(220,220,220,${0.7 - f * 0.6})`); } },
  };
};

P.station = (x, r, style = 'nk') => {
  vgrad(x, 0, 0, W, 64, ['#7aaee0', '#a8cce8']);
  const wall = style === 'cn' ? '#b8b4ac' : '#ece0c4';
  building(x, r, 60, 104, 360, 80, wall, { win: '#5a7080', litP: 0 });
  rect(x, 200, 34, 80, 12, style === 'cn' ? '#c8302a' : '#c8302a');
  for (let k = 206; k < 274; k += 10) rect(x, k, 37, 7, 6, '#f5d03a');
  ellipse(x, 240, 58, 7, 7, '#f4f4f4'); line(x, 240, 58, 240, 53, '#101010'); line(x, 240, 58, 244, 58, '#101010');
  if (style === 'nk') { roof(x, 240, 16, 100, 6, '#3f9b7a', '#245a48'); rect(x, 196, 22, 88, 12, wall); }
  rect(x, 0, 64, W, 8, '#2e5a44'); rect(x, 0, 72, W, 2, '#1e3a2c');
  for (let X = 20; X < W; X += 70) rect(x, X, 74, 3, 76, '#2e5a44');
  rect(x, 0, 104, W, 46, '#6a6258');
  for (let X = 0; X < W; X += 6) { rect(x, X, 126, 3, 18, '#5a4a3a'); }
  rect(x, 0, 128, W, 1, '#b0b0b8'); rect(x, 0, 141, W, 1, '#b0b0b8');
  const body = style === 'cn' ? '#2e7a4a' : '#1f4d34';
  for (let k = 0; k < 3; k++) {
    const cx = 10 + k * 158;
    rect(x, cx, 98, 150, 40, body); rect(x, cx, 98, 150, 2, shade(body, 1.3));
    rect(x, cx, 124, 150, 3, '#e8c030');
    for (let X = cx + 8; X < cx + 142; X += 14) rect(x, X, 106, 9, 10, style === 'cn' ? '#9ac4e0' : '#2a2a2a');
    rect(x, cx + 20, 138, 10, 4, '#1a1a1a'); rect(x, cx + 120, 138, 10, 4, '#1a1a1a');
  }
  rect(x, 0, 148, W, H - 148, '#b0aca4');
  for (let X = 0; X < W; X += 2) rect(x, X, 152, 1, 4, '#e8c030');
  for (let y = 170; y < H; y += 16) rect(x, 0, y, W, 1, '#a09c94');
  return { walk: [10, 162, 470, 262] };
};

P.launch = (x, r, style = 'nk') => {
  vgrad(x, 0, 0, W, 120, ['#5a96d8', '#8cbcea', '#d0e6f6']);
  clouds(x, r, 3, 10, 50);
  if (style === 'nk') vgrad(x, 0, 112, W, 30, ['#3a7ab8', '#4a8ac8']);
  else { ridge(x, 71, 140, 20, '#3a6a4a', 0.02, { bottom: 142 }); for (let k = 0; k < 30; k++) pine(x, r() * W, 140, 3, '#2a5a3a'); }
  const gx = 320;
  const gc = style === 'nk' ? ['#d8302a', '#f0f0f0'] : ['#8a8a90', '#b8b8c0'];
  for (let y = 24; y < 150; y++) { px(x, gx, y, gc[Math.floor(y / 8) % 2]); px(x, gx + 24, y, gc[Math.floor(y / 8) % 2]); if (y % 8 === 0) line(x, gx, y, gx + 24, y + 8, gc[0]); if (y % 8 === 4) line(x, gx + 24, y, gx, y + 8, gc[1]); }
  for (let y = 40; y < 150; y += 22) rect(x, gx + 24, y, 14, 2, gc[0]);
  const rx = 354;
  rect(x, rx, 30, 12, 120, '#f2f2f2'); rect(x, rx + 9, 30, 3, 120, '#d0d0d8');
  for (let i = 0; i < 8; i++) rect(x, rx + 6 - i * 0.7, 22 + i, Math.max(1, i * 1.6), 1, '#f2f2f2');
  rect(x, rx, 60, 12, 3, '#1a1a1a'); rect(x, rx, 100, 12, 3, style === 'nk' ? '#c83a3a' : '#2a4ea0');
  if (style === 'ru') { rect(x, rx - 6, 110, 6, 40, '#e8e8e8'); rect(x, rx + 12, 110, 6, 40, '#e8e8e8'); }
  rect(x, 0, 150, W, H - 150, '#a8a8a0');
  for (let y = 158; y < H; y += 20) rect(x, 0, y, W, 1, '#98988f');
  building(x, r, 30, 150, 80, 30, '#d8d4c8', { win: '#4a6a88', litP: 0 });
  rect(x, 60, 108, 2, 12, '#8a8a90'); ellipse(x, 61, 106, 8, 4, '#e8e8e8');
  return { walk: [10, 160, 470, 262], anim: (ctx, t) => { for (let i = 0; i < 5; i++) { const f = (t * 0.3 + i / 5) % 1; ellipse(ctx, rx + 6 + (i - 2) * 6 * f, 150 - f * 10, 3 + f * 5, 2 + f * 2, `rgba(240,240,240,${0.6 - f * 0.5})`); } } };
};

P.jsa = (x, r) => {
  vgrad(x, 0, 0, W, 110, ['#78aee0', '#a8cce8', '#dcecf6']);
  ridge(x, 81, 100, 20, '#6a8a6a', 0.015, { bottom: 110 });
  building(x, r, 160, 104, 160, 50, '#c8c4bc', { win: '#4a5a68', litP: 0 });
  rect(x, 150, 52, 180, 3, '#9a968e');
  rect(x, 0, 104, W, 50, '#a8a49a');
  for (const [a, b] of [[96, 168], [204, 276], [312, 384]]) {
    rect(x, a, 110, b - a, 42, '#3a78c8'); rect(x, a, 106, b - a, 4, '#2a5aa0'); rect(x, b - 3, 110, 3, 42, '#2a5aa0');
    for (let X = a + 6; X < b - 8; X += 14) rect(x, X, 118, 8, 8, '#e8f0f8');
    rect(x, (a + b) / 2 - 4, 134, 8, 18, '#2a4a80');
  }
  rect(x, 0, 152, W, 5, '#e0dcd4'); rect(x, 0, 157, W, 1, '#8a867e');
  noiseGround(x, r, 158, H, ['#a8a49a', '#9a968c', '#b8b4aa']);
  return { walk: [10, 164, 470, 262] };
};

P.village = (x, r) => {
  vgrad(x, 0, 0, W, 120, ['#78b0e0', '#a8cce8', '#e0eef8']);
  clouds(x, r, 4, 10, 50);
  ridge(x, 91, 118, 26, '#7a9a78', 0.012, { bottom: 122 });
  for (let y = 120; y < 164; y += 4) rect(x, 0, y, W, 4, (y / 4) % 2 ? '#8ab85a' : '#c8b85a');
  for (let k = 0; k < 5; k++) {
    const hx = 30 + k * 95 + r() * 20, rc = pick(r, ['#c83a3a', '#3a6ab0', '#6a4a3a', '#3a8a5a']);
    rect(x, hx, 146, 36, 20, '#e8dcc0'); rect(x, hx + 14, 154, 8, 12, '#6a4a2a'); rect(x, hx + 4, 150, 6, 5, '#6a8aa8');
    for (let i = 0; i < 8; i++) rect(x, hx - 3 + i, 138 + i, 42 - i * 2, 1, rc);
  }
  for (let k = 0; k < 6; k++) roundTree(x, r() * W, 168, 6, '#4a8a3a');
  noiseGround(x, r, 168, H, ['#9a8a60', '#8a7a50', '#6a9a48']);
  return { walk: [10, 174, 470, 262] };
};

P.landmark = (x, r, style = 'generic') => {
  const S = LM[style] || LM.generic;
  return S(x, r);
};
const LM = {
  gwanghwamun: (x, r) => {
    vgrad(x, 0, 0, W, 140, ['#6aa6e0', '#9cc8ec', '#dcecf8']);
    clouds(x, r, 3, 8, 40);
    ridge(x, 101, 112, 60, '#3e6a44', 0.01, { light: '#5a8a52' });
    rect(x, 0, 104, 140, 38, '#b8b0a0'); rect(x, 340, 104, 140, 38, '#b8b0a0');
    rect(x, 140, 100, 200, 42, '#c8c0b0'); for (let y = 104; y < 142; y += 5) rect(x, 140, y, 200, 1, '#b0a898');
    for (const ax of [180, 240, 300]) { ellipse(x, ax, 122, 12, 10, '#2a2420'); rect(x, ax - 12, 122, 25, 20, '#2a2420'); }
    rect(x, 160, 80, 160, 20, '#8a3a2a'); for (let X = 164; X < 318; X += 12) rect(x, X, 80, 3, 20, '#c83a2a'); rect(x, 160, 80, 160, 3, '#3a8a6a');
    roof(x, 240, 72, 200, 8, '#4a4a52', '#2a2a30'); rect(x, 184, 60, 112, 12, '#8a3a2a'); rect(x, 184, 60, 112, 2, '#3a8a6a');
    roof(x, 240, 50, 140, 10, '#4a4a52', '#2a2a30');
    rect(x, 0, 142, W, H - 142, '#c8c0b4'); for (let y = 150; y < H; y += 14) rect(x, 0, y, W, 1, '#b8b0a4');
    for (let X = 20; X < W; X += 110) { rect(x, X, 150, 40, 8, '#6a4a2a'); for (let k = 0; k < 10; k++) px(x, X + 2 + k * 4, 150, pick(r, ['#e83a5a', '#f0c020', '#ffffff'])); }
    flag(x, 60, 118, 'kr'); flag(x, 410, 118, 'kr');
    return { walk: [10, 162, 470, 262] };
  },
  tiananmen: (x, r) => {
    vgrad(x, 0, 0, W, 140, ['#8ab0d0', '#b0c8dc', '#dce4ec']);
    rect(x, 40, 92, 400, 56, '#b8322a'); rect(x, 40, 92, 400, 3, '#d0483a');
    for (const ax of [120, 180, 240, 300, 360]) { ellipse(x, ax, 124, 9, 8, '#2a1a18'); rect(x, ax - 9, 124, 19, 24, '#2a1a18'); }
    rect(x, 90, 66, 300, 26, '#b8322a'); for (let X = 94; X < 386; X += 10) rect(x, X, 66, 3, 26, '#d0483a');
    roof(x, 240, 56, 320, 10, '#e8b830', '#a87a18');
    rect(x, 130, 44, 220, 12, '#b8322a');
    roof(x, 240, 30, 250, 12, '#e8b830', '#a87a18');
    rect(x, 224, 96, 32, 22, '#6a4a2a'); rect(x, 226, 98, 28, 18, '#3a3a40');
    rect(x, 0, 148, W, 10, '#4a4a50'); for (let X = 0; X < W; X += 16) rect(x, X, 152, 8, 1, '#e8e8e0');
    rect(x, 0, 158, W, H - 158, '#b8b4ac'); for (let y = 166; y < H; y += 12) rect(x, 0, y, W, 1, '#a8a49c');
    for (let X = 30; X <= 450; X += 60) flag(x, X, 136, 'cn');
    return { walk: [10, 168, 470, 262] };
  },
  redsquare: (x, r) => {
    vgrad(x, 0, 0, W, 150, ['#6a90c8', '#98b4d8', '#d4e0ec']);
    clouds(x, r, 3, 10, 50, '#f0f0f4');
    rect(x, 0, 104, 230, 46, '#a8322a');
    for (let X = 0; X < 230; X += 8) { rect(x, X, 98, 5, 6, '#a8322a'); px(x, X, 97, '#a8322a'); px(x, X + 4, 97, '#a8322a'); }
    for (let y = 108; y < 150; y += 6) rect(x, 0, y, 230, 1, '#8e2a22');
    rect(x, 150, 50, 30, 100, '#b8382e'); rect(x, 154, 70, 22, 16, '#f0f0e8'); ellipse(x, 165, 78, 6, 6, '#1a1a1a'); ellipse(x, 165, 78, 5, 5, '#f4e8c8');
    for (let i = 0; i < 26; i++) rect(x, 165 - (26 - i) / 3, 24 + i, (26 - i) / 1.5, 1, '#2a6a3a');
    px(x, 165, 18, '#e83a3a'); rect(x, 164, 19, 3, 3, '#e83a3a');
    rect(x, 300, 96, 150, 54, '#b8382e'); for (let X = 304; X < 446; X += 10) rect(x, X, 110, 5, 8, '#f0e0c0');
    const domes = [[322, 58, 20, '#3a8a4a', '#f0c030'], [375, 26, 26, '#e83a3a', '#f4f4f4'], [428, 60, 20, '#3a6ab8', '#f0c030'], [348, 72, 15, '#f0c030', '#3a8a4a'], [402, 74, 15, '#3a8a4a', '#e83a3a']];
    for (const [dx, dy, s, c1, c2] of domes) {
      rect(x, dx - s / 3, dy + s, (s * 2) / 3, 96 - dy - s, '#d8c8a8');
      for (let i = 0; i < s; i++) { const w = Math.round(Math.sin((i / s) * Math.PI * 0.95 + 0.1) * s * 0.8); for (let k = -w; k <= w; k++) px(x, dx + k, dy + i, (k + i) % 4 < 2 ? c1 : c2); }
      rect(x, dx, dy - 8, 1, 8, '#f0c030');
    }
    for (let y = 150; y < H; y++) for (let X = 0; X < W; X++) px(x, X, y, (Math.floor(X / 6) + Math.floor(y / 3)) % 2 ? '#6a5a58' : '#5a4a48');
    return { walk: [10, 160, 470, 262] };
  },
  eiffel: (x, r) => {
    vgrad(x, 0, 0, W, 150, ['#7ab0e0', '#a8cce8', '#e4f0f8']);
    clouds(x, r, 4, 10, 60);
    for (let y = 10; y < 150; y++) {
      const w = Math.round(3 + ((y - 10) / 140) ** 2.2 * 70);
      const col = '#8a6a4a';
      px(x, 240 - w, y, col); px(x, 240 + w, y, col); px(x, 240 - w + 1, y, '#a8886a'); px(x, 240 + w - 1, y, '#6a4a30');
      if (y % 5 === 0 && w > 4) for (let k = -w; k <= w; k += 2) px(x, 240 + k, y, '#7a5a3a');
    }
    rect(x, 222, 64, 37, 3, '#6a4a30'); rect(x, 200, 104, 81, 4, '#6a4a30');
    for (let k = 0; k < 20; k++) { const w = 20 - k; px(x, 240 - 58 + k * 2.9, 150 - Math.sqrt(k) * 8, '#6a4a30'); px(x, 240 + 58 - k * 2.9, 150 - Math.sqrt(k) * 8, '#6a4a30'); if (w < 0) break; }
    for (let k = 0; k < 14; k++) roundTree(x, k * 36 + 10, 152, 8, '#4a8a3a');
    rect(x, 0, 152, W, H - 152, '#6aa84a'); rect(x, 160, 152, 160, H - 152, '#d8c8a0');
    return { walk: [10, 162, 470, 262] };
  },
  bigben: (x, r) => {
    vgrad(x, 0, 0, W, 150, ['#8aa0c0', '#aabcd0', '#d8e0e8']);
    clouds(x, r, 5, 10, 60, '#e8ecf0');
    for (let X = 0; X < 330; X += 12) { rect(x, X, 96, 12, 54, '#c8b078'); rect(x, X + 5, 88, 2, 8, '#c8b078'); for (let yy = 104; yy < 146; yy += 12) rect(x, X + 3, yy, 5, 8, '#5a5040'); }
    rect(x, 330, 30, 30, 120, '#c8b078'); rect(x, 356, 30, 4, 120, '#a8905a');
    for (let y = 36; y < 150; y += 8) rect(x, 334, y, 22, 1, '#a8905a');
    rect(x, 332, 40, 26, 24, '#d8c088'); ellipse(x, 345, 52, 9, 9, '#f4f0e0'); line(x, 345, 52, 345, 46, '#1a1a1a'); line(x, 345, 52, 349, 52, '#1a1a1a');
    for (let i = 0; i < 22; i++) rect(x, 345 - (22 - i) / 2, 8 + i, 22 - i + 1, 1, i % 3 ? '#4a4a52' : '#e8c030');
    rect(x, 0, 150, W, H - 150, '#a8a8a4'); for (let y = 158; y < H; y += 12) rect(x, 0, y, W, 1, '#98989a');
    rect(x, 30, 140, 40, 22, '#d02a2a'); rect(x, 30, 140, 40, 2, '#a01a1a'); for (let X = 33; X < 68; X += 7) { rect(x, X, 144, 5, 4, '#2a2a3a'); rect(x, X, 152, 5, 4, '#2a2a3a'); }
    return { walk: [10, 168, 470, 262] };
  },
  whitehouse: (x, r) => {
    vgrad(x, 0, 0, W, 130, ['#6aa6e0', '#9cc8ec', '#dcecf8']);
    clouds(x, r, 3, 10, 40);
    for (let k = 0; k < 12; k++) roundTree(x, k * 42 + 10, 110, 10, '#3a7a3a');
    rect(x, 0, 104, W, 40, '#5aa04a');
    rect(x, 130, 66, 220, 44, '#f4f4f0'); rect(x, 130, 66, 220, 3, '#dcdcd8');
    for (let X = 138; X < 344; X += 14) rect(x, X, 76, 6, 9, '#4a5a68'), rect(x, X, 92, 6, 9, '#4a5a68');
    rect(x, 210, 58, 60, 52, '#f4f4f0'); for (let i = 0; i < 8; i++) rect(x, 210 + i * 4, 58 - i, 60 - i * 8, 1, '#e8e8e4');
    for (let X = 214; X < 270; X += 8) rect(x, X, 66, 3, 44, '#dcdcd8');
    flag(x, 239, 36, 'red');
    ellipse(x, 240, 128, 20, 5, '#c8c8c8'); ellipse(x, 240, 127, 16, 3, '#6aa8e0');
    for (let X = 0; X < W; X += 4) rect(x, X, 138, 1, 12, '#1a1a1a'); rect(x, 0, 140, W, 1, '#1a1a1a');
    rect(x, 0, 150, W, H - 150, '#b8b4ac'); for (let y = 160; y < H; y += 14) rect(x, 0, y, W, 1, '#a8a49c');
    return { walk: [10, 160, 470, 262] };
  },
  pyramid: (x, r) => {
    vgrad(x, 0, 0, W, 150, ['#7ab4e4', '#b8d4e8', '#f0e4c8']);
    for (const [cx, by, s] of [[140, 150, 90], [300, 150, 70], [410, 150, 40]]) for (let i = 0; i < s; i++) { rect(x, cx - i, by - s + i, i, 1, '#e0c080'); rect(x, cx, by - s + i, i, 1, '#b89858'); if (i % 6 === 0) { rect(x, cx - i, by - s + i, i * 2, 1, '#c8a868'); } }
    noiseGround(x, r, 150, H, ['#e8d098', '#d8c088', '#c8b078']);
    return { walk: [10, 160, 470, 262] };
  },
  bridge: (x, r) => {
    vgrad(x, 0, 0, W, 116, ['#5a96d8', '#8cbcea', '#d4eaf8']);
    clouds(x, r, 3, 10, 40);
    vgrad(x, 0, 110, W, 50, ['#2a6aa8', '#3a82c0']);
    for (const cx of [140, 380]) { line(x, cx - 10, 110, cx, 16, '#e8e8f0'); line(x, cx + 10, 110, cx, 16, '#e8e8f0'); line(x, cx - 9, 110, cx + 1, 16, '#c8c8d0'); for (let k = 0; k < 9; k++) { line(x, cx, 22 + k * 3, cx - 20 - k * 12, 98, '#d8d8e0'); line(x, cx, 22 + k * 3, cx + 20 + k * 12, 98, '#d8d8e0'); } }
    rect(x, 0, 98, W, 4, '#6a6a74'); rect(x, 0, 102, W, 1, '#3a3a44');
    for (let X = 10; X < 140; X += 30) building(x, r, X, 160, 26, 30 + r() * 20, pick(r, ['#c8d8e8', '#a8c0d8', '#e0e8f0']), { win: '#6a8aa8', lit: '#bfe0ff', litP: 0.3 });
    rect(x, 0, 160, W, H - 160, '#b8b4ac'); for (let y = 168; y < H; y += 12) rect(x, 0, y, W, 1, '#a8a49c');
    for (let X = 200; X < 460; X += 60) flag(x, X, 140, 'ru');
    return { walk: [10, 170, 470, 262], anim: (ctx, t) => { for (let i = 0; i < 18; i++) rect(ctx, (i * 61 + t * 6) % W, 114 + ((i * 11) % 44), 5, 1, 'rgba(220,240,255,0.6)'); } };
  },
  generic: (x, r) => P.city(x, r, 'generic'),
};

P.golf = (x, r, style = 'nj') => {
  const scot = style === 'scotland';
  vgrad(x, 0, 0, W, 122, scot ? ['#7a9ac0', '#a8bcd4', '#d8e0e8'] : ['#6aa6e0', '#9cc8ec', '#dcecf8']);
  clouds(x, r, 5, 10, 55, scot ? '#eef0f4' : '#ffffff');
  if (scot) {
    vgrad(x, 0, 96, W, 28, ['#3a6a98', '#4a7aa8']);
    rect(x, 404, 50, 12, 64, '#f4f4f0'); rect(x, 404, 50, 12, 6, '#c83a2a'); rect(x, 402, 44, 16, 6, '#3a3a40'); rect(x, 406, 45, 8, 4, '#f8e070'); rect(x, 413, 56, 3, 58, '#d8d8d4');
    ellipse(x, 410, 116, 26, 6, '#6a6a60');
    ridge(x, 111, 124, 12, '#6a8a58', 0.02, { bottom: 130 });
  } else {
    for (let k = 0; k < 16; k++) roundTree(x, k * 32 + r() * 10, 122, 9 + Math.floor(r() * 4), pick(r, ['#2e6a36', '#3a7a3e', '#2a5a30']));
    rect(x, 30, 88, 110, 32, '#f4f0e8'); for (let X = 36; X < 136; X += 10) rect(x, X, 96, 5, 8, '#4a5a68');
    roof(x, 85, 76, 124, 12, '#3a3a44', '#22222a');
  }
  for (let y = 122; y < H; y++) rect(x, 0, y, W, 1, Math.floor((y - 122) / 10) % 2 ? '#5aa84a' : '#4e9a40');
  for (let X = 0; X < W; X++) if (bayer(X, 122) < 0.5) px(x, X, 122 + (X % 3), '#3a7a32');
  ellipse(x, 320, 172, 62, 16, '#7ac85a');
  rect(x, 330, 136, 1, 34, '#f4f4f4'); rect(x, 331, 136, 9, 5, '#e0302a'); rect(x, 329, 170, 3, 1, '#1a1a1a');
  ellipse(x, 150, 214, 36, 10, '#e8d8a0'); ellipse(x, 150, 213, 30, 7, '#f0e4b0');
  cart(x, 50, 196); cart(x, 70, 200); cart(x, 420, 236);
  return { walk: [10, 130, 470, 262] };
};

P.resort = (x, r) => {
  vgrad(x, 0, 0, W, 104, ['#48a0e8', '#88c4f0', '#d0ecf8']);
  clouds(x, r, 4, 8, 40);
  vgrad(x, 0, 96, W, 24, ['#3ab0c8', '#5ac8d8']);
  const cream = '#f2e2c8', tile = '#c8583a', tileD = '#9a3e28';
  rect(x, 110, 72, 260, 58, cream); rect(x, 368, 72, 2, 58, '#d8c6a8');
  for (let X = 120; X < 360; X += 18) { ellipse(x, X + 4, 92, 4, 4, '#3a4a5a'); rect(x, X, 92, 9, 12, '#3a4a5a'); }
  for (let X = 120; X < 360; X += 18) rect(x, X, 112, 9, 12, '#3a4a5a');
  for (let i = 0; i < 8; i++) rect(x, 104 + i, 64 + i, 272 - i * 2, 1, i % 2 ? tile : tileD);
  rect(x, 226, 26, 48, 46, cream); for (let X = 232; X < 270; X += 12) { rect(x, X, 40, 6, 10, '#3a4a5a'); }
  for (let i = 0; i < 16; i++) rect(x, 250 - i * 2 - 2, 10 + i, i * 4 + 4, 1, i % 2 ? tile : tileD);
  flag(x, 249, -4, 'red');
  for (const [px0, h] of [[40, 50], [70, 40], [410, 52], [440, 44], [92, 34], [388, 36]]) palm(x, px0, 132, h);
  for (let y = 130; y < H; y++) rect(x, 0, y, W, 1, Math.floor((y - 130) / 8) % 2 ? '#6ab84a' : '#5eac40');
  for (let y = 130; y < H; y++) { const w = 30 + (y - 130) * 0.5; rect(x, 240 - w / 2, y, w, 1, '#eadcc0'); }
  rect(x, 56, 196, 96, 36, '#f4f4f0'); rect(x, 60, 200, 88, 28, '#48c8e0');
  for (let i = 0; i < 8; i++) rect(x, 66 + i * 10, 206 + (i % 2) * 8, 6, 1, '#a8ecf8');
  for (const cx of [330, 360, 390]) { rect(x, cx, 214, 20, 3, '#f4f4f4'); rect(x, cx + 16, 208, 3, 6, '#f4f4f4'); }
  return { walk: [10, 138, 470, 262], anim: (ctx, t) => { for (let i = 0; i < 12; i++) rect(ctx, (i * 43 + t * 6) % W, 100 + ((i * 7) % 16), 4, 1, 'rgba(255,255,255,0.6)'); } };
};

P.ruins = (x, r, style = 'bunker') => {
  vgrad(x, 0, 0, W, 150, ['#6e665e', '#8e8478', '#b8aa96']);
  const glows = [], smokes = [];
  let X = -4;
  while (X < W) {
    const w = 22 + Math.floor(r() * 30), h = 40 + r() * 70, wall = pick(r, ['#7a7068', '#5e5850', '#8a7e72']);
    for (let i = 0; i < w; i++) { const hh = Math.max(12, h - (r() < 0.35 ? r() * 26 : 0) - (i > w * 0.6 ? (i - w * 0.6) * 1.2 : 0)); rect(x, X + i, 150 - hh, 1, hh, i > w - 3 ? shade(wall, 0.8) : wall); }
    for (let k = 0; k < 6; k++) { const wx = X + 3 + r() * (w - 8), wy = 150 - h * (0.3 + r() * 0.5); const fire = r() < 0.18; rect(x, wx, wy, 3, 4, fire ? '#e8783a' : '#2a2622'); if (fire) glows.push([wx, wy]); }
    if (r() < 0.3) smokes.push(X + w / 2);
    X += w + 2;
  }
  if (style === 'gate') {
    rect(x, 140, 134, 200, 16, '#b8ae9a'); rect(x, 140, 134, 200, 2, '#d0c6b0');
    for (let k = 0; k < 6; k++) { const cx = 150 + k * 36; rect(x, cx, 82, 10, 52, '#cfc4ae'); rect(x, cx + 7, 82, 3, 52, '#a89e88'); }
    rect(x, 142, 66, 196, 16, '#c6bca6'); for (let X2 = 146; X2 < 336; X2 += 8) rect(x, X2, 72, 4, 4, '#a89e88');
    rect(x, 190, 52, 100, 14, '#bcb29c'); rect(x, 222, 38, 36, 14, '#3a3a34'); rect(x, 214, 44, 52, 8, '#2e2e28');
    rect(x, 300, 66, 18, 10, '#6e665e'); rect(x, 164, 90, 6, 12, '#2a2622');
  } else {
    rect(x, 180, 104, 120, 46, '#9a9890'); for (let y = 110; y < 150; y += 8) rect(x, 180, y, 120, 1, '#8a8880');
    rect(x, 180, 104, 120, 3, '#b0aea6'); rect(x, 226, 122, 28, 28, '#26241f'); rect(x, 230, 126, 20, 24, '#141412');
    for (let k = 0; k < 14; k++) ellipse(x, 176 + k * 10, 147, 5, 3, k % 2 ? '#a89870' : '#98885f');
    rect(x, 120, 120, 12, 30, '#6a6258'); rect(x, 116, 116, 20, 5, '#4a4640');
  }
  noiseGround(x, r, 150, H, ['#8a8274', '#7a7266', '#5a544c']);
  for (let k = 0; k < 30; k++) ellipse(x, r() * W, 158 + r() * 104, 2 + r() * 5, 1 + r() * 2, pick(r, ['#6a645a', '#9a9284', '#4a463e']));
  if (smokes.length < 2) smokes.push(90, 380);
  return {
    walk: [10, 158, 470, 262],
    anim: (ctx, t) => {
      for (const sx of smokes) for (let i = 0; i < 6; i++) { const f = (t * 0.12 + i / 6) % 1; ellipse(ctx, sx + f * 30, 70 - f * 60, 4 + f * 10, 3 + f * 5, `rgba(60,56,52,${0.6 - f * 0.5})`); }
      for (const [gx, gy] of glows) { ctx.fillStyle = Math.sin(t * 9 + gx) > 0 ? '#f0a040' : '#c8502a'; ctx.fillRect(Math.round(gx), Math.round(gy), 3, 4); }
    },
  };
};

P.harbor = (x, r, style = 'uboat') => {
  vgrad(x, 0, 0, W, 112, ['#8a98a8', '#aab4c0', '#ccd2d8']);
  clouds(x, r, 4, 10, 50, '#dde0e4');
  ridge(x, 121, 110, 16, '#7a8a7a', 0.015, { bottom: 112 });
  vgrad(x, 0, 110, W, 60, ['#3a5a78', '#4a6a88']);
  if (style === 'uboat') {
    for (let X = 130; X < 390; X++) { const t = (X - 130) / 260; const h = Math.round(7 * Math.sin(t * Math.PI) ** 0.5); rect(x, X, 146 - h, 1, h * 2, X % 2 ? '#4a5058' : '#454b53'); px(x, X, 146 - h, '#6a7078'); }
    rect(x, 246, 124, 30, 18, '#4a5058'); rect(x, 246, 124, 30, 2, '#6a7078'); rect(x, 262, 110, 2, 14, '#3a3e44'); rect(x, 268, 114, 1, 10, '#3a3e44');
    rect(x, 180, 140, 14, 2, '#3a3e44');
  } else {
    rect(x, 110, 124, 290, 34, '#2e2e32'); rect(x, 110, 150, 290, 8, '#8a2a24'); rect(x, 110, 124, 290, 2, '#4a4a50');
    rect(x, 320, 96, 50, 28, '#e8e8e4'); for (let X = 324; X < 366; X += 8) rect(x, X, 104, 5, 4, '#3a4a5a');
    rect(x, 334, 78, 12, 18, '#1a1a1a'); rect(x, 334, 82, 12, 4, '#c83a2a');
  }
  for (let y = 40; y < 172; y++) { px(x, 46, y, '#8a6a3a'); px(x, 60, y, '#8a6a3a'); if (y % 8 === 0) line(x, 46, y, 60, y + 8, '#8a6a3a'); }
  line(x, 53, 40, 110, 52, '#8a6a3a'); line(x, 105, 52, 105, 90, '#2a2a2a');
  rect(x, 0, 160, W, 12, '#6a5238'); for (let X = 0; X < W; X += 6) rect(x, X, 160, 1, 12, '#4a3a28');
  building(x, r, 404, 172, 76, 58, '#8a4a3a', { win: '#3a2a22', litP: 0.05, roof: '#5a3a2a' });
  rect(x, 0, 172, W, H - 172, '#8a8680'); for (let y = 180; y < H; y += 14) rect(x, 0, y, W, 1, '#7a766f');
  for (let k = 0; k < 6; k++) { const cx = 20 + r() * 380, cy = 200 + r() * 50; rect(x, cx, cy - 10, 12, 10, '#8a6a3a'); rect(x, cx, cy - 10, 12, 1, '#a88a5a'); line(x, cx, cy - 10, cx + 11, cy - 1, '#6a4a2a'); }
  return { walk: [10, 178, 470, 262], anim: (ctx, t) => { for (let i = 0; i < 16; i++) rect(ctx, (i * 57 + t * 5) % W, 116 + ((i * 11) % 40), 5, 1, 'rgba(200,220,240,0.45)'); } };
};

// 씬 생성 (캐시)
const cache = new Map();
export function buildScene(poi) {
  if (cache.has(poi.id)) return cache.get(poi.id);
  const [c, x] = makeCanvas(W, H);
  const r = mulberry32(hashStr(poi.id));
  const kind = poi.scene?.kind || 'city';
  const res = (P[kind] || P.city)(x, r, poi.scene?.style);
  const s = { bg: c, walk: res.walk || [10, 170, 470, 262], anim: res.anim || null };
  cache.set(poi.id, s);
  return s;
}
