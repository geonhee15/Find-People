// 사람 생성: 외형(look) + 신상(info) + 픽셀 스프라이트 (저해상도 몸통, 고해상도 얼굴, 카드용 흉상)
import { makeCanvas, pick, chance, shade, mix, bayer, weighted } from './util.js';

export const SKIN = [
  ['#f7dabe', '#e8bf9b', '#b98e6c'],
  ['#efc6a0', '#d9a67f', '#a8795a'],
  ['#d9a16f', '#bf8455', '#8c5a37'],
  ['#a9724b', '#8b5936', '#5e3a22'],
  ['#6f4a31', '#583923', '#35220f'],
  ['#f0b481', '#d9985f', '#a4683c'],
];
const HAIRC = { black: '#1c1c24', dark: '#3a2a20', brown: '#6b4a2e', blond: '#d8b45c', red: '#9c4a24', gray: '#9b9b9f', white: '#e0e0e0' };
const EYE = '#1a1420';
const OLIVE = '#55633a';

// ───────────────────────── 이름 / 국적 그룹 ─────────────────────────
const N = {
  ko: { sur: '김 이 박 최 정 강 조 윤 장 임 한 오 서 신 권 황 안 송 류 홍 전 고 문 손 배 백 허 남 심 노 하 곽 성 차 주 우 구 민 유 진'.split(' '),
    m: '민준 서준 도윤 예준 시우 주원 하준 지호 준서 건우 현우 우진 선우 성민 정훈 영수 상철 동현 재민 승현 태영 광수 진호 형준 명수'.split(' '),
    f: '서연 서윤 지우 서현 민서 하은 하윤 윤서 지민 채원 수빈 지아 은정 미경 영희 순자 혜진 유나 소영 다은 가영 현정'.split(' '), order: 'east', sp: '' },
  nk: { sur: '김 리 박 최 정 강 조 윤 장 림 한 오 서 신 권 황 안 송 류 홍 전 고 문 손 배 백 허 남 심 로 하 곽 성 차 주 우 구 민 진'.split(' '),
    m: '철수 명철 광혁 성남 영철 경식 혁 일남 승철 국철 정남 룡수 만수 성혁 춘일 학철 은철 광철 영남'.split(' '),
    f: '설화 은별 향미 옥주 금순 선희 경옥 명순 은정 춘희 혜성 봄순 련희 옥순 영란 설경'.split(' '), order: 'east', sp: '' },
  zh: { sur: '왕 리 장 류 천 양 자오 황 저우 우 쉬 쑨 마 주 후 궈 허 린'.split(' '),
    m: '웨이 레이 제 타오 밍 하오 쥔 즈하오 하이양 젠궈 샤오밍'.split(' '), f: '팡 나 민 징 옌 린 샤오위 이판 위퉁 메이'.split(' '), order: 'east', sp: ' ' },
  ja: { sur: '사토 스즈키 다카하시 다나카 와타나베 이토 야마모토 나카무라 고바야시 가토 요시다 야마다 사사키 마쓰모토'.split(' '),
    m: '히로시 켄타 하루토 다이스케 쇼타 유토 렌 다쿠야 마사토 겐지'.split(' '), f: '유키 아야 사쿠라 미호 하나 유이 나나 아오이 리코 에미'.split(' '), order: 'east', sp: ' ' },
  vi: { sur: '응우옌 쩐 레 팜 호앙 판 부 당'.split(' '), m: '반안 득민 꽝하이 민뚜안 반훙'.split(' '), f: '티란 티흐엉 응옥마이 투짱 티호아'.split(' '), order: 'east', sp: ' ' },
  ru: { sur: '페트로프 스미르노프 이바노프 쿠즈네초프 포포프 소콜로프 레베데프 코즐로프 노비코프 모로조프 볼코프'.split(' '),
    m: '이반 드미트리 세르게이 알렉세이 니콜라이 미하일 안드레이 블라디미르 파벨 유리'.split(' '),
    f: '안나 마리야 올가 엘레나 나탈리야 타티야나 이리나 스베틀라나 율리야 크세니야'.split(' '), order: 'west', sp: ' ' },
  en: { sur: '스미스 존슨 브라운 밀러 윌슨 테일러 앤더슨 토머스 무어 마틴 클라크 화이트 해리스 톰프슨'.split(' '),
    m: '존 마이클 데이비드 제임스 로버트 크리스 대니얼 매슈 라이언 케빈 브라이언 에릭'.split(' '),
    f: '사라 에밀리 제시카 애슐리 로런 해나 올리비아 에마 메건 케이트 레이철 줄리아'.split(' '), order: 'west', sp: ' ' },
  fr: { sur: '마르탱 베르나르 뒤부아 르루아 모로 로랑 지라르 르페브르'.split(' '), m: '장 피에르 루이 앙투안 니콜라 토마 뤼크 쥘'.split(' '), f: '마리 소피 카미유 클레르 쥘리 레아 마농 에마'.split(' '), order: 'west', sp: ' ' },
  de: { sur: '뮐러 슈미트 슈나이더 피셔 베버 마이어 바그너 베커'.split(' '), m: '루카스 요나스 펠릭스 막시밀리안 슈테판 클라우스'.split(' '), f: '한나 레나 클라라 자비네 우르줄라 미아'.split(' '), order: 'west', sp: ' ' },
  es: { sur: '가르시아 로드리게스 마르티네스 로페스 곤살레스 페레스 산체스 라미레스'.split(' '), m: '카를로스 호세 루이스 미겔 하비에르 디에고 마테오 알레한드로'.split(' '), f: '마리아 루시아 소피아 카르멘 이사벨라 발렌티나 라우라'.split(' '), order: 'west', sp: ' ' },
  ar: { sur: '알사이드 하산 이브라힘 칼릴 만수르 나세르'.split(' '), m: '아흐마드 무함마드 오마르 유세프 하산 칼리드 타리크'.split(' '), f: '파티마 아이샤 라일라 누르 마리암 야스민'.split(' '), order: 'west', sp: ' ' },
  in: { sur: '샤르마 파텔 싱 쿠마르 굽타 레디 나이르'.split(' '), m: '아르준 라훌 비크람 아디트야 산제이 라지'.split(' '), f: '프리야 아난야 디비야 카비타 네하 푸자'.split(' '), order: 'west', sp: ' ' },
  af: { sur: '오콘쿼 멘사 카마우 디알로 은쿠루마 아산테 케이타'.split(' '), m: '쿠아메 치디 오세이 음완기 바바툰데 코피'.split(' '), f: '아마라 응고지 아이샤 와냐 파투 키수아'.split(' '), order: 'west', sp: ' ' },
};
// 그룹별 피부톤 가중치 / 머리색 가중치
const GROUP = {
  ko: { skin: [5, 5, 1, 0, 0], hair: { black: 8, dark: 3, brown: 1 } },
  nk: { skin: [3, 6, 2, 0, 0], hair: { black: 12, dark: 1 } },
  zh: { skin: [4, 5, 2, 0, 0], hair: { black: 9, dark: 2 } },
  ja: { skin: [5, 5, 1, 0, 0], hair: { black: 7, dark: 3, brown: 2 } },
  vi: { skin: [1, 4, 4, 1, 0], hair: { black: 10, dark: 1 } },
  ru: { skin: [9, 2, 0, 0, 0], hair: { dark: 3, brown: 4, blond: 3, black: 1, red: 1 } },
  en: { skin: [6, 2, 2, 1, 1], hair: { dark: 3, brown: 4, blond: 3, black: 2, red: 1 } },
  fr: { skin: [7, 2, 1, 1, 1], hair: { dark: 4, brown: 4, blond: 2, black: 2 } },
  de: { skin: [8, 2, 1, 0, 0], hair: { dark: 2, brown: 4, blond: 4, red: 1 } },
  es: { skin: [2, 5, 3, 1, 0], hair: { black: 5, dark: 5, brown: 2 } },
  ar: { skin: [1, 4, 5, 1, 0], hair: { black: 7, dark: 4 } },
  in: { skin: [0, 1, 5, 4, 1], hair: { black: 10, dark: 2 } },
  af: { skin: [0, 0, 1, 4, 6], hair: { black: 10, dark: 1 } },
};
const COUNTRY_GROUP = {
  'South Korea': 'ko', 'North Korea': 'nk', China: 'zh', Taiwan: 'zh', 'Hong Kong': 'zh', Macao: 'zh', Singapore: 'zh', Mongolia: 'zh',
  Japan: 'ja', Vietnam: 'vi', Thailand: 'vi', Laos: 'vi', Cambodia: 'vi', Myanmar: 'vi', Philippines: 'vi', Malaysia: 'vi', Indonesia: 'vi',
  Russia: 'ru', Ukraine: 'ru', Belarus: 'ru', Kazakhstan: 'ru', Poland: 'ru', Serbia: 'ru', Bulgaria: 'ru', Czechia: 'ru', Slovakia: 'ru',
  'United States of America': 'en', 'United Kingdom': 'en', Canada: 'en', Australia: 'en', 'New Zealand': 'en', Ireland: 'en',
  France: 'fr', Belgium: 'fr', Switzerland: 'de', Germany: 'de', Austria: 'de', Netherlands: 'de', Denmark: 'de', Sweden: 'de', Norway: 'de', Finland: 'de',
  Spain: 'es', Portugal: 'es', Italy: 'es', Mexico: 'es', Argentina: 'es', Colombia: 'es', Peru: 'es', Chile: 'es', Brazil: 'es', Venezuela: 'es', Cuba: 'es', Ecuador: 'es', Bolivia: 'es',
  Egypt: 'ar', 'Saudi Arabia': 'ar', Iraq: 'ar', Iran: 'ar', Syria: 'ar', Jordan: 'ar', Morocco: 'ar', Algeria: 'ar', Tunisia: 'ar', Libya: 'ar', 'United Arab Emirates': 'ar', Turkey: 'ar', Israel: 'ar', Qatar: 'ar', Kuwait: 'ar', Oman: 'ar', Yemen: 'ar', Afghanistan: 'ar', Pakistan: 'in',
  India: 'in', Bangladesh: 'in', 'Sri Lanka': 'in', Nepal: 'in',
};
export function groupFor(country, continent) {
  if (COUNTRY_GROUP[country]) return COUNTRY_GROUP[country];
  if (continent === 'Africa') return 'af';
  if (continent === 'South America') return 'es';
  if (continent === 'Asia') return 'vi';
  return 'en';
}
const BIRTHPLACE = {
  ko: '서울 부산 대구 인천 광주 대전 수원 전주 강릉 제주'.split(' '),
  nk: '평양 함흥 청진 원산 신의주 개성 사리원 남포 해주 혜산'.split(' '),
  zh: '베이징 상하이 선양 단둥 광저우 청두 하얼빈 톈진'.split(' '),
  ja: '도쿄 오사카 교토 삿포로 후쿠오카 나고야'.split(' '),
  ru: '모스크바 상트페테르부르크 블라디보스토크 하바롭스크 노보시비르스크 카잔'.split(' '),
  en: '뉴욕 로스앤젤레스 시카고 런던 맨체스터 토론토 시드니'.split(' '),
  fr: '파리 리옹 마르세유 브뤼셀'.split(' '), de: '베를린 뮌헨 함부르크 빈 취리히'.split(' '),
  es: '마드리드 바르셀로나 멕시코시티 부에노스아이레스 보고타 리마'.split(' '),
  ar: '카이로 리야드 두바이 이스탄불 테헤란 바그다드'.split(' '), in: '뭄바이 델리 벵갈루루 콜카타 카라치'.split(' '),
  af: '라고스 나이로비 아크라 다카르 아디스아바바'.split(' '), vi: '하노이 호찌민 방콕 마닐라 자카르타'.split(' '),
};
const JOBS = '회사원 교사 대학생 간호사 요리사 택시기사 엔지니어 공무원 자영업자 기자 디자이너 은퇴자 경찰관 프로그래머 의사 배달원 판매원 카페사장 유튜버 건축가 회계사 사진작가'.split(' ');
const NK_JOBS = ['공장 노동자', '협동농장원', '교원', '김일성종합대학 학생', '판매원', '의사', '공장 기사', '관광 안내원', '철도 노동자', '건설 돌격대원', '탁아소 보육원', '상점 책임자'];
const NK_OFFICIAL = ['조선노동당 중앙위원', '인민군 대장', '인민군 상장', '내각 부총리', '당 조직지도부 부부장', '국가계획위원회 위원장', '당 선전선동부 과장'];
const BLOOD = ['A', 'B', 'O', 'AB'];

