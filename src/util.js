// 공용 유틸: 난수, 색상, 픽셀 캔버스 헬퍼
export const W = 480, H = 270;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const chance = (r, p) => r() < p;
export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function weighted(r, items, wf = (x) => x.w) {
  const tot = items.reduce((s, x) => s + wf(x), 0);
  let v = r() * tot;
  for (const x of items) { v -= wf(x); if (v <= 0) return x; }
  return items[items.length - 1];
}

// 4x4 베이어 디더 행렬 (0..1)
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER4[((y & 3) << 2) | (x & 3)];

const rgbCache = new Map();
export function hex2rgb(h) {
  let c = rgbCache.get(h);
  if (c) return c;
  const s = h.replace('#', '');
  c = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  rgbCache.set(h, c);
  return c;
}
export function rgb2hex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
export function shade(h, f) {
  const [r, g, b] = hex2rgb(h);
  return f >= 1 ? rgb2hex(r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)) : rgb2hex(r * f, g * f, b * f);
}
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}
export function rect(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function px(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}
// 1px 선 (브레젠험)
export function line(ctx, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = col;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
export function ellipse(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
  }
}
// 세로 디더 그라디언트
export function vgrad(ctx, x0, y0, w, h, cols) {
  const n = cols.length - 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (y / Math.max(1, h - 1)) * n;
      let i = Math.floor(t), f = t - i;
      if (i >= n) { i = n - 1; f = 1; }
      ctx.fillStyle = f > bayer(x0 + x, y0 + y) ? cols[i + 1] : cols[i];
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}
// 문자열 배열 → 스프라이트 캔버스
export function spriteFromRows(rows, pal, w = 0) {
  const width = w || Math.max(...rows.map((r) => r.length));
  const [c, x] = makeCanvas(width, rows.length);
  rows.forEach((row, y) => {
    for (let i = 0; i < width; i++) {
      const ch = row[i];
      if (!ch || ch === '.' || !pal[ch]) continue;
      x.fillStyle = pal[ch];
      x.fillRect(i, y, 1, 1);
    }
  });
  return c;
}
// 1D 값 노이즈
export function noise1(seed, freq) {
  const r = mulberry32(seed);
  const vals = Array.from({ length: 512 }, () => r());
  return (x) => {
    const t = x * freq, i = Math.floor(t), f = t - i;
    const a = vals[((i % 512) + 512) % 512], b = vals[(((i + 1) % 512) + 512) % 512];
    const s = (1 - Math.cos(f * Math.PI)) / 2;
    return a + (b - a) * s;
  };
}
export function haversineKm(lon1, lat1, lon2, lat2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function fmtHours(h) {
  const d = Math.floor(h / 24), hh = Math.floor(h % 24), mm = Math.round((h % 1) * 60);
  return (d ? d + '일 ' : '') + (hh ? hh + '시간 ' : '') + (mm ? mm + '분' : '') || '0분';
}
