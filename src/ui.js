// DOM UI: HUD, 도구 패널, 모달, 전체 화면(타이틀/선택/브리핑/결과/교도소)
import { ICON, iconDataURL } from './art.js';
import { bust, genLook } from './people.js';
import { snsTags } from './story.js';
import { geo } from './geo.js';
import { makeCanvas, mulberry32, hashStr, fmtHours, pick, shuffle } from './util.js';
import { speak, voiceFor, isMuted, setMuted } from './voice.js';
import { TARGETS, TARGET_ORDER } from './targets.js';
import { loadPrison, PrisonView } from './prison.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export function bustURL(look, scale = 4, bg = '#1b2233') {
  const b = bust(look, bg);
  const [c, x] = makeCanvas(32 * scale, 32 * scale);
  x.drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL();
}

function toolsFor(T) {
  return [
    { id: 'scope', icon: 'telescope', label: '망원경', key: 'T' },
    { id: 'phone', icon: 'phone', label: '전화', key: 'P' },
    { id: 'sns', icon: T.tools.snsIcon, label: T.tools.sns, key: 'S' },
    { id: 'hack', icon: 'hack', label: T.tools.hack, key: 'H' },
    { id: 'drone', icon: T.era === 1945 ? 'plane' : 'drone', label: T.tools.drone, key: 'R' },
    { id: 'tap', icon: 'headset', label: T.tools.tap, key: 'W' },
    { id: 'notes', icon: 'notebook', label: '수첩', key: 'N' },
    { id: 'dossier', icon: 'dossier', label: '대상 정보', key: 'D' },
  ];
}

export function initUI(game) {
  const tb = $('#toolbar');
  tb.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    game.sfx('click');
    if (b.dataset.nav === 'back') game.back();
    if (b.dataset.nav === 'globe') game.goGlobe();
    if (b.dataset.tool) game.useTool(b.dataset.tool);
  };
  $('#muteBtn').onclick = () => { setMuted(!isMuted()); renderMute(); };
  renderMute();
}
function renderMute() { $('#muteBtn').textContent = isMuted() ? '🔇' : '🔊'; }

// 대상이 바뀔 때마다 툴바/HUD 다시 구성
export function setupForTarget(game) {
  const T = game.target;
  const tb = $('#toolbar');
  tb.innerHTML = `<div class="nav"><button class="tool" data-nav="back"><img src="${iconDataURL('back')}"><span>뒤로 <kbd>Esc</kbd></span></button>
    <button class="tool" data-nav="globe"><img src="${iconDataURL('globe')}"><span>지구본 <kbd>G</kbd></span></button></div>
    <div class="tools">${toolsFor(T).map((t) => `<button class="tool" data-tool="${t.id}"><img src="${iconDataURL(t.icon)}"><span>${esc(t.label)} <kbd>${t.key}</kbd></span></button>`).join('')}</div>`;
  const hc = $('#hudTarget').getContext('2d');
  hc.clearRect(0, 0, 32, 32);
  hc.drawImage(bust(T.look(), '#3a1a1a'), 0, 0);
  $('#hudTargetName').textContent = T.name;
  document.body.classList.toggle('era1945', T.era === 1945);
}

