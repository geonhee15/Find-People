// 시나리오(대상의 실제 위치)와 단서 생성 로직
import { SPOTS, CONTACTS, COUNTRY_POIS, HACK_SYSTEMS } from './data.js';
import { KO } from './geo.js';
import { mulberry32, weighted, pick, shuffle, chance } from './util.js';

export const POI_INDEX = {};
for (const [country, list] of Object.entries(COUNTRY_POIS)) for (const p of list) POI_INDEX[p.id] = { ...p, country };

export function newScenario(seed) {
  const r = mulberry32(seed);
  const spot = weighted(r, SPOTS);
  const nkPois = COUNTRY_POIS['North Korea'].map((p) => p.id).filter((id) => id !== spot.poi);
  const doublePois = new Set(shuffle(r, nkPois).slice(0, 2));
  if (spot.foreign && chance(r, 0.6)) {
    const others = COUNTRY_POIS[spot.country].map((p) => p.id).filter((id) => id !== spot.poi);
    if (others.length) doublePois.add(pick(r, others));
  }
  const officialPois = new Set(nkPois.filter(() => chance(r, 0.5)));
  return { seed, spot, doublePois, officialPois, rng: r };
}

const areaOf = (s) => s.area;
function decoy(r, s, pred = () => true) {
  const others = SPOTS.filter((x) => x.poi !== s.poi && pred(x));
  return others.length ? pick(r, others) : pick(r, SPOTS.filter((x) => x.poi !== s.poi));
}

// ── 전화 ──
const CLUE_TEXT = {
  border: (s) => (s.foreign
    ? s.transport === 'plane'
      ? "순안공항에서 전용기 '참매 1호'가 이륙한 정황이 있어. 해외로 나간 게 거의 확실해."
      : `최근 48시간 안에 특별열차가 ${s.border}를 건넌 정황이 있어. 해외(${KO[s.country]})야.`
    : '국경을 넘은 정황은 없어. 북한 안에 있다고 봐야지.'),
  direction: (s) => (s.foreign ? `움직임은 ${s.dir} 쪽으로 보고되고 있어.` : `경호 병력이 ${s.dir} 방향으로 이동한 게 포착됐어.`),
  capital: (s) => (s.area === '평양'
    ? "오늘 평양 시내 곳곳에 교통 통제가 있었어요. 전형적인 '1호 행사' 통제예요."
    : "평양 시내는 조용해요. '1호 행사' 통제는 없었어요. 지금 평양엔 없는 것 같아요."),
  transport: (s) => (s.transport === 'train'
    ? `${s.station} 인근에 창문을 가린 녹색 장편성 열차가 서 있는 게 위성에 잡혔어요. 1호 열차로 보여요.`
    : s.transport === 'plane'
      ? '순안공항 격납고에서 참매 1호가 사라졌어요. 장거리 비행이에요. 1호 열차는 차고에 그대로 있고요.'
      : s.area === '평양'
        ? '김일성광장 주변에 방탄차량과 가림막 구조물이 잔뜩 보여요. 열차는 안 움직였어요.'
        : `1호 열차는 차고에 그대로예요. 대신 평양에서 ${s.dir} 쪽으로 방탄차량 행렬이 빠져나가는 게 찍혔어요.`),
  activity: (s) => `노동신문 쪽 소식통 말로는 곧 '${s.act}' 관련 보도가 나간대.`,
  favorites: (s, r) => {
    if (s.foreign) return `호위사령부 동기들이 요즘 해외 출장 준비로 정신없대요. ${KO[s.country]} 쪽이라던데...`;
    const dom = shuffle(r, SPOTS.filter((x) => !x.foreign && x.poi !== s.poi)).slice(0, 2).map(areaOf);
    const list = shuffle(r, [s.area, ...dom]);
    return `요즘 그분은 ${list.join(', ')} 쪽 특각(별장)이나 현장을 자주 찾는다고 들었어요. 그 셋 중 하나일 거예요.`;
  },
};
const PRED = {
  border: (s) => (x) => x.foreign !== s.foreign,
  capital: (s) => (x) => (x.area === '평양') !== (s.area === '평양'),
  transport: (s) => (x) => x.transport !== s.transport || x.station !== s.station,
};

