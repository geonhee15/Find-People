// DOM UI: HUD, 도구 패널(전화/SNS/해킹/수첩/대상정보/인물카드), 모달, 화면 전환
import { ICON, iconDataURL } from './art.js';
import { bust, genLook, targetLook } from './people.js';
import { CONTACTS, HACK_SYSTEMS } from './data.js';
import { SNS_TAGS } from './story.js';
import { geo } from './geo.js';
import { makeCanvas, mulberry32, hashStr, fmtHours, pick, shuffle } from './util.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function bustURL(look, scale = 4, bg = '#1b2233') {
  const b = bust(look, bg);
  const [c, x] = makeCanvas(32 * scale, 32 * scale);
  x.drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL();
}
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const TOOLS = [
  { id: 'scope', icon: 'telescope', label: '망원경', key: 'T' },
  { id: 'phone', icon: 'phone', label: '전화', key: 'P' },
  { id: 'sns', icon: 'sns', label: 'SNS', key: 'S' },
  { id: 'hack', icon: 'hack', label: '해킹', key: 'H' },
  { id: 'notes', icon: 'notebook', label: '수첩', key: 'N' },
  { id: 'dossier', icon: 'dossier', label: '대상 정보', key: 'D' },
];

export function initUI(game) {
  const tb = $('#toolbar');
  tb.innerHTML = '';
  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = `<button class="tool" data-nav="back"><img src="${iconDataURL('back')}"><span>뒤로 <kbd>Esc</kbd></span></button>
    <button class="tool" data-nav="globe"><img src="${iconDataURL('globe')}"><span>지구본 <kbd>G</kbd></span></button>`;
  tb.appendChild(nav);
  const tools = document.createElement('div');
  tools.className = 'tools';
  for (const t of TOOLS) {
    const b = document.createElement('button');
    b.className = 'tool'; b.dataset.tool = t.id;
    b.innerHTML = `<img src="${iconDataURL(t.icon)}"><span>${t.label} <kbd>${t.key}</kbd></span>`;
    tools.appendChild(b);
  }
  tb.appendChild(tools);
  tb.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    game.sfx('click');
    if (b.dataset.nav === 'back') game.back();
    if (b.dataset.nav === 'globe') game.goGlobe();
    if (b.dataset.tool) game.useTool(b.dataset.tool);
  });
  $('#hudTarget').getContext('2d').drawImage(bust(targetLook(), '#3a1a1a'), 0, 0);
}

export function renderHud(game) {
  const start = new Date(2026, 9, 1, 9, 0);
  const now = new Date(start.getTime() + game.time * 3600e3);
  const wd = '일월화수목금토'[now.getDay()];
  $('#hudDate').textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 (${wd}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
  document.querySelector('#toolbar [data-nav="back"]').disabled = game.viewName === 'globe';
}

export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = msg;
  $('#toasts').appendChild(t);
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
  const name = game.panel;
  const fn = PANELS[name] || PANELS.info;
  p.onclick = null;
  p.innerHTML = '';
  p.scrollTop = 0;
  fn(game, p);
}

const PANELS = {};