function makeName(r, g, female) {
  const n = N[g] || N.en;
  let sur = pick(r, n.sur);
  const given = pick(r, female ? n.f : n.m);
  if (g === 'ru' && female) sur = sur.replace(/프$/, '바');
  return n.order === 'east' ? sur + n.sp + given : given + ' ' + sur;
}

export const GAME_YEAR = 2026;
function birthInfo(r, age, year = GAME_YEAR) {
  const m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
  const y = year - age - (m >= 10 ? 1 : 0);
  return `${y}년 ${m}월 ${d}일`;
}

// ───────────────────────── 외형 생성 ─────────────────────────
function hairColorFor(r, g, age) {
  if (age > 62 && chance(r, 0.6)) return chance(r, 0.5) ? HAIRC.gray : HAIRC.white;
  if (age > 50 && chance(r, 0.25)) return HAIRC.gray;
  const w = (GROUP[g] || GROUP.en).hair;
  const key = weighted(r, Object.entries(w).map(([k, v]) => ({ k, w: v }))).k;
  return HAIRC[key];
}
const BRIGHT = ['#d84a4a', '#e88a3a', '#e8c84a', '#5ab65a', '#4a8ad8', '#8a5ad8', '#e87ab0', '#3ab8b0', '#f2f2f2', '#2a2a2a', '#7a8a9a', '#b85a3a'];
const DULL = ['#2b3445', '#555a60', '#5a4636', '#1f2228', '#3d4a3a', '#6a6258', '#44405a'];
const PANTS = ['#2d3e5e', '#3b5a8a', '#2a2a2e', '#5a5046', '#6b6b70', '#8a7a5a'];
const HANBOK = ['#f2a2b8', '#9cc8ec', '#f1efe6', '#f0d36a', '#c9a0e0', '#f5c0a0'];