export function gameDate(game) {
  const [y, m, d, h] = game.target.startDate;
  return new Date(new Date(y, m, d, h).getTime() + game.time * 3600e3);
}
export function renderHud(game) {
  const now = gameDate(game);
  const wd = '일월화수목금토'[now.getDay()];
  const yr = game.target.era === 1945 ? `${now.getFullYear()}년 ` : '';
  $('#hudDate').textContent = `${yr}${now.getMonth() + 1}월 ${now.getDate()}일 (${wd}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const left = Math.max(0, game.limit - game.time);
  $('#hudLeft').textContent = `남은 시간 ${fmtHours(left)}`;
  $('#hudLeft').classList.toggle('danger', left < 48);
  const a = Math.round(game.alert);
  $('#alertBar').style.width = a + '%';
  $('#alertBar').className = a > 70 ? 'hi' : a > 40 ? 'mid' : '';
  $('#alertNum').textContent = a + '%';
  const c = geo.byName.get(game.loc.country);
  const poi = game.loc.poi ? game.poiById(game.loc.poi) : null;
  $('#hudLoc').innerHTML = `📍 ${esc(c ? c.ko : game.loc.country)}${poi ? ' › ' + esc(poi.name) : ''}`;
  document.querySelectorAll('#toolbar [data-tool]').forEach((b) => {
    b.classList.toggle('active', (b.dataset.tool === 'scope' && game.tool === 'scope') || b.dataset.tool === game.panel);
    if (b.dataset.tool === 'scope') b.disabled = game.viewName !== 'scene';
  });
  const back = document.querySelector('#toolbar [data-nav="back"]');
  if (back) back.disabled = game.viewName === 'globe';
}

export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = msg;
  $('#toasts').appendChild(t);
  while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3200);
}

export function confirmModal(title, body, yes, onYes, no = '취소') {
  const m = $('#modal');
  m.innerHTML = `<div class="box"><h3>${title}</h3><div class="body">${body}</div><div class="row"><button class="btn" data-a="no">${no}</button><button class="btn primary" data-a="yes">${yes}</button></div></div>`;
  m.classList.remove('hidden');
  m.onclick = (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a && e.target !== m) return;
    m.classList.add('hidden');
    if (a === 'yes') onYes();
  };
}

// ───────────── 사이드 패널 ─────────────
export function renderPanel(game) {
  const p = $('#panel');
  const fn = PANELS[game.panel] || PANELS.info;
  p.onclick = null;
  p.innerHTML = '';
  p.scrollTop = 0;
  fn(game, p);
}
const PANELS = {};

PANELS.info = (game, el) => {
  const T = game.target;
  if (game.viewName === 'globe') {
    const quick = T.era === 1945 ? ['Germany', 'Austria', 'Switzerland', 'Argentina', 'United Kingdom', 'Spain'] : ['North Korea', 'South Korea', 'China', 'Russia', 'Japan', 'United States of America', 'United Kingdom'];
    el.innerHTML = `<h2>🌍 세계 지도${T.era === 1945 ? ' · 1945' : ''}</h2>
      <p class="muted">${game.touch ? '지구본을 드래그해서 돌리고, 두 손가락으로 확대하세요.' : '지구본을 드래그해서 돌리고, 휠로 확대/축소하세요.'} 나라를 누르면 비행기로 이동합니다.</p>
      <input id="cSearch" class="input" placeholder="나라 이름 검색 (예: 독일, 미국)">
      <div id="cList" class="list"></div>
      <h3>빠른 이동</h3><div class="chips">${quick.map((n) => `<button class="chip" data-c="${n}">${geo.byName.get(n)?.ko}</button>`).join('')}</div>`;
    const list = el.querySelector('#cList'), input = el.querySelector('#cSearch');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      list.innerHTML = q ? geo.list.filter((c) => c.ko.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 8).map((c) => `<button class="row-btn" data-c="${esc(c.name)}">${esc(c.ko)} <span class="muted">${esc(c.name)}</span></button>`).join('') : '';
    });
    el.onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) game.requestTravelCountry(geo.byName.get(b.dataset.c)); };
  } else if (game.viewName === 'country') {
    const v = game.views.country;
    el.innerHTML = `<h2>🗺️ ${esc(v.c.ko)}</h2><p class="muted">아이콘을 누르면 그 장소로 이동합니다. 주변 나라를 누르면 비행기로 넘어갑니다.</p>
      <div class="list">${v.pois.map((p) => {
        const lv = game.droneScans[p.id];
        const sec = lv === undefined ? '' : ` · <span class="lv lv${lv}">경호 ${['없음', '낮음', '높음', '매우 높음'][lv]}</span>`;
        return `<button class="row-btn" data-p="${esc(p.id)}"><img class="ico" src="${iconDataURL(ICON[p.type] ? p.type : 'landmark', 2)}"><span>${esc(p.name)}<br><span class="muted">${game.loc.poi === p.id ? '현재 위치' : '이동 약 ' + game.poiTravelHours(p).toFixed(1) + '시간'}</span>${sec}</span></button>`;
      }).join('')}</div>`;
    el.onclick = (e) => { const b = e.target.closest('[data-p]'); if (b) game.requestTravelPoi(game.poiById(b.dataset.p)); };
  } else {
    el.innerHTML = `<h2>🧍 인물 카드</h2><p class="muted">사람을 ${game.touch ? '탭' : '클릭'}하면 신원을 조회합니다 (15분 소요).<br>망원경으로 먼저 얼굴을 확인하면 시간을 아낄 수 있어요.</p>
      <div class="tip">💡 ${T.dossier.points.slice(0, 3).join(' · ')}</div>`;
  }
};

PANELS.card = (game, el) => {
  const p = game.selected;
  if (!p) return PANELS.info(game, el);
  if (!p.checked) { el.innerHTML = `<div class="card scanning"><div class="scan">🔍 안면 인식 · 신원 조회 중...</div></div>`; return; }
  const i = p.info;
  const verdict = p.isTarget ? `<div class="verdict ok">✔ 신원 일치 — 대상 확인!</div>` : p.isDouble ? `<div class="verdict warn">✖ 불일치 · 외형 유사 (대역 가능성)</div>` : `<div class="verdict no">✖ 대상 불일치</div>`;
  const capture = p.isTarget ? `<button class="btn big primary capture" id="capBtn" ${game.capturing ? 'disabled' : ''}>🚨 ${game.target.era === 1945 ? '체포하기' : '포획하기'}</button>` : '';
  el.innerHTML = `<div class="card ${p.isTarget ? 'target' : ''}">
    <div class="card-head"><img class="portrait" src="${bustURL(p.look, 4, p.isTarget ? '#3a1a1a' : '#1b2233')}"><div>
      <div class="card-name">${esc(i.name)}</div><div class="muted">${esc(i.job)}</div></div></div>
    <table class="fields">
      <tr><th>나이</th><td>${i.age}세</td></tr><tr><th>출생</th><td>${esc(i.birth)}</td></tr>
      <tr><th>출생지</th><td>${esc(i.birthplace)}</td></tr><tr><th>국적</th><td>${esc(i.nationality)}</td></tr>
      <tr><th>직업</th><td>${esc(i.job)}</td></tr><tr><th>비고</th><td>${esc(i.note)}</td></tr>
    </table>${verdict}${capture}
    ${p.isTarget ? '' : `<div class="row"><button class="btn" id="talkBtn" ${p.talked ? 'disabled' : ''}>🗣 말 걸기 (30분)</button></div>`}
    <div class="talk bubble-talk ${p.talkText ? '' : 'hidden'}"><span class="who">${esc(i.name)}</span><div id="talkOut"></div></div></div>`;
  el.querySelector('#talkBtn')?.addEventListener('click', () => game.talk(p));
  el.querySelector('#capBtn')?.addEventListener('click', () => game.capture(p));
  const out = el.querySelector('#talkOut');
  if (p.talkText) {
    if (p.speakNow) { p.speakNow = false; speak(out, p.talkText, voiceFor(p.look, hashStr(p.id))); }
    else out.textContent = p.talkText;
  }
};

PANELS.phone = (game, el) => {
  const T = game.target;
  el.innerHTML = `<h2>📞 전화</h2><p class="muted">정보원에게 전화를 겁니다 (통화 1시간). 신뢰도가 낮은 정보원은 틀린 정보를 줄 수 있어요.</p><div id="callOut"></div><div class="list" id="contacts"></div>`;
  const list = el.querySelector('#contacts');
  for (const c of T.contacts) {
    const look = genLook(mulberry32(hashStr(c.id)), c.look);
    const used = game.calls[c.id] || 0;
    const b = document.createElement('div');
    b.className = 'contact';
    b.innerHTML = `<img class="avatar" src="${bustURL(look, 2)}"><div class="grow"><b>${esc(c.name)}</b><div class="muted">${esc(c.org)}</div><div class="stars" title="신뢰도">${stars(Math.round(c.rel * 5))}</div></div>
      <button class="btn small" ${used >= c.clues.length ? 'disabled' : ''}>${used >= c.clues.length ? '소진' : '통화'}</button>`;
    b.querySelector('button').onclick = () => game.callContact(c.id);
    list.appendChild(b);
  }
  const lc = game.lastCall;
  if (lc) {
    const out = el.querySelector('#callOut');
    out.innerHTML = `<div class="bubble"><b>📞 ${esc(lc.name)}</b><div class="typed"></div></div>`;
    const typed = out.querySelector('.typed');
    if (lc.fresh) { lc.fresh = false; speak(typed, lc.text, { ...lc.voice, radio: true }); } else typed.textContent = lc.text;
  }
};

function snsPhoto(kind, seed, era) {
  const [c, x] = makeCanvas(64, 28);
  const r = mulberry32(seed);
  x.fillStyle = '#8ab8e0'; x.fillRect(0, 0, 64, 14); x.fillStyle = '#6a6a70'; x.fillRect(0, 14, 64, 14);
  if (kind === 'convoy') for (let i = 0; i < 4; i++) { x.fillStyle = '#141418'; x.fillRect(4 + i * 15, 17, 12, 4); x.fillRect(6 + i * 15, 15, 7, 2); x.fillStyle = '#101010'; x.fillRect(5 + i * 15, 21, 2, 1); x.fillRect(12 + i * 15, 21, 2, 1); }
  if (kind === 'train') { x.fillStyle = '#1f4d34'; x.fillRect(0, 12, 64, 9); x.fillStyle = '#e8c030'; x.fillRect(0, 18, 64, 1); x.fillStyle = '#1a1a1a'; for (let i = 2; i < 64; i += 6) x.fillRect(i, 14, 4, 3); }
  if (kind === 'guards') for (let i = 0; i < 6; i++) { const gx = 4 + i * 10 + r() * 3; x.fillStyle = '#17171d'; x.fillRect(gx, 14, 4, 10); x.fillStyle = '#efc6a0'; x.fillRect(gx, 10, 4, 4); x.fillStyle = '#0e0e14'; x.fillRect(gx, 11, 4, 1); x.fillStyle = '#1c1c24'; x.fillRect(gx, 9, 4, 1); }
  if (kind === 'closed') { x.fillStyle = '#e8e8e8'; x.fillRect(10, 16, 44, 4); x.fillStyle = '#d02a2a'; for (let i = 10; i < 54; i += 8) x.fillRect(i, 16, 4, 4); x.fillStyle = '#2a3a8a'; x.fillRect(48, 10, 8, 12); }
  if (kind === 'plane') { x.fillStyle = '#f4f4f4'; x.fillRect(10, 6, 40, 5); x.fillStyle = '#3a6ab8'; x.fillRect(10, 9, 40, 2); x.fillStyle = '#e8e8e8'; x.fillRect(26, 2, 6, 12); x.fillRect(46, 2, 4, 5); }
  if (kind === 'heli') { x.fillStyle = '#2e4a2e'; x.fillRect(22, 5, 16, 6); x.fillRect(38, 7, 14, 2); x.fillStyle = '#f4f4f4'; x.fillRect(22, 8, 16, 1); x.fillStyle = '#1a1a1a'; x.fillRect(12, 3, 36, 1); }
  if (kind === 'sub') { x.fillStyle = '#3a5a78'; x.fillRect(0, 12, 64, 16); x.fillStyle = '#4a5058'; x.fillRect(8, 15, 48, 4); x.fillRect(28, 10, 8, 5); }
  const [c2, x2] = makeCanvas(192, 84);
  if (era === 1945) x2.filter = 'grayscale(1) contrast(1.2)';
  x2.drawImage(c, 0, 0, 192, 84);
  return c2.toDataURL();
}

PANELS.sns = (game, el) => {
  const T = game.target, S = T.sns;
  const unit = T.era === 1945 ? '조사' : '검색';
  el.innerHTML = `<h2>${T.era === 1945 ? '📰' : '📱'} ${esc(S.label)} ${unit}</h2><p class="muted">키워드로 ${T.era === 1945 ? '신문 기사와 라디오 방송' : '게시물'}을 뒤져 목격담을 찾습니다 (1회 2시간, 이미 ${unit}한 키워드는 무료).</p>
    <form id="snsForm" class="search"><input class="input" id="snsQ" placeholder="#키워드" value="${esc(game.snsLast || '')}"><button class="btn">${unit}</button></form>
    <div id="feed" class="feed"></div><h3>추천 키워드</h3>
    <div class="chips">${snsTags(T).map((t) => `<button class="chip ${game.snsCache[t] ? 'done' : ''}" data-t="${esc(t)}">#${esc(t)}</button>`).join('')}</div>`;
  el.querySelector('#snsForm').onsubmit = (e) => { e.preventDefault(); game.snsSearch(el.querySelector('#snsQ').value); };
  el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => game.snsSearch(b.dataset.t)));
  const res = game.snsLast && game.snsCache[game.snsLast];
  if (!res) return;
  const feed = el.querySelector('#feed');
  let html = `<div class="muted">#${esc(game.snsLast)} ${unit} 결과</div>`;
  for (const p of res.posts) {
    if (p.system) { html += `<div class="post muted">${esc(p.text)}</div>`; continue; }
    const r = mulberry32(p.seed);
    if (S.authors) {
      html += `<div class="post paper"><img class="avatar" src="${iconDataURL('newspaper', 3)}"><div class="grow"><b>${esc(pick(r, S.authors))}</b> <span class="muted">· ${p.ago}시간 전</span><div>${esc(p.text)}</div>${p.photo ? `<img class="photo" src="${snsPhoto(p.photo, p.seed, 1945)}">` : ''}</div></div>`;
    } else {
      const look = genLook(r, { group: pick(r, ['ko', 'en', 'zh', 'ru', 'ja']), role: 'civ' });
      const handle = pick(r, ['travel', 'daily', 'news', 'osint', 'photo', 'korea', 'watcher', 'foodie', 'hiker']) + '_' + Math.floor(r() * 9000 + 100);
      html += `<div class="post"><img class="avatar" src="${bustURL(look, 1.5)}"><div class="grow"><b>@${handle}</b> <span class="muted">· ${p.ago}시간 전</span><div>${esc(p.text)}</div>${p.photo ? `<img class="photo" src="${snsPhoto(p.photo, p.seed)}">` : ''}<div class="muted small">♥ ${p.likes}</div></div></div>`;
    }
  }
  feed.innerHTML = html;
};