PANELS.info = (game, el) => {
  if (game.viewName === 'globe') {
    el.innerHTML = `<h2>🌍 세계 지도</h2>
      <p class="muted">지구본을 드래그해서 돌리고, 휠로 확대/축소하세요. 나라를 클릭하면 비행기로 이동합니다.</p>
      <input id="cSearch" class="input" placeholder="나라 이름 검색 (예: 북한, 러시아)">
      <div id="cList" class="list"></div>
      <h3>빠른 이동</h3><div class="chips">${['North Korea', 'South Korea', 'China', 'Russia', 'Japan', 'United States of America', 'Vietnam'].map((n) => `<button class="chip" data-c="${n}">${geo.byName.get(n)?.ko}</button>`).join('')}</div>`;
    const list = el.querySelector('#cList');
    const input = el.querySelector('#cSearch');
    const fill = () => {
      const q = input.value.trim().toLowerCase();
      list.innerHTML = q ? geo.list.filter((c) => c.ko.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 8).map((c) => `<button class="row-btn" data-c="${esc(c.name)}">${esc(c.ko)} <span class="muted">${esc(c.name)}</span></button>`).join('') : '';
    };
    input.addEventListener('input', fill);
    el.onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) game.requestTravelCountry(geo.byName.get(b.dataset.c)); };
  } else if (game.viewName === 'country') {
    const v = game.views.country;
    el.innerHTML = `<h2>🗺️ ${esc(v.c.ko)}</h2><p class="muted">아이콘을 클릭하면 그 장소로 이동합니다. 주변 나라를 클릭하면 비행기로 넘어갑니다.</p>
      <div class="list">${v.pois.map((p) => `<button class="row-btn" data-p="${esc(p.id)}"><img class="ico" src="${iconDataURL(ICON[p.type] ? p.type : 'landmark', 2)}"><span>${esc(p.name)}<br><span class="muted">${game.loc.poi === p.id ? '현재 위치' : '이동 약 ' + game.poiTravelHours(p).toFixed(1) + '시간'}</span></span></button>`).join('')}</div>`;
    el.onclick = (e) => { const b = e.target.closest('[data-p]'); if (b) game.requestTravelPoi(game.poiById(b.dataset.p)); };
  } else {
    el.innerHTML = `<h2>🧍 인물 카드</h2><p class="muted">사람을 클릭하면 신원을 조회합니다 (15분 소요).<br>망원경(T)으로 먼저 얼굴을 확인하면 시간을 아낄 수 있어요.</p>
      <div class="tip">💡 대상 특징: 옆머리를 바짝 민 투블럭, 검은 인민복, 둥근 얼굴. 주변에 검은 양복·선글라스 경호원과 수첩 든 간부들이 따라다닙니다.</div>`;
  }
};

PANELS.card = (game, el) => {
  const p = game.selected;
  if (!p) return PANELS.info(game, el);
  if (!p.checked) { el.innerHTML = `<div class="card scanning"><div class="scan">🔍 안면 인식 · 신원 조회 중...</div></div>`; return; }
  const i = p.info;
  const verdict = p.isTarget ? `<div class="verdict ok">✔ 신원 일치 — 대상 확인!</div>` : p.isDouble ? `<div class="verdict warn">✖ 불일치 · 외형 유사 (대역 가능성)</div>` : `<div class="verdict no">✖ 대상 불일치</div>`;
  el.innerHTML = `<div class="card ${p.isTarget ? 'target' : ''}">
    <div class="card-head"><img class="portrait" src="${bustURL(p.look, 4, p.isTarget ? '#3a1a1a' : '#1b2233')}"><div>
      <div class="card-name">${esc(i.name)}</div><div class="muted">${esc(i.job)}</div></div></div>
    <table class="fields">
      <tr><th>나이</th><td>${i.age}세</td></tr>
      <tr><th>출생</th><td>${esc(i.birth)}</td></tr>
      <tr><th>출생지</th><td>${esc(i.birthplace)}</td></tr>
      <tr><th>국적</th><td>${esc(i.nationality)}</td></tr>
      <tr><th>직업</th><td>${esc(i.job)}</td></tr>
      <tr><th>비고</th><td>${esc(i.note)}</td></tr>
    </table>${verdict}
    <div class="row"><button class="btn" id="talkBtn" ${p.talked || p.isTarget ? 'disabled' : ''}>🗣 말 걸기 (30분)</button></div>
    <div id="talkOut" class="talk">${p.talkText ? '“' + esc(p.talkText) + '”' : ''}</div></div>`;
  el.querySelector('#talkBtn').onclick = () => game.talk(p);
};

PANELS.phone = (game, el) => {
  el.innerHTML = `<h2>📞 전화</h2><p class="muted">정보원에게 전화를 겁니다 (통화 1시간). 신뢰도가 낮은 정보원은 틀린 정보를 줄 수 있어요.</p><div class="list" id="contacts"></div><div id="callOut"></div>`;
  const list = el.querySelector('#contacts');
  for (const c of CONTACTS) {
    const look = genLook(mulberry32(hashStr(c.id)), c.look);
    const used = game.calls[c.id] || 0;
    const b = document.createElement('div');
    b.className = 'contact';
    b.innerHTML = `<img class="avatar" src="${bustURL(look, 2)}"><div class="grow"><b>${esc(c.name)}</b><div class="muted">${esc(c.org)}</div><div class="stars" title="신뢰도">${stars(Math.round(c.rel * 5))}</div></div>
      <button class="btn small" ${used >= c.clues.length ? 'disabled' : ''}>${used >= c.clues.length ? '정보 소진' : '통화'}</button>`;
    b.querySelector('button').onclick = () => game.callContact(c.id);
    list.appendChild(b);
  }
  if (game.lastCall) {
    const out = el.querySelector('#callOut');
    out.innerHTML = `<div class="bubble"><b>${esc(game.lastCall.name)}</b><div class="typed"></div></div>`;
    typewrite(out.querySelector('.typed'), game.lastCall.text);
  }
};

