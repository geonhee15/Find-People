// 추적 대상 정의: 외형, 신상, 시대, 후보 위치, 정보원, 단서 문구, SNS, 해킹, 도청, 탐문 대사
import { KO } from './geo.js';
import { shuffle } from './util.js';

const ko = (c) => KO[c] || c;

// ───────────────────────── 김정은 ─────────────────────────
const KJU = {
  id: 'kju', name: '김정은', nameEn: 'Kim Jong Un', title: '북한 국무위원장', era: 2026, diff: 3,
  tagline: '철통 경호 · 1호 열차 · 대역 존재',
  start: { country: 'South Korea', lon: 126.98, lat: 37.56, label: '서울' }, startDate: [2026, 9, 1, 9], limitH: 240,
  home: 'North Korea', hostile: 'North Korea', alertMul: 1,
  look: () => ({
    skin: 0, female: false, age: 42, hair: 'kju', hairCol: '#0f0f14', fw: 16, fh: 15, chin: 0.28,
    eyes: 'narrow', brows: 'thin', mouth: 'small', nose: 'wide', glasses: null, beard: null, mole: null, blush: false,
    hat: null, top: 'mao', topCol: '#26282e', top2: null, bottomCol: '#1d1f24', shoeCol: '#0c0c10',
    stocky: true, pin: false, notebook: false, earpiece: false, backpack: false, medals: false, camera: false, doubleChin: true, skirt: false,
  }),
  info: { name: '김정은', age: 42, birth: '1984년 1월 8일 (공식)', birthplace: '평양', nationality: '조선민주주의인민공화국', job: '조선노동당 총비서 · 국무위원장', note: "신장 약 170cm · 투블럭('패기머리') · 인민복" },
  voice: { pitch: 118, vari: 0.25, formant: 0.95 },
  prison: { reason: '수감 사유: 숨바꼭질 패배', quotes: ['여기서 내보내 주시라요!', '밥은 언제 나옵네까?', '...(창살을 붙잡고 흔든다)', '이 감방은 인민의 요구에 맞지 않습네다!'] },
  entourage: { off: 5, offStyle: null, offJob: null, guard: 4, guardJob: '호위사령부 요원', car: '#141418' },
  doubleGroup: 'nk', doubleJobs: ['배우 (대역 의심 인물)', '호위사령부 소속 (신원 비공개)', '신원 불명 — 안면 유사도 87%'],
  officialGroups: true,
  briefClue: '대상은 일주일째 공개 활동 없음. 북한 내부 또는 우방국(중국·러시아) 방문 가능성.',
  brief: `<p>대상 <b>김정은</b>의 현재 위치가 불분명하다. 공개 활동이 끊긴 지 일주일째.</p>
    <p>너는 서울에서 출발한다. <b>10일</b> 안에 대상을 찾아 군중 속에서 <b>신원을 확인하고 포획</b>하라.</p>`,
  dossier: {
    points: ["옆·뒷머리를 바짝 민 <b>투블럭</b>, 윗머리는 높고 납작하게 넘김", '<b>검은 인민복</b> (깃이 목까지), 김일성·김정일 <b>배지 미착용</b>', '<b>둥글고 넓은 얼굴</b>, 이중턱, 가는 눈썹과 가는 눈', '안경·점 없음', '주변에 <b>검은 양복+선글라스 경호원</b>, <b>수첩 든 간부</b>들. 검은 방탄차량 동반'],
    moves: ['장거리는 주로 <b>1호 열차</b>(녹색 특별열차), 가끔 전용기 <b>참매 1호</b>', "'1호 행사' 때는 도로 통제·관광 취소가 잦음", '<b>대역</b>이 있을 수 있음 — 얼굴형·안경·점을 비교할 것'],
  },
  tools: { sns: 'SNS', snsIcon: 'sns', hack: '해킹', drone: '드론', tap: '도청' },
  travel: { kmh: 800, base: 2.5, road: 45, extra: { 'North Korea': [5, '베이징 경유 고려항공 + 입국 심사'] } },
  spots: [
    { poi: 'nk_square', country: 'North Korea', foreign: false, area: '평양', dir: '수도 평양', transport: 'car', act: '열병식 준비 점검', hub: '평양역', kw: ['평양', '김일성광장', '열병식', '교통통제'], w: 3 },
    { poi: 'nk_wonsan', country: 'North Korea', foreign: false, area: '원산', dir: '동해안', transport: 'train', act: '해안 휴양지 휴식', hub: '원산역', kw: ['원산', '갈마', '해변', '동해안'], w: 3 },
    { poi: 'nk_masik', country: 'North Korea', foreign: false, area: '마식령', dir: '동해안', transport: 'car', act: '스키장 현지지도', hub: '원산역', kw: ['마식령', '스키장', '현지지도', '동해안'], w: 1 },
    { poi: 'nk_paektu', country: 'North Korea', foreign: false, area: '삼지연', dir: '북부 산악지대', transport: 'train', act: '백두산 등정', hub: '삼지연역', kw: ['백두산', '삼지연', '천지'], w: 2 },
    { poi: 'nk_myohyang', country: 'North Korea', foreign: false, area: '향산', dir: '북서부 내륙 산간', transport: 'car', act: '특각(별장) 휴식', hub: '향산역', kw: ['묘향산', '향산', '특각'], w: 1 },
    { poi: 'nk_hamhung', country: 'North Korea', foreign: false, area: '함흥', dir: '동해안 북부', transport: 'train', act: '비료공장 현지지도', hub: '함흥역', kw: ['함흥', '흥남', '비료공장', '현지지도'], w: 2 },
    { poi: 'nk_sohae', country: 'North Korea', foreign: false, area: '동창리', dir: '서해안', transport: 'car', act: '위성 발사 참관', hub: '—', kw: ['동창리', '서해위성발사장', '위성발사', '미사일'], w: 2 },
    { poi: 'nk_sinuiju', country: 'North Korea', foreign: false, area: '신의주', dir: '북서부 국경', transport: 'train', act: '수해 복구 현지지도', hub: '신의주역', kw: ['신의주', '압록강', '수해', '현지지도'], w: 1 },
    { poi: 'ru_vladi', country: 'Russia', foreign: true, area: '블라디보스토크', dir: '러시아 극동', transport: 'train', act: '북러 정상회담', hub: '블라디보스토크역', border: '두만강 철교', kw: ['블라디보스토크', '루스키섬', '정상회담', '러시아'], w: 2 },
    { poi: 'ru_vostochny', country: 'Russia', foreign: true, area: '보스토치니', dir: '러시아 극동 내륙', transport: 'train', act: '우주기지 시찰 및 회담', hub: '치올콥스키역', border: '두만강 철교', kw: ['보스토치니', '우주기지', '러시아', '정상회담'], w: 1 },
    { poi: 'ru_moscow', country: 'Russia', foreign: true, area: '모스크바', dir: '러시아 서부', transport: 'plane', act: '기념행사 참석', hub: '브누코보 공항', kw: ['모스크바', '붉은광장', '러시아'], w: 1 },
    { poi: 'cn_beijing', country: 'China', foreign: true, area: '베이징', dir: '중국 수도권', transport: 'train', act: '북중 정상회담', hub: '베이징역', border: '압록강 철교(단둥)', kw: ['베이징', '천안문', '정상회담', '중국', '단둥'], w: 2 },
  ],
  contacts: [
    { id: 'nis', name: '박 과장', org: '국정원 대북정보팀', rel: 0.9, busy: 0.1, clues: ['border', 'direction', 'capital'], look: { group: 'ko', role: 'civ', female: false, age: 47 } },
    { id: 'osint', name: '노아 킴', org: '민간 위성영상 분석가', rel: 0.8, busy: 0.15, clues: ['transport', 'direction'], look: { group: 'en', role: 'civ', female: false, age: 31 } },
    { id: 'journalist', name: '엘렌 추', org: '외신 베이징 특파원', rel: 0.7, busy: 0.25, clues: ['activity', 'border'], look: { group: 'zh', role: 'civ', female: true, age: 36 } },
    { id: 'defector', name: '리성호', org: '탈북민 · 前 호위사령부 운전병', rel: 0.65, busy: 0.15, clues: ['favorites', 'transport'], look: { group: 'nk', role: 'civ', female: false, age: 52 } },
    { id: 'diplomat', name: '한스 뮐러', org: '평양 주재 유럽 외교관', rel: 0.85, busy: 0.45, clues: ['capital', 'activity'], look: { group: 'de', role: 'civ', female: false, age: 58 } },
  ],
  clue: {
    border: (s) => (s.foreign
      ? s.transport === 'plane' ? "순안공항에서 전용기 '참매 1호'가 이륙한 정황이 있어. 해외로 나간 게 거의 확실해." : `최근 48시간 안에 특별열차가 ${s.border}를 건넌 정황이 있어. 해외(${ko(s.country)})야.`
      : '국경을 넘은 정황은 없어. 북한 안에 있다고 봐야지.'),
    direction: (s) => (s.foreign ? `움직임은 ${s.dir} 쪽으로 보고되고 있어.` : `경호 병력이 ${s.dir} 방향으로 이동한 게 포착됐어.`),
    capital: (s) => (s.area === '평양' ? "오늘 평양 시내 곳곳에 교통 통제가 있었어요. 전형적인 '1호 행사' 통제예요." : "평양 시내는 조용해요. '1호 행사' 통제는 없었어요. 지금 평양엔 없는 것 같아요."),
    transport: (s) => (s.transport === 'train'
      ? `${s.hub} 인근에 창문을 가린 녹색 장편성 열차가 서 있는 게 위성에 잡혔어요. 1호 열차로 보여요.`
      : s.transport === 'plane' ? '순안공항 격납고에서 참매 1호가 사라졌어요. 장거리 비행이에요. 1호 열차는 차고에 그대로고요.'
        : s.area === '평양' ? '김일성광장 주변에 방탄차량과 가림막 구조물이 잔뜩 보여요. 열차는 안 움직였어요.'
          : `1호 열차는 차고에 그대로예요. 대신 평양에서 ${s.dir} 쪽으로 방탄차량 행렬이 빠져나가는 게 찍혔어요.`),
    activity: (s) => `노동신문 쪽 소식통 말로는 곧 '${s.act}' 관련 보도가 나간대.`,
    favorites: (s, r, T) => {
      if (s.foreign) return `호위사령부 동기들이 요즘 해외 출장 준비로 정신없대요. ${ko(s.country)} 쪽이라던데...`;
      const dom = shuffle(r, T.spots.filter((x) => !x.foreign && x.poi !== s.poi)).slice(0, 2).map((x) => x.area);
      return `요즘 그분은 ${shuffle(r, [s.area, ...dom]).join(', ')} 쪽 특각이나 현장을 자주 찾는다고 들었어요. 그 셋 중 하나일 거예요.`;
    },
  },
  pred: {
    border: (s) => (x) => x.foreign !== s.foreign,
    capital: (s) => (x) => (x.area === '평양') !== (s.area === '평양'),
    transport: (s) => (x) => x.transport !== s.transport || x.hub !== s.hub,
  },
  sns: {
    label: 'SNS', generic: ['김정은', '북한'],
    transport: { '1호열차': 'train', '참매1호': 'plane' },
    pos: { train: (s) => `위성사진 보니 1호 열차가 차고에서 빠졌음. ${s.hub} 방향 선로에서 포착됐다는 글 있음`, plane: () => '순안공항 항공기 추적 앱에 참매 1호 신호 잡힘! 장거리 비행 중' },
    neg: { train: '요즘 1호 열차는 평양 차고에 그대로 서 있다던데? 이번엔 열차 이동 아닌 듯', plane: '참매 1호는 한동안 안 떴음. 추적 앱에 기록 없음' },
    photo: { train: 'train', plane: null },
    rumor: (s) => `[찌라시] ${s.area} 쪽에 '1호 행사'가 있다는 얘기 돌고 있음. 확인은 안 됨`,
    evidence: (s) => {
      const a = s.area;
      const out = [{ text: `${a} 가는 길 전면 통제됨... 검은 벤츠 행렬 지나감 🚗🚗🚗`, photo: 'convoy' }, { text: `${a}에 선글라스 낀 양복 아저씨들 엄청 많음. 귀에 이어폰 다 꽂고 있음`, photo: 'guards' }];
      if (s.transport === 'train') out.push({ text: `${s.hub} 근처에 초록색 긴 열차 서 있는데 창문이 다 막혀 있음. 뭐지?`, photo: 'train' });
      out.push(s.foreign ? { text: `${a} 호텔 전체 예약 막힘. 경찰 쫙 깔림 (번역됨)`, photo: 'closed' } : { text: `오늘 ${a} 관광 일정 갑자기 취소됨. 안내원이 "특별한 사정"이래요 (북한 여행 커뮤니티)` });
      return out;
    },
    noise: ['김정은 건강이상설 또 나옴... 믿거나 말거나 🤔', '대역설 진짜임? 사진마다 얼굴이 좀 달라 보임. 점이나 안경 유무로 구분한다던데', "전문가: '최근 공개활동 주기가 불규칙해져'", '오늘 조선중앙TV 편성 이상하게 조용함', '1호 열차 추적하는 OSINT 계정 팔로우 추천합니다', '투블럭 머리+인민복 = 무조건 그 사람 아님. 요즘 따라하는 간부도 많대'],
    normal: [(a) => `${a} 날씨 최고 ☀️`, (a) => `${a} 맛집 추천 좀 해주세요`, (a) => `${a} 사진 찍기 좋은 날 📷`, (a) => `${a} 다녀왔어요. 생각보다 사람 많네요`, (a) => `(북한 전문 채널) ${a} 최근 모습 공개 영상`],
    authors: null,
  },
  hacks: [
    { id: 'cctv', name: '현지 교통 CCTV망', desc: '지금 있는 나라의 도로 CCTV에서 VIP 차량 행렬을 찾습니다.', diff: 1, repeat: true, result: (s, c) => (s.country === c.here ? `CCTV #${100 + c.n}: ${c.poiName} 인근 도로에서 방탄차량 행렬 + 경호 차량 포착!` : `${ko(c.here)} 주요 도로 CCTV 스캔 완료 — VIP 차량 행렬 없음.`) },
    { id: 'rail', name: '북한 철도성 운행 DB', desc: '특별열차(1호 열차)의 최근 운행 기록을 빼냅니다.', diff: 2, result: (s) => (s.transport === 'train' ? `특별열차 운행기록: 평양 출발 → ${s.foreign ? s.border + ' 통과 → ' : ''}${s.hub} 도착 (정차 중)` : '특별열차 운행기록: 최근 7일 운행 없음 (평양 차고 대기).') },
    { id: 'atc', name: '동북아 항공 관제 기록', desc: '전용기 "참매 1호"의 비행 계획을 조회합니다.', diff: 2, result: (s) => (s.transport === 'plane' ? `비행계획 FPL: 참매 1호 순안 → ${s.hub} — 도착 완료` : '참매 1호 / 국가 전용기 비행계획 없음.') },
    { id: 'guard', name: '호위사령부 암호 통신', desc: '1호 행사 작전구역 코드를 해독합니다. 실패 시 경계도 급상승.', diff: 3, result: (s, c) => `암호 해독 성공 — 1호 행사 작전구역: 「${c.poiName}」` },
  ],
  wiretap: [
    { id: 'adj', name: '호위사령부 부관 휴대폰', gen: (s) => `"...준비는 끝났습니다. ${s.area}... [잡음] ...내일 오전까지 경계 유지하라우."` },
    { id: 'sec', name: '당 중앙위 비서실 유선', gen: (s) => `"...'${s.act}' 원고 최종본 보내라. 사진은... [잡음] ...현지에서 찍는다."` },
    { id: 'crew', name: '1호 열차 승무원 무전', gen: (s) => (s.transport === 'train' ? `"...${s.hub} 정차 중. 선로 경계 강화... [잡음] ...출발 명령 대기."` : '"...열차는 차고 대기. 이번엔 우리 차례 아니다... [잡음]"') },
  ],
  talk: {
    here: ['오늘 저쪽은 못 가게 막더라고요. 경호원들이 쫙 깔렸어요.', '아까 검은 차들이 줄지어 들어왔어요. 높으신 분이 온 것 같아요.', '(주위를 살피며) 여기 오늘 분위기가 이상해요… 조심하세요.', '저 안쪽에 간부들이 수첩 들고 우르르 몰려다니던데요.'],
    how: { train: '특별열차가', plane: '전용기가', car: '검은 차 행렬이' },
    rumor: (s, how) => `${s.area} 쪽으로 ${how} 갔다는 소문 들었어요.`,
    decoy: (d) => `친구가 그러는데 ${d.area}에 뭔가 큰 행사가 있대요. 확실하진 않아요.`,
    mundane: ['잘 모르겠는데요.', '오늘 날씨 좋네요.', '관광객이세요?', '바빠서요, 죄송해요.', '뉴스에서 북한 얘기 나오던데 전 관심 없어요.', '길 물어보시는 거면 저쪽이요.'],
    hostileMundane: ['…그런 건 묻지 마시라요.', '저는 모릅네다.', '(대답 없이 고개를 젓는다)', '오늘 생산 과제가 많아서 바쁩네다.'],
    guard: '물러서십시오. 여기서 뭐 하시는 겁니까?', flee: '…(당황하며 대답을 피하고 자리를 뜬다)', target: '(경호원들이 앞을 가로막는다)',
  },
};