PANELS.hack = (game, el) => {
  const T = game.target;
  const hs = game.hackState;
  if (hs && hs.active) return renderHackGame(game, el, hs);
  el.innerHTML = `<h2>💻 ${esc(T.tools.hack)}</h2><p class="muted">시스템에 침투해 기록을 빼냅니다 (1회 3시간). 코드 시퀀스를 제한 시간 안에 순서대로 누르세요. 실패하면 경계도가 크게 오릅니다.</p>${game.lastHack ? `<div class="terminal">${esc(game.lastHack)}</div>` : ''}<div class="list" id="systems"></div>`;
  const list = el.querySelector('#systems');
  for (const s of T.hacks) {
    const done = game.hacked[s.id] && !s.repeat;
    const d = document.createElement('div');
    d.className = 'contact';
    d.innerHTML = `<img class="ico" src="${iconDataURL('hack', 2)}"><div class="grow"><b>${esc(s.name)}</b><div class="muted">${esc(s.desc)}</div><div class="stars">난이도 ${'■'.repeat(s.diff)}${'□'.repeat(3 - s.diff)}</div></div><button class="btn small" ${done ? 'disabled' : ''}>${done ? '완료' : '침투'}</button>`;
    d.querySelector('button').onclick = () => game.startHack(s.id);
    list.appendChild(d);
  }
};
function renderHackGame(game, el, hs) {
  el.innerHTML = `<h2>💻 ${esc(hs.sys.name)}</h2><div class="terminal">접속 중... 방화벽 우회 시퀀스를 순서대로 입력하라</div>
    <div class="seq">${hs.seq.map((c, i) => `<span class="${i < hs.idx ? 'ok' : i === hs.idx ? 'cur' : ''}">${c}</span>`).join('')}</div>
    <div class="timer"><div style="width:${(hs.left / hs.total) * 100}%"></div></div>
    <div class="hexgrid" style="grid-template-columns:repeat(${hs.cols},1fr)">${hs.grid.map((c, i) => `<button data-i="${i}" class="${hs.used.has(i) ? 'used' : ''}">${c}</button>`).join('')}</div>`;
  el.querySelectorAll('.hexgrid button').forEach((b) => (b.onclick = () => game.hackClick(+b.dataset.i)));
}
export function updateHackTimer(hs) {
  const t = document.querySelector('#panel .timer div');
  if (t) t.style.width = (hs.left / hs.total) * 100 + '%';
}
export function makeHackState(sys, r) {
  const HEX = '0123456789ABCDEF';
  const code = () => HEX[Math.floor(r() * 16)] + HEX[Math.floor(r() * 16)];
  const len = 2 + sys.diff + (sys.diff === 3 ? 1 : 0);
  const cols = sys.diff === 1 ? 5 : 6;
  const seq = Array.from({ length: len }, code);
  const grid = Array.from({ length: cols * cols }, code);
  shuffle(r, grid.map((_, i) => i)).slice(0, len).forEach((slot, i) => (grid[slot] = seq[i]));
  const total = [0, 16, 15, 14][sys.diff];
  return { sys, seq, grid, cols, idx: 0, used: new Set(), left: total, total, active: true };
}