function typewrite(node, text) {
  let i = 0;
  const id = setInterval(() => { node.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(id); }, 18);
}

function snsPhoto(kind, seed) {
  const [c, x] = makeCanvas(64, 28);
  const r = mulberry32(seed);
  x.fillStyle = '#8ab8e0'; x.fillRect(0, 0, 64, 14); x.fillStyle = '#6a6a70'; x.fillRect(0, 14, 64, 14);
  if (kind === 'convoy') for (let i = 0; i < 4; i++) { x.fillStyle = '#141418'; x.fillRect(4 + i * 15, 17, 12, 4); x.fillRect(6 + i * 15, 15, 7, 2); x.fillStyle = '#101010'; x.fillRect(5 + i * 15, 21, 2, 1); x.fillRect(12 + i * 15, 21, 2, 1); }
  if (kind === 'train') { x.fillStyle = '#1f4d34'; x.fillRect(0, 12, 64, 9); x.fillStyle = '#e8c030'; x.fillRect(0, 18, 64, 1); x.fillStyle = '#1a1a1a'; for (let i = 2; i < 64; i += 6) x.fillRect(i, 14, 4, 3); }
  if (kind === 'guards') for (let i = 0; i < 6; i++) { const gx = 4 + i * 10 + r() * 3; x.fillStyle = '#17171d'; x.fillRect(gx, 14, 4, 10); x.fillStyle = '#efc6a0'; x.fillRect(gx, 10, 4, 4); x.fillStyle = '#0e0e14'; x.fillRect(gx, 11, 4, 1); x.fillStyle = '#1c1c24'; x.fillRect(gx, 9, 4, 1); }
  if (kind === 'closed') { x.fillStyle = '#e8e8e8'; x.fillRect(10, 16, 44, 4); x.fillStyle = '#d02a2a'; for (let i = 10; i < 54; i += 8) x.fillRect(i, 16, 4, 4); x.fillStyle = '#2a3a8a'; x.fillRect(48, 10, 8, 12); }
  const [c2, x2] = makeCanvas(192, 84);
  x2.drawImage(c, 0, 0, 192, 84);
  return c2.toDataURL();
}