// ───────────────────────── 도널드 트럼프 ─────────────────────────
const TRUMP = {
  id: 'trump', name: '도널드 트럼프', nameEn: 'Donald Trump', title: '미국 대통령', era: 2026, diff: 2,
  tagline: '비밀경호국 · 에어포스원 · 골프장 · 성대모사 대역',
  start: { country: 'South Korea', lon: 126.98, lat: 37.56, label: '서울' }, startDate: [2026, 9, 1, 9], limitH: 240,
  home: 'United States of America', hostile: 'United States of America', alertMul: 0.6,
  look: () => ({
    skin: 5, female: false, age: 80, hair: 'trump', hairCol: '#e2c46a', fw: 15, fh: 16, chin: 0.32,
    eyes: 'narrow', brows: 'normal', mouth: 'small', nose: 'wide', glasses: null, beard: null, mole: null, blush: false,
    hat: null, top: 'suit', topCol: '#1e2a4a', tie: '#d42a2a', top2: null, bottomCol: '#1a2440', shoeCol: '#0c0c10',
    stocky: true, pin: true, pinCol: ['#3a5ab8', '#e8e8e8', '#d42a2a', '#e8e8e8'], notebook: false, earpiece: false, backpack: false, medals: false, camera: false, doubleChin: true, skirt: false,
  }),
  info: { name: '도널드 트럼프', age: 80, birth: '1946년 6월 14일', birthplace: '미국 뉴욕 퀸스', nationality: '미국', job: '제47대 미국 대통령', note: '신장 약 190cm · 금발 스윕 헤어 · 긴 빨간 넥타이' },
  voice: { pitch: 104, vari: 0.35, formant: 0.9 },
  prison: { reason: '수감 사유: 숨바꼭질 패배', quotes: ['여기 인테리어 별로야. 내 호텔이 훨씬 좋지!', '이건 엄청나게, 엄청나게 불공정해!', '(창살 너머로 엄지를 치켜든다)', '변호사 불러! 최고의 변호사로!'] },
  entourage: { off: 3, offStyle: 'suit', offJob: '백악관 보좌관', guard: 5, guardJob: '비밀경호국 요원', car: '#141418' },
  doubleGroup: 'en', doubleJobs: ['트럼프 성대모사 코미디언', '행사 대역 배우', '열혈 지지자 (코스프레)'],
  officialGroups: false,
  briefClue: '대통령 공식 일정 비공개 전환. 워싱턴, 플로리다, 뉴욕·뉴저지, 해외 순방 가능성.',
  brief: `<p>미국 대통령 <b>도널드 트럼프</b>의 일정이 갑자기 비공개로 바뀌었다.</p>
    <p>너는 서울에서 출발한다. <b>10일</b> 안에 비밀경호국의 벽을 뚫고 대상을 찾아 <b>신원을 확인하고 포획</b>하라.</p>`,
  dossier: {
    points: ['풍성하게 뒤로 넘긴 <b>금발 머리</b>, 이마 위로 쓸어 넘긴 앞머리', '<b>남색 정장 + 길게 늘어뜨린 빨간 넥타이</b>', '구릿빛 피부, 옅은 눈썹, 오므린 입, 이중턱', '가슴에 <b>성조기 배지</b>', '주변에 <b>비밀경호국 요원</b>(검은 양복·선글라스·이어폰), 보좌관들'],
    moves: ['장거리는 <b>에어포스원</b>, 근거리는 <b>마린원</b> 헬기', '주말엔 <b>골프장</b>(마러라고·베드민스터·스코틀랜드)을 자주 찾음', '<b>성대모사 코미디언</b>이 비슷하게 차려입고 다님 — 얼굴 비교 필수'],
  },
  tools: { sns: 'SNS', snsIcon: 'sns', hack: '해킹', drone: '드론', tap: '도청' },
  travel: { kmh: 850, base: 2.5, road: 80, extra: {} },
  spots: [
    { poi: 'us_dc', country: 'United States of America', foreign: false, area: '워싱턴 D.C.', dir: '수도 워싱턴', transport: 'car', act: '백악관 기자회견', hub: '앤드루스 기지', golf: false, kw: ['워싱턴', '백악관', '기자회견', '브리핑'], w: 3 },
    { poi: 'us_maralago', country: 'United States of America', foreign: false, area: '팜비치', dir: '플로리다 남부', transport: 'plane', act: '마러라고 주말 휴식', hub: '팜비치 국제공항', golf: true, kw: ['마러라고', '팜비치', '플로리다'], w: 3 },
    { poi: 'us_trumptower', country: 'United States of America', foreign: false, area: '뉴욕 맨해튼', dir: '뉴욕', transport: 'heli', act: '트럼프 타워 체류', hub: '맨해튼 헬기장', golf: false, kw: ['뉴욕', '트럼프타워', '맨해튼'], w: 2 },
    { poi: 'us_bedminster', country: 'United States of America', foreign: false, area: '베드민스터', dir: '뉴저지', transport: 'heli', act: '여름 골프 휴가', hub: '모리스타운 공항', golf: true, kw: ['베드민스터', '뉴저지', '골프'], w: 2 },
    { poi: 'uk_turnberry', country: 'United Kingdom', foreign: true, area: '턴베리', dir: '스코틀랜드', transport: 'plane', act: '스코틀랜드 골프장 방문', hub: '프레스트윅 공항', golf: true, kw: ['스코틀랜드', '턴베리', '골프', '영국'], w: 1 },
    { poi: 'kr_jsa', country: 'South Korea', foreign: true, area: '판문점', dir: '한반도 DMZ', transport: 'plane', act: '깜짝 DMZ 방문', hub: '오산 공군기지', golf: false, kw: ['판문점', 'DMZ', '한국'], w: 1 },
  ],
  contacts: [
    { id: 'press', name: '케이틀린 로즈', org: '백악관 출입기자', rel: 0.8, busy: 0.2, clues: ['capital', 'activity'], look: { group: 'en', role: 'civ', female: true, age: 34 } },
    { id: 'adsb', name: '마이크 첸', org: '항공기 추적(ADS-B) 덕후', rel: 0.85, busy: 0.1, clues: ['transport', 'direction'], look: { group: 'en', role: 'civ', female: false, age: 27 } },
    { id: 'caddie', name: '조 맥그리거', org: '골프장 캐디 30년차', rel: 0.7, busy: 0.2, clues: ['golf', 'direction'], look: { group: 'en', role: 'civ', female: false, age: 58 } },
    { id: 'exss', name: '로버트 헤일', org: '前 비밀경호국 요원', rel: 0.9, busy: 0.35, clues: ['border', 'transport'], look: { group: 'en', role: 'civ', female: false, age: 52 } },
    { id: 'doorman', name: '루이스 가르시아', org: '트럼프 타워 도어맨', rel: 0.75, busy: 0.2, clues: ['tower', 'activity'], look: { group: 'es', role: 'civ', female: false, age: 44 } },
  ],
  clue: {
    border: (s) => (s.foreign ? `에어포스원이 바다를 건넜다는 얘기가 있어. 지금 미국 밖, ${ko(s.country)}이야.` : '해외 순방 일정은 없어. 미국 안에 있다고 보면 돼.'),
    direction: (s) => `경호 차량 대열이 ${s.dir} 쪽으로 움직였어.`,
    capital: (s) => (s.poi === 'us_dc' ? '오늘 백악관 브리핑룸 분위기가 빡빡해요. 본인이 워싱턴에 있는 게 확실해요.' : '오늘 백악관엔 없어요. 브리핑도 대변인이 대신 했고요.'),
    transport: (s) => (s.transport === 'plane' ? `에어포스원이 ${s.hub}에 내려앉는 걸 ADS-B로 잡았어요!`
      : s.transport === 'heli' ? `에어포스원은 기지에 그대로예요. 대신 마린원 헬기가 ${s.hub} 쪽으로 떴어요.`
        : '에어포스원도 마린원도 안 떴어요. 차량으로만 움직이는 중이에요.'),
    activity: (s) => `다음 일정 예고가 돌고 있어요. '${s.act}'라던데요.`,
    golf: (s) => (s.golf ? `이번 주 ${s.area} 코스 티타임이 전부 막혔어. 'VIP 예약'이래.` : '골프장 예약은 평소랑 똑같아. 이번엔 골프 치러 간 게 아닌가 봐.'),
    tower: (s) => (s.poi === 'us_trumptower' ? '오늘 로비에 비밀경호국이 쫙 깔렸어요. 위층에 계신 것 같아요.' : '오늘 타워는 조용해요. 뉴욕엔 안 오셨어요.'),
  },
  pred: {
    border: (s) => (x) => x.foreign !== s.foreign,
    capital: (s) => (x) => (x.poi === 'us_dc') !== (s.poi === 'us_dc'),
    transport: (s) => (x) => x.transport !== s.transport,
    golf: (s) => (x) => x.golf !== s.golf,
    tower: (s) => (x) => (x.poi === 'us_trumptower') !== (s.poi === 'us_trumptower'),
  },
  sns: {
    label: 'SNS', generic: ['트럼프', '대통령'],
    transport: { '에어포스원': 'plane', '마린원': 'heli' },
    pos: { plane: (s) => `${s.hub}에 에어포스원 착륙하는 거 봄!! ✈️ 실화냐`, heli: (s) => `${s.area} 상공에 마린원이랑 헬기 편대 지나감 🚁` },
    neg: { plane: '에어포스원 오늘도 앤드루스 기지에 그대로 있음. 추적앱 확인함', heli: '마린원 오늘은 안 떴대요. 헬기장 조용' },
    photo: { plane: 'plane', heli: 'heli' },
    rumor: (s) => `[속보?] 대통령 지금 ${s.area}에 있다는 목격담 돌고 있음`,
    evidence: (s) => [
      { text: `${s.area} 앞 도로 통제! 비밀경호국 SUV 줄줄이 🚙🚙🚙`, photo: 'convoy' },
      { text: `${s.area}에 검은 양복+선글라스 무리 ㄷㄷ 다 이어폰 꽂음`, photo: 'guards' },
      { text: `${s.area} 오늘 일반인 출입 금지래요 😤`, photo: 'closed' },
      ...(s.golf ? [{ text: `${s.area} 골프장 오늘 갑자기 전 코스 클로즈드. 골프카트 행렬 봄 ⛳` }] : []),
    ],
    noise: ['트럼프 오늘 또 긴 글 올림 ㅋㅋ', '대통령 일정 비공개라는데 어디 계신지 아는 사람?', '트럼프 성대모사 코미디언 또 떴네 진짜 똑같음', '골프 몇 번 쳤는지 세는 계정 있음 ㅋㅋ', '정장+긴 빨간 넥타이 = 그 사람? 성대모사하는 사람들도 그렇게 입음'],
    normal: [(a) => `${a} 날씨 굿 ☀️`, (a) => `${a} 여행 중 🇺🇸`, (a) => `${a} 햄버거 맛집 발견 🍔`, (a) => `${a} 사진 명소 추천합니다 📷`],
    authors: null,
  },
  hacks: [
    { id: 'cctv', name: '현지 교통 CCTV망', desc: '지금 있는 나라의 도로 CCTV에서 VIP 차량 행렬을 찾습니다.', diff: 1, repeat: true, result: (s, c) => (s.country === c.here ? `CCTV #${100 + c.n}: ${c.poiName} 인근에서 비밀경호국 차량 행렬 포착!` : `${ko(c.here)} 주요 도로 CCTV 스캔 완료 — VIP 차량 행렬 없음.`) },
    { id: 'faa', name: 'FAA 비행계획 시스템', desc: '에어포스원·마린원 비행계획을 조회합니다.', diff: 2, result: (s) => (s.transport === 'plane' ? `SAM28000(에어포스원) 비행계획: 앤드루스 → ${s.hub} — 도착 완료` : s.transport === 'heli' ? `에어포스원 대기. 마린원(VH-92) 비행계획: → ${s.hub}` : '에어포스원·마린원 비행계획 없음. 지상 이동 추정.') },
    { id: 'golfres', name: '골프장 예약 시스템', desc: '대통령 소유 골프장들의 예약 현황을 빼냅니다.', diff: 2, result: (s, c) => (s.golf ? `${c.poiName} — 이번 주 전 코스 'VIP 전용' 블록 예약!` : '소유 골프장 전부 정상 영업 (VIP 블록 없음).') },
    { id: 'ssradio', name: '비밀경호국 무전 암호', desc: '경호 무전을 해독해 정확한 위치를 알아냅니다. 실패 시 경계도 급상승.', diff: 3, result: (s, c) => `무전 해독: "보호 대상 위치 — 「${c.poiName}」"` },
  ],
  wiretap: [
    { id: 'chief', name: '비서실장 휴대폰', gen: (s) => `"...일정 확정입니다. ${s.area}... [잡음] ...기자들한텐 아직 비밀로 해요."` },
    { id: 'front', name: '마러라고 프론트 데스크', gen: (s) => (s.poi === 'us_maralago' ? '"네, 마러라고입니다. 이번 주는... [잡음] ...VIP 일정으로 전 층 예약 불가입니다."' : '"네, 마러라고입니다. 이번 주엔 오신다는 연락 없었어요... [잡음]"') },
    { id: 'crew', name: '전용기 승무원 무전', gen: (s) => (s.transport === 'plane' ? `"...${s.hub} 착륙 허가 받았다. 반복한다, ${s.hub}... [잡음]"` : '"...오늘 비행 없음. 기체 정비 중... [잡음]"') },
  ],
  talk: {
    here: ['저쪽 전부 통제됐어요. 비밀경호국이 쫙 깔렸어요.', '아까 헬기 소리 엄청 났어요. 거물이 온 것 같아요.', '긴 빨간 넥타이 맨 사람 봤어요! 진짜인지는 모르겠지만.', '경호원들이 사진 찍지 말래요.'],
    how: { plane: '에어포스원이', heli: '마린원 헬기가', car: '차량 행렬이' },
    rumor: (s, how) => `${s.area} 쪽으로 ${how} 갔다는 뉴스 봤어요.`,
    decoy: (d) => `${d.area}에 대통령 온다던데요? 확실하진 않아요.`,
    mundane: ['Sorry, 바빠서요.', '관광 오셨어요? 저기가 사진 명소예요.', '오늘 날씨 좋네요!', '정치 얘기는 좀...', '(이어폰을 끼고 있어 못 들은 척한다)'],
    hostileMundane: ['Sorry, 바빠서요.', '정치 얘기는 좀...', '관광 오셨어요?'],
    guard: '뒤로 물러서 주세요. 비밀경호국입니다.', flee: '...(수상하게 쳐다보며 자리를 뜬다)', target: '(비밀경호국 요원들이 앞을 가로막는다)',
  },
};