PANELS.drone = (game, el) => {
  const T = game.target, name = T.tools.drone;
  const icon = T.era === 1945 ? '✈️' : '🛸';
  let action = '';
  if (game.viewName === 'country') action = `<p>이 나라의 모든 장소 상공을 ${name}로 훑어 <b>경호 수준</b>을 표시합니다. (2시간)</p><button class="btn primary big" id="droneBtn">${icon} ${esc(game.views.country.c.ko)} 전체 스캔</button>`;
  else if (game.viewName === 'scene') action = `<p>이 장소 상공에 ${name}를 띄워 <b>경호 인력 위치</b>를 30초간 붉게 표시합니다. (1시간)</p><button class="btn primary big" id="droneBtn">${icon} ${name} 띄우기</button>`;
  else action = '<p class="warn">나라 지도나 장소 안에서 사용할 수 있어요.</p>';
  el.innerHTML = `<h2>${icon} ${esc(name)}</h2><p class="muted">적대 지역(${esc(geo.byName.get(T.hostile)?.ko || T.hostile)})에서는 격추될 수 있고 경계도가 오릅니다.</p>${action}
    <h3>스캔 기록</h3>${Object.keys(game.droneScans).length ? `<div class="list">${Object.entries(game.droneScans).map(([id, lv]) => `<div class="post"><span class="lv lv${lv}">${'■'.repeat(lv)}${'□'.repeat(3 - lv)}</span> ${esc(game.poiById(id)?.name || id)}</div>`).join('')}</div>` : '<div class="post muted">아직 없음</div>'}`;
  el.querySelector('#droneBtn')?.addEventListener('click', () => game.useDrone());
};