PANELS.sns = (game, el) => {
  el.innerHTML = `<h2>📱 SNS 검색</h2><p class="muted">키워드를 검색해 목격담을 찾습니다 (검색 1회 2시간, 이미 검색한 키워드는 무료).</p>
    <form id="snsForm" class="search"><input class="input" id="snsQ" placeholder="#키워드" value="${esc(game.snsLast || '')}"><button class="btn">검색</button></form>
    <div id="feed" class="feed"></div><h3>추천 해시태그</h3>
    <div class="chips">${SNS_TAGS.map((t) => `<button class="chip ${game.snsCache[t] ? 'done' : ''}" data-t="${esc(t)}">#${esc(t)}</button>`).join('')}</div>`;
  el.querySelector('#snsForm').onsubmit = (e) => { e.preventDefault(); game.snsSearch(el.querySelector('#snsQ').value); };
  el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => game.snsSearch(b.dataset.t)));
  const res = game.snsLast && game.snsCache[game.snsLast.replace(/^#/, '').replace(/\s+/g, '')];
  if (!res) return;
  const feed = el.querySelector('#feed');
  feed.innerHTML = `<div class="muted">#${esc(game.snsLast)} 검색 결과</div>`;
  for (const p of res.posts) {
    if (p.system) { feed.innerHTML += `<div class="post muted">${esc(p.text)}</div>`; continue; }
    const r = mulberry32(p.seed);
    const look = genLook(r, { group: pick(r, ['ko', 'en', 'zh', 'ru', 'ja']), role: 'civ' });
    const handle = pick(r, ['travel', 'daily', 'news', 'osint', 'photo', 'korea', 'watcher', 'foodie', 'hiker']) + '_' + Math.floor(r() * 9000 + 100);
    feed.innerHTML += `<div class="post"><img class="avatar" src="${bustURL(look, 1.5)}"><div class="grow"><b>@${handle}</b> <span class="muted">· ${p.ago}시간 전</span>
      <div>${esc(p.text)}</div>${p.photo ? `<img class="photo" src="${snsPhoto(p.photo, p.seed)}">` : ''}<div class="muted small">♥ ${p.likes}</div></div></div>`;
  }
};

PANELS.hack = (game, el) => {
  const hs = game.hackState;
  if (hs && hs.active) return renderHackGame(game, el, hs);
  el.innerHTML = `<h2>💻 해킹</h2><p class="muted">시스템에 침투해 기록을 빼냅니다 (1회 3시간). 코드 시퀀스를 제한 시간 안에 순서대로 클릭하세요. 실패하면 경계도가 크게 오릅니다.</p><div class="list" id="systems"></div>${game.lastHack ? `<div class="terminal">${esc(game.lastHack)}</div>` : ''}`;
  const list = el.querySelector('#systems');
  for (const s of HACK_SYSTEMS) {
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
  const len = 2 + sys.diff * 1 + (sys.diff === 3 ? 1 : 0);
  const cols = sys.diff === 1 ? 5 : 6;
  const seq = Array.from({ length: len }, code);
  const grid = Array.from({ length: cols * cols }, code);
  const slots = shuffle(r, grid.map((_, i) => i)).slice(0, len);
  seq.forEach((c, i) => (grid[slots[i]] = c));
  const total = [0, 16, 15, 14][sys.diff];
  return { sys, seq, grid, cols, idx: 0, used: new Set(), left: total, total, active: true };
}

PANELS.notes = (game, el) => {
  el.innerHTML = `<h2>📓 수첩</h2><p class="muted">모은 단서가 기록됩니다. 별이 많을수록 믿을 만한 정보입니다.</p>
    ${game.clues.length ? '' : '<div class="post muted">아직 단서가 없습니다. 전화·SNS·해킹·탐문으로 정보를 모으세요.</div>'}
    ${game.clues.slice().reverse().map((c) => `<div class="clue"><div class="src">${esc(c.src)} <span class="stars">${stars(c.stars)}</span></div><div>${esc(c.text)}</div><div class="muted small">${esc(c.when)}</div></div>`).join('')}`;
};

PANELS.dossier = (game, el) => {
  el.innerHTML = `<h2>📁 대상 정보</h2>
    <div class="card target"><div class="card-head"><img class="portrait" src="${bustURL(targetLook(), 4, '#3a1a1a')}"><div><div class="card-name">김정은</div><div class="muted">Kim Jong Un</div><div class="muted">조선노동당 총비서 · 국무위원장</div></div></div>
    <table class="fields"><tr><th>나이</th><td>42세 (1984년생, 공식)</td></tr><tr><th>국적</th><td>조선민주주의인민공화국</td></tr></table></div>
    <h3>식별 포인트</h3><ul class="points">
      <li>옆·뒷머리를 바짝 민 <b>투블럭</b>, 윗머리는 높고 납작하게 넘김</li>
      <li><b>검은 인민복</b> (깃이 목까지 올라옴), 김일성·김정일 <b>배지 미착용</b></li>
      <li><b>둥글고 넓은 얼굴</b>, 이중턱, 가는 눈썹과 가는 눈</li>
      <li>안경·점 없음</li>
      <li>주변에 <b>검은 양복+선글라스 경호원</b>, <b>수첩 든 간부</b>들이 따라붙음. 검은 방탄차량 동반</li>
    </ul>
    <h3>동선 특징</h3><ul class="points">
      <li>장거리는 주로 <b>1호 열차</b>(녹색 특별열차), 가끔 전용기 <b>참매 1호</b></li>
      <li>'1호 행사' 때는 주변 도로 통제·관광 취소가 잦음</li>
      <li><b>대역</b>이 있을 수 있음 — 얼굴형·안경·점을 비교할 것</li>
    </ul>`;
};

// ───────────── 전체 화면 (타이틀/선택/브리핑/결과) ─────────────
export function showScreen(html, onClick) {
  const s = $('#screen');
  s.innerHTML = html;
  s.classList.remove('hidden');
  s.onclick = (e) => { const b = e.target.closest('[data-act]'); if (b) onClick(b.dataset.act, b); };
}
export function hideScreen() { $('#screen').classList.add('hidden'); }
export { esc, stars };