const OLD = ['#4a4036', '#3a3a3e', '#5a4a3a', '#2e3440', '#4e4a44', '#6a5a48', '#3e4638'];
export function genLook(r, { group = 'en', role = 'civ', nk = false, female, age, era = 2026, style = null } = {}) {
  if (era === 1945 && role === 'tourist') role = 'civ';
  if (female === undefined) female = role === 'civ' || role === 'tourist' ? chance(r, 0.5) : role === 'official' ? chance(r, 0.08) : chance(r, 0.12);
  if (age === undefined) age = role === 'official' ? 50 + Math.floor(r() * 28) : role === 'guard' || role === 'soldier' ? 20 + Math.floor(r() * 22) : 17 + Math.floor(r() * 62);
  const w = (GROUP[group] || GROUP.en).skin;
  const skin = weighted(r, w.map((v, i) => ({ i, w: v }))).i;
  const L = {
    skin, female, age,
    hair: 'short', hairCol: hairColorFor(r, group, age),
    fw: female ? 12 + Math.floor(r() * 2) : 13 + Math.floor(r() * 3),
    fh: 14 + Math.floor(r() * 3), chin: female ? 0.5 + r() * 0.15 : 0.35 + r() * 0.25,
    eyes: pick(r, ['normal', 'normal', 'narrow', 'big']), brows: pick(r, ['normal', 'normal', 'thick', 'thin']),
    mouth: pick(r, ['neutral', 'neutral', 'smile', 'small']), nose: pick(r, ['small', 'small', 'wide']),
    glasses: chance(r, age > 45 ? 0.3 : 0.15) ? 'glasses' : null, beard: null, mole: null, blush: female && chance(r, 0.5),
    hat: null, hatCol: null, top: 'tshirt', topCol: pick(r, BRIGHT), top2: null, bottomCol: pick(r, PANTS), shoeCol: pick(r, ['#1a1a1e', '#3a2a1e', '#e8e8e8', '#5a3a2a']),
    stocky: chance(r, 0.2), pin: false, notebook: false, earpiece: false, backpack: false, medals: false, camera: false, doubleChin: false, skirt: false,
  };
  // 머리 스타일
  if (female) L.hair = pick(r, ['long', 'long', 'bob', 'ponytail', 'bun', 'short']);
  else L.hair = age > 55 && chance(r, 0.35) ? pick(r, ['bald', 'receding']) : pick(r, ['short', 'short', 'side', 'buzz', group === 'af' ? 'buzz' : 'curly', 'side']);
  if (!female && chance(r, 0.15) && !nk) L.beard = pick(r, ['mustache', 'beard', 'stubble']);
  if (chance(r, 0.05)) L.mole = [pick(r, [5, 6, 13, 14]), pick(r, [15, 16, 17])];

  // 옷
  const top = pick(r, ['tshirt', 'shirt', 'jacket', 'coat', 'jacket']);
  L.top = top;
  if (top === 'coat' || top === 'jacket') L.topCol = pick(r, [...DULL, ...BRIGHT.slice(0, 6)]);
  if (female && chance(r, 0.35)) { L.skirt = true; L.top2 = pick(r, [...PANTS, '#8a3a4a', '#3a3a5a']); }
  if (female && chance(r, 0.12)) { L.top = 'dress'; L.topCol = pick(r, BRIGHT); }

  if (nk && role === 'civ') {
    if (female) {
      if (chance(r, 0.3)) { L.top = 'hanbok'; L.topCol = pick(r, HANBOK); L.top2 = pick(r, ['#2a3a6a', '#c83a4a', '#f1efe6', '#3a6a5a', L.topCol]); }
      else { L.top = pick(r, ['shirt', 'jacket']); L.topCol = pick(r, ['#f1efe6', '#2b3445', '#6a4a5a', '#3d4a3a']); L.skirt = true; L.top2 = pick(r, ['#1f2a44', '#2a2a2e', '#3a3a3a']); }
      L.hair = pick(r, ['bob', 'short', 'bun', 'ponytail']);
    } else {
      L.top = pick(r, ['mao', 'jacket', 'mao', 'shirt']); L.topCol = pick(r, DULL); L.bottomCol = pick(r, ['#2a2a2e', '#2b3445', '#3a3a3a']);
      L.hair = pick(r, ['short', 'side', 'buzz']); L.glasses = chance(r, 0.1) ? 'glasses' : null;
    }
    L.pin = chance(r, 0.85); L.hairCol = age > 60 && chance(r, 0.5) ? HAIRC.gray : HAIRC.black;
  }
  if (role === 'tourist') { L.top = 'tshirt'; L.topCol = pick(r, BRIGHT); L.backpack = true; L.camera = chance(r, 0.6); if (chance(r, 0.4)) { L.hat = 'cap'; L.hatCol = pick(r, BRIGHT); } }
  if (role === 'guard' && era !== 1945) {
    Object.assign(L, { female: false, top: 'suit', topCol: '#17171d', bottomCol: '#17171d', shoeCol: '#0c0c0e', glasses: 'sun', earpiece: true, hair: pick(r, ['short', 'buzz', 'side']), stocky: chance(r, 0.6), tie: '#1a1a22', beard: null, skirt: false });
    L.hairCol = HAIRC.black; L.pin = nk;
  }
  if (role === 'soldier') {
    Object.assign(L, { top: 'uniform', topCol: nk ? OLIVE : pick(r, ['#5a6a45', '#4a5a3a', '#6a6a50']), bottomCol: nk ? OLIVE : '#4a5a3a', shoeCol: '#1a1a14', hat: 'milcap', hatCol: nk ? OLIVE : '#4a5a3a', glasses: null, beard: null, skirt: false });
    if (L.female) L.hair = 'bob';
  }
  if (role === 'official') {
    L.female = false; L.hair = pick(r, ['short', 'side', 'receding']); L.beard = null; L.skirt = false;
    if (style !== 'suit' && chance(r, 0.55)) { Object.assign(L, { top: 'uniform', topCol: nk ? OLIVE : '#4a5a3a', bottomCol: nk ? OLIVE : '#4a5a3a', hat: 'milcap', hatCol: nk ? OLIVE : '#4a5a3a', medals: true }); }
    else { L.top = pick(r, ['mao', 'suit']); L.topCol = pick(r, ['#26282e', '#3a3d45', '#2b3445']); L.bottomCol = L.topCol; }
    L.notebook = chance(r, 0.7); L.pin = nk; L.stocky = chance(r, 0.5); L.shoeCol = '#0e0e10';
  }
  if (role === 'worker') { Object.assign(L, { top: 'overall', topCol: '#3a5a8a', bottomCol: '#3a5a8a', hat: 'hardhat', hatCol: '#f0c030', skirt: false }); }
  if (role === 'skier') { L.top = 'jacket'; L.topCol = pick(r, BRIGHT); L.bottomCol = pick(r, ['#2a2a2e', '#3a4a6a']); L.hat = 'beanie'; L.hatCol = pick(r, BRIGHT); L.glasses = chance(r, 0.5) ? 'sun' : L.glasses; L.skirt = false; }
  if (role === 'civ' && !nk && group === 'ru' && chance(r, 0.15)) { L.hat = 'ushanka'; L.hatCol = '#6a4a30'; }
  if (role === 'civ' && !nk && chance(r, 0.06)) { L.hat = 'cap'; L.hatCol = pick(r, BRIGHT); }
  if (L.top === 'shirt' && chance(r, 0.4)) L.topCol = pick(r, ['#f2f2f2', '#cfe0f0', '#f0e0c0']);
  if (era === 1945) era1945(r, L, role);
  return L;
}
// 1945년: 코트·정장·페도라·스카프, 회녹색 군복, 검은 제복 경호대
function era1945(r, L, role) {
  Object.assign(L, { backpack: false, camera: false, earpiece: false, glasses: L.glasses === 'sun' ? null : L.glasses });
  if (L.hair === 'curly') L.hair = 'short';
  if (role === 'civ' || role === 'worker') {
    L.hat = null;
    if (L.female) { L.top = pick(r, ['dress', 'coat', 'dress']); L.topCol = pick(r, [...OLD, '#7a4a4a', '#4a5a7a']); L.skirt = true; L.top2 = pick(r, OLD); if (chance(r, 0.35)) { L.hat = 'scarf'; L.hatCol = pick(r, ['#8a3a3a', '#3a4a6a', '#6a6a4a', '#e0d8c0']); } }
    else { L.top = pick(r, ['coat', 'suit', 'jacket', 'coat']); L.topCol = pick(r, OLD); L.tie = '#2a2a2a'; if (chance(r, 0.45)) { L.hat = 'fedora'; L.hatCol = pick(r, ['#2a2a2a', '#4a4036', '#3a3a40', '#5a5048']); } }
    L.bottomCol = pick(r, ['#2a2a2a', '#3a3630', '#4a4038']);
  }
  if (role === 'soldier') Object.assign(L, { top: 'uniform', topCol: '#5d6450', bottomCol: '#5d6450', hat: chance(r, 0.6) ? 'helmet' : 'milcap', hatCol: '#4a5040', band: '#4a5040', female: false, hair: 'short' });
  if (role === 'guard') Object.assign(L, { female: false, top: 'uniform', topCol: '#26262a', bottomCol: '#26262a', shoeCol: '#0c0c0e', hat: 'milcap', hatCol: '#222226', band: '#2e2e32', hair: 'short', hairCol: HAIRC.dark, stocky: chance(r, 0.5), beard: null, skirt: false, glasses: null });
  if (role === 'official') Object.assign(L, { top: 'uniform', topCol: '#6a6e5c', bottomCol: '#5a5e4e', hat: 'milcap', hatCol: '#6a6e5c', band: '#3e4a3a', medals: true, pin: false });
}

