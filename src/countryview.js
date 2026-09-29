// 나라 안 지도: 픽셀 지형 + 랜드마크/산/도시 POI
/* global d3 */
import { W, H, makeCanvas, hex2rgb, rgb2hex, mix, shade, bayer, mulberry32, hashStr, clamp, pick, haversineKm } from './util.js';
import { geo, rasterize, mainParts } from './geo.js';
import { ICON } from './art.js';
import { poiListFor } from './data.js';
import { POI_INDEX } from './story.js';

// 주요 산맥/산 (경도, 위도, 크기)
const PEAKS = {
  'North Korea': [[128.08, 42.0, 2], [127.3, 40.9, 1], [127.9, 41.2, 1], [126.9, 40.4, 1], [128.4, 40.6, 1], [127.1, 39.9, 1], [128.1, 38.65, 1], [126.5, 40.9, 1], [127.6, 41.6, 1], [129.2, 41.7, 1]],
  'South Korea': [[128.47, 38.12, 1], [128.6, 37.4, 1], [128.9, 36.8, 1], [127.73, 35.34, 1], [126.53, 33.36, 1], [128.2, 36.3, 1]],
  Japan: [[138.73, 35.36, 2], [137.6, 36.3, 1], [140.1, 38.3, 1], [142.9, 43.6, 1], [131.1, 32.9, 1]],
  China: [[86.9, 28.0, 2], [90, 33, 1], [100, 30, 1], [95, 36, 1], [110, 34, 1], [104, 38, 1], [116.02, 40.6, 1], [84, 42, 1]],
  'United States of America': [[-106, 40, 1], [-110, 44, 1], [-120, 37, 1], [-114, 38, 1], [-82, 35.6, 1], [-121.8, 46.8, 1]],
  Russia: [[43.5, 43.3, 1], [90, 51, 1], [105, 56, 1], [130, 62, 1], [160, 56, 2], [60, 60, 1]],
};
const RIVERS = {
  'North Korea': [[[125.2, 38.75], [125.45, 38.9], [125.75, 39.02], [126.0, 39.25], [126.35, 39.55], [126.7, 39.75]], [[126.6, 37.95], [126.8, 38.3], [127.1, 38.6]]],
  'South Korea': [[[126.6, 37.62], [126.9, 37.55], [127.2, 37.53], [127.5, 37.5], [127.9, 37.3]], [[128.9, 35.1], [128.7, 35.5], [128.5, 36.0], [128.3, 36.5]]],
  China: [[[121.8, 31.4], [118.8, 32.0], [116, 30], [112, 30.4], [106.5, 29.5], [100, 28]], [[118.5, 37.7], [114, 35], [110.5, 34.6], [106, 36], [104, 38.5]]],
};

