// 시나리오(대상의 실제 위치)와 단서 생성 — 대상 정의(targets.js)를 받아 동작하는 범용 엔진
import { COUNTRY_POIS, COUNTRY_POIS_1945, poiListFor } from './data.js';
import { mulberry32, weighted, pick, shuffle, chance, hashStr } from './util.js';

export const POI_INDEX = {};
for (const lists of [COUNTRY_POIS, COUNTRY_POIS_1945]) for (const [country, list] of Object.entries(lists)) for (const p of list) POI_INDEX[p.id] = { ...p, country };

export function newScenario(T, seed) {
  const r = mulberry32(seed);
  const spot = weighted(r, T.spots);
  const homePois = (poiListFor(T.home, T.era) || []).map((p) => p.id).filter((id) => id !== spot.poi);
  const doublePois = new Set(shuffle(r, homePois).slice(0, 2));
  if (spot.foreign && chance(r, 0.6)) {
    const others = (poiListFor(spot.country, T.era) || []).map((p) => p.id).filter((id) => id !== spot.poi);
    if (others.length) doublePois.add(pick(r, others));
  }
  const officialPois = new Set(T.officialGroups ? homePois.filter(() => chance(r, 0.5)) : []);
  return { seed, spot, doublePois, officialPois };
}

function decoy(r, T, s, pred = () => true) {
  const others = T.spots.filter((x) => x.poi !== s.poi && pred(x));
  return others.length ? pick(r, others) : pick(r, T.spots.filter((x) => x.poi !== s.poi));
}
const stars = (rel) => Math.max(1, Math.round(rel * 5));

// ── 전화 ──
export function callContact(game, id) {
  const T = game.target, r = game.rng;
  const c = T.contacts.find((x) => x.id === id);
  const used = game.calls[id] || 0;
  if (chance(r, c.busy)) return { text: '(뚜— 뚜— 뚜—) … 전화를 받지 않는다.', cost: 0.5, missed: true };
  if (used >= c.clues.length) return { text: pick(r, ['지금은 더 알려줄 게 없어. 새 소식 있으면 연락할게.', '미안, 이미 아는 건 다 말했어.', '그 이상은 나도 몰라. 조심해.']), cost: 0.5 };
  const kind = c.clues[used];
  game.calls[id] = used + 1;
  const s0 = game.scenario.spot;
  const s = r() < c.rel ? s0 : decoy(r, T, s0, T.pred[kind] ? T.pred[kind](s0) : undefined);
  const text = T.clue[kind](s, r, T);
  return { text, cost: 1, clue: { src: `📞 ${c.name} (${c.org})`, text, stars: stars(c.rel) } };
}

