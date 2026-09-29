// Find People — 메인: 상태, 루프, 입력, 이동/시간/단서, 포획/교도소
import { W, H, mulberry32, clamp, haversineKm, fmtHours } from './util.js';
import { initArt } from './art.js';
import { loadGeo, geo } from './geo.js';
import { GlobeView } from './globe.js';
import { CountryView, generatePois } from './countryview.js';
import { SceneView } from './sceneview.js';
import { newScenario, POI_INDEX, callContact, snsSearch, hackResult, askPerson, wiretap, droneLevels } from './story.js';
import { TARGETS, TARGET_ORDER } from './targets.js';
import { savePrisoner, loadPrison, prisonCount } from './prison.js';
import { audio, masterOut, isMuted } from './voice.js';
import * as ui from './ui.js';

const $ = (s) => document.querySelector(s);

// 오버레이 캔버스: 픽셀 폰트 텍스트를 화면 해상도로 선명하게
class Overlay {
  constructor(canvas) { this.c = canvas; this.x = canvas.getContext('2d'); this.S = 2; }
  begin(S, dpr) {
    this.S = S; this.dpr = dpr;
    this.x.setTransform(1, 0, 0, 1, 0, 0);
    this.x.clearRect(0, 0, this.c.width, this.c.height);
    this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  text(str, x, y, o = {}) {
    const k = Math.max(1, this.S / 2);
    const size = Math.round((o.size || 11) * k);
    const ctx = this.x;
    ctx.font = `${o.bold ? 'bold ' : ''}${size}px Galmuri11, monospace`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'middle';
    const X = x * this.S, Y = y * this.S;
    if (o.outline !== null) {
      ctx.lineWidth = Math.max(2, Math.round(3 * k));
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.outline || '#000';
      ctx.strokeText(str, X, Y);
    }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, X, Y);
  }
  tooltip(title, x, y, sub) {
    if (this.noTips) return;
    const ctx = this.x, k = Math.max(1, this.S / 2);
    const f1 = Math.round(12 * k), f2 = Math.round(9 * k);
    ctx.font = `${f1}px Galmuri11, monospace`;
    const w1 = ctx.measureText(title).width;
    ctx.font = `${f2}px Galmuri11, monospace`;
    const w2 = sub ? ctx.measureText(sub).width : 0;
    const pw = Math.max(w1, w2) + 14 * k, ph = (sub ? f1 + f2 + 14 : f1 + 10) * 1;
    let X = x * this.S + 14, Y = y * this.S + 14;
    const cw = this.c.width / this.dpr, ch = this.c.height / this.dpr;
    if (X + pw > cw - 4) X = x * this.S - pw - 10;
    if (Y + ph > ch - 4) Y = y * this.S - ph - 10;
    ctx.fillStyle = 'rgba(12,16,32,0.92)'; ctx.fillRect(X, Y, pw, ph);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(X, Y, pw, 2 * k);
    ctx.strokeStyle = '#4a5a8a'; ctx.lineWidth = 1; ctx.strokeRect(X + 0.5, Y + 0.5, pw - 1, ph - 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = `${f1}px Galmuri11, monospace`; ctx.fillStyle = '#fff'; ctx.fillText(title, X + 7 * k, Y + 5 * k);
    if (sub) { ctx.font = `${f2}px Galmuri11, monospace`; ctx.fillStyle = '#b8c4e0'; ctx.fillText(sub, X + 7 * k, Y + 7 * k + f1); }
  }
}

class Game {
  constructor() {
    this.canvas = $('#game'); this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.ov = new Overlay($('#overlay'));
    this.mouse = { x: -100, y: -100, inside: false };
    this.fade = null;
    this.poiCache = {};
    this.started = false;
    this.panel = 'info';
    this.tool = null;
    this.target = TARGETS.kju;
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.pointers = new Map();
  }
  async boot() {
    initArt();
    $('#loading').textContent = '세계 지도 불러오는 중...';
    await loadGeo();
    try { await document.fonts.load('12px Galmuri11'); } catch (e) { /* 폰트 없으면 기본 글꼴 */ }
    this.views = { globe: new GlobeView(this), country: new CountryView(this), scene: new SceneView(this) };
    this.loc = { country: 'South Korea', poi: null, lon: 126.98, lat: 37.56 };
    this.viewName = 'globe'; this.view = this.views.globe;
    ui.initUI(this);
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    this.resize();
    $('#loading').remove();
    this.showTitle();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  // 화면 비율에 따라 레이아웃 전환: 가로(사이드 패널) / 세로(패널이 아래로)
  resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    document.body.classList.toggle('stacked', vw / vh < 1.2 || vw < 720);
    document.body.classList.toggle('compact', vh < 620 || vw < 1180);
    document.body.classList.toggle('touch', this.touch);
    const st = $('#stage');
    const aw = st.clientWidth, ah = st.clientHeight;
    let S = Math.min(aw / W, ah / H);
    if (S >= 2) S = Math.floor(S * 4) / 4;
    const cw = Math.floor(W * S), ch = Math.floor(H * S);
    for (const c of [this.canvas, $('#overlay')]) { c.style.width = cw + 'px'; c.style.height = ch + 'px'; }
    this.dpr = window.devicePixelRatio || 1;
    $('#overlay').width = Math.round(cw * this.dpr); $('#overlay').height = Math.round(ch * this.dpr);
    this.S = cw / W;
  }
  frame(dt) {
    this.view.update(dt);
    this.view.render(this.ctx);
    this.ov.begin(this.S, this.dpr);
    this.ov.noTips = this.touch && this.pointers.size === 0;
    if (this.started && !this.fade) this.view.overlay(this.ov);
    if (this.fade) {
      const f = this.fade;
      f.t += dt;
      const half = f.dur / 2;
      if (!f.fired && f.t >= half) { f.fired = true; f.mid(); }
      const a = f.t < half ? f.t / half : Math.max(0, 1 - (f.t - half) / half);
      this.ctx.fillStyle = `rgba(4,6,14,${a})`; this.ctx.fillRect(0, 0, W, H);
      if (f.label && a > 0.6) this.ov.text(f.label, W / 2, H / 2, { size: 16, align: 'center', color: '#ffd24a' });
      if (f.t >= f.dur) this.fade = null;
    }
    if (this.hackState?.active) this.tickHack(dt);
    if (this.started && !this.ended) {
      this.hudT = (this.hudT || 0) + dt;
      if (this.hudT > 0.25) { this.hudT = 0; ui.renderHud(this); }
    }
  }
  transition(mid, label, dur = 0.7) { this.fade = { t: 0, dur, mid, fired: false, label }; }
  setView(name, arg) {
    this.viewName = name; this.view = this.views[name];
    if (name !== 'scene') this.tool = null;
    this.view.enter(arg);
    if (this.panel === 'info' || this.panel === 'card') { this.panel = 'info'; this.selected = null; }
    if (this.started) { ui.renderHud(this); ui.renderPanel(this); }
  }