PANELS.tap = (game, el) => {
  const T = game.target;
  el.innerHTML = `<h2>🎧 ${esc(T.tools.tap)}</h2><p class="muted">회선에 몰래 접속해 대화를 엿듣습니다 (1회 4시간). 잡음이 섞이지만 신뢰도가 높아요. 경계도가 오릅니다.</p><div id="tapOut"></div><div class="list" id="lines"></div>`;
  const list = el.querySelector('#lines');
  for (const l of T.wiretap) {
    const done = game.tapped[l.id];
    const d = document.createElement('div');
    d.className = 'contact';
    d.innerHTML = `<img class="ico" src="${iconDataURL('headset', 2)}"><div class="grow"><b>${esc(l.name)}</b></div><button class="btn small" ${done ? 'disabled' : ''}>${done ? '완료' : '감청'}</button>`;
    d.querySelector('button').onclick = () => game.wiretap(l.id);
    list.appendChild(d);
  }
  const lt = game.lastTap;
  if (lt) {
    const out = el.querySelector('#tapOut');
    out.innerHTML = `<div class="bubble radio"><b>🎧 ${esc(lt.name)}</b><div class="typed"></div></div>`;
    const typed = out.querySelector('.typed');
    if (lt.fresh) { lt.fresh = false; speak(typed, lt.text, { pitch: 110 + (hashStr(lt.name) % 60), vari: 0.3, formant: 0.95, radio: true }); } else typed.textContent = lt.text;
  }
};