// ── SNS / 신문 ──
export function snsTags(T) {
  const s = new Set([...T.sns.generic, ...Object.keys(T.sns.transport)]);
  T.spots.forEach((x) => x.kw.forEach((k) => s.add(k)));
  return [...s];
}
export function snsSearch(game, kwRaw) {
  const T = game.target, S = T.sns;
  const kw = kwRaw.replace(/^#/, '').replace(/\s+/g, '').trim();
  const r = mulberry32((game.scenario.seed ^ hashStr(kw)) >>> 0);
  const s = game.scenario.spot;
  const posts = [], clues = [];
  const src = `📱 ${S.label} #${kw}`;
  if (S.generic.includes(kw)) {
    const hs = chance(r, 0.7) ? s : decoy(r, T, s);
    posts.push({ text: S.rumor(hs) });
    clues.push({ src, text: `${S.rumor(hs)} (미확인)`, stars: 2 });
    shuffle(r, S.noise).slice(0, 4).forEach((t) => posts.push({ text: t }));
  } else if (S.transport[kw]) {
    const mode = S.transport[kw];
    if (s.transport === mode) { const t = S.pos[mode](s); posts.push({ text: t, photo: S.photo[mode] }); clues.push({ src, text: t, stars: 3 }); }
    else { posts.push({ text: S.neg[mode] }); clues.push({ src, text: S.neg[mode], stars: 3 }); }
    shuffle(r, S.noise).slice(0, 3).forEach((t) => posts.push({ text: t }));
  } else if (s.kw.includes(kw)) {
    const ev = shuffle(r, S.evidence(s)).slice(0, 2 + (r() < 0.5 ? 1 : 0));
    ev.forEach((p) => posts.push(p));
    clues.push({ src, text: `${s.area} 목격담: ${ev[0].text.slice(0, 42)}…`, stars: 4 });
    for (let i = 0; i < 2; i++) posts.push({ text: pick(r, S.normal)(s.area) });
  } else if (T.spots.some((x) => x.kw.includes(kw))) {
    const sp = T.spots.find((x) => x.kw.includes(kw));
    for (let i = 0; i < 4; i++) posts.push({ text: pick(r, S.normal)(sp.area) });
    if (chance(r, 0.25)) { const d = decoy(r, T, s); posts.push({ text: `여기 오늘 좀 이상하지 않음? 뭔가 있는 듯...? (${d.area})` }); }
    clues.push({ src, text: `#${kw}: 특별한 목격담 없음`, stars: 3 });
  } else {
    posts.push({ text: `#${kw} 관련 기사/게시물이 거의 없습니다.`, system: true });
  }
  return { posts: shuffle(r, posts).map((p) => ({ ...p, likes: Math.floor(r() * 900), ago: 1 + Math.floor(r() * 47), seed: Math.floor(r() * 1e9) })), clues };
}

// ── 해킹 / 암호 해독 ──
export function hackResult(game, sysId) {
  const T = game.target, s = game.scenario.spot;
  const sys = T.hacks.find((h) => h.id === sysId);
  return sys.result(s, { poiName: POI_INDEX[s.poi].name, here: game.loc.country, n: game.time | 0 });
}

// ── 도청 / 무선 감청 ──
export function wiretap(game, lineId) {
  const T = game.target, r = game.rng;
  const line = T.wiretap.find((l) => l.id === lineId);
  const s0 = game.scenario.spot;
  const s = r() < 0.85 ? s0 : decoy(r, T, s0);
  const text = line.gen(s);
  return { text, clue: { src: `🎧 ${T.tools.tap} · ${line.name}`, text, stars: 4 } };
}

// ── 드론 / 정찰기: 나라 안 모든 장소의 경호 수준 ──
export function droneLevels(game, pois) {
  const sc = game.scenario;
  const r = mulberry32((sc.seed ^ hashStr('drone' + game.loc.country)) >>> 0);
  const out = {};
  for (const p of pois) {
    if (p.id === sc.spot.poi) out[p.id] = 3;
    else if (sc.doublePois.has(p.id)) out[p.id] = r() < 0.5 ? 3 : 2;
    else if (sc.officialPois.has(p.id)) out[p.id] = 1 + (r() < 0.3 ? 1 : 0);
    else out[p.id] = r() < 0.12 ? 1 : 0;
  }
  return out;
}

// ── 탐문 ──
export function askPerson(game, person, poiId, countryName) {
  const T = game.target, K = T.talk, r = game.rng, s = game.scenario.spot;
  const hostile = countryName === T.hostile;
  const m = hostile ? T.alertMul : 0.3;
  const a = (v) => Math.round(v * m);
  if (person.role === 'guard') return { text: K.guard, alert: a(8) };
  if (person.isTarget) return { text: K.target, alert: a(10) };
  if (hostile && chance(r, 0.3)) return { text: K.flee, alert: a(5) };
  if (poiId === s.poi) {
    const t = pick(r, K.here);
    return { text: t, alert: a(3), clue: { src: '🗣️ 현장 탐문', text: `${POI_INDEX[poiId]?.name || '이곳'}: "${t}"`, stars: 4 } };
  }
  if (countryName === s.country && chance(r, 0.5)) {
    const t = K.rumor(s, K.how[s.transport]);
    return { text: t, alert: a(3), clue: { src: '🗣️ 현장 탐문', text: `"${t}"`, stars: 3 } };
  }
  if (chance(r, 0.22)) {
    const t = K.decoy(decoy(r, T, s));
    return { text: t, alert: a(3), clue: { src: '🗣️ 현장 탐문', text: `"${t}"`, stars: 1 } };
  }
  return { text: pick(r, hostile ? K.hostileMundane : K.mundane), alert: a(2) };
}