// 대역 (닮은 사람): 대상 외형에서 1~2가지 차이
export function doubleLook(r, base) {
  const L = { ...base };
  const vars = [
    () => { L.fw = Math.max(12, L.fw - 2); L.doubleChin = false; },
    () => { L.glasses = 'glasses'; },
    () => { L.mole = [14, 17]; },
    () => { L.eyes = L.eyes === 'normal' ? 'big' : 'normal'; L.brows = 'thick'; },
    () => { L.skin = L.skin === 2 ? 1 : 2; },
    () => { L.topCol = shade(L.topCol, 1.35); },
    () => { L.fh = L.fh >= 16 ? 14 : 16; L.chin = L.chin > 0.45 ? 0.3 : 0.6; },
    () => { L.mouth = L.mouth === 'smile' ? 'neutral' : 'smile'; },
  ];
  const picks = [];
  while (picks.length < 2) { const v = pick(r, vars); if (!picks.includes(v)) picks.push(v); }
  picks.forEach((f) => f());
  return L;
}
// 교도소용 줄무늬 죄수복
export function prisonLook(base) {
  return { ...base, top: 'stripes', topCol: '#e8e8e8', bottomCol: '#e8e8e8', shoeCol: '#2a2a2a', tie: null, pin: false, medals: false, notebook: false, hat: null, earpiece: false, glasses: base.glasses === 'sun' ? null : base.glasses };
}

// ───────────────────────── 신상 카드 ─────────────────────────
const OLD_JOBS = ['공장 노동자', '농부', '교사', '주부', '간호사', '우편배달부', '제빵사', '재단사', '철도원', '학생', '상인', '국민돌격대원'];
export function genInfo(r, L, { group, role, nk, countryKo, nationalityKo, era = 2026 }) {
  const g = role === 'tourist' ? group : nk ? 'nk' : group;
  const name = makeName(r, g, L.female);
  let job = pick(r, JOBS);
  if (nk) job = pick(r, NK_JOBS);
  if (role === 'tourist') job = '관광객';
  if (role === 'guard') job = nk ? '호위사령부 요원' : pick(r, ['경호원', '경찰 특공대', '사설 경호원']);
  if (role === 'soldier') job = nk ? pick(r, ['조선인민군 하전사', '조선인민군 군관']) : '군인';
  if (role === 'official') job = nk ? pick(r, NK_OFFICIAL) : pick(r, ['정부 관료', '외교관', '의전 담당관']);
  if (role === 'worker') job = nk ? '공장 노동자' : '현장 근로자';
  if (role === 'skier') job = pick(r, ['스키 강사', '관광객', '대학생']);
  if (L.age >= 30 && /학생/.test(job)) job = pick(r, nk ? ['공장 노동자', '협동농장원', '교원'] : ['회사원', '자영업자', '교사', '공무원']);
  if (L.age >= 66 && !['guard', 'soldier', 'official'].includes(role) && role !== 'tourist' && chance(r, 0.6)) job = '은퇴자';
  if (L.age < 23 && job === '은퇴자') job = '대학생';
  if (era === 1945) {
    job = { guard: '총통 경호대원', soldier: '독일 국방군 병사', official: pick(r, ['국방군 장교', '나치당 간부', '참모 장교']) }[role] || pick(r, OLD_JOBS);
  }
  const h = L.female ? 152 + Math.floor(r() * 18) : 162 + Math.floor(r() * 22);
  return {
    name, age: L.age, birth: birthInfo(r, L.age, era === 1945 ? 1945 : GAME_YEAR), birthplace: pick(r, BIRTHPLACE[g] || BIRTHPLACE.en),
    nationality: nationalityKo || countryKo, job, note: `신장 ${h}cm · 혈액형 ${pick(r, BLOOD)}형`,
  };
}
// ───────────────────────── 스프라이트 ─────────────────────────
// 저해상도 인물: 9x18. 머리 0~5행, 몸통 6~11, 다리 12~16, 신발 17
function grid(w, h) { return { w, h, d: new Array(w * h).fill(null) }; }
function gset(g, x, y, c) { if (x >= 0 && y >= 0 && x < g.w && y < g.h && c) g.d[y * g.w + x] = c; }
function gget(g, x, y) { return x >= 0 && y >= 0 && x < g.w && y < g.h ? g.d[y * g.w + x] : null; }
function gcanvas(g) {
  const [c, x] = makeCanvas(g.w, g.h);
  const img = x.createImageData(g.w, g.h);
  g.d.forEach((col, i) => {
    if (!col) return;
    const n = parseInt(col.slice(1), 16);
    img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
  });
  x.putImageData(img, 0, 0);
  return c;
}
const fillR = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) gset(g, x, y, c); };

function bodyLow(L, frame) {
  const g = grid(9, 18);
  const S = SKIN[L.skin];
  const tl = L.stocky ? 1 : 2, tr = L.stocky ? 7 : 6;
  const top = L.topCol, topD = shade(top, 0.75);
  const pants = L.bottomCol, shoe = L.shoeCol;
  const legL = [tl, tl + 1 + (L.stocky ? 1 : 0)], legR = [tr - 1 - (L.stocky ? 1 : 0), tr];
  const off = frame === 1 ? 1 : 0;
  const legs = (col, y0) => {
    for (let y = y0; y <= 16; y++) {
      const o = y >= 15 ? off : 0;
      for (let x = legL[0]; x <= legL[1]; x++) gset(g, x - o, y, col);
      for (let x = legR[0]; x <= legR[1]; x++) gset(g, x + o, y, col);
    }
    gset(g, legL[0] - off, 17, shoe); gset(g, legL[1] - off, 17, shoe);
    gset(g, legR[0] + off, 17, shoe); gset(g, legR[1] + off, 17, shoe);
  };
  let armEnd = 10;
  if (L.top === 'hanbok') {
    const sk = L.top2 || top;
    for (let y = 9; y <= 16; y++) { const wv = y < 12 ? 1 : 0; fillR(g, tl - 1 + wv, y, tr + 1 - wv, y, y % 3 === 0 ? shade(sk, 0.9) : sk); }
    gset(g, 3, 17, shoe); gset(g, 5, 17, shoe);
    fillR(g, tl, 6, tr, 8, top); gset(g, 4, 6, '#ffffff'); gset(g, 4, 7, '#ffffff'); gset(g, 4, 8, '#c8303a');
    armEnd = 7;
  } else if (L.top === 'dress') {
    fillR(g, tl, 6, tr, 10, top);
    fillR(g, tl - 1, 11, tr + 1, 13, top); fillR(g, tl - 1, 13, tr + 1, 13, topD);
    gset(g, 3, 14, S[0]); gset(g, 3, 15, S[0]); gset(g, 3, 16, S[0]); gset(g, 5, 14, S[0]); gset(g, 5, 15, S[0]); gset(g, 5, 16, S[0]);
    gset(g, 3, 17, shoe); gset(g, 5, 17, shoe);
  } else if (L.skirt) {
    fillR(g, tl, 6, tr, 11, top);
    fillR(g, tl - (L.stocky ? 0 : 1), 12, tr + (L.stocky ? 0 : 1), 13, L.top2 || pants);
    for (let y = 14; y <= 16; y++) { gset(g, 3, y, S[0]); gset(g, 5, y, S[0]); }
    gset(g, 3, 17, shoe); gset(g, 5, 17, shoe);
  } else if (L.top === 'coat') {
    legs(pants, 14);
    fillR(g, tl, 6, tr, 14, top); for (let y = 7; y <= 14; y++) gset(g, 4, y, topD);
  } else {
    legs(pants, 12);
    fillR(g, tl, 6, tr, 11, top);
  }
  // 팔
  const al = tl - 1, ar = tr + 1;
  for (let y = 6; y <= armEnd; y++) { gset(g, al, y, y === 6 ? topD : top); gset(g, ar, y, topD); }
  gset(g, al, armEnd + 1, S[0]); gset(g, ar, armEnd + 1, S[1]);
  // 옷 디테일
  if (L.top === 'mao') { gset(g, 3, 6, topD); gset(g, 5, 6, topD); gset(g, 4, 8, shade(top, 1.35)); gset(g, 4, 10, shade(top, 1.35)); }
  if (L.top === 'suit') { gset(g, 4, 6, '#f2f2f2'); gset(g, 4, 7, L.tie || '#b03030'); gset(g, 4, 8, L.tie || '#b03030'); gset(g, 3, 6, topD); gset(g, 5, 6, topD); }
  if (L.top === 'tshirt' || L.top === 'dress') gset(g, 4, 6, S[0]);
  if (L.top === 'shirt') { gset(g, 3, 6, '#f8f8f8'); gset(g, 5, 6, '#f8f8f8'); gset(g, 4, 6, S[0]); }
  if (L.top === 'uniform') { fillR(g, tl, 10, tr, 10, '#5a3a20'); gset(g, 4, 10, '#d0b040'); gset(g, tl, 6, '#b8302a'); gset(g, tr, 6, '#b8302a'); }
  if (L.top === 'overall') { gset(g, 3, 6, '#e8e8e8'); gset(g, 5, 6, '#e8e8e8'); gset(g, 4, 6, '#e8e8e8'); }
  if (L.top === 'jacket') { for (let y = 6; y <= 11; y++) gset(g, 4, y, topD); }
  if (L.pin) gset(g, 3, 7, (L.pinCol || ['#e02a2a'])[0]);
  if (L.medals) { gset(g, 5, 7, '#e8c040'); gset(g, 6, 7, '#e02a2a'); gset(g, 5, 8, '#3a8ae0'); }
  if (L.backpack) { gset(g, 3, 6, '#3a2a1a'); gset(g, 3, 7, '#3a2a1a'); gset(g, 5, 6, '#3a2a1a'); gset(g, 5, 7, '#3a2a1a'); }
  if (L.camera) { gset(g, 4, 8, '#1a1a1a'); gset(g, 4, 9, '#1a1a1a'); }
  if (L.notebook) { gset(g, ar, armEnd, '#f4f4f0'); gset(g, ar + 1, armEnd, '#f4f4f0'); gset(g, ar + 1, armEnd + 1, '#d8d8d0'); }
  if (L.top === 'stripes') for (let y = 6; y <= 16; y += 2) for (let x = 0; x < 9; x++) if (gget(g, x, y) === L.topCol) gset(g, x, y, '#26262c');
  if (L.top === 'suit' && L.tie) { gset(g, 4, 9, L.tie); }
  return gcanvas(g);
}

