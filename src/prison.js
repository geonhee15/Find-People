// 교도소 (도감): 포획한 대상을 저장하고 감방에 줄무늬 죄수복으로 보여준다
import { W, makeCanvas, rect, px, mulberry32, bayer } from './util.js';
import { buildSprites, prisonLook } from './people.js';
import { TARGETS, TARGET_ORDER } from './targets.js';

const KEY = 'findpeople.prison.v1';
export function loadPrison() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
export function savePrisoner(id, rec) {
  const p = loadPrison();
  const cur = p[id] || { count: 0 };
  cur.count++;
  cur.last = rec;
  if (!cur.first) cur.first = rec;
  if (!cur.best || rec.hours < cur.best.hours) cur.best = rec;
  p[id] = cur;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 저장 불가 */ }
  return cur;
}
export const prisonCount = () => Object.keys(loadPrison()).filter((k) => TARGETS[k]).length;

const PH = 230;
const CELL_W = 150, CELL_X = [9, 165, 321], CELL_TOP = 34, FLOOR = 196;

// 정적 배경: 벽돌 복도 + 감방 3칸
function paintBg() {
  const [c, x] = makeCanvas(W, PH);
  for (let y = 0; y < PH; y++) for (let X = 0; X < W; X++) {
    const row = Math.floor(y / 6), off = row % 2 ? 6 : 0;
    const mortar = y % 6 === 5 || (X + off) % 12 === 11;
    px(x, X, y, mortar ? '#3a3634' : bayer(X, y) < 0.15 ? '#5a5552' : '#524d4a');
  }
  rect(x, 0, FLOOR + 10, W, PH - FLOOR - 10, '#3a3a40');
  for (let X = 0; X < W; X += 16) rect(x, X, FLOOR + 10, 1, PH - FLOOR - 10, '#2e2e34');
  CELL_X.forEach((cx, i) => {
    rect(x, cx, CELL_TOP, CELL_W, FLOOR - CELL_TOP + 10, '#6e6862');
    for (let y = CELL_TOP; y < FLOOR + 10; y += 6) rect(x, cx, y, CELL_W, 1, '#5e5854');
    rect(x, cx, FLOOR, CELL_W, 10, '#4a4644');
    rect(x, cx + 58, CELL_TOP + 10, 34, 20, '#8ab8e0'); for (let k = 0; k < 5; k++) rect(x, cx + 60 + k * 7, CELL_TOP + 10, 2, 20, '#2a2a30');
    rect(x, cx + 100, FLOOR - 16, 44, 6, '#7a5a3a'); rect(x, cx + 100, FLOOR - 10, 3, 10, '#5a3a2a'); rect(x, cx + 141, FLOOR - 10, 3, 10, '#5a3a2a');
    rect(x, cx + 102, FLOOR - 19, 14, 3, '#e8e8e0');
    rect(x, cx + 50, 8, 50, 14, '#1c1c22'); rect(x, cx + 50, 8, 50, 1, '#c8a040'); rect(x, cx + 50, 21, 50, 1, '#c8a040');
    const n = String(i + 1).padStart(3, '0');
    digits(x, n, cx + 64, 12, '#f8d868');
  });
  return c;
}
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function digits(x, str, x0, y0, col) {
  [...str].forEach((d, k) => { const g = DIG[+d]; for (let j = 0; j < 15; j++) if (g[j] === '1') px(x, x0 + k * 5 + (j % 3), y0 + Math.floor(j / 3), col); });
}
function bars(ctx, cx) {
  for (let X = cx + 2; X < cx + CELL_W; X += 11) { rect(ctx, X, CELL_TOP, 3, FLOOR - CELL_TOP + 10, '#2a2a30'); rect(ctx, X, CELL_TOP, 1, FLOOR - CELL_TOP + 10, '#6a6a74'); }
  rect(ctx, cx, CELL_TOP, CELL_W, 4, '#2a2a30'); rect(ctx, cx, CELL_TOP + 70, CELL_W, 3, '#2a2a30'); rect(ctx, cx, CELL_TOP + 70, CELL_W, 1, '#6a6a74');
  rect(ctx, cx + CELL_W - 20, CELL_TOP + 90, 6, 10, '#8a7a3a');
}

const Z = 4;
// 몸통(4배) + 고해상도 얼굴을 한 장으로 합성
function compose(spr, frame) {
  const [c, x] = makeCanvas(9 * Z + 8, 18 * Z + 4);
  x.drawImage(spr.body[frame], 0, 4, 9 * Z, 18 * Z);
  x.drawImage(spr.hi, 2 * Z - 4, 0);
  return c;
}
function silhouette(src) {
  const [c, x] = makeCanvas(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#16161c'; x.fillRect(0, 0, c.width, c.height);
  return c;
}
export class PrisonView {
  constructor(canvas, onPick) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.x.imageSmoothingEnabled = false;
    canvas.width = W; canvas.height = PH;
    this.bg = paintBg();
    this.data = loadPrison();
    const r = mulberry32(99);
    this.cells = TARGET_ORDER.map((id, i) => {
      const T = TARGETS[id];
      const caught = !!this.data[id];
      const look = prisonLook(T.look());
      const spr = buildSprites(look);
      const comp = [compose(spr, 0), compose(spr, 1)];
      return { id, T, caught, comp, sil: silhouette(comp[0]), x: CELL_X[i] + 30 + r() * 60, tx: CELL_X[i] + 60, wait: 1, frame: 0, ft: 0, cx: CELL_X[i] };
    });
    this.t = 0; this.alive = true;
    canvas.onclick = (e) => {
      const rc = canvas.getBoundingClientRect();
      const lx = ((e.clientX - rc.left) / rc.width) * W;
      const cell = this.cells.find((c) => lx >= c.cx && lx < c.cx + CELL_W);
      if (cell) onPick(cell);
    };
    let last = performance.now();
    const loop = (now) => { if (!this.alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; this.update(dt); this.render(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  stop() { this.alive = false; }
  update(dt) {
    this.t += dt;
    for (const c of this.cells) {
      if (!c.caught) continue;
      if (c.wait > 0) { c.wait -= dt; c.frame = 0; continue; }
      const d = c.tx - c.x;
      if (Math.abs(d) < 1) { c.wait = 1 + Math.random() * 3; c.tx = c.cx + 22 + Math.random() * 70; continue; }
      c.x += Math.sign(d) * Math.min(Math.abs(d), 14 * dt);
      c.ft += dt; if (c.ft > 0.2) { c.ft = 0; c.frame ^= 1; }
    }
  }
  render() {
    const x = this.x;
    x.drawImage(this.bg, 0, 0);
    for (const c of this.cells) {
      const by = FLOOR + 4 - 76;
      if (c.caught) {
        const bx = Math.round(c.x) - 18;
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(bx + 4, FLOOR + 2, 28, 4);
        x.drawImage(c.comp[c.frame], bx, by);
      } else x.drawImage(c.sil, c.cx + 57, by);
      bars(x, c.cx);
    }
  }
}