// ───────────────────────── 아돌프 히틀러 (1945) ─────────────────────────
const HITLER = {
  id: 'hitler', name: '아돌프 히틀러', nameEn: 'Adolf Hitler', title: '나치 독일 총통 (1945)', era: 1945, diff: 4,
  tagline: '시간여행 · 1945년 4월 · 벙커 · 탈출설',
  start: { country: 'United Kingdom', lon: -0.12, lat: 51.5, label: '런던' }, startDate: [1945, 3, 25, 9], limitH: 168,
  home: 'Germany', hostile: 'Germany', alertMul: 1.2,
  look: () => ({
    skin: 0, female: false, age: 56, hair: 'hitler', hairCol: '#2e241c', fw: 13, fh: 16, chin: 0.52,
    eyes: 'normal', brows: 'normal', mouth: 'neutral', nose: 'wide', glasses: null, beard: 'toothbrush', mole: null, blush: false,
    hat: null, top: 'suit', topCol: '#6f6a58', tie: '#141414', top2: null, bottomCol: '#262626', shoeCol: '#0c0c0c',
    stocky: false, pin: false, notebook: false, earpiece: false, backpack: false, medals: false, camera: false, doubleChin: false, skirt: false,
  }),
  info: { name: '아돌프 히틀러', age: 56, birth: '1889년 4월 20일', birthplace: '오스트리아 브라우나우암인', nationality: '독일 (오스트리아 출생)', job: '나치 독일 총통', note: '신장 약 175cm · 칫솔 콧수염 · 옆가르마' },
  voice: { pitch: 128, vari: 0.3, formant: 1.0 },
  prison: { reason: '죄목: 전쟁 범죄 · 반인도적 범죄 (국제군사재판 회부)', quotes: ['(말없이 벽만 바라보고 있다)', '……', '(창살 너머를 노려본다)'] },
  entourage: { off: 4, offStyle: null, offJob: null, guard: 4, guardJob: '총통 경호대원', car: '#1a1a1a' },
  doubleGroup: 'de', doubleJobs: ['대역 (신원 불명)', '배우 (대역 의심)'],
  officialGroups: true,
  briefClue: '1945년 4월 25일. 소련군이 베를린을 포위. 총통의 행방에 대해 벙커 잔류설과 탈출설이 엇갈린다.',
  brief: `<p><b>시간여행 작전.</b> 1945년 4월 25일, 베를린 함락 직전으로 간다.</p>
    <p>총통 <b>아돌프 히틀러</b>는 벙커에 있는가, 이미 빠져나갔는가? 런던의 연합군 정보부에서 출발해 <b>7일</b> 안에 찾아 <b>신원을 확인하고 체포</b>하라.
    이 시대엔 SNS도 드론도 없다 — <b>신문·라디오, 암호 해독, 정찰기, 무선 감청</b>을 써라.</p>`,
  dossier: {
    points: ['이마로 비스듬히 내린 <b>옆가르마 앞머리</b>, 짧은 옆머리', '코 밑의 작은 <b>칫솔 콧수염</b>', '회녹색 상의 + 흰 셔츠 + <b>검은 넥타이</b>', '긴 얼굴, 모자 없음', '주변에 <b>검은 제복 경호대</b>와 훈장 단 장교들'],
    moves: ['1945년 4월, 소련군이 베를린 포위 중', '벙커 잔류 · 알프스 산장 · 유보트 탈출 · 남미 도피설', '<b>대역설</b>이 있음 — 콧수염과 얼굴형을 비교할 것'],
  },
  tools: { sns: '신문·라디오', snsIcon: 'newspaper', hack: '암호 해독', drone: '정찰기', tap: '무선 감청' },
  travel: { kmh: 350, base: 3, road: 60, extra: { Germany: [3, '전선 우회 · 연합군 수송기'], Argentina: [30, '대서양 횡단 수송선'] } },
  spots: [
    { poi: 'de_bunker', country: 'Germany', foreign: false, area: '베를린', dir: '베를린 중심부', transport: 'bunker', act: '벙커 작전 회의', hub: '총통 관저', berlin: true, kw: ['베를린', '벙커', '총통관저', '작전회의'], w: 4 },
    { poi: 'de_gate', country: 'Germany', foreign: false, area: '베를린 티어가르텐', dir: '베를린 서쪽', transport: 'car', act: '베를린 방어선 시찰', hub: '브란덴부르크 문', berlin: true, kw: ['브란덴부르크문', '티어가르텐', '방어선'], w: 1 },
    { poi: 'de_berghof', country: 'Germany', foreign: false, area: '오버잘츠베르크', dir: '남부 바이에른 알프스', transport: 'plane', act: '알프스 요새 피신', hub: '잘츠부르크 비행장', kw: ['베르크호프', '알프스', '오버잘츠베르크', '바이에른'], w: 2 },
    { poi: 'de_flensburg', country: 'Germany', foreign: false, area: '플렌스부르크', dir: '북부 해안', transport: 'sub', act: '유보트 탈출 준비', hub: '플렌스부르크 항', kw: ['플렌스부르크', '항구', '북해'], w: 2 },
    { poi: 'at_braunau', country: 'Austria', foreign: true, area: '브라우나우', dir: '오스트리아 국경 마을', transport: 'car', act: '고향 은신', hub: '브라우나우', kw: ['브라우나우', '오스트리아', '고향'], w: 1 },
    { poi: 'ar_bariloche', country: 'Argentina', foreign: true, area: '바릴로체', dir: '남미 파타고니아', transport: 'sub', act: '남미 도피', hub: '마르 델 플라타 항', kw: ['바릴로체', '아르헨티나', '남미'], w: 1 },
  ],
  contacts: [
    { id: 'oss', name: '해리슨 소령', org: '연합군 OSS 정보장교', rel: 0.9, busy: 0.15, clues: ['border', 'direction', 'capital'], look: { group: 'en', role: 'civ', female: false, age: 41, era: 1945 } },
    { id: 'resist', name: '리젤', org: '베를린 지하 저항조직', rel: 0.7, busy: 0.3, clues: ['capital', 'activity'], look: { group: 'de', role: 'civ', female: true, age: 29, era: 1945 } },
    { id: 'pilot', name: '톰 브래들리', org: '영국 공군 정찰 조종사', rel: 0.8, busy: 0.2, clues: ['transport', 'direction'], look: { group: 'en', role: 'civ', female: false, age: 26, era: 1945 } },
    { id: 'deserter', name: '한스 크뤼거', org: '독일군 탈영병 (前 관저 운전병)', rel: 0.6, busy: 0.15, clues: ['favorites', 'transport'], look: { group: 'de', role: 'civ', female: false, age: 34, era: 1945 } },
    { id: 'swiss', name: '에밀 브루너', org: '취리히 은행가', rel: 0.65, busy: 0.4, clues: ['escape', 'border'], look: { group: 'de', role: 'civ', female: false, age: 60, era: 1945 } },
  ],
  clue: {
    border: (s) => (s.foreign ? `스위스 쪽 정보로는 이미 독일을 빠져나갔다는 설이 있소. ${ko(s.country)} 방면이오.` : '국경을 넘었다는 확실한 증거는 없소. 아직 독일 안에 있을 거요.'),
    direction: (s) => `친위대 호송대가 ${s.dir} 방향으로 이동하는 걸 봤다는 보고가 있소.`,
    capital: (s) => (s.berlin ? '관저 주변 경비가 여전히 삼엄해요. 아직 베를린에 있어요.' : '관저 경비가 눈에 띄게 줄었어요. 베를린을 떠난 것 같아요.'),
    transport: (s) => ({
      sub: `${s.hub}에서 유보트 한 척이 몰래 출항 준비 중이라는 정찰 보고요.`,
      plane: `템펠호프 근처에서 소형 수송기가 몰래 이륙하는 걸 봤소. 목적지는 ${s.hub} 쪽.`,
      car: `검은 메르세데스 호송대가 ${s.dir}로 향하는 걸 상공에서 봤습니다.`,
      bunker: '지상 이동 흔적이 전혀 없소. 지하에 틀어박혀 있는 듯하오.',
    }[s.transport]),
    activity: (s) => `...듣기로는 '${s.act}' 준비를 한다더군.`,
    favorites: (s, r, T) => {
      if (s.foreign) return '남미로 가는 비밀 탈출로 얘기를 들었어요. 이미 떠났을지도...';
      const dom = shuffle(r, T.spots.filter((x) => !x.foreign && x.poi !== s.poi)).slice(0, 2).map((x) => x.area);
      return `총통은 ${shuffle(r, [s.area, ...dom]).join(', ')} 중 한 곳에 있을 거요. 전에 모셨던 곳들이지.`;
    },
    escape: (s) => (s.foreign ? `스위스 계좌에서 큰돈이 ${ko(s.country)}로 송금됐소. 탈출 자금이오.` : '수상한 해외 송금은 없었소. 아직 탈출하지 않은 것 같소.'),
  },
  pred: {
    border: (s) => (x) => x.foreign !== s.foreign,
    escape: (s) => (x) => x.foreign !== s.foreign,
    capital: (s) => (x) => !!x.berlin !== !!s.berlin,
    transport: (s) => (x) => x.transport !== s.transport,
  },
  sns: {
    label: '신문·라디오', generic: ['히틀러', '총통', '나치'],
    transport: { '유보트': 'sub', '특별기': 'plane' },
    pos: { sub: (s) => `[어민 증언] ${s.hub} 앞바다에 유보트가 떠올랐다가 사라졌다`, plane: (s) => `[목격담] 베를린에서 몰래 뜬 수송기가 ${s.hub} 쪽으로 향했다` },
    neg: { sub: '[해군 소식] 최근 특별 출항한 유보트는 없다고', plane: '[공군 소식] 연료 부족으로 고위 인사 특별기 운항 전면 중단' },
    photo: { sub: 'sub', plane: null },
    rumor: (s) => `[소문] 총통이 ${s.area}에 있다는 말이 돈다`,
    evidence: (s) => [
      { text: `[BBC 라디오] ${s.area} 부근에서 친위대 차량 행렬 목격 보도`, photo: 'convoy' },
      { text: `[스위스 신문] ${s.area}에 정체불명 고위 인사 도착설`, photo: null },
      { text: `[주민 증언] ${s.area} 일대 통행 금지. 검문이 크게 강화됐다`, photo: 'closed' },
      ...(s.transport === 'sub' ? [{ text: `[어민 증언] ${s.hub}에 유보트 입항, 민간인 접근 금지`, photo: 'sub' }] : []),
    ],
    noise: ['[선전 방송] 총통께서 베를린을 끝까지 사수하신다!', '[연합 통신] 소련군 베를린 시내 진입', '[BBC] 나치 수뇌부 도주설 확인 중', '[소문] 총통 대역이 여럿이라는 말이 돈다', '[신문] 베를린 시민들 방공호 생활 계속'],
    normal: [(a) => `[지역 신문] ${a} 배급 줄 길어져`, (a) => `[지역 신문] ${a} 공습 피해 복구 중`, (a) => `[라디오] ${a} 날씨 맑음, 밤엔 등화관제`],
    authors: ['런던 타임스', 'BBC 라디오', '취리히 신문', '연합 통신', '지하 방송', '뉴욕 헤럴드'],
  },
  hacks: [
    { id: 'recon', name: '항공 정찰사진 판독', desc: '지금 있는 나라의 최근 정찰사진에서 호송대를 찾습니다.', diff: 1, repeat: true, result: (s, c) => (s.country === c.here ? `정찰사진 #${100 + c.n}: ${c.poiName} 주변에 경호 차량 다수 포착!` : `${ko(c.here)} 정찰사진 판독 완료 — 특이 호송대 없음.`) },
    { id: 'navy', name: '독일 해군 암호', desc: '유보트 출항 명령을 해독합니다.', diff: 2, result: (s) => (s.transport === 'sub' ? `유보트 U-977 특별 출항 명령: ${s.hub} → 목적지 기밀` : '특별 출항 명령 없음. 유보트 전부 정규 임무 중.') },
    { id: 'luft', name: '공군 비행일지', desc: '고위 인사 특별기 운항 기록을 해독합니다.', diff: 2, result: (s) => (s.transport === 'plane' ? `특별기 Ju 290 비행 기록: 베를린 → ${s.hub}` : '고위 인사 특별기 운항 기록 없음.') },
    { id: 'enigma', name: '에니그마 (최고사령부)', desc: '최고사령부 에니그마 전문을 해독해 정확한 위치를 알아냅니다. 실패 시 경계도 급상승.', diff: 3, result: (s, c) => `에니그마 해독 성공 — 총통 소재지: 「${c.poiName}」` },
  ],
  wiretap: [
    { id: 'switch', name: '총통 관저 교환대', gen: (s) => (s.berlin ? '"...총통 각하께 연결합니다... [잡음] ...지하 회의실로 내려오라는 명령입니다."' : '"...각하는 여기 안 계십니다. 연결할 수 없... [잡음]"') },
    { id: 'ss', name: '경호대 무전망', gen: (s) => `"...호송 준비 완료. ${s.area}... [잡음] ...민간인 전부 통제하라."` },
    { id: 'navycable', name: '해군 사령부 전신', gen: (s) => (s.transport === 'sub' ? `"...특수 화물 적재 완료. ${s.hub}에서 대기... [잡음]"` : '"...특별 임무 없음. 정규 작전 계속... [잡음]"') },
  ],
  talk: {
    here: ['저쪽엔 경호대가 겹겹이 서 있어요. 가까이 가지 마세요.', '검은 메르세데스가 들어가는 걸 봤어요...', '(작게) 높으신 분이 여기 계시다는 소문이...', '장교들이 서류를 들고 계속 들락날락해요.'],
    how: { car: '호송대가', plane: '비행기가', sub: '잠수함이', bunker: '높은 분들이' },
    rumor: (s, how) => (s.transport === 'bunker' ? '높은 분들은 지하로 들어가서 안 나온다는 소문이에요.' : `${s.area} 쪽으로 ${how} 갔다는 소문이 있어요.`),
    decoy: (d) => `이웃이 그러는데 ${d.area}로 높은 분이 갔대요. 확실하진 않아요.`,
    mundane: ['전쟁은 언제 끝나나요...', '먹을 게 없어요.', '공습 경보 울리면 방공호로 가세요.', '저는 아무것도 몰라요.', '(지친 얼굴로 고개를 젓는다)'],
    hostileMundane: ['(주위를 두리번거리며) 그런 걸 물으면 큰일 나요.', '...(대답 없이 서둘러 지나간다)', '저는 아무것도 몰라요.'],
    guard: '멈춰! 신분증을 보여라!', flee: '...(겁에 질려 자리를 뜬다)', target: '(경호대가 총을 겨누며 가로막는다)',
  },
};

export const TARGETS = { kju: KJU, trump: TRUMP, hitler: HITLER };
export const TARGET_ORDER = ['kju', 'trump', 'hitler'];
