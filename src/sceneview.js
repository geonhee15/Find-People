// 장소 안: 군중 시뮬레이션 + 망원경 + 인물 클릭
import { W, H, makeCanvas, mulberry32, hashStr, pick, chance, clamp, ellipse } from './util.js';
import { buildScene, car } from './scenes.js';
import { genLook, genInfo, doubleLook, buildSprites, groupFor, headHi } from './people.js';
import { geo } from './geo.js';

const COUNT = { square: 58, city: 62, beach: 44, mountain: 30, ski: 32, factory: 36, station: 42, launch: 30, jsa: 26, landmark: 56, village: 24, golf: 28, resort: 34, ruins: 30, harbor: 30 };
const TOURIST_GROUPS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'];
const LENS_R = 56, ZOOM = 4;

export class SceneView {
  constructor(game) {
    this.g = game; this.t = 0; this.hover = null;
    [this.world, this.wctx] = makeCanvas(W, H);
    [this.lens, this.lctx] = makeCanvas(LENS_R * 2, LENS_R * 2);
    [this.mask] = makeCanvas(LENS_R * 2, LENS_R * 2);
    const mx = this.mask.getContext('2d'); mx.fillStyle = '#fff';
    for (let y = 0; y < LENS_R * 2; y++) for (let x = 0; x < LENS_R * 2; x++) if ((x - LENS_R + 0.5) ** 2 + (y - LENS_R + 0.5) ** 2 <= LENS_R * LENS_R) mx.fillRect(x, y, 1, 1);
  }
  enter(poi) {
    this.poi = poi; this.scene = buildScene(poi); this.t = 0;
    const g = this.g, sc = g.scenario, T = g.target, era = T.era;
    this.drone = 0; this.capture = null;
    const country = geo.byName.get(poi.country);
    const group = groupFor(poi.country, country?.cont);
    const nk = poi.country === 'North Korea';
    const r = mulberry32(hashStr(poi.id) ^ sc.seed);
    const kind = poi.scene?.kind || 'city';
    const [x0, y0, x1, y1] = this.scene.walk;
    const rp = () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)];
    const people = [];
    const nationality = country?.ko || poi.country;
    const add = (role, opts = {}) => {
      const tg = role === 'tourist' ? (nk ? pick(r, ['zh', 'ru', 'en']) : pick(r, TOURIST_GROUPS.filter((q) => q !== group))) : group;
      const look = opts.look || genLook(r, { group: tg, role, nk: nk && role !== 'tourist', era, style: opts.style });
      const natKo = role === 'tourist' ? { en: '미국', zh: '중국', ja: '일본', ko: '대한민국', fr: '프랑스', de: '독일', es: '스페인', ru: '러시아' }[tg] : nk ? '조선민주주의인민공화국' : nationality;
      const info = opts.info || genInfo(r, look, { group: tg, role, nk: nk && role !== 'tourist', nationalityKo: natKo, era });
      if (opts.job) info.job = opts.job;
      const [px, py] = opts.pos || rp();
      const p = {
        id: `${poi.id}#${people.length}`, look, info, role, spr: buildSprites(look),
        x: px, y: py, tx: px, ty: py, speed: 8 + r() * 10, wait: r() * 4, frame: 0, ft: 0,
        idle: chance(r, 0.3), leader: opts.leader || null, ox: opts.ox || 0, oy: opts.oy || 0,
        isTarget: !!opts.isTarget, isDouble: !!opts.isDouble,
      };
      people.push(p);
      return p;
    };
    const night = this.nightAlpha() > 0.3;
    const n = Math.round((COUNT[kind] || 40) * (night ? 0.6 : 1));
    const roleMix = () => {
      const v = r();
      if (kind === 'factory') return v < 0.6 ? 'worker' : 'civ';
      if (kind === 'ski') return v < 0.65 ? 'skier' : 'civ';
      if (kind === 'launch') return v < 0.35 ? 'soldier' : v < 0.45 ? 'official' : v < 0.6 ? 'worker' : 'civ';
      if (kind === 'jsa') return v < 0.45 ? 'soldier' : v < 0.85 ? 'tourist' : 'civ';
      if (nk) return v < 0.18 ? 'soldier' : v < 0.24 ? 'tourist' : 'civ';
      if (era === 1945) return poi.country === 'Germany' ? (v < 0.25 ? 'soldier' : 'civ') : 'civ';
      if (kind === 'golf') return v < 0.15 ? 'worker' : 'civ';
      return v < (kind === 'landmark' || kind === 'beach' ? 0.3 : 0.12) ? 'tourist' : 'civ';
    };
    for (let i = 0; i < n; i++) add(roleMix());
    // 대상 + 수행단
    const entourage = (leader, nOff, nGuard) => {
      const E = T.entourage;
      for (let i = 0; i < nOff; i++) add('official', { leader, style: E.offStyle, job: E.offJob, ox: (i % 2 ? 1 : -1) * (11 + Math.floor(i / 2) * 9 + r() * 3), oy: 9 + (i % 3) * 4, pos: [leader.x, leader.y + 10] });
      for (let i = 0; i < nGuard; i++) add('guard', { leader, job: E.guardJob, ox: (i % 2 ? 1 : -1) * (16 + Math.floor(i / 2) * 8 + r() * 4), oy: -6 + (i >> 1) * 6, pos: [leader.x + 10, leader.y] });
    };
    this.cars = [];
    if (poi.id === sc.spot.poi) {
      const [px, py] = [x0 + 60 + r() * (x1 - x0 - 120), y0 + 20 + r() * (y1 - y0 - 30)];
      const t = add('target', { look: T.look(), info: { ...T.info }, isTarget: true, pos: [px, py] });
      t.speed = 4; t.idle = false; t.checked = false;
      entourage(t, T.entourage.off, T.entourage.guard);
      this.cars.push([clamp(px - 60, x0, x1 - 30), clamp(py - 16, y0, y1)], [clamp(px - 30, x0, x1 - 30), clamp(py - 20, y0, y1)]);
    }
    if (sc.doublePois.has(poi.id)) {
      const [px, py] = [x0 + 60 + r() * (x1 - x0 - 120), y0 + 20 + r() * (y1 - y0 - 30)];
      const dl = doubleLook(r, T.look());
      dl.age = Math.max(25, dl.age - 3 - Math.floor(r() * 12));
      const dnk = T.doubleGroup === 'nk';
      const d = add('double', { look: dl, isDouble: true, pos: [px, py], info: { ...genInfo(r, dl, { group: T.doubleGroup, role: 'civ', nk: dnk, nationalityKo: dnk ? '조선민주주의인민공화국' : T.info.nationality.split(' ')[0], era }), job: pick(r, T.doubleJobs) } });
      d.speed = 4; d.idle = false; d.info.note = '대상과 외형 유사 · 대역 가능성';
      entourage(d, 2, 2);
      this.cars.push([clamp(px - 50, x0, x1 - 30), clamp(py - 14, y0, y1)]);
    }
    if (sc.officialPois.has(poi.id)) {
      const lead = add('official', { pos: rp() }); lead.speed = 5;
      for (let i = 0; i < 3; i++) add('official', { leader: lead, ox: -10 + i * 8, oy: 5, pos: [lead.x, lead.y] });
    }
    for (const p of people) { p.checked = g.checked.has(p.id); p.talked = g.talked.has(p.id); }
    this.people = people;
    this.selected = null;
  }
  // 드론: N초 동안 경호 인력 위치 표시
  launchDrone(sec = 30) { this.drone = sec; }
  // 포획 연출: 철창이 떨어지고 경찰 조명
  startCapture(p, done) {
    this.capture = { p, t: 0, done, fired: false };
    p.leader = null; p.wait = 999; p.tx = p.x; p.ty = p.y;
    for (const q of this.people) if (q.leader === p) { q.leader = null; q.tx = q.x + (q.x < p.x ? -120 : 120); q.ty = q.y + (Math.random() - 0.5) * 30; q.speed = 40; q.wait = 0; q.idle = false; }
  }
  update(dt) {
    this.t += dt;
    if (this.drone > 0) this.drone -= dt;
    if (this.capture) {
      const c = this.capture; c.t += dt;
      if (!c.fired && c.t > 2.6) { c.fired = true; c.done(); }
    }
    const [x0, y0, x1, y1] = this.scene.walk;
    for (const p of this.people) {
      let moving = false;
      if (p.leader) {
        const tx = p.leader.x + p.ox, ty = p.leader.y + p.oy;
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        if (d > 2) { const s = Math.min(d, (p.leader.speed + 6) * dt); p.x += (dx / d) * s; p.y += (dy / d) * s; moving = true; }
      } else if (p.wait > 0) p.wait -= dt;
      else {
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
        if (d < 1) {
          p.wait = p.idle ? 6 + Math.random() * 10 : 1 + Math.random() * 4;
          const range = p.isTarget || p.isDouble ? 50 : 140;
          p.tx = clamp(p.x + (Math.random() - 0.5) * range * 2, x0, x1);
          p.ty = clamp(p.y + (Math.random() - 0.5) * range * 0.6, y0, y1);
        } else { const s = Math.min(d, p.speed * dt); p.x += (dx / d) * s; p.y += (dy / d) * s; moving = true; }
      }
      p.x = clamp(p.x, x0 - 4, x1 + 4); p.y = clamp(p.y, y0 - 6, y1 + 4);
      if (moving) { p.ft += dt; if (p.ft > 0.18) { p.ft = 0; p.frame ^= 1; } } else p.frame = 0;
    }
  }
  drawWorld() {
    const w = this.wctx;
    w.drawImage(this.scene.bg, 0, 0);
    if (this.scene.anim) this.scene.anim(w, this.t);
    for (const [cx, cy] of this.cars) car(w, cx, cy, '#141418', true);
  }
  drawPerson(ctx, p, ox = 0, oy = 0, z = 1, hi = false) {
    const bx = (Math.round(p.x) - 4 - ox) * z, by = (Math.round(p.y) - 17 - oy) * z;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(bx + 1 * z, by + 17 * z, 7 * z, 1 * z);
    ctx.fillRect(bx + 2 * z, by + 18 * z, 5 * z, 1 * z);
    ctx.drawImage(p.spr.body[p.frame], bx, by, 9 * z, 18 * z);
    if (hi) ctx.drawImage(p.spr.hi, bx + 2 * z - 4, by - 4);
    else ctx.drawImage(p.spr.head, bx, by, 9 * z, 18 * z);
  }
  render(ctx) {
    this.drawWorld();
    ctx.drawImage(this.world, 0, 0);
    const sorted = this.people.slice().sort((a, b) => a.y - b.y);
    for (const p of sorted) this.drawPerson(ctx, p);
    for (const p of sorted) {
      if (p.checked) { ctx.fillStyle = p.isTarget ? '#ffd24a' : '#5ad07a'; ctx.fillRect(Math.round(p.x), Math.round(p.y) - 21, 1, 2); ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 20, 1, 1); }
    }
    const na = this.nightAlpha();
    if (na > 0) { ctx.fillStyle = `rgba(14,20,64,${na})`; ctx.fillRect(0, 0, W, H); }
    const sel = this.selected;
    if (sel) this.bracket(ctx, sel, '#ffd24a');
    if (this.hover && this.hover !== sel) this.bracket(ctx, this.hover, '#ffffff');
    if (this.drone > 0) this.renderDrone(ctx);
    if (this.capture) this.renderCapture(ctx);
    if (this.g.tool === 'scope') this.renderLens(ctx, sorted);
  }
  renderDrone(ctx) {
    const t = this.t, blink = Math.floor(t * 4) % 2;
    for (const p of this.people) {
      if (p.role !== 'guard') continue;
      const cx = Math.round(p.x), cy = Math.round(p.y) - 9;
      ctx.fillStyle = blink ? '#ff3a3a' : '#ff9a3a';
      for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(an) * 8), Math.round(cy + Math.sin(an) * 11), 1, 1); }
    }
    // 드론 본체가 화면을 가로지름
    const dx = ((t * 40) % (W + 40)) - 20, dy = 24 + Math.sin(t * 2) * 4;
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(dx - 4, dy, 9, 3); ctx.fillRect(dx - 7, dy - 2, 4, 1); ctx.fillRect(dx + 4, dy - 2, 4, 1);
    ctx.fillStyle = blink ? '#ff3a3a' : '#3aff6a'; ctx.fillRect(dx, dy + 1, 1, 1);
    ctx.fillStyle = 'rgba(255,60,60,0.12)'; ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, H - 2, W, 2); ctx.fillRect(0, 0, 2, H); ctx.fillRect(W - 2, 0, 2, H);
  }
  renderCapture(ctx) {
    const c = this.capture, p = c.p;
    const f = Math.min(1, c.t / 0.7);
    const bounce = f < 1 ? f * f : 1 - Math.abs(Math.sin((c.t - 0.7) * 12)) * Math.max(0, 0.3 - (c.t - 0.7)) * 0.3;
    const top = Math.round(-40 + (p.y - 26 + 40) * bounce);
    const x0 = Math.round(p.x) - 9;
    if (Math.floor(c.t * 6) % 2) { ctx.fillStyle = 'rgba(255,40,40,0.18)'; ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = 'rgba(40,80,255,0.18)'; ctx.fillRect(W / 2, 0, W / 2, H); }
    else { ctx.fillStyle = 'rgba(40,80,255,0.18)'; ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = 'rgba(255,40,40,0.18)'; ctx.fillRect(W / 2, 0, W / 2, H); }
    ctx.fillStyle = '#c8c8d0';
    ctx.fillRect(x0, top, 19, 2); ctx.fillRect(x0, top + 26, 19, 2);
    for (let i = 0; i <= 18; i += 3) { ctx.fillStyle = i % 6 ? '#8a8a94' : '#d8d8e0'; ctx.fillRect(x0 + i, top, 1, 28); }
    ctx.fillStyle = '#6a6a74'; ctx.fillRect(x0 + 8, top - 6, 3, 6);
  }
  // 게임 시각에 따른 밤 어둡기 (게임은 오전 9시에 시작)
  nightAlpha() {
    const h = (9 + this.g.time) % 24;
    if (h >= 20 || h < 5) return 0.45;
    if (h >= 18) return ((h - 18) / 2) * 0.45;
    if (h < 7) return ((7 - h) / 2) * 0.45;
    return 0;
  }
  bracket(ctx, p, col) {
    const x = Math.round(p.x) - 6, y = Math.round(p.y) - 20;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 3, 1); ctx.fillRect(x, y, 1, 3); ctx.fillRect(x + 10, y, 3, 1); ctx.fillRect(x + 12, y, 1, 3);
    ctx.fillRect(x, y + 22, 3, 1); ctx.fillRect(x, y + 20, 1, 3); ctx.fillRect(x + 10, y + 22, 3, 1); ctx.fillRect(x + 12, y + 20, 1, 3);
  }
  renderLens(ctx, sorted) {
    const m = this.g.mouse;
    const mx = Math.round(m.x), my = Math.round(m.y);
    const half = LENS_R / ZOOM;
    const l = this.lctx;
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, LENS_R * 2, LENS_R * 2);
    l.imageSmoothingEnabled = false;
    l.drawImage(this.world, mx - half, my - half, half * 2, half * 2, 0, 0, LENS_R * 2, LENS_R * 2);
    const ox = mx - half, oy = my - half;
    for (const p of sorted) {
      if (Math.abs(p.x - mx) > half + 6 || p.y - 18 > my + half || p.y < my - half) continue;
      this.drawPerson(l, p, ox, oy, ZOOM, true);
    }
    const na = this.nightAlpha();
    if (na > 0) { l.fillStyle = `rgba(14,20,64,${na * 0.5})`; l.fillRect(0, 0, LENS_R * 2, LENS_R * 2); }
    l.globalCompositeOperation = 'destination-in';
    l.drawImage(this.mask, 0, 0);
    l.globalCompositeOperation = 'source-over';
    // 터치: 손가락에 가리지 않게 렌즈를 위쪽에 띄우는 돋보기 방식
    const lx = mx, ly = this.g.touch ? Math.max(LENS_R - 14, my - 62) : my;
    this.lensPos = [lx, ly];
    ctx.drawImage(this.lens, lx - LENS_R, ly - LENS_R);
    if (ly !== my) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(mx - 3, my, 7, 1); ctx.fillRect(mx, my - 3, 1, 7); }
    // 렌즈 테두리
    for (let a = 0; a < 360; a += 0.8) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < 3; k++) {
        const rr = LENS_R + k;
        ctx.fillStyle = k === 0 ? '#e8e0c8' : k === 1 ? '#6a5a3a' : '#20180c';
        ctx.fillRect(Math.round(lx + Math.cos(rad) * rr), Math.round(ly + Math.sin(rad) * rr), 1, 1);
      }
    }
    ctx.fillStyle = 'rgba(255,60,60,0.8)';
    for (const [dx, dy] of [[-LENS_R + 2, 0], [LENS_R - 8, 0]]) ctx.fillRect(lx + dx, ly, 6, 1);
    for (const dy of [-LENS_R + 2, LENS_R - 8]) ctx.fillRect(lx, ly + dy, 1, 6);
  }
  overlay(o) {
    o.text(this.poi.name, 10, 16, { size: 14, color: '#fff6d8', outline: '#0a1020' });
    o.text(`인물 ${this.people.length}명 · 조회 ${this.people.filter((p) => p.checked).length}명`, 10, 30, { size: 9, color: '#d8e0f0', outline: '#0a1020' });
    if (this.capture && this.capture.t > 0.7) o.text(this.g.target.era === 1945 ? '🚨 체포 성공!' : '🚨 포획 성공!', W / 2, 60, { size: 26, align: 'center', color: '#ffd24a', outline: '#3a0a0a' });
    else if (this.drone > 0) o.text(`🛰 ${this.g.target.tools.drone} 감시 중 · 붉은 표시 = 경호 인력 (${Math.ceil(this.drone)}초)`, W / 2, H - 6, { size: 9, align: 'center', color: '#ffb0a0', outline: '#000' });
    else if (this.g.tool !== 'scope') o.text(this.g.touch ? '🔭 망원경을 켜고 드래그해서 얼굴을 확대 · 인물 탭 = 신원 조회(15분)' : '🔭 망원경(T)으로 얼굴을 확대해 보세요 · 인물 클릭 = 신원 조회(15분)', W / 2, H - 6, { size: 9, align: 'center', color: '#fff', outline: '#000' });
    const h = this.hover, m = this.g.mouse;
    if (h) {
      if (h.checked) o.tooltip(h.info.name, m.x, m.y, `${h.info.job} · 클릭해서 카드 보기`);
      else o.tooltip('미확인 인물', m.x, m.y, '클릭: 신원 조회 (15분)');
    }
    if (this.g.tool === 'scope') {
      const half = LENS_R / ZOOM;
      for (const p of this.people) if (p.checked && Math.abs(p.x - m.x) < half && Math.abs(p.y - 12 - m.y) < half + 4) {
        const [lx, ly] = this.lensPos || [m.x, m.y];
        const sx = lx + (p.x - m.x) * ZOOM, sy = ly + (p.y - 18 - m.y) * ZOOM - 8;
        o.text(p.info.name, sx, sy, { size: 9, align: 'center', color: p.isTarget ? '#ffd24a' : '#9af0b0', outline: '#000' });
      }
    }
  }
  personAt(x, y) {
    // 얼굴(머리) 클릭을 몸통보다 우선: 뒤에 선 사람 얼굴도 고를 수 있게
    let head = null, body = null;
    for (const p of this.people) {
      if (x < p.x - 4.5 || x > p.x + 4.5) continue;
      if (y >= p.y - 18 && y <= p.y - 11 && Math.abs(x - p.x) <= 3.5) { if (!head || p.y > head.y) head = p; }
      else if (y >= p.y - 18 && y <= p.y + 1) { if (!body || p.y > body.y) body = p; }
    }
    return head || body;
  }
  pointerMove(x, y) { this.hover = this.personAt(x, y); }
  pointerDown() {}
  pointerUp(x, y) {
    if (this.capture) return;
    const p = this.personAt(x, y);
    if (p) { this.selected = p; this.g.selectPerson(p); }
  }
}
export { headHi };