function headLow(L) {
  const g = grid(9, 18);
  const S = SKIN[L.skin], hc = L.hairCol, hd = shade(hc, 0.7);
  fillR(g, 2, 1, 6, 4, S[0]); fillR(g, 3, 5, 5, 5, S[0]);
  gset(g, 6, 2, S[1]); gset(g, 6, 3, S[1]); gset(g, 6, 4, S[1]); gset(g, 5, 5, S[1]);
  gset(g, 3, 3, EYE); gset(g, 5, 3, EYE);
  const stub = mix(S[1], '#4a5060', 0.5);
  switch (L.hair) {
    case 'kju': fillR(g, 3, 0, 5, 1, hc); gset(g, 2, 1, stub); gset(g, 6, 1, stub); gset(g, 2, 2, stub); gset(g, 6, 2, stub); break;
    case 'short': case 'receding': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); gset(g, 2, 2, hd); gset(g, 6, 2, hd); break;
    case 'side': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); fillR(g, 2, 2, 4, 2, hc); gset(g, 6, 2, hd); break;
    case 'buzz': fillR(g, 3, 0, 5, 0, hd); fillR(g, 2, 1, 6, 1, hd); break;
    case 'curly': fillR(g, 2, 0, 6, 0, hc); fillR(g, 1, 1, 7, 1, hc); gset(g, 1, 2, hc); gset(g, 7, 2, hc); break;
    case 'long': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); for (let y = 1; y <= 7; y++) { gset(g, 1, y, hc); gset(g, 7, y, hd); } break;
    case 'bob': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); for (let y = 1; y <= 4; y++) { gset(g, 1, y, hc); gset(g, 7, y, hd); } break;
    case 'ponytail': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); for (let y = 1; y <= 5; y++) gset(g, 7, y, hd); break;
    case 'bun': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); gset(g, 4, 0, hd); break;
    case 'bald': gset(g, 2, 2, hc); gset(g, 6, 2, hc); break;
    case 'trump': fillR(g, 2, 0, 6, 0, hc); fillR(g, 1, 1, 7, 1, hc); fillR(g, 1, 2, 4, 2, hc); gset(g, 7, 2, hd); gset(g, 4, 0, shade(hc, 1.2)); break;
    case 'hitler': fillR(g, 3, 0, 5, 0, hc); fillR(g, 2, 1, 6, 1, hc); fillR(g, 2, 2, 3, 2, hc); gset(g, 6, 2, hd); break;
  }
  const hat = L.hatCol, hatD = hat ? shade(hat, 0.7) : null;
  switch (L.hat) {
    case 'milcap': fillR(g, 1, 0, 7, 0, hat); fillR(g, 2, 1, 6, 1, '#b8302a'); gset(g, 4, 1, '#e8c040'); fillR(g, 2, 2, 6, 2, '#15151a'); break;
    case 'cap': fillR(g, 3, 0, 5, 0, hat); fillR(g, 2, 1, 6, 1, hat); fillR(g, 1, 2, 5, 2, hatD); break;
    case 'beanie': fillR(g, 3, 0, 5, 0, hat); fillR(g, 2, 1, 6, 1, hatD); break;
    case 'hardhat': fillR(g, 3, 0, 5, 0, hat); fillR(g, 1, 1, 7, 1, hat); break;
    case 'ushanka': fillR(g, 2, 0, 6, 0, hat); fillR(g, 1, 1, 7, 1, hat); for (let y = 2; y <= 4; y++) { gset(g, 1, y, hatD); gset(g, 7, y, hatD); } break;
    case 'fedora': fillR(g, 2, 0, 6, 0, hat); fillR(g, 1, 1, 7, 1, hatD); break;
    case 'helmet': fillR(g, 2, 0, 6, 0, hat); fillR(g, 1, 1, 7, 1, hat); gset(g, 1, 2, hatD); gset(g, 7, 2, hatD); break;
    case 'scarf': fillR(g, 3, 0, 5, 0, hat); fillR(g, 2, 1, 6, 1, hat); for (let y = 2; y <= 5; y++) { gset(g, 1, y, hatD); gset(g, 7, y, hatD); } break;
  }
  if (L.glasses === 'sun') fillR(g, 3, 3, 5, 3, '#0e0e14');
  else if (L.glasses) { gset(g, 3, 3, '#6f86a0'); gset(g, 5, 3, '#6f86a0'); }
  if (L.beard === 'beard') fillR(g, 3, 5, 5, 5, hc);
  if (L.beard === 'mustache' || L.beard === 'toothbrush') gset(g, 4, 4, hc);
  return gcanvas(g);
}