  // ─── 입력 (마우스 + 터치 + 핀치) ───
  bindInput() {
    const oc = $('#overlay');
    const pos = (e) => { const r = oc.getBoundingClientRect(); return [(e.clientX - r.left) / this.S, (e.clientY - r.top) / this.S]; };
    oc.addEventListener('pointerdown', (e) => {
      audio();
      const [x, y] = pos(e);
      this.pointers.set(e.pointerId, { x, y, sx: x, sy: y });
      if (!this.canAct()) return;
      try { oc.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      this.mouse.x = x; this.mouse.y = y;
      if (this.pointers.size === 2) { this.pinch = this.pinchDist(); this.view.drag = null; return; }
      if (this.pointers.size > 2) return;
      this.view.pointerMove(x, y);
      this.view.pointerDown(x, y);
    });
    oc.addEventListener('pointermove', (e) => {
      const [x, y] = pos(e);
      const p = this.pointers.get(e.pointerId);
      if (p) { p.x = x; p.y = y; }
      if (this.pointers.size === 2 && this.pinch) {
        const d = this.pinchDist();
        if (this.view.zoomBy) this.view.zoomBy(d / this.pinch);
        this.pinch = d;
        return;
      }
      if (this.touch && !p) return;
      this.mouse.x = x; this.mouse.y = y; this.mouse.inside = true;
      if (this.started && !this.fade) this.view.pointerMove(x, y);
    });
    const up = (e) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (this.pinch) { if (this.pointers.size === 0) this.pinch = null; return; }
      if (!this.canAct() || !p) return;
      const [x, y] = pos(e);
      const moved = Math.hypot(x - p.sx, y - p.sy);
      // 장소 안에서는 드래그(망원경 이동)와 탭(조회)을 구분
      if (this.viewName === 'scene' && moved > 6) return;
      this.view.pointerUp(x, y);
    };
    oc.addEventListener('pointerup', up);
    oc.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); if (!this.pointers.size) this.pinch = null; if (this.view) this.view.drag = null; });
    oc.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    oc.addEventListener('wheel', (e) => { e.preventDefault(); if (this.view.wheel) this.view.wheel(e.deltaY); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!this.started || this.ended || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'escape') { if (this.tool) { this.tool = null; ui.renderHud(this); } else this.back(); }
      const map = { t: 'scope', p: 'phone', s: 'sns', h: 'hack', r: 'drone', w: 'tap', n: 'notes', d: 'dossier' };
      if (map[k]) this.useTool(map[k]);
      if (k === 'g') this.goGlobe();
    });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }
  pinchDist() { const [a, b] = [...this.pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  canAct() { return this.started && !this.ended && !this.fade && !this.views.globe.flight && !this.capturing && $('#modal').classList.contains('hidden'); }

  // ─── 화면 ───
  showTitle() {
    this.started = false;
    document.body.classList.remove('playing', 'era1945');
    this.canvas.classList.remove('sepia');
    this.views.globe.enter(); this.views.globe.auto = true;
    const n = prisonCount();
    ui.showScreen(`<div class="title-wrap"><div class="logo">FIND<span>PEOPLE</span></div>
      <div class="subtitle">픽셀 추적 시뮬레이션 — 전 세계 군중 속에서 단 한 사람을 찾아라</div>
      <button class="btn big primary" data-act="start">▶ 게임 시작</button>
      <button class="btn big" data-act="prison">🏛 교도소 도감 <span class="muted">${n}/${TARGET_ORDER.length}</span></button>
      <div class="muted small">${this.touch ? '드래그: 회전 · 핀치: 확대 · 탭: 이동/조회' : '드래그: 지구본 회전 · 휠: 확대 · 클릭: 이동/조회'}</div></div>`, (a) => {
      this.sfx('click');
      if (a === 'start') this.showSelect();
      if (a === 'prison') ui.showPrison(this, null, () => this.showTitle());
    });
  }
  showSelect() {
    const jail = loadPrison();
    const cards = TARGET_ORDER.map((id) => {
      const T = TARGETS[id];
      return `<button class="tcard" data-act="pick" data-id="${id}">${jail[id] ? '<div class="caught">🔒 수감됨</div>' : ''}
        <img src="${ui.bustURL(T.look(), 4, T.era === 1945 ? '#3a2e1a' : '#3a1a1a')}">
        <div class="tname">${ui.esc(T.name)}</div><div class="muted">${ui.esc(T.title)}</div>
        <div class="diff">난이도 ${'★'.repeat(T.diff)}${'☆'.repeat(5 - T.diff)}</div><div class="muted small">${ui.esc(T.tagline)}</div></button>`;
    }).join('');
    ui.showScreen(`<div class="select-wrap"><h1>추적 대상 선택</h1><div class="targets">${cards}</div><button class="btn" data-act="back">← 뒤로</button></div>`, (a, b) => {
      this.sfx('click');
      if (a === 'pick') this.showBrief(b.dataset.id);
      if (a === 'back') this.showTitle();
    });
  }
  showBrief(id) {
    const T = TARGETS[id];
    ui.showScreen(`<div class="brief-wrap"><div class="brief ${T.era === 1945 ? 'old' : ''}"><img src="${ui.bustURL(T.look(), 5, T.era === 1945 ? '#3a2e1a' : '#3a1a1a')}"><div>
      <h1>작전명: ${ui.esc(T.name)} 추적</h1>${T.brief}
      <ul class="points">
        <li>🌍 지구본에서 나라를 골라 이동하고, 나라 안의 장소로 들어가라</li>
        <li>📞 전화 · ${T.era === 1945 ? '📰' : '📱'} ${T.tools.sns} · 💻 ${T.tools.hack} · ${T.era === 1945 ? '✈️' : '🛸'} ${T.tools.drone} · 🎧 ${T.tools.tap} · 🗣 탐문으로 단서를 모아라</li>
        <li>🔭 망원경으로 얼굴을 확대하고, 의심 인물을 눌러 신원을 조회하라</li>
        <li>🚨 신원이 일치하면 <b>포획</b>해서 교도소로 보내라</li>
        <li>⚠️ 적대 지역에서 수상한 행동을 하면 <b>경계도</b>가 오른다. 100%면 체포당한다</li>
      </ul>
      <div class="row"><button class="btn" data-act="back">← 다른 대상</button><button class="btn big primary" data-act="go">작전 개시</button></div></div></div></div>`, (a) => {
      if (a === 'go') { this.sfx('start'); this.newGame(id); }
      if (a === 'back') { this.sfx('click'); this.showSelect(); }
    });
  }
  newGame(id) {
    this.target = TARGETS[id];
    const T = this.target;
    const seed = (Math.random() * 2 ** 31) | 0;
    this.scenario = newScenario(T, seed);
    this.rng = mulberry32(seed + 77);
    Object.assign(this, { time: 0, alert: 0, limit: T.limitH, clues: [], calls: {}, snsCache: {}, snsLast: '', hacked: {}, tapped: {}, droneScans: {}, checked: new Set(), talked: new Set(), lastCall: null, lastHack: null, lastTap: null, hackState: null, selected: null, ended: false, capturing: false, tool: null, poiCache: {} });
    this.stats = { checks: 0, calls: 0, searches: 0, hacks: 0, talks: 0, drones: 0, taps: 0, flights: 0, moves: 0 };
    this.loc = { country: T.start.country, poi: null, lon: T.start.lon, lat: T.start.lat };
    this.started = true;
    ui.hideScreen();
    ui.setupForTarget(this);
    document.body.classList.add('playing');
    this.canvas.classList.toggle('sepia', T.era === 1945);
    this.resize();
    this.panel = 'info';
    this.setView('globe');
    this.views.globe.auto = false;
    this.views.globe.focusOn(this.loc.lon, this.loc.lat);
    this.addClue({ src: '📁 작전 브리핑', text: T.briefClue, stars: 3 });
    ui.toast(`🌍 ${T.start.label}에서 출발합니다. 정보부터 모으는 게 좋아요.`);
  }

  // ─── 이동 ───
  poiById(id) { return POI_INDEX[id]; }
  poisFor(country, view) { return (this.poiCache[country.name] ||= generatePois(country, view, this.target.era)); }
  flightHours(c) {
    const T = this.target, cur = this.loc.country;
    const to = c.capital ? [c.capital.lon, c.capital.lat] : c.centroid;
    const km = haversineKm(this.loc.lon, this.loc.lat, to[0], to[1]);
    let h = km / T.travel.kmh + T.travel.base;
    const ex = T.travel.extra[c.name] || T.travel.extra[cur];
    if (ex) h += ex[0];
    return { h, km, to, note: T.travel.extra[c.name]?.[1] };
  }
  poiTravelHours(p) {
    const km = haversineKm(this.loc.lon, this.loc.lat, p.lon, p.lat);
    if (km > 600) return km / (this.target.era === 1945 ? 300 : 750) + 2;
    return Math.max(0.5, km / (p.country === this.target.hostile ? this.target.travel.road * 0.8 : this.target.travel.road) + 0.3);
  }
  requestTravelCountry(c) {
    if (!c || !this.canAct()) return;
    if (c.name === this.loc.country) { this.transition(() => this.setView('country', c)); return; }
    const { h, km, to, note } = this.flightHours(c);
    const warn = note ? `<p class="warn">⚠️ ${note} (추가 시간)</p>` : '';
    ui.confirmModal(`✈️ ${c.ko}(으)로 이동`, `<p>${geo.byName.get(this.loc.country)?.ko} → ${c.ko} · 약 ${Math.round(km).toLocaleString()}km</p><p>소요 시간: <b>${fmtHours(h)}</b></p>${warn}`, '출발', () => {
      this.sfx('plane');
      const from = [this.loc.lon, this.loc.lat];
      if (this.viewName !== 'globe') this.setView('globe');
      this.views.globe.flyTo(from, to, 2.2, () => {
        this.advance(h, `${c.ko} 도착`);
        this.stats.flights++;
        this.loc = { country: c.name, poi: null, lon: to[0], lat: to[1] };
        this.transition(() => this.setView('country', c), c.ko);
      });
    });
  }
  requestTravelPoi(p) {
    if (!p || !this.canAct()) return;
    if (p.id === this.loc.poi) { this.transition(() => this.setView('scene', p), p.name); return; }
    const h = this.poiTravelHours(p);
    ui.confirmModal(`🚗 ${p.name}`, `<p>이동 시간: <b>${fmtHours(h)}</b></p>`, '이동', () => {
      this.sfx('click');
      this.transition(() => {
        this.advance(h, p.name + ' 도착');
        this.stats.moves++;
        this.loc = { country: p.country, poi: p.id, lon: p.lon, lat: p.lat };
        this.setView('scene', p);
      }, p.name, 1.0);
    });
  }
  back() {
    if (!this.canAct()) return;
    if (this.viewName === 'scene') { const c = geo.byName.get(this.loc.country); this.transition(() => this.setView('country', c)); }
    else if (this.viewName === 'country') this.goGlobe();
  }
  goGlobe() { if (!this.canAct() || this.viewName === 'globe') return; this.transition(() => { this.setView('globe'); this.views.globe.focusOn(this.loc.lon, this.loc.lat); }); }

  // ─── 시간/경계도/단서 ───
  hostileHere() { return this.loc.country === this.target.hostile; }
  advance(h, why) {
    this.time += h;
    this.alert = Math.max(0, this.alert - h * 1.0);
    if (why !== false) ui.toast(`⏱ +${fmtHours(h)}${why ? ' · ' + why : ''}`, 'time');
    ui.renderHud(this);
    if (this.time >= this.limit) setTimeout(() => this.lose('time'), 600);
  }
  raiseAlert(v) {
    v = Math.round(v);
    if (!v || this.ended) return;
    this.alert = clamp(this.alert + v, 0, 100);
    ui.toast(`⚠️ 경계도 +${v}%`, 'warn');
    this.sfx('alert');
    ui.renderHud(this);
    if (this.alert >= 100) setTimeout(() => this.lose('caught'), 600);
  }
  addClue(c) {
    const now = ui.gameDate(this);
    this.clues.push({ ...c, when: `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` });
    const b = document.querySelector('#toolbar [data-tool="notes"]');
    if (b) { b.classList.remove('ping'); void b.offsetWidth; b.classList.add('ping'); }
  }

  // ─── 도구 ───
  useTool(id) {
    if (!this.started || this.ended) return;
    if (id === 'scope') {
      if (this.viewName !== 'scene') { ui.toast('🔭 망원경은 장소 안에서만 쓸 수 있어요.'); return; }
      this.tool = this.tool === 'scope' ? null : 'scope';
      if (this.tool && this.touch) { this.mouse.x = W / 2; this.mouse.y = 190; ui.toast('🔭 화면을 드래그하면 렌즈가 따라와요'); }
      this.sfx('click');
      ui.renderHud(this);
      return;
    }
    if (this.hackState?.active && id !== 'hack') return;
    this.panel = this.panel === id ? (this.viewName === 'scene' && this.selected ? 'card' : 'info') : id;
    ui.renderPanel(this); ui.renderHud(this);
    if (document.body.classList.contains('stacked')) $('#side').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  selectPerson(p) {
    this.selected = p;
    this.panel = 'card';
    this.sfx('click');
    if (!p.checked) {
      ui.renderPanel(this);
      setTimeout(() => {
        if (this.ended) return;
        p.checked = true; this.checked.add(p.id); this.stats.checks++;
        this.advance(0.25, '신원 조회');
        if (this.hostileHere()) this.raiseAlert((p.role === 'guard' || p.role === 'official' ? 4 : 1) * this.target.alertMul);
        if (this.selected === p) ui.renderPanel(this);
        if (p.isTarget) { this.sfx('win'); ui.toast(`🎯 대상 확인! "${this.target.era === 1945 ? '체포하기' : '포획하기'}"를 누르세요`, 'ok'); }
        else this.sfx(p.isDouble ? 'alert' : 'blip');
      }, 650);
    } else ui.renderPanel(this);
  }
  capture(p) {
    if (this.capturing || this.ended || !p.isTarget) return;
    this.capturing = true;
    this.tool = null;
    ui.renderPanel(this);
    this.sfx('siren');
    this.views.scene.startCapture(p, () => this.win());
  }
  talk(p) {
    if (p.talked || this.ended) return;
    const res = askPerson(this, p, this.loc.poi, this.loc.country);
    p.talked = true; this.talked.add(p.id); p.talkText = res.text; p.speakNow = true; this.stats.talks++;
    this.advance(0.5, '탐문');
    if (res.clue) this.addClue(res.clue);
    ui.renderPanel(this);
    this.raiseAlert(res.alert);
  }
  callContact(id) {
    if (this.ended) return;
    const T = this.target;
    const res = callContact(this, id);
    const ct = T.contacts.find((x) => x.id === id);
    const v = { pitch: ct.look.female ? 220 : 120 + (id.length * 13) % 40, vari: 0.3, formant: ct.look.female ? 1.12 : 0.95 };
    this.lastCall = { name: res.missed ? `${ct.name} (부재중)` : `${ct.name} · ${ct.org}`, text: res.text, voice: v, fresh: !res.missed };
    this.stats.calls++;
    this.sfx('phone');
    this.advance(res.cost, '통화');
    if (res.clue) this.addClue(res.clue);
    ui.renderPanel(this);
  }
  snsSearch(q) {
    const kw = (q || '').replace(/^#/, '').replace(/\s+/g, '').trim();
    if (!kw || this.ended) return;
    this.snsLast = kw;
    if (!this.snsCache[kw]) {
      const res = snsSearch(this, kw);
      this.snsCache[kw] = res;
      this.stats.searches++;
      this.advance(2, `#${kw}`);
      res.clues.forEach((c) => this.addClue(c));
    }
    this.sfx('blip');
    ui.renderPanel(this);
  }
  wiretap(lineId) {
    if (this.ended || this.tapped[lineId]) return;
    const T = this.target;
    const line = T.wiretap.find((l) => l.id === lineId);
    const res = wiretap(this, lineId);
    this.tapped[lineId] = true; this.stats.taps++;
    this.lastTap = { name: line.name, text: res.text, fresh: true };
    this.advance(4, T.tools.tap);
    this.addClue(res.clue);
    ui.renderPanel(this);
    this.raiseAlert(this.hostileHere() ? 8 * T.alertMul : 3);
  }
  useDrone() {
    if (this.ended) return;
    const T = this.target;
    const hostile = this.hostileHere();
    this.stats.drones++;
    if (this.viewName === 'country') {
      this.advance(2, `${T.tools.drone} 스캔`);
      if (hostile && this.rng() < 0.25) { ui.toast(`💥 ${T.tools.drone}가 격추당했습니다!`, 'warn'); this.sfx('error'); this.raiseAlert(12 * T.alertMul); ui.renderPanel(this); return; }
      const lv = droneLevels(this, this.views.country.pois);
      Object.assign(this.droneScans, lv);
      const max = Math.max(...Object.values(lv));
      const hot = this.views.country.pois.filter((p) => lv[p.id] === max && max >= 2).map((p) => p.name);
      this.addClue({ src: `🛰 ${T.tools.drone} · ${geo.byName.get(this.loc.country)?.ko}`, text: hot.length ? `경호 수준이 높은 곳: ${hot.join(', ')}` : '눈에 띄는 경호 인력 없음', stars: 4 });
      if (hostile) this.raiseAlert(5 * T.alertMul);
      this.sfx('blip');
      this.panel = 'info';
    } else if (this.viewName === 'scene') {
      this.advance(1, `${T.tools.drone} 정찰`);
      if (hostile && this.rng() < 0.2) { ui.toast(`💥 ${T.tools.drone}가 격추당했습니다!`, 'warn'); this.sfx('error'); this.raiseAlert(10 * T.alertMul); ui.renderPanel(this); return; }
      this.views.scene.launchDrone(30);
      if (hostile) this.raiseAlert(4 * T.alertMul);
      this.sfx('blip');
    }
    ui.renderPanel(this);
  }
  startHack(id) {
    const sys = this.target.hacks.find((s) => s.id === id);
    if (!sys || this.ended) return;
    if (this.hacked[id] && !sys.repeat) return;
    this.advance(3, `${sys.name} 침투`);
    this.stats.hacks++;
    this.hackState = ui.makeHackState(sys, this.rng);
    this.sfx('start');
    ui.renderPanel(this);
  }
  tickHack(dt) {
    const hs = this.hackState;
    hs.left -= dt;
    ui.updateHackTimer(hs);
    if (hs.left <= 0) this.finishHack(false);
  }
  hackClick(i) {
    const hs = this.hackState;
    if (!hs?.active || hs.used.has(i)) return;
    if (hs.grid[i] === hs.seq[hs.idx]) {
      hs.used.add(i); hs.idx++;
      this.sfx('blip');
      if (hs.idx >= hs.seq.length) return this.finishHack(true);
    } else { hs.left -= 2.5; this.sfx('error'); }
    ui.renderPanel(this);
  }
  finishHack(ok) {
    const hs = this.hackState;
    hs.active = false;
    const top = hs.sys.diff === 3;
    if (ok) {
      const text = hackResult(this, hs.sys.id);
      this.hacked[hs.sys.id] = true;
      this.lastHack = `> ACCESS GRANTED\n> ${text}`;
      this.addClue({ src: `💻 ${this.target.tools.hack} · ${hs.sys.name}`, text, stars: 5 });
      ui.toast('💻 침투 성공!', 'ok');
      this.sfx('win');
      this.raiseAlert(top ? 15 : 6);
    } else {
      this.lastHack = '> ACCESS DENIED\n> 침입 탐지됨. 연결이 차단되었습니다.';
      ui.toast('💻 침투 실패 — 추적당했습니다!', 'warn');
      this.sfx('error');
      this.raiseAlert(top ? 35 : 22);
    }
    ui.renderPanel(this);
  }

  // ─── 결과 ───
  win() {
    this.ended = true;
    const T = this.target;
    const h = this.time;
    const grade = h < T.limitH * 0.15 ? 'S' : h < T.limitH * 0.3 ? 'A' : h < T.limitH * 0.55 ? 'B' : 'C';
    const poi = POI_INDEX[this.scenario.spot.poi];
    const d = new Date();
    const rec = { date: `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, place: poi.name, hours: Math.round(h * 10) / 10, grade };
    const cur = savePrisoner(T.id, rec);
    const no = TARGET_ORDER.indexOf(T.id) + 1;
    ui.showScreen(`<div class="end-wrap win"><div class="stamp">${T.era === 1945 ? 'ARRESTED' : 'CAPTURED'}</div>
      <img class="end-portrait" src="${ui.bustURL(T.look(), 5, '#3a1a1a')}">
      <h1>${T.era === 1945 ? '체포' : '포획'} 완료: ${ui.esc(T.name)}</h1><p>장소: <b>${ui.esc(poi.name)}</b> · ${ui.esc(this.scenario.spot.act)}</p>
      <p class="jail">🏛 교도소 <b>No.${String(no).padStart(3, '0')}</b> 감방에 수감되었습니다 (통산 ${cur.count}회)</p>
      <div class="grade">등급 <b>${grade}</b></div>
      <table class="fields stats"><tr><th>소요 시간</th><td>${fmtHours(h)}</td></tr><tr><th>신원 조회</th><td>${this.stats.checks}명</td></tr>
      <tr><th>전화 / ${ui.esc(T.tools.sns)} / ${ui.esc(T.tools.hack)}</th><td>${this.stats.calls} / ${this.stats.searches} / ${this.stats.hacks}</td></tr>
      <tr><th>${ui.esc(T.tools.drone)} / ${ui.esc(T.tools.tap)} / 탐문</th><td>${this.stats.drones} / ${this.stats.taps} / ${this.stats.talks}</td></tr>
      <tr><th>최종 경계도</th><td>${Math.round(this.alert)}%</td></tr></table>
      <div class="row"><button class="btn big primary" data-act="jail">🏛 교도소 보기</button><button class="btn big" data-act="again">다른 대상 추적</button></div></div>`, (a) => {
      this.sfx('click');
      if (a === 'jail') ui.showPrison(this, T.id, () => this.showTitle());
      if (a === 'again') { this.restart(); this.showSelect(); }
    });
  }
  lose(reason) {
    if (this.ended) return;
    this.ended = true;
    this.sfx('error');
    const poi = POI_INDEX[this.scenario.spot.poi];
    const msg = reason === 'time' ? '⏰ 시간 초과. 대상은 다시 모습을 감췄다.' : '🚨 경계도 100% — 요원의 신분이 노출되어 체포되었다.';
    ui.showScreen(`<div class="end-wrap lose"><div class="stamp red">MISSION<br>FAILED</div><h1>${msg}</h1>
      <p>대상은 <b>${ui.esc(poi.name)}</b>에 있었습니다. (${ui.esc(this.scenario.spot.act)})</p>
      <div class="row"><button class="btn big primary" data-act="again">다시 하기</button><button class="btn big" data-act="title">타이틀로</button></div></div>`, (a) => {
      this.sfx('click');
      if (a === 'again') { const id = this.target.id; this.restart(); this.showBrief(id); }
      if (a === 'title') { this.restart(); this.showTitle(); }
    });
  }
  restart() { this.started = false; this.ended = false; this.capturing = false; document.body.classList.remove('playing'); this.setView('globe'); this.resize(); }

  // ─── 효과음 ───
  sfx(kind) {
    if (isMuted()) return;
    try {
      const a = audio(), out = masterOut(), t = a.currentTime;
      const seq = { click: [[660, 0.04]], blip: [[880, 0.05], [1320, 0.05]], alert: [[300, 0.12], [220, 0.16]], error: [[180, 0.2]], phone: [[440, 0.1], [0, 0.05], [440, 0.1]], plane: [[220, 0.3], [260, 0.3]], start: [[523, 0.08], [659, 0.08], [784, 0.12]], win: [[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.25]], siren: [[700, 0.18], [950, 0.18], [700, 0.18], [950, 0.18], [700, 0.18], [950, 0.18]] }[kind] || [[600, 0.05]];
      let tt = t;
      for (const [f, d] of seq) {
        if (f) {
          const o = a.createOscillator(), g = a.createGain();
          o.type = 'square'; o.frequency.value = f;
          g.gain.setValueAtTime(0.05, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + d);
          o.connect(g).connect(out); o.start(tt); o.stop(tt + d);
        }
        tt += d;
      }
    } catch (e) { /* 오디오 불가 환경 */ }
  }
}

const game = new Game();
window.__game = game;
game.boot();