export class CountryView {
  constructor(game) { this.g = game; this.t = 0; this.hover = null; this.hoverCountry = null; }
  enter(country) {
    this.c = country;
    const proj = d3.geoMercator().rotate([-country.centroid[0], 0]);
    proj.fitExtent([[40, 40], [440, 244]], mainParts(country.feature));
    if (proj.scale() > 9000) { const s = 9000; proj.scale(s); proj.translate([W / 2, H / 2 + 8]).center([0, 0]); const [x, y] = proj([country.centroid[0], country.centroid[1]]); const t = proj.translate(); proj.translate([t[0] + W / 2 - x, t[1] + H / 2 + 8 - y]); }
    proj.clipExtent([[0, 0], [W, H]]);
    this.proj = proj;
    this.ids = rasterize(geo.list, proj, W, H);
    this.bg = this.paint();
    this.pois = this.g.poisFor(country, this);
    this.t = 0;
  }
  landAt(x, y) { return this.ids[clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)]; }
  paint() {
    const [c, x] = makeCanvas(W, H);
    const img = x.createImageData(W, H), d = img.data;
    const ids = this.ids, own = this.c.idx;
    const r = mulberry32(hashStr(this.c.name));
    // 2D 값 노이즈 (지형 톤)
    const nz = new Float32Array(61 * 35); for (let i = 0; i < nz.length; i++) nz[i] = r();
    const noise = (px, py) => {
      const gx = px / 8, gy = py / 8, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const g = (a, b) => nz[clamp(b, 0, 34) * 61 + clamp(a, 0, 60)];
      const a = g(ix, iy) * (1 - fx) + g(ix + 1, iy) * fx, b = g(ix, iy + 1) * (1 - fx) + g(ix + 1, iy + 1) * fx;
      return a * (1 - fy) + b * fy;
    };
    const base = this.c.color;
    const ownCols = [shade(base, 0.78), shade(base, 0.9), base, shade(base, 1.12)].map(hex2rgb);
    const nbCols = [mix(shade(base, 0.7), '#8a8a80', 0.7), mix(base, '#a8a898', 0.7)].map(hex2rgb);
    const distOcean = new Uint8Array(W * H).fill(9);
    for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
      const i = y * W + X;
      if (ids[i]) continue;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const j = (y + dy) * W + X + dx;
        if (y + dy >= 0 && y + dy < H && X + dx >= 0 && X + dx < W && ids[j]) distOcean[i] = Math.min(distOcean[i], Math.max(Math.abs(dx), Math.abs(dy)));
      }
    }
    for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
      const i = y * W + X, id = ids[i], k = i * 4;
      let col;
      if (!id) {
        const dd = distOcean[i];
        col = dd <= 1 ? [96, 160, 214] : dd <= 3 ? [60, 124, 190] : [38, 92, 156];
        if (dd > 3 && bayer(X, y) < 0.25 && ((X * 7 + y * 13) % 5 === 0)) col = [46, 104, 170];
        const wv = hashStr(((X / 6) | 0) + ':' + ((y / 5) | 0)) % 23;
        if (dd > 3 && wv === 0 && (X % 6) < 3 && y % 5 === 0) col = [110, 170, 225];
      } else {
        const n = noise(X, y) + (bayer(X, y) - 0.5) * 0.25;
        if (id === own) col = ownCols[clamp(Math.floor(n * 4), 0, 3)];
        else col = nbCols[n > 0.72 ? 0 : 1];
        const L = X > 0 ? ids[i - 1] : id, R = X < W - 1 ? ids[i + 1] : id, U = y > 0 ? ids[i - W] : id, D = y < H - 1 ? ids[i + W] : id;
        if (!L || !R || !U || !D) col = [32, 48, 30];
        else if (L !== id || U !== id) col = (X + y) % 2 ? [60, 50, 40] : col;
      }
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    // 강
    for (const riv of RIVERS[this.c.name] || []) {
      x.fillStyle = '#4a8ed0';
      for (let i = 0; i + 1 < riv.length; i++) {
        const [ax, ay] = this.proj(riv[i]), [bx, by] = this.proj(riv[i + 1]);
        const n = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (let s = 0; s <= n; s++) { const px = Math.round(ax + ((bx - ax) * s) / n), py = Math.round(ay + ((by - ay) * s) / n); if (this.ids[py * W + px] === own) x.fillRect(px, py, 1, 1); }
      }
    }
    // 절차적 나무/언덕
    const treeCol = shade(base, 0.6), trunk = '#5a3a20';
    const n = 220;
    for (let i = 0; i < n; i++) {
      const X = Math.floor(r() * W), y = Math.floor(r() * H);
      if (this.ids[y * W + X] !== own || this.ids[(y + 3) * W + X] !== own) continue;
      if (r() < 0.7) { x.fillStyle = treeCol; x.fillRect(X, y, 3, 2); x.fillRect(X + 1, y - 1, 1, 1); x.fillStyle = trunk; x.fillRect(X + 1, y + 2, 1, 1); }
      else { x.fillStyle = shade(base, 0.7); x.fillRect(X - 2, y + 1, 5, 1); x.fillRect(X - 1, y, 3, 1); x.fillStyle = shade(base, 1.25); x.fillRect(X, y - 1, 1, 1); }
    }
    // 큰 산
    for (const [lon, lat, s] of PEAKS[this.c.name] || []) {
      const p = this.proj([lon, lat]);
      if (!p) continue;
      const [px, py] = p.map(Math.round);
      const h = s === 2 ? 9 : 6;
      for (let j = 0; j < h; j++) for (let k = -j; k <= j; k++) {
        const col = j < (s === 2 ? 3 : 2) ? '#f4f4f4' : k < 0 ? '#9a8a78' : '#6a5a4a';
        x.fillStyle = col; x.fillRect(px + k, py - h + j, 1, 1);
      }
      x.fillStyle = '#3a2e22'; x.fillRect(px - h, py, h * 2 + 1, 1);
    }
    // 테두리 프레임
    x.fillStyle = '#0c1020';
    x.fillRect(0, 0, W, 2); x.fillRect(0, H - 2, W, 2); x.fillRect(0, 0, 2, H); x.fillRect(W - 2, 0, 2, H);
    // 나침반
    const cx = W - 22, cy = H - 26;
    x.fillStyle = '#f4f0e0'; x.fillRect(cx, cy - 8, 1, 17); x.fillRect(cx - 8, cy, 17, 1);
    x.fillStyle = '#e0453c'; x.fillRect(cx - 1, cy - 8, 3, 4);
    return c;
  }
  poiScreen(p) {
    const q = this.proj([p.lon, p.lat]);
    if (!q) return null;
    return [Math.round(q[0] + (p.dx || 0)), Math.round(q[1] + (p.dy || 0))];
  }
  update(dt) { this.t += dt; }
  render(ctx) {
    ctx.drawImage(this.bg, 0, 0);
    // 이웃 나라 하이라이트
    if (this.hoverCountry && !this.hover) {
      ctx.fillStyle = 'rgba(255,220,90,0.25)';
      const id = this.hoverCountry.idx;
      for (let y = 0; y < H; y += 1) for (let x = (y % 2); x < W; x += 2) if (this.ids[y * W + x] === id) ctx.fillRect(x, y, 1, 1);
    }
    const loc = this.g.loc;
    for (const p of this.pois) {
      const s = this.poiScreen(p);
      if (!s) continue;
      const hov = this.hover === p;
      const bob = hov ? Math.round(Math.abs(Math.sin(this.t * 8)) * -3) : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(s[0] - 6, s[1] + 1, 12, 2);
      ctx.drawImage(ICON[p.type] || ICON.landmark, s[0] - 8, s[1] - 15 + bob);
      if (hov) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(s[0] - 9, s[1] + 3, 18, 1); }
      if (loc.poi === p.id) ctx.drawImage(ICON.pin, s[0] - 5, s[1] - 30 - Math.round(Math.abs(Math.sin(this.t * 4)) * 2));
      const lv = this.g.droneScans?.[p.id];
      if (lv !== undefined) {
        const cols = ['#5ad07a', '#f0d040', '#f08a2e', '#ff3a3a'];
        ctx.fillStyle = '#101018'; ctx.fillRect(s[0] - 8, s[1] - 22, 16, 5);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < lv ? cols[lv] : '#3a3a48'; ctx.fillRect(s[0] - 7 + k * 5, s[1] - 21, 4, 3); }
      }
    }
  }
  overlay(o) {
    o.text(this.c.ko, 12, 18, { size: 18, color: '#fff6d8', outline: '#0a1020' });
    o.text(this.c.name, 12, 34, { size: 9, color: '#c8d4e8', outline: '#0a1020' });
    // 이웃 나라 라벨
    for (const f of geo.list) {
      if (f === this.c || f.area * this.proj.scale() ** 2 < 1800) continue;
      const p = this.proj(f.centroid);
      if (!p || p[0] < 20 || p[0] > W - 20 || p[1] < 20 || p[1] > H - 10) continue;
      if (this.ids[(p[1] | 0) * W + (p[0] | 0)] !== f.idx) continue;
      o.text(f.ko, p[0], p[1], { size: 9, align: 'center', color: 'rgba(230,230,210,0.75)', outline: '#1a1a14' });
    }
    const small = this.g.S < 1.3;
    for (const p of this.pois) {
      const s = this.poiScreen(p);
      if (!s || (small && this.hover !== p && this.g.loc.poi !== p.id)) continue;
      o.text(p.name.split(' · ').pop(), s[0], s[1] + 12, { size: 9, align: 'center', color: this.hover === p ? '#ffd24a' : '#ffffff', outline: '#101010' });
    }
    const m = this.g.mouse;
    if (this.hover) {
      const here = this.g.loc.poi === this.hover.id;
      const lv = this.g.droneScans?.[this.hover.id];
      const sec = lv === undefined ? '' : ` · 경호 ${['없음', '낮음', '높음', '매우 높음'][lv]}`;
      o.tooltip(this.hover.name, m.x, m.y, (here ? '현재 위치 · 눌러서 들어가기' : `이동 약 ${this.g.poiTravelHours(this.hover).toFixed(1)}시간`) + sec);
    } else if (this.hoverCountry && this.hoverCountry !== this.c) {
      o.tooltip(this.hoverCountry.ko, m.x, m.y, '클릭: 이 나라로 이동');
    }
  }
  pickPoi(x, y) {
    let best = null, bd = 12;
    for (const p of this.pois) {
      const s = this.poiScreen(p);
      if (!s) continue;
      const d = Math.hypot(s[0] - x, s[1] - 7 - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  pointerMove(x, y) {
    this.hover = this.pickPoi(x, y);
    const id = this.landAt(x, y);
    this.hoverCountry = id ? geo.features[id] : null;
  }
  pointerDown() {}
  pointerUp(x, y) {
    const p = this.pickPoi(x, y);
    if (p) return this.g.requestTravelPoi(p);
    const id = this.landAt(x, y);
    if (id && id !== this.c.idx) this.g.requestTravelCountry(geo.features[id]);
  }
}

// 데이터가 없는 나라는 수도 + 무작위 지형 POI 자동 생성
export function generatePois(country, view, era = 2026) {
  const fixed = poiListFor(country.name, era);
  if (fixed) return fixed.map((p) => POI_INDEX[p.id]);
  const sfx = era === 1945 ? '_45' : '';
  const r = mulberry32(hashStr('poi:' + country.name + sfx));
  const out = [];
  const cap = country.capital || { name: country.ko + ' 도심', lon: country.centroid[0], lat: country.centroid[1] };
  const push = (p) => { const q = { ...p, country: country.name }; POI_INDEX[q.id] = q; out.push(q); };
  push({ id: country.name + '_cap' + sfx, name: `${country.ko} · ${cap.name}`, type: 'capital', lon: cap.lon, lat: cap.lat, scene: { kind: 'city', style: era === 1945 ? 'old' : 'generic' } });
  const own = [];
  for (let i = 0; i < 4000; i++) {
    const x = 20 + Math.floor(r() * (W - 40)), y = 30 + Math.floor(r() * (H - 50));
    if (view.ids[y * W + x] === country.idx) own.push([x, y]);
  }
  const capS = view.proj([cap.lon, cap.lat]) || [W / 2, H / 2];
  const chosen = [capS];
  for (const [x, y] of own) {
    if (chosen.length >= 3) break;
    if (chosen.some(([a, b]) => Math.hypot(a - x, b - y) < 70)) continue;
    chosen.push([x, y]);
    let coast = false;
    for (let dy = -8; dy <= 8 && !coast; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (!view.ids[clamp(y + dy, 0, H - 1) * W + clamp(x + dx, 0, W - 1)]) { coast = true; break; }
    const kind = coast ? 'beach' : pick(r, ['village', 'mountain']);
    const [lon, lat] = view.proj.invert([x, y]);
    const nm = { beach: '해안', village: '시골 마을', mountain: '산악 지대' }[kind];
    push({ id: `${country.name}_${chosen.length}${sfx}`, name: `${country.ko} · ${nm}`, type: kind, lon, lat, scene: { kind, style: kind === 'mountain' ? 'green' : 'generic' } });
  }
  return out;
}
export { haversineKm };