// 고해상도 얼굴: 28x28 캔버스, 코어 20x24 영역이 (4,4)에서 시작. 저해상도 머리(5x6)의 4배 확대와 정렬됨.
export function headHi(L) {
  const g = grid(28, 28);
  const O = 4;
  const set = (x, y, c) => gset(g, x + O, y + O, c);
  const get = (x, y) => gget(g, x + O, y + O);
  const S = SKIN[L.skin];
  const cx = 10, y0 = 5, fw = L.fw, fh = L.fh;
  const ey = y0 + Math.round(fh * 0.46);
  const chinY = y0 + fh - 1;
  const hc = L.hairCol, hl = shade(hc, hc === HAIRC.white || hc === HAIRC.blond ? 0.85 : 1.6), hd = shade(hc, 0.6);
  const top = L.topCol, topD = shade(top, 0.72), topL = shade(top, 1.3);

  // 목
  for (let y = chinY - 1; y <= 23; y++) for (let x = 7; x <= 12; x++) set(x, y, x >= 11 ? S[1] : S[0]);
  for (let x = 7; x <= 12; x++) set(x, chinY + 1, S[1]);
  // 옷깃 (20~23행)
  const collar = () => {
    for (let y = 21; y <= 23; y++) for (let x = 0; x <= 19; x++) {
      if (y === 21 && (x < 2 || x > 17)) continue;
      set(x, y, x > 14 ? topD : top);
    }
    switch (L.top) {
      case 'mao':
        for (let x = 7; x <= 12; x++) { set(x, 20, topL); set(x, 21, top); }
        set(9, 22, topD); set(10, 22, topD); set(9, 23, topD); set(10, 23, shade(top, 1.6));
        break;
      case 'suit':
        set(8, 21, '#f2f2f2'); set(9, 21, L.tie || '#b03030'); set(10, 21, L.tie || '#b03030'); set(11, 21, '#f2f2f2');
        set(9, 22, '#f2f2f2'); set(10, 22, L.tie || '#b03030'); set(9, 23, L.tie || '#b03030'); set(10, 23, L.tie || '#b03030');
        set(7, 22, topD); set(12, 22, topD);
        break;
      case 'uniform':
        for (let x = 7; x <= 12; x++) set(x, 20, top);
        set(6, 21, '#b8302a'); set(7, 21, '#b8302a'); set(12, 21, '#b8302a'); set(13, 21, '#b8302a');
        break;
      case 'shirt': set(7, 21, '#fafafa'); set(8, 21, '#fafafa'); set(11, 21, '#fafafa'); set(12, 21, '#fafafa'); set(9, 21, S[0]); set(10, 21, S[1]); break;
      case 'hanbok': set(7, 21, '#ffffff'); set(8, 21, '#ffffff'); set(11, 21, '#ffffff'); set(12, 21, '#ffffff'); set(9, 22, '#ffffff'); set(10, 22, '#ffffff'); set(9, 23, '#c8303a'); set(10, 23, '#c8303a'); break;
      case 'overall': for (let x = 5; x <= 14; x++) set(x, 21, '#e8e8e8'); set(6, 22, '#2a4a7a'); set(13, 22, '#2a4a7a'); break;
      case 'coat': set(8, 21, topD); set(11, 21, topD); set(9, 22, topD); set(10, 22, topD); break;
      default: for (let x = 8; x <= 11; x++) set(x, 21, S[x > 9 ? 1 : 0]);
    }
  };
  collar();
  if (L.top === 'stripes') for (let y = 20; y <= 23; y++) for (let x = 0; x < 20; x++) if (get(x, y) === top && y % 2 === 0) set(x, y, '#26262c');

  // 얼굴 마스크
  const mask = new Set();
  const hwAt = [];
  for (let i = 0; i < fh; i++) {
    const t = i / (fh - 1);
    const prof = t < 0.35 ? Math.sqrt(1 - ((0.35 - t) / 0.35) ** 2 * 0.5) : 1 - ((t - 0.35) / 0.65) ** 2 * L.chin;
    const hw = (fw / 2) * prof;
    hwAt[i] = hw;
    for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw) mask.add(x + ',' + (y0 + i));
  }
  const inM = (x, y) => mask.has(x + ',' + y);
  // 귀
  const earY = ey - 1;
  const lEdge = Math.round(cx - hwAt[earY - y0]) - 1, rEdge = Math.round(cx + hwAt[earY - y0]);
  for (let y = earY; y <= earY + 2; y++) { set(lEdge, y, S[0]); set(rEdge, y, S[1]); set(lEdge - (y === earY + 1 ? 1 : 0), y, S[2]); }
  set(rEdge + 0, earY + 1, S[2]);
  // 피부 + 음영 + 외곽선
  for (const k of mask) {
    const [x, y] = k.split(',').map(Number);
    const i = y - y0, hw = hwAt[i];
    let c = S[0];
    if (x + 0.5 - cx > hw - 2.2) c = S[1];
    if (!inM(x - 1, y) || !inM(x + 1, y) || !inM(x, y + 1)) c = S[2];
    set(x, y, c);
  }
  // 이중턱
  if (L.doubleChin) { for (let x = 7; x <= 12; x++) set(x, chinY + 1, S[2]); for (let x = 8; x <= 11; x++) set(x, chinY + 2, S[1]); set(Math.round(cx - hwAt[fh - 4]) + 1, chinY - 2, S[1]); }

  // 눈
  const e = fw >= 15 ? 2 : 1;
  const exL = cx - e - 2, exR = cx + e;
  const eye = (ex, outer) => {
    if (L.eyes === 'narrow') { set(ex, ey, shade(EYE, 1.6)); set(ex + 1, ey, shade(EYE, 1.6)); set(outer, ey - 1, S[1]); }
    else if (L.eyes === 'big') { set(ex, ey, EYE); set(ex + 1, ey, EYE); set(ex, ey - 1, EYE); set(ex + 1, ey - 1, EYE); set(outer === ex ? ex : ex + 1, ey - 1, '#ffffff'); }
    else { set(ex, ey, EYE); set(ex + 1, ey, EYE); set(outer, ey, shade(EYE, 1.8)); }
    if (L.female) set(outer === ex ? ex - 1 : ex + 2, ey - 1, EYE);
  };
  eye(exL, exL); eye(exR, exR + 1);
  // 눈썹
  const bc = L.hat === 'milcap' ? shade(hc, 1) : hd === '#000000' ? hc : hc;
  if (L.brows === 'thin') { set(exL, ey - 2, bc); set(exL + 1, ey - 2, bc); set(exR, ey - 2, bc); set(exR + 1, ey - 2, bc); }
  else {
    for (let d = -1; d <= 1; d++) { set(exL + 1 + d, ey - 2, bc); set(exR + d, ey - 2, bc); }
    if (L.brows === 'thick') { set(exL, ey - 3, bc); set(exL + 1, ey - 3, bc); set(exR, ey - 3, bc); set(exR + 1, ey - 3, bc); }
  }
  // 코
  set(cx, ey + 1, S[1]); set(cx, ey + 2, S[1]);
  set(cx - 1, ey + 3, S[2]); set(cx, ey + 3, S[2]);
  if (L.nose === 'wide') { set(cx - 2, ey + 3, S[1]); set(cx + 1, ey + 3, S[1]); }
  // 입
  const my = Math.min(ey + 5, chinY - 2);
  const lip = L.female ? '#c84a54' : mix(S[2], '#a04438', 0.5);
  if (L.mouth === 'small') { set(cx - 1, my, lip); set(cx, my, lip); }
  else if (L.mouth === 'smile') { set(cx - 3, my - 1, lip); set(cx + 2, my - 1, lip); for (let x = cx - 2; x <= cx + 1; x++) set(x, my, lip); }
  else for (let x = cx - 2; x <= cx + 1; x++) set(x, my, lip);
  // 볼터치 / 주름 / 점
  if (L.blush) { set(exL - 1, ey + 2, mix(S[0], '#e87a8a', 0.5)); set(exR + 2, ey + 2, mix(S[0], '#e87a8a', 0.5)); }
  if (L.age >= 58) { set(exL - 1, ey, S[2]); set(exR + 2, ey, S[2]); set(cx - 3, my - 1, S[1]); set(cx + 2, my - 1, S[1]); }
  if (L.mole) set(L.mole[0], L.mole[1], '#4a3020');
  // 수염
  if (L.beard === 'mustache' || L.beard === 'beard') for (let x = cx - 2; x <= cx + 1; x++) set(x, my - 1, hc);
  if (L.beard === 'toothbrush') { for (let y = ey + 3; y <= my - 1; y++) { set(cx - 1, y, hc); set(cx, y, hc); } }
  if (L.beard === 'beard' || L.beard === 'stubble') {
    for (let y = my - 1; y <= chinY; y++) for (let x = 0; x < 20; x++) {
      if (!inM(x, y) || (y === my && x >= cx - 2 && x <= cx + 1)) continue;
      if (Math.abs(x + 0.5 - cx) > hwAt[y - y0] - 1 && y < my + 1) continue;
      if (L.beard === 'beard' || bayer(x, y) > 0.5) set(x, y, L.beard === 'beard' ? (bayer(x, y) > 0.7 ? hd : hc) : mix(S[1], hc, 0.5));
    }
  }

  // 머리카락
  const dome = (topY, botY, halfW, col, edge) => {
    for (let y = topY; y <= botY; y++) {
      const t = (botY - y) / (botY - topY + 1);
      const hw = halfW * Math.sqrt(1 - t * t * 0.85);
      for (let x = 0; x < 20; x++) {
        const d = Math.abs(x + 0.5 - cx);
        if (d <= hw) set(x, y, edge && d > hw - 1 ? edge : col);
      }
    }
  };
  const sides = (fromY, toY, inner, outer, col) => {
    for (let y = fromY; y <= toY; y++) for (let x = 0; x < 20; x++) {
      const d = Math.abs(x + 0.5 - cx);
      if (d > inner && d <= outer) set(x, y, x > cx ? hd : col);
    }
  };
  const hw0 = fw / 2;
  switch (L.hair) {
    case 'kju': {
      // 옆머리를 바짝 민 투블럭: 옆은 푸르스름한 짧은 머리, 윗머리는 높고 납작하게
      const stub = mix(S[1], '#2a3040', 0.6), stub2 = mix(S[1], '#394152', 0.5);
      for (let y = y0 - 4; y <= ey - 2; y++) for (let x = 0; x < 20; x++) {
        const d = Math.abs(x + 0.5 - cx);
        const lim = y < y0 ? hw0 * Math.sqrt(Math.max(0, 1 - ((y0 - y) / 5.5) ** 2)) + 0.3 : inM(x, y) ? hw0 + 0.4 : -1;
        if (d <= lim && d > hw0 - 3.2) set(x, y, bayer(x, y) > 0.3 ? stub : stub2);
      }
      for (let y = y0 - 5; y <= y0 + 1; y++) {
        const hw = y === y0 - 5 ? hw0 - 4.2 : y === y0 - 4 ? hw0 - 3 : hw0 - 2.4;
        for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw) set(x, y, hc);
      }
      for (let x = cx - 2; x <= cx + 1; x++) set(x, y0 + 2, hc);
      for (let x = cx - 3; x <= cx + 1; x++) set(x, y0 - 4, hl);
      set(cx - 4, y0 - 3, hl); set(cx + 2, y0 - 3, hl); set(cx - 1, y0 - 2, hl);
      break;
    }
    case 'short': dome(y0 - 3, y0 + 1, hw0 + 1, hc, hd); sides(y0 + 2, ey - 2, hw0 - 1.5, hw0 + 1, hc); set(cx - 3, y0 - 2, hl); set(cx - 2, y0 - 2, hl); break;
    case 'receding': dome(y0 - 3, y0, hw0 + 1, hc, hd); sides(y0 + 1, ey - 2, hw0 - 1.5, hw0 + 1, hc); break;
    case 'side':
      dome(y0 - 3, y0 + 1, hw0 + 1, hc, hd); sides(y0 + 2, ey - 2, hw0 - 1.5, hw0 + 1, hc);
      for (let x = Math.round(cx - hw0); x <= cx + 2; x++) set(x, y0 + 2, hc);
      for (let x = Math.round(cx - hw0); x <= cx - 2; x++) set(x, y0 + 3, hc);
      set(cx + 1, y0 - 2, hl); set(cx + 2, y0 - 2, hl);
      break;
    case 'buzz': for (let y = y0 - 2; y <= y0 + 1; y++) for (let x = 0; x < 20; x++) { const d = Math.abs(x + 0.5 - cx); if (d <= hw0 + 0.5 - (y === y0 - 2 ? 2 : 0) && bayer(x, y) < 0.7) set(x, y, hd); } break;
    case 'curly': dome(y0 - 4, y0 + 2, hw0 + 2, hc, hd); for (let x = 0; x < 20; x += 2) set(x, y0 - 4 + ((x >> 1) % 2), null); sides(y0 + 2, ey, hw0 - 1, hw0 + 2, hc); break;
    case 'long': case 'bob': {
      dome(y0 - 3, y0 + 2, hw0 + 1.5, hc, hd);
      for (let x = 0; x < 20; x++) if (inM(x, y0 + 2) && x !== cx) set(x, y0 + 2, hc);
      for (let x = 0; x < 20; x++) if (inM(x, y0 + 3) && (x < cx - 3 || x > cx + 3)) set(x, y0 + 3, hc);
      sides(y0 + 2, L.hair === 'long' ? 23 : ey + 4, hw0 - 1, hw0 + 2, hc);
      set(cx - 3, y0 - 2, hl); set(cx - 2, y0 - 2, hl); set(cx - 4, y0 - 1, hl);
      break;
    }
    case 'ponytail':
      dome(y0 - 3, y0 + 1, hw0 + 1, hc, hd); sides(y0 + 2, ey - 2, hw0 - 1.5, hw0 + 1, hc);
      for (let x = Math.round(cx - hw0) + 1; x <= cx + 1; x++) set(x, y0 + 2, hc);
      for (let y = y0; y <= y0 + 10; y++) { set(Math.round(cx + hw0) + 1, y, hd); set(Math.round(cx + hw0) + 2, y, y > y0 + 2 && y < y0 + 8 ? hd : null); }
      break;
    case 'bun':
      dome(y0 - 3, y0 + 1, hw0 + 1, hc, hd); sides(y0 + 2, ey - 2, hw0 - 1.5, hw0 + 1, hc);
      for (let y = y0 - 7; y <= y0 - 3; y++) for (let x = cx - 3; x <= cx + 2; x++) if ((x - cx + 0.5) ** 2 + (y - (y0 - 5)) ** 2 <= 7) set(x, y, x > cx ? hd : hc);
      break;
    case 'bald': sides(y0 + 3, ey - 1, hw0 - 1.2, hw0 + 0.6, hc); set(cx - 2, y0 + 1, S[0 + 0]); set(cx - 3, y0 + 2, '#ffffff'); break;
    case 'trump': {
      // 풍성하게 뒤로 넘긴 금발 + 이마 위 스윕
      dome(y0 - 5, y0 + 2, hw0 + 1.8, hc, hd);
      sides(y0 + 2, ey - 1, hw0 - 1.6, hw0 + 1.6, hc);
      const L0 = Math.round(cx - hw0) - 1;
      for (let x = L0; x <= cx + 3; x++) set(x, y0 + 3, hc);
      for (let x = L0 + 1; x <= cx - 1; x++) set(x, y0 + 4, hd);
      for (let x = cx - 4; x <= cx + 2; x++) set(x, y0 - 4, hl);
      for (let x = cx - 2; x <= cx + 4; x++) set(x, y0 - 1, hl);
      set(cx - 5, y0 + 1, hl); set(cx - 4, y0 + 2, hl);
      break;
    }
    case 'hitler': {
      // 짧은 옆머리 + 이마로 비스듬히 내린 앞머리
      dome(y0 - 3, y0 + 1, hw0 + 0.6, hc, hd);
      sides(y0 + 2, ey - 2, hw0 - 1.2, hw0 + 0.8, hc);
      const L0 = Math.round(cx - hw0);
      for (let k = 0; k < 4; k++) for (let x = L0; x <= cx + 2 - k * 3; x++) set(x, y0 + 2 + k, k === 3 ? hd : hc);
      set(cx + 1, y0 - 2, hl); set(cx + 2, y0 - 2, hl);
      break;
    }
  }
  // 모자
  const hat = L.hatCol;
  if (L.hat) {
    const hatD = shade(hat, 0.7), hatL = shade(hat, 1.25);
    switch (L.hat) {
      case 'milcap':
        for (let y = y0 - 5; y <= y0 - 1; y++) { const hw = y === y0 - 5 ? hw0 + 1.5 : hw0 + 2.5; for (let x = 0; x < 20; x++) { const d = Math.abs(x + 0.5 - cx); if (d <= hw) set(x, y, y === y0 - 5 ? hatL : x > cx + 3 ? hatD : hat); } }
        for (let x = 0; x < 20; x++) { const d = Math.abs(x + 0.5 - cx); if (d <= hw0 + 0.5) set(x, y0, L.band || '#b8302a'); if (d <= hw0 - 1) set(x, y0 + 1, '#15151a'); if (d <= hw0 - 0.5 && inM(x, y0 + 2)) set(x, y0 + 2, S[2]); }
        set(cx - 1, y0 - 1, '#e8c040'); set(cx, y0 - 1, '#e8c040'); set(cx - 1, y0, '#e8c040'); set(cx, y0, '#e8c040');
        break;
      case 'cap': dome(y0 - 3, y0 + 1, hw0 + 1, hat, hatD); for (let x = Math.round(cx - hw0) - 1; x <= cx + hw0; x++) set(x, y0 + 2, hatD); break;
      case 'beanie': dome(y0 - 4, y0 + 2, hw0 + 1.5, hat, hatD); for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw0 + 1.5) { set(x, y0 + 1, hatD); set(x, y0 + 2, hatD); } set(cx - 1, y0 - 5, '#f4f4f4'); set(cx, y0 - 5, '#f4f4f4'); break;
      case 'hardhat': dome(y0 - 4, y0 + 1, hw0 + 1, hat, hatD); for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw0 + 2.5) set(x, y0 + 2, hatD); set(cx - 3, y0 - 3, hatL); break;
      case 'ushanka': dome(y0 - 4, y0 + 2, hw0 + 2, hat, hatD); sides(y0 + 2, ey + 3, hw0 - 0.5, hw0 + 2, hat); for (let x = 0; x < 20; x += 2) set(x, y0 + 2, hatL); break;
      case 'fedora':
        for (let y = y0 - 4; y <= y0; y++) for (let x = 0; x < 20; x++) { const d = Math.abs(x + 0.5 - cx); if (d <= hw0 - (y === y0 - 4 ? 1.5 : 0.5) && !(y === y0 - 4 && d < 1.5)) set(x, y, y === y0 ? '#161616' : x > cx + 2 ? hatD : hat); }
        for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw0 + 3) set(x, y0 + 1, hatD);
        break;
      case 'helmet':
        dome(y0 - 5, y0 + 1, hw0 + 2, hat, hatD);
        for (let x = 0; x < 20; x++) if (Math.abs(x + 0.5 - cx) <= hw0 + 3) set(x, y0 + 2, hatD);
        set(cx - 3, y0 - 3, hatL); set(cx - 2, y0 - 4, hatL);
        break;
      case 'scarf':
        dome(y0 - 3, y0 + 2, hw0 + 1.5, hat, hatD); sides(y0 + 2, chinY, hw0 - 1, hw0 + 1.6, hat);
        set(cx - 1, chinY + 1, hatD); set(cx, chinY + 1, hatD);
        break;
    }
  }
  // 안경
  if (L.glasses === 'sun') {
    for (const ex of [exL, exR]) for (let y = ey - 1; y <= ey; y++) for (let x = ex - 1; x <= ex + 2; x++) set(x, y, '#0e0e14');
    set(exL - 1, ey - 1, '#5a6070'); set(exR - 1, ey - 1, '#5a6070');
    for (let x = exL + 3; x < exR - 1; x++) set(x, ey - 1, '#0e0e14');
  } else if (L.glasses) {
    const fc = '#2a2a30', tint = mix(S[0], '#d8ecff', 0.35);
    for (const ex of [exL, exR]) {
      for (let x = ex - 1; x <= ex + 2; x++) { set(x, ey - 1, fc); set(x, ey + 1, fc); }
      set(ex - 1, ey, fc); set(ex + 2, ey, fc);
      if (L.eyes === 'narrow') { set(ex, ey, EYE); set(ex + 1, ey, EYE); }
      else if (!get(ex, ey)) set(ex, ey, tint);
    }
    for (let x = exL + 3; x < exR - 1; x++) set(x, ey - 1, fc);
  }
  if (L.earpiece) { set(rEdge, earY + 1, '#e0e0e0'); for (let y = earY + 2; y <= 21; y++) set(rEdge + (y > earY + 4 ? 1 : 0), y, '#c8c8c8'); }
  return gcanvas(g);
}