export function callContact(game, id) {
  const c = CONTACTS.find((x) => x.id === id);
  const r = game.rng;
  const used = (game.calls[id] = game.calls[id] || 0);
  if (chance(r, c.busy)) return { text: '(뚜— 뚜— 뚜—) … 전화를 받지 않는다.', cost: 0.5, missed: true };
  if (used >= c.clues.length) return { text: pick(r, ['지금은 더 알려줄 게 없어. 새 소식 있으면 연락할게.', '미안, 이미 아는 건 다 말했어.', '그 이상은 나도 몰라. 조심해.']), cost: 0.5 };
  const kind = c.clues[used];
  game.calls[id] = used + 1;
  const reliable = r() < c.rel;
  const s = reliable ? game.scenario.spot : decoy(r, game.scenario.spot, (PRED[kind] || (() => () => true))(game.scenario.spot));
  const text = CLUE_TEXT[kind](s, r);
  return { text, cost: 1, clue: { src: `📞 ${c.name} (${c.org})`, text, stars: Math.round(c.rel * 5) } };
}

// ── SNS ──
const NOISE = [
  '김정은 건강이상설 또 나옴... 믿거나 말거나 🤔',
  '대역설 진짜임? 사진마다 얼굴이 좀 달라 보임. 점이나 안경 유무로 구분한다던데',
  "전문가: '최근 공개활동 주기가 불규칙해져'",
  '오늘 조선중앙TV 편성 이상하게 조용함',
  '1호 열차 추적하는 OSINT 계정 팔로우 추천합니다',
  '투블럭 머리+인민복 = 무조건 그 사람 아님. 요즘 따라하는 간부도 많대',
  '북한 뉴스 볼 때마다 경호원 선글라스가 제일 무서움',
];
const NORMAL = [
  (a) => `${a} 날씨 최고 ☀️`, (a) => `${a} 맛집 추천 좀 해주세요`, (a) => `${a} 사진 찍기 좋은 날 📷`,
  (a) => `${a} 다녀왔어요. 생각보다 사람 많네요`, (a) => `${a} 여행 3일차 🧳 발 아파요`, (a) => `(북한 전문 채널) ${a} 최근 모습 공개 영상`,
];
function evidencePosts(s) {
  const a = s.area;
  const out = [
    { text: `${a} 가는 길 전면 통제됨... 검은 벤츠 행렬 지나감 🚗🚗🚗`, photo: 'convoy' },
    { text: `${a}에 선글라스 낀 양복 아저씨들 엄청 많음. 귀에 이어폰 다 꽂고 있음`, photo: 'guards' },
  ];
  if (s.transport === 'train') out.push({ text: `${s.station} 근처에 초록색 긴 열차 서 있는데 창문이 다 막혀 있음. 뭐지?`, photo: 'train' });
  if (s.foreign) out.push({ text: `${a} 호텔 전체 예약 막힘. 경찰 쫙 깔림 (번역됨)`, photo: 'closed' });
  else out.push({ text: `오늘 ${a} 관광 일정 갑자기 취소됨. 안내원이 "특별한 사정"이래요 (북한 여행 커뮤니티)`, photo: null });
  return out;
}
export const SNS_TAGS = (() => {
  const s = new Set(['김정은', '북한', '1호열차', '참매1호', '정상회담', '현지지도']);
  SPOTS.forEach((x) => x.kw.forEach((k) => s.add(k)));
  return [...s];
})();