PANELS.notes = (game, el) => {
  el.innerHTML = `<h2>📓 수첩</h2><p class="muted">모은 단서가 기록됩니다. 별이 많을수록 믿을 만한 정보입니다.</p>
    ${game.clues.length ? '' : '<div class="post muted">아직 단서가 없습니다.</div>'}
    ${game.clues.slice().reverse().map((c) => `<div class="clue"><div class="src">${esc(c.src)} <span class="stars">${stars(c.stars)}</span></div><div>${esc(c.text)}</div><div class="muted small">${esc(c.when)}</div></div>`).join('')}`;
};

PANELS.dossier = (game, el) => {
  const T = game.target;
  el.innerHTML = `<h2>📁 대상 정보</h2>
    <div class="card target"><div class="card-head"><img class="portrait" src="${bustURL(T.look(), 4, '#3a1a1a')}"><div><div class="card-name">${esc(T.name)}</div><div class="muted">${esc(T.nameEn)}</div><div class="muted">${esc(T.info.job)}</div></div></div>
    <table class="fields"><tr><th>나이</th><td>${T.info.age}세 (${esc(T.info.birth)})</td></tr><tr><th>국적</th><td>${esc(T.info.nationality)}</td></tr></table></div>
    <h3>식별 포인트</h3><ul class="points">${T.dossier.points.map((p) => `<li>${p}</li>`).join('')}</ul>
    <h3>동선 특징</h3><ul class="points">${T.dossier.moves.map((p) => `<li>${p}</li>`).join('')}</ul>`;
};

