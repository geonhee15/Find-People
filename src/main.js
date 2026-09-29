// Find People — 메인: 상태, 루프, 입력, 이동/시간/단서 처리
import { W, H, mulberry32, clamp, haversineKm, fmtHours } from './util.js';
import { initArt } from './art.js';
import { loadGeo, geo } from './geo.js';
import { GlobeView } from './globe.js';
import { CountryView, generatePois } from './countryview.js';
import { SceneView } from './sceneview.js';
import { newScenario, POI_INDEX, callContact, snsSearch, hackResult, askPerson, HACK_SYSTEMS } from './story.js';
import { targetLook } from './people.js';
import { CONTACTS } from './data.js';
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
    this.limit = 240;
    this.fade = null;
    this.poiCache = {};
    this.started = false;
    this.panel = 'info';
    this.tool = null;
    this.audio = null;
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
  resize() {
    const st = $('#stage');
    const aw = st.clientWidth, ah = st.clientHeight;
    let S = Math.min(aw / W, ah / H);
    if (S >= 2) S = Math.floor(S * 2) / 2;
    this.S = S;
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
    if (this.started && !this.fade) this.view.overlay(this.ov);
    if (this.fade) {
      const f = this.fade;
      f.t += dt;
      const half = f.dur / 2;
      if (!f.fired && f.t >= half) { f.fired = true; f.mid(); }
      const a = f.t < half ? f.t / half : Math.max(0, 1 - (f.t - half) / half);
      const ctx = this.ctx;
      ctx.fillStyle = `rgba(4,6,14,${a})`; ctx.fillRect(0, 0, W, H);
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

  // ─── 입력 ───
  bindInput() {
    const oc = $('#overlay');
    const pos = (e) => { const r = oc.getBoundingClientRect(); return [(e.clientX - r.left) / this.S, (e.clientY - r.top) / this.S]; };
    oc.addEventListener('pointerdown', (e) => { if (!this.canAct()) return; const [x, y] = pos(e); oc.setPointerCapture(e.pointerId); this.view.pointerDown(x, y); });
    oc.addEventListener('pointermove', (e) => { const [x, y] = pos(e); this.mouse.x = x; this.mouse.y = y; this.mouse.inside = true; if (this.started && !this.fade) this.view.pointerMove(x, y); });
    oc.addEventListener('pointerup', (e) => { if (!this.canAct()) return; const [x, y] = pos(e); this.view.pointerUp(x, y); });
    oc.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    oc.addEventListener('wheel', (e) => { e.preventDefault(); if (this.view.wheel) this.view.wheel(e.deltaY); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!this.started || this.ended || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'escape') { if (this.tool) { this.tool = null; ui.renderHud(this); } else this.back(); }
      const map = { t: 'scope', p: 'phone', s: 'sns', h: 'hack', n: 'notes', d: 'dossier' };
      if (map[k]) this.useTool(map[k]);
      if (k === 'g') this.goGlobe();
    });
  }
  canAct() { return this.started && !this.ended && !this.fade && !this.views.globe.flight && $('#modal').classList.contains('hidden'); }

  // ─── 화면 ───
  showTitle() {
    this.views.globe.enter(); this.views.globe.auto = true;
    ui.showScreen(`<div class="title-wrap"><div class="logo">FIND<span>PEOPLE</span></div>
      <div class="subtitle">픽셀 추적 시뮬레이션 — 전 세계 군중 속에서 단 한 사람을 찾아라</div>
      <button class="btn big primary" data-act="start">▶ 게임 시작</button>
      <div class="muted small">드래그: 지구본 회전 · 휠: 확대 · 클릭: 이동/조회</div></div>`, (a) => { if (a === 'start') { this.sfx('click'); this.showSelect(); } });
  }
  showSelect() {
    const t = ui.bustURL(targetLook(), 4, '#3a1a1a');
    ui.showScreen(`<div class="select-wrap"><h1>추적 대상 선택</h1><div class="targets">
      <button class="tcard" data-act="kju"><img src="${t}"><div class="tname">김정은</div><div class="muted">북한 국무위원장</div><div class="diff">난이도 ★★★☆☆</div><div class="muted small">철통 경호 · 1호 열차 · 대역 존재</div></button>
      <div class="tcard locked"><div class="q">?</div><div class="tname">???</div><div class="muted small">추후 추가 예정</div></div>
      <div class="tcard locked"><div class="q">?</div><div class="tname">???</div><div class="muted small">추후 추가 예정</div></div>
      </div><button class="btn" data-act="back">← 뒤로</button></div>`, (a) => {
      this.sfx('click');
      if (a === 'kju') this.showBrief();
      if (a === 'back') this.showTitle();
    });
  }
  showBrief() {
    const t = ui.bustURL(targetLook(), 5, '#3a1a1a');
    ui.showScreen(`<div class="brief-wrap"><div class="brief"><img src="${t}"><div>
      <h1>작전명: 1호 추적</h1>
      <p>대상 <b>김정은</b>의 현재 위치가 불분명하다. 공개 활동이 끊긴 지 일주일째.</p>
      <p>너는 서울에서 출발한다. <b>10일</b> 안에 대상을 찾아 군중 속에서 직접 <b>신원을 확인</b>하라.</p>
      <ul class="points">
        <li>🌍 지구본에서 나라를 골라 이동하고, 나라 안의 장소로 들어가라</li>
        <li>📞 전화 · 📱 SNS · 💻 해킹 · 🗣 탐문으로 단서를 모아라</li>
        <li>🔭 망원경으로 얼굴을 확대하고, 의심 인물을 클릭해 신원을 조회하라</li>
        <li>⚠️ 북한에서 수상한 행동을 하면 <b>경계도</b>가 오른다. 100%면 체포</li>
        <li>🎭 대역을 조심하라. 얼굴형·안경·점을 비교할 것</li>
      </ul>
      <button class="btn big primary" data-act="go">작전 개시</button></div></div></div>`, (a) => { if (a === 'go') { this.sfx('start'); this.newGame(); } });
  }
  newGame() {
    const seed = (Math.random() * 2 ** 31) | 0;
    this.scenario = newScenario(seed);
    this.rng = mulberry32(seed + 77);
    Object.assign(this, { time: 0, alert: 0, clues: [], calls: {}, snsCache: {}, snsLast: '', hacked: {}, checked: new Set(), talked: new Set(), lastCall: null, lastHack: null, hackState: null, selected: null, ended: false, tool: null });
    this.stats = { checks: 0, calls: 0, searches: 0, hacks: 0, talks: 0, flights: 0, moves: 0 };
    this.loc = { country: 'South Korea', poi: null, lon: 126.98, lat: 37.56 };
    this.started = true;
    ui.hideScreen();
    document.body.classList.add('playing');
    this.resize();
    this.panel = 'info';
    this.setView('globe');
    this.views.globe.auto = false;
    this.addClue({ src: '📁 작전 브리핑', text: '대상은 일주일째 공개 활동 없음. 북한 내부 또는 우방국(중국·러시아) 방문 가능성.', stars: 3 });
    ui.toast('🌍 지구본에서 나라를 클릭해 이동하세요. 정보부터 모으는 게 좋습니다.');
  }

  // ─── 이동 ───
  poiById(id) { return POI_INDEX[id]; }
  poisFor(country, view) { return (this.poiCache[country.name] ||= generatePois(country, view)); }
  flightHours(c) {
    const cur = geo.byName.get(this.loc.country);
    const to = c.capital ? [c.capital.lon, c.capital.lat] : c.centroid;
    const km = haversineKm(this.loc.lon, this.loc.lat, to[0], to[1]);
    let h = km / 800 + 2.5;
    if (c.name === 'North Korea' || cur?.name === 'North Korea') h += 5;
    return { h, km, to };
  }
  poiTravelHours(p) {
    const km = haversineKm(this.loc.lon, this.loc.lat, p.lon, p.lat);
    if (km > 600) return km / 750 + 2;
    return Math.max(0.5, km / (p.country === 'North Korea' ? 45 : 70) + 0.3);
  }
  requestTravelCountry(c) {
    if (!c || !this.canAct()) return;
    if (c.name === this.loc.country) { this.transition(() => this.setView('country', c)); return; }
    const { h, km, to } = this.flightHours(c);
    const nk = c.name === 'North Korea' ? '<p class="warn">⚠️ 북한 입국: 베이징 경유 고려항공 + 입국 심사 (+5시간)</p>' : '';
    ui.confirmModal(`✈️ ${c.ko}(으)로 이동`, `<p>${geo.byName.get(this.loc.country)?.ko} → ${c.ko} · 약 ${Math.round(km).toLocaleString()}km</p><p>소요 시간: <b>${fmtHours(h)}</b></p>${nk}`, '출발', () => {
      this.sfx('plane');
      const from = [this.loc.lon, this.loc.lat];
      if (this.viewName !== 'globe') this.setView('globe');
      this.views.globe.flyTo(from, to, 1.8, () => {
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
  advance(h, why) {
    this.time += h;
    this.alert = Math.max(0, this.alert - h * 1.0);
    if (why !== false) ui.toast(`⏱ +${fmtHours(h)}${why ? ' · ' + why : ''}`, 'time');
    ui.renderHud(this);
    if (this.time >= this.limit) setTimeout(() => this.lose('time'), 600);
  }
  raiseAlert(v) {
    if (!v) return;
    this.alert = clamp(this.alert + v, 0, 100);
    ui.toast(`⚠️ 경계도 +${v}%`, 'warn');
    this.sfx('alert');
    ui.renderHud(this);
    if (this.alert >= 100) setTimeout(() => this.lose('caught'), 600);
  }
  addClue(c) {
    const start = new Date(2026, 9, 1, 9, 0);
    const now = new Date(start.getTime() + this.time * 3600e3);
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
      this.sfx('click');
      ui.renderHud(this);
      return;
    }
    if (this.hackState?.active && id !== 'hack') return;
    this.panel = this.panel === id ? (this.viewName === 'scene' && this.selected ? 'card' : 'info') : id;
    ui.renderPanel(this); ui.renderHud(this);
  }
  selectPerson(p) {
    this.selected = p;
    this.panel = 'card';
    this.sfx('click');
    if (!p.checked) {
      ui.renderPanel(this);
      this.busy = true;
      setTimeout(() => {
        p.checked = true; this.checked.add(p.id); this.stats.checks++;
        this.advance(0.25, '신원 조회');
        if (this.loc.country === 'North Korea') this.raiseAlert(p.role === 'guard' || p.role === 'official' ? 4 : 1);
        if (this.selected === p) ui.renderPanel(this);
        if (p.isTarget) this.win();
        else this.sfx(p.isDouble ? 'alert' : 'blip');
        this.busy = false;
      }, 650);
    } else ui.renderPanel(this);
  }
  talk(p) {
    if (p.talked || this.ended) return;
    const res = askPerson(this, p, this.loc.poi, this.loc.country);
    p.talked = true; this.talked.add(p.id); p.talkText = res.text; this.stats.talks++;
    this.advance(0.5, '탐문');
    if (res.clue) this.addClue(res.clue);
    ui.renderPanel(this);
    this.raiseAlert(res.alert);
  }
  callContact(id) {
    if (this.ended) return;
    const res = callContact(this, id);
    const ct = CONTACTS.find((x) => x.id === id);
    this.lastCall = { name: res.missed ? `${ct.name} (부재중)` : `${ct.name} · ${ct.org}`, text: res.text };
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
      this.advance(2, `#${kw} 검색`);
      res.clues.forEach((c) => this.addClue(c));
    }
    this.sfx('blip');
    ui.renderPanel(this);
  }
  startHack(id) {
    const sys = HACK_SYSTEMS.find((s) => s.id === id);
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
    if (ok) {
      const text = hackResult(this, hs.sys.id);
      this.hacked[hs.sys.id] = true;
      this.lastHack = `> ACCESS GRANTED\n> ${text}`;
      this.addClue({ src: `💻 해킹 · ${hs.sys.name}`, text, stars: 5 });
      ui.toast('💻 침투 성공!', 'ok');
      this.sfx('win');
      this.raiseAlert(hs.sys.id === 'guard' ? 15 : 6);
    } else {
      this.lastHack = '> ACCESS DENIED\n> 침입 탐지됨. 연결이 차단되었습니다.';
      ui.toast('💻 침투 실패 — 추적당했습니다!', 'warn');
      this.sfx('error');
      this.raiseAlert(hs.sys.id === 'guard' ? 35 : 22);
    }
    ui.renderPanel(this);
  }

  // ─── 결과 ───
  win() {
    this.ended = true;
    this.sfx('win');
    const h = this.time;
    const grade = h < 36 ? 'S' : h < 72 ? 'A' : h < 130 ? 'B' : 'C';
    const poi = POI_INDEX[this.scenario.spot.poi];
    setTimeout(() => {
      ui.showScreen(`<div class="end-wrap win"><div class="stamp">MISSION<br>COMPLETE</div>
        <img class="end-portrait" src="${ui.bustURL(targetLook(), 5, '#3a1a1a')}">
        <h1>대상 확인: 김정은</h1><p>장소: <b>${ui.esc(poi.name)}</b> · ${ui.esc(this.scenario.spot.act)}</p>
        <div class="grade">등급 <b>${grade}</b></div>
        <table class="fields stats"><tr><th>소요 시간</th><td>${fmtHours(h)}</td></tr><tr><th>신원 조회</th><td>${this.stats.checks}명</td></tr>
        <tr><th>통화 / SNS / 해킹 / 탐문</th><td>${this.stats.calls} / ${this.stats.searches} / ${this.stats.hacks} / ${this.stats.talks}</td></tr>
        <tr><th>최종 경계도</th><td>${Math.round(this.alert)}%</td></tr></table>
        <button class="btn big primary" data-act="again">다시 하기</button></div>`, (a) => { if (a === 'again') this.restart(); });
    }, 1400);
  }
  lose(reason) {
    if (this.ended) return;
    this.ended = true;
    this.sfx('error');
    const poi = POI_INDEX[this.scenario.spot.poi];
    const msg = reason === 'time' ? '⏰ 시간 초과. 대상은 다시 모습을 감췄다.' : '🚨 경계도 100% — 요원이 신분이 노출되어 체포되었다.';
    ui.showScreen(`<div class="end-wrap lose"><div class="stamp red">MISSION<br>FAILED</div><h1>${msg}</h1>
      <p>대상은 <b>${ui.esc(poi.name)}</b>에 있었습니다. (${ui.esc(this.scenario.spot.act)})</p>
      <button class="btn big primary" data-act="again">다시 하기</button></div>`, (a) => { if (a === 'again') this.restart(); });
  }
  restart() { this.started = false; this.ended = false; document.body.classList.remove('playing'); this.setView('globe'); this.showTitle(); this.resize(); }

  // ─── 효과음 (WebAudio 삑삑이) ───
  sfx(kind) {
    try {
      if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)();
      const a = this.audio, t = a.currentTime;
      const seq = { click: [[660, 0.04]], blip: [[880, 0.05], [1320, 0.05]], alert: [[300, 0.12], [220, 0.16]], error: [[180, 0.2]], phone: [[440, 0.1], [0, 0.05], [440, 0.1]], plane: [[220, 0.3], [260, 0.3]], start: [[523, 0.08], [659, 0.08], [784, 0.12]], win: [[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.25]] }[kind] || [[600, 0.05]];
      let tt = t;
      for (const [f, d] of seq) {
        if (f) {
          const o = a.createOscillator(), g = a.createGain();
          o.type = 'square'; o.frequency.value = f;
          g.gain.setValueAtTime(0.04, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + d);
          o.connect(g).connect(a.destination); o.start(tt); o.stop(tt + d);
        }
        tt += d;
      }
    } catch (e) { /* 오디오 불가 환경 */ }
  }
}

const game = new Game();
window.__game = game;
game.boot();