export function snsSearch(game, kwRaw) {
  const kw = kwRaw.replace(/^#/, '').replace(/\s+/g, '').trim();
  const r = mulberry32((game.scenario.seed ^ [...kw].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) >>> 0);
  const s = game.scenario.spot;
  const posts = [];
  const clues = [];
  const matchSpot = SPOTS.find((x) => x.kw.includes(kw) && x.area !== undefined && (x.area === kw || x.kw.indexOf(kw) === 0));
  const hitTrue = s.kw.includes(kw);
  if (kw === '김정은' || kw === '북한') {
    const hs = chance(r, 0.7) ? s : decoy(r, s);
    posts.push({ text: `[찌라시] ${hs.area} 쪽에 '1호 행사'가 있다는 얘기 돌고 있음. 확인은 안 됨`, photo: null });
    clues.push({ src: `📱 SNS #${kw}`, text: `찌라시: ${hs.area} 쪽에 '1호 행사' 소문 (미확인)`, stars: 2 });
    shuffle(r, NOISE).slice(0, 4).forEach((t) => posts.push({ text: t }));
  } else if (kw === '1호열차') {
    if (s.transport === 'train') {
      posts.push({ text: `위성사진 보니 1호 열차가 차고에서 빠졌음. ${s.station} 방향 선로에서 포착됐다는 글 있음`, photo: 'train' });
      clues.push({ src: '📱 SNS #1호열차', text: `1호 열차가 ${s.station} 방향에서 포착됐다는 글`, stars: 3 });
    } else {
      posts.push({ text: '요즘 1호 열차는 평양 차고에 그대로 서 있다던데? 이번엔 열차 이동 아닌 듯', photo: null });
      clues.push({ src: '📱 SNS #1호열차', text: '1호 열차는 이번에 움직이지 않았다는 글', stars: 3 });
    }
    shuffle(r, NOISE).slice(0, 3).forEach((t) => posts.push({ text: t }));
  } else if (kw === '참매1호') {
    if (s.transport === 'plane') { posts.push({ text: `순안공항 항공기 추적 앱에 참매 1호 신호 잡힘! 서쪽으로 장거리 비행 중`, photo: null }); clues.push({ src: '📱 SNS #참매1호', text: '참매 1호가 장거리 비행 중이라는 글', stars: 3 }); }
    else { posts.push({ text: '참매 1호는 한동안 안 떴음. 추적 앱에 기록 없음', photo: null }); clues.push({ src: '📱 SNS #참매1호', text: '참매 1호 비행 기록 없음', stars: 3 }); }
    shuffle(r, NOISE).slice(0, 3).forEach((t) => posts.push({ text: t }));
  } else if (hitTrue) {
    const ev = shuffle(r, evidencePosts(s)).slice(0, 2 + (r() < 0.5 ? 1 : 0));
    ev.forEach((p) => posts.push(p));
    clues.push({ src: `📱 SNS #${kw}`, text: `${s.area} 관련 목격담: ${ev[0].text.slice(0, 40)}…`, stars: 4 });
    for (let i = 0; i < 2; i++) posts.push({ text: pick(r, NORMAL)(s.area) });
  } else if (matchSpot || SPOTS.some((x) => x.kw.includes(kw))) {
    const sp = SPOTS.find((x) => x.kw.includes(kw));
    for (let i = 0; i < 4; i++) posts.push({ text: pick(r, NORMAL)(sp.area) });
    if (chance(r, 0.25)) { const d = decoy(r, s); posts.push({ text: `여기 오늘 좀 이상하지 않음? 뭔가 있는 듯...? (${d.area})`, photo: null }); }
    clues.push({ src: `📱 SNS #${kw}`, text: `#${kw}: 특이한 목격담 없음`, stars: 3 });
  } else {
    posts.push({ text: `#${kw} 관련 게시물이 거의 없습니다.`, system: true });
  }
  return { posts: shuffle(r, posts).map((p) => ({ ...p, likes: Math.floor(r() * 900), ago: 1 + Math.floor(r() * 47), seed: Math.floor(r() * 1e9) })), clues };
}

// ── 해킹 ──
export function hackResult(game, sysId) {
  const s = game.scenario.spot;
  const poiName = POI_INDEX[s.poi].name;
  switch (sysId) {
    case 'cctv': {
      const here = game.loc.country;
      if (s.country === here) return `CCTV #${100 + (game.time | 0)}: ${poiName} 인근 도로에서 방탄차량 행렬 + 경호 차량 포착!`;
      return `${KO[here] || here} 주요 도로 CCTV 스캔 완료 — VIP 차량 행렬 없음.`;
    }
    case 'rail':
      if (s.transport === 'train') return `특별열차 운행기록: 평양 출발 → ${s.foreign ? s.border + ' 통과 → ' : ''}${s.station} 도착 (정차 중)`;
      return '특별열차 운행기록: 최근 7일 운행 없음 (평양 차고 대기).';
    case 'atc':
      if (s.transport === 'plane') return `비행계획 FPL: 참매 1호 (P-618) 순안 → ${s.station} — 도착 완료`;
      return '참매 1호 / 국가 전용기 비행계획 없음.';
    case 'guard':
      return `암호 해독 성공 — 1호 행사 작전구역: 「${poiName}」`;
  }
  return '';
}
export { HACK_SYSTEMS };

// ── 탐문 ──
const MUNDANE = ['잘 모르겠는데요.', '오늘 날씨 좋네요.', '관광객이세요?', '바빠서요, 죄송해요.', '뉴스에서 북한 얘기 나오던데 전 관심 없어요.', '길 물어보시는 거면 저쪽이요.', '(이어폰을 끼고 있어 못 들은 척한다)'];
const NK_MUNDANE = ['…그런 건 묻지 마시라요.', '저는 모릅네다.', '(대답 없이 고개를 젓는다)', '오늘 생산 과제가 많아서 바쁩네다.'];
export function askPerson(game, person, poiId, countryName) {
  const r = game.rng, s = game.scenario.spot;
  const nk = countryName === 'North Korea';
  if (person.role === 'guard') return { text: '물러서십시오. 여기서 뭐 하시는 겁니까?', alert: nk ? 8 : 4 };
  if (person.isTarget) return { text: '(경호원들이 앞을 가로막는다)', alert: 10 };
  if (nk && chance(r, 0.3)) return { text: '…(당황하며 대답을 피하고 자리를 뜬다)', alert: 5 };
  if (poiId === s.poi) {
    const t = pick(r, ['오늘 저쪽은 못 가게 막더라고요. 경호원들이 쫙 깔렸어요.', '아까 검은 차들이 줄지어 들어왔어요. 높으신 분이 온 것 같아요.', '(주위를 살피며) 여기 오늘 분위기가 이상해요… 조심하세요.', '저 안쪽에 간부들이 수첩 들고 우르르 몰려다니던데요.']);
    return { text: t, alert: nk ? 3 : 1, clue: { src: '🗣️ 현장 탐문', text: `${POI_INDEX[poiId]?.name || '이곳'}: "${t}"`, stars: 4 } };
  }
  if (countryName === s.country && chance(r, 0.5)) {
    const how = s.transport === 'train' ? '특별열차가' : s.transport === 'plane' ? '전용기가' : '검은 차 행렬이';
    const t = `${s.area} 쪽으로 ${how} 갔다는 소문 들었어요.`;
    return { text: t, alert: nk ? 3 : 0, clue: { src: '🗣️ 현장 탐문', text: `"${t}"`, stars: 3 } };
  }
  if (chance(r, 0.22)) {
    const d = decoy(r, s);
    const t = `친구가 그러는데 ${d.area}에 뭔가 큰 행사가 있대요. 확실하진 않아요.`;
    return { text: t, alert: nk ? 3 : 0, clue: { src: '🗣️ 현장 탐문', text: `"${t}"`, stars: 1 } };
  }
  return { text: pick(r, nk ? NK_MUNDANE : MUNDANE), alert: nk ? 2 : 0 };
}