// ───────────── 전체 화면 ─────────────
let prisonView = null;
export function showScreen(html, onClick) {
  if (prisonView) { prisonView.stop(); prisonView = null; }
  const s = $('#screen');
  s.innerHTML = html;
  s.classList.remove('hidden');
  s.scrollTop = 0;
  s.onclick = (e) => { const b = e.target.closest('[data-act]'); if (b) onClick(b.dataset.act, b); };
}
export function hideScreen() { if (prisonView) { prisonView.stop(); prisonView = null; } $('#screen').classList.add('hidden'); }

export function showPrison(game, highlight, onBack) {
  const data = loadPrison();
  const fmt = (rec) => (rec ? `${esc(rec.date)} · ${esc(rec.place)} · ${fmtHours(rec.hours)} · ${rec.grade}등급` : '-');
  const cards = TARGET_ORDER.map((id, i) => {
    const T = TARGETS[id], d = data[id];
    return `<div class="pcard ${d ? '' : 'locked'} ${highlight === id ? 'new' : ''}">
      <div class="pno">No.${String(i + 1).padStart(3, '0')}${highlight === id ? ' <span class="newtag">NEW!</span>' : ''}</div>
      ${d ? `<img src="${bustURL(T.look(), 3, '#2a2a30')}"><div class="tname">${esc(T.name)}</div><div class="muted small">${esc(T.title)}</div>
        <div class="small reason">${esc(T.prison.reason)}</div>
        <table class="fields small"><tr><th>포획</th><td>${d.count}회</td></tr><tr><th>최초</th><td>${fmt(d.first)}</td></tr><tr><th>최고 기록</th><td>${fmt(d.best)}</td></tr></table>
        <button class="btn small" data-act="visit" data-id="${id}">💬 면회</button>`
        : `<div class="q">?</div><div class="tname">???</div><div class="muted small">아직 포획하지 못함</div>`}
    </div>`;
  }).join('');
  const n = Object.keys(data).filter((k) => TARGETS[k]).length;
  showScreen(`<div class="prison-wrap"><h1>🏛 교도소 <span class="muted">(${n}/${TARGET_ORDER.length})</span></h1>
    <div class="prison-stage"><canvas id="prisonCanvas"></canvas><div id="prisonBubble" class="pbubble hidden"><b></b><div class="typed"></div></div></div>
    <p class="muted small">감방을 누르면 면회할 수 있어요.</p>
    <div class="pcards">${cards}</div>
    <button class="btn big" data-act="back">← 돌아가기</button></div>`, (a, b) => {
    if (a === 'back') { game.sfx('click'); onBack(); }
    if (a === 'visit') visit(b.dataset.id);
  });
  const visit = (id) => {
    const T = TARGETS[id];
    if (!data[id]) return;
    const bub = $('#prisonBubble');
    const idx = TARGET_ORDER.indexOf(id);
    bub.style.left = idx === 0 ? '3%' : idx === 1 ? '50%' : 'auto';
    bub.style.right = idx === 2 ? '3%' : 'auto';
    bub.style.transform = idx === 1 ? 'translateX(-50%)' : 'none';
    bub.classList.remove('hidden');
    bub.querySelector('b').textContent = T.name;
    speak(bub.querySelector('.typed'), pick(Math.random, T.prison.quotes), T.voice);
  };
  prisonView = new PrisonView($('#prisonCanvas'), (cell) => { if (cell.caught) visit(cell.id); else game.sfx('error'); });
}