// 카드용 흉상 (32x32)
export function bust(L, bg = '#223') {
  const [c, x] = makeCanvas(32, 32);
  x.fillStyle = bg; x.fillRect(0, 0, 32, 32);
  const top = L.topCol, topD = shade(top, 0.72);
  const rows = [[25, 5, 26], [26, 3, 28], [27, 2, 29], [28, 2, 29], [29, 2, 29], [30, 2, 29], [31, 2, 29]];
  for (const [y, a, b] of rows) for (let i = a; i <= b; i++) { x.fillStyle = i > 22 ? topD : top; x.fillRect(i, y, 1, 1); }
  const P = (i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
  if (L.top === 'mao') { for (let y = 26; y < 32; y++) P(15, y, topD); P(16, 27, shade(top, 1.6)); P(16, 30, shade(top, 1.6)); P(8, 29, topD); P(9, 29, topD); P(22, 29, topD); P(23, 29, topD); }
  if (L.top === 'suit') { for (let y = 26; y < 32; y++) { P(15, y, L.tie || '#b03030'); P(16, y, L.tie || '#b03030'); } for (let y = 26; y < 29; y++) { P(14 - (y - 26), y, '#f2f2f2'); P(17 + (y - 26), y, '#f2f2f2'); } }
  if (L.top === 'uniform') { P(4, 27, '#b8302a'); P(5, 27, '#e8c040'); P(26, 27, '#e8c040'); P(27, 27, '#b8302a'); for (let y = 26; y < 32; y += 2) P(15, y, '#d0b040'); }
  if (L.top === 'hanbok') { for (let y = 26; y < 32; y++) { P(12 + (y - 26), y, '#ffffff'); P(19 - (y - 26), y, '#ffffff'); } P(15, 29, '#c8303a'); P(16, 29, '#c8303a'); P(15, 30, '#c8303a'); }
  if (L.top === 'jacket' || L.top === 'coat') { for (let y = 26; y < 32; y++) P(15, y, topD); }
  if (L.top === 'overall') { P(9, 26, '#2a4a7a'); P(9, 27, '#2a4a7a'); P(22, 26, '#2a4a7a'); P(22, 27, '#2a4a7a'); }
  if (L.pin) { const pc = L.pinCol || ['#e02a2a', '#e02a2a', '#e8c040', '#e02a2a']; P(9, 28, pc[0]); P(10, 28, pc[1]); P(9, 29, pc[2]); P(10, 29, pc[3]); }
  if (L.top === 'stripes') for (let y = 26; y < 32; y += 2) for (let i = 2; i <= 29; i++) { const d = x.getImageData(i, y, 1, 1).data; if (d[0] > 150 && d[1] > 150) P(i, y, '#26262c'); }
  if (L.medals) { const mc = ['#e8c040', '#e02a2a', '#3a8ae0', '#e8c040', '#5ab65a']; mc.forEach((m, i) => { P(19 + (i % 3) * 2, 28 + Math.floor(i / 3) * 2, m); }); }
  if (L.backpack) { for (let y = 26; y < 32; y++) { P(8, y, '#3a2a1a'); P(23, y, '#3a2a1a'); } }
  x.drawImage(headHi(L), 2, -1);
  return c;
}

// 게임 오브젝트용 스프라이트 묶음
export function buildSprites(L) {
  return { body: [bodyLow(L, 0), bodyLow(L, 1)], head: headLow(L), hi: headHi(L) };
}
