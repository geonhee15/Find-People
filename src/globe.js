/* global d3 */
// 픽셀 지구본: 매 프레임 원판 픽셀을 역투영해 국가 ID 래스터를 샘플링
import { W, H, hex2rgb, bayer, mulberry32, clamp } from './util.js';
import { geo, CONT_KO } from './geo.js';
import { ICON } from './art.js';

const CONT_LABELS = [
  ['Asia', 95, 48], ['Europe', 15, 52], ['Africa', 20, 5], ['North America', -100, 45], ['South America', -60, -15], ['Oceania', 134, -25], ['Antarctica', 0, -80],
];
const OCEAN = ['#1d3f78', '#24509a', '#2d62b4', '#3a78c8'];
const OCEAN_RGB = OCEAN.map(hex2rgb);

export class GlobeView {
  constructor(game) {
    this.g = game;
    this.lon0 = 127; this.lat0 = 30;
    this.R = 104; this.cx = W / 2; this.cy = H / 2 + 6;
    this.vlon = 0; this.vlat = 0;
    this.drag = null; this.hover = null; this.auto = true;
    this.img = new ImageData(W, H);
    this.stars = [];
    const r = mulberry32(7);
    for (let i = 0; i < 160; i++) this.stars.push([Math.floor(r() * W), Math.floor(r() * H), r()]);
    this.colorCache = [];
    for (const f of geo.features) if (f) this.colorCache[f.idx] = hex2rgb(f.color);
    this.flight = null;
    this.t = 0;
  }
  enter() { this.auto = !this.g.started; this.focusOn(this.g.loc.lon, this.g.loc.lat); }
  focusOn(lon, lat) { this.lon0 = lon; this.lat0 = clamp(lat, -60, 60); }
  // 화면 → 경위도
  invert(x, y) {
    const nx = (x - this.cx) / this.R, ny = -(y - this.cy) / this.R;
    const d = nx * nx + ny * ny;
    if (d > 1) return null;
    const nz = Math.sqrt(1 - d);
    const p = (this.lat0 * Math.PI) / 180;
    const X = nx, Y = ny * Math.cos(p) + nz * Math.sin(p), Z = -ny * Math.sin(p) + nz * Math.cos(p);
    const lat = (Math.asin(clamp(Y, -1, 1)) * 180) / Math.PI;
    let lon = this.lon0 + (Math.atan2(X, Z) * 180) / Math.PI;
    lon = ((((lon + 180) % 360) + 360) % 360) - 180;
    return [lon, lat];
  }
  // 경위도 → 화면 (z<0이면 뒷면)
  project(lon, lat) {
    const l = ((lon - this.lon0) * Math.PI) / 180, f = (lat * Math.PI) / 180, p = (this.lat0 * Math.PI) / 180;
    const X = Math.cos(f) * Math.sin(l), Y = Math.sin(f), Z = Math.cos(f) * Math.cos(l);
    const y = Y * Math.cos(p) - Z * Math.sin(p), z = Y * Math.sin(p) + Z * Math.cos(p);
    return [this.cx + X * this.R, this.cy - y * this.R, z];
  }
  countryAt(x, y) {
    const ll = this.invert(x, y);
    if (!ll) return null;
    const u = Math.floor(((ll[0] + 180) / 360) * geo.RW) % geo.RW, v = clamp(Math.floor(((90 - ll[1]) / 180) * geo.RH), 0, geo.RH - 1);
    return geo.features[geo.idRaster[v * geo.RW + u]] || null;
  }
  update(dt) {
    this.t += dt;
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = f.t < 0.5 ? 2 * f.t * f.t : 1 - (-2 * f.t + 2) ** 2 / 2;
      const [lon, lat] = f.interp(e);
      this.lon0 = lon; this.lat0 = clamp(lat, -60, 60);
      f.pos = [lon, lat];
      if (f.t >= 1) { const cb = f.done; this.flight = null; cb(); }
      return;
    }
    if (!this.drag) {
      if (this.auto) this.lon0 += dt * 6;
      this.lon0 += this.vlon; this.lat0 = clamp(this.lat0 + this.vlat, -70, 70);
      this.vlon *= 0.9; this.vlat *= 0.9;
    }
  }
  flyTo(fromLL, toLL, dur, done) {
    const interp = d3.geoInterpolate(fromLL, toLL);
    this.flight = { t: 0, dur, interp, done, pos: fromLL, from: fromLL, to: toLL };
  }
  render(ctx) {
    const { img, R, cx, cy } = this;
    const data = img.data;
    data.fill(0);
    // 배경 (우주)
    for (let i = 0; i < W * H; i++) { data[i * 4] = 8; data[i * 4 + 1] = 10; data[i * 4 + 2] = 24; data[i * 4 + 3] = 255; }
    for (const [x, y, b] of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(this.t * 2 + b * 20);
      const v = 90 + Math.floor(tw * b * 165);
      const k = (y * W + x) * 4; data[k] = v; data[k + 1] = v; data[k + 2] = Math.min(255, v + 30);
    }
    const p = (this.lat0 * Math.PI) / 180, sp = Math.sin(p), cp = Math.cos(p);
    const L = [-0.45, 0.55, 0.7];
    const hov = this.hover ? this.hover.idx : -1;
    const cur = this.g.loc ? geo.byName.get(this.g.loc.country)?.idx : -1;
    const prevRow = new Int32Array(W).fill(-1);
    const rowIds = new Int32Array(W).fill(-1);
    const RW = geo.RW, RH = geo.RH, ids = geo.idRaster;
    const y0 = Math.max(0, Math.floor(cy - R - 3)), y1 = Math.min(H - 1, Math.ceil(cy + R + 3));
    for (let y = y0; y <= y1; y++) {
      rowIds.fill(-1);
      for (let x = Math.max(0, Math.floor(cx - R - 3)); x <= Math.min(W - 1, cx + R + 3); x++) {
        const nx = (x + 0.5 - cx) / R, ny = -(y + 0.5 - cy) / R;
        const d = nx * nx + ny * ny;
        const k = (y * W + x) * 4;
        if (d > 1) {
          // 대기권 테두리
          if (d < 1.06) { const a = d < 1.03 ? 1 : 0.5; if (a === 1 || bayer(x, y) < 0.5) { data[k] = 110; data[k + 1] = 170; data[k + 2] = 255; } }
          continue;
        }
        const nz = Math.sqrt(1 - d);
        const X = nx, Y = ny * cp + nz * sp, Z = -ny * sp + nz * cp;
        const lat = Math.asin(Y), lon = (this.lon0 * Math.PI) / 180 + Math.atan2(X, Z);
        let u = Math.floor(((lon / Math.PI + 1) / 2) * RW) % RW; if (u < 0) u += RW;
        const v = Math.min(RH - 1, Math.max(0, Math.floor((0.5 - lat / Math.PI) * RH)));
        const id = ids[v * RW + u];
        rowIds[x] = id;
        let light = nx * L[0] + ny * L[1] + nz * L[2];
        light = clamp(light * 0.75 + 0.35, 0.15, 1.1);
        const q = light * 3 + (bayer(x, y) - 0.5) * 0.9;
        const lvl = clamp(Math.round(q), 0, 3);
        let rr, gg, bb;
        if (id) {
          let c = this.colorCache[id];
          if (id === hov) c = [250, 214, 80];
          else if (id === cur) c = [240, 120, 110];
          const f = [0.55, 0.72, 0.88, 1.0][lvl];
          rr = c[0] * f; gg = c[1] * f; bb = c[2] * f;
          // 국경선
          const left = rowIds[x - 1], up = prevRow[x];
          if ((left > 0 && left !== id) || (up > 0 && up !== id) || left === 0 || up === 0) { rr *= 0.55; gg *= 0.55; bb *= 0.6; }
        } else {
          const c = OCEAN_RGB[lvl];
          rr = c[0]; gg = c[1]; bb = c[2];
          const lonD = (lon * 180) / Math.PI, latD = (lat * 180) / Math.PI;
          if (Math.abs(((lonD % 30) + 30) % 30) < 0.5 || Math.abs(((latD % 30) + 30) % 30) < 0.4) { rr += 18; gg += 22; bb += 28; }
          if (prevRow[x] > 0 || rowIds[x - 1] > 0) { rr += 40; gg += 50; bb += 40; }
        }
        data[k] = rr; data[k + 1] = gg; data[k + 2] = bb;
      }
      prevRow.set(rowIds);
    }
    ctx.putImageData(img, 0, 0);
    // 현재 위치 핀
    if (this.g.loc) {
      const [px, py, z] = this.project(this.g.loc.lon, this.g.loc.lat);
      if (z > 0 && !this.flight) ctx.drawImage(ICON.pin, Math.round(px - 5), Math.round(py - 11 - Math.abs(Math.sin(this.t * 4)) * 2));
    }
    // 비행기
    if (this.flight) {
      const f = this.flight;
      const [px, py] = this.project(f.pos[0], f.pos[1]);
      // 경로 점선
      for (let i = 0; i <= 40; i++) {
        const ll = f.interp(i / 40);
        const [ax, ay, z] = this.project(ll[0], ll[1]);
        if (z > 0 && i % 2 === 0) { ctx.fillStyle = i / 40 < f.t ? '#ffd24a' : '#ffffff'; ctx.fillRect(Math.round(ax), Math.round(ay - 4 * Math.sin((i / 40) * Math.PI)), 1, 1); }
      }
      ctx.drawImage(ICON.plane, Math.round(px - 8), Math.round(py - 8 - 4 * Math.sin(f.t * Math.PI)));
    }
  }
  overlay(o) {
    if (this.flight) { o.text('✈  이동 중...', W / 2, 16, { size: 14, align: 'center', color: '#ffd24a' }); return; }
    for (const [c, lon, lat] of CONT_LABELS) {
      const [x, y, z] = this.project(lon, lat);
      if (z > 0.25) o.text(CONT_KO[c], x, y, { size: 11, align: 'center', color: 'rgba(255,255,255,0.85)', outline: '#0a1430' });
    }
    // 큰 나라 이름 (확대 시)
    const zoom = this.R / 104;
    for (const f of geo.list) {
      if (f.area < 0.05 / (zoom * zoom) || f.name === 'Antarctica') continue;
      const [x, y, z] = this.project(f.centroid[0], f.centroid[1]);
      if (z > 0.4) o.text(f.ko, x, y + 10, { size: 9, align: 'center', color: 'rgba(255,248,220,0.9)', outline: '#1a2a10' });
    }
    if (this.hover && !this.drag?.moved) {
      const m = this.g.mouse;
      o.tooltip(`${this.hover.ko}`, m.x, m.y, this.hover.name === this.g.loc.country ? '현재 위치 · 클릭해서 들어가기' : '클릭해서 이동');
    }
  }
  pointerDown(x, y) { this.drag = { x, y, sx: x, sy: y, moved: false }; this.auto = false; }
  pointerMove(x, y) {
    if (this.flight) return;
    if (this.drag) {
      const dx = x - this.drag.x, dy = y - this.drag.y;
      if (Math.abs(x - this.drag.sx) + Math.abs(y - this.drag.sy) > 3) this.drag.moved = true;
      const k = (57 / this.R) * 1.0;
      this.lon0 -= dx * k; this.lat0 = clamp(this.lat0 + dy * k, -70, 70);
      this.vlon = -dx * k * 0.3; this.vlat = dy * k * 0.3;
      this.drag.x = x; this.drag.y = y;
    }
    this.hover = this.countryAt(x, y);
    if (this.hover && this.hover.name === 'Antarctica') this.hover = null;
  }
  pointerUp(x, y) {
    const d = this.drag; this.drag = null;
    if (this.flight || !d || d.moved) return;
    const c = this.countryAt(x, y);
    if (c && c.name !== 'Antarctica') this.g.requestTravelCountry(c);
  }
  wheel(dy) { this.R = clamp(this.R * (dy > 0 ? 0.9 : 1.1), 80, 420); }
}
