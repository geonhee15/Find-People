// 정적 데이터: 나라별 장소(POI), 대상 후보 위치, 연락처
// dx/dy: 지도 아이콘이 겹칠 때 화면 픽셀 보정

export const COUNTRY_POIS = {
  'North Korea': [
    { id: 'nk_square', name: '평양 · 김일성광장', type: 'capital', lon: 125.7536, lat: 39.0194, scene: { kind: 'square' } },
    { id: 'nk_wonsan', name: '원산 · 갈마해안관광지구', type: 'beach', lon: 127.53, lat: 39.19, scene: { kind: 'beach', style: 'wonsan' } },
    { id: 'nk_masik', name: '마식령 스키장', type: 'ski', lon: 127.2, lat: 38.93, dx: -6, dy: 4, scene: { kind: 'ski' } },
    { id: 'nk_paektu', name: '백두산 · 천지', type: 'mountain', lon: 128.08, lat: 42.0, scene: { kind: 'mountain', style: 'paektu' } },
    { id: 'nk_myohyang', name: '묘향산', type: 'mountain', lon: 126.28, lat: 40.0, scene: { kind: 'mountain', style: 'green' } },
    { id: 'nk_hamhung', name: '함흥 · 흥남비료연합기업소', type: 'factory', lon: 127.54, lat: 39.83, scene: { kind: 'factory' } },
    { id: 'nk_sohae', name: '동창리 · 서해위성발사장', type: 'launch', lon: 124.705, lat: 39.66, dy: 6, scene: { kind: 'launch', style: 'nk' } },
    { id: 'nk_sinuiju', name: '신의주역', type: 'station', lon: 124.45, lat: 40.08, dy: -6, scene: { kind: 'station', style: 'nk' } },
  ],
  'South Korea': [
    { id: 'kr_gwanghwamun', name: '서울 · 광화문광장', type: 'capital', lon: 126.977, lat: 37.572, dx: -8, scene: { kind: 'landmark', style: 'gwanghwamun' } },
    { id: 'kr_gangnam', name: '서울 · 강남역', type: 'city', lon: 127.03, lat: 37.5, dx: 10, dy: 4, scene: { kind: 'city', style: 'seoul' } },
    { id: 'kr_jsa', name: '판문점 JSA', type: 'jsa', lon: 126.677, lat: 37.956, dy: -4, scene: { kind: 'jsa' } },
    { id: 'kr_busan', name: '부산 · 해운대', type: 'beach', lon: 129.16, lat: 35.16, scene: { kind: 'beach', style: 'haeundae' } },
    { id: 'kr_seorak', name: '설악산', type: 'mountain', lon: 128.47, lat: 38.12, scene: { kind: 'mountain', style: 'green' } },
    { id: 'kr_halla', name: '제주 · 한라산', type: 'mountain', lon: 126.53, lat: 33.36, scene: { kind: 'mountain', style: 'green' } },
  ],
  China: [
    { id: 'cn_beijing', name: '베이징 · 천안문광장', type: 'capital', lon: 116.3975, lat: 39.9087, scene: { kind: 'landmark', style: 'tiananmen' } },
    { id: 'cn_wall', name: '만리장성 · 바다링', type: 'mountain', lon: 116.02, lat: 40.36, dx: -8, dy: -8, scene: { kind: 'mountain', style: 'greatwall' } },
    { id: 'cn_dandong', name: '단둥역', type: 'station', lon: 124.39, lat: 40.12, scene: { kind: 'station', style: 'cn' } },
    { id: 'cn_shanghai', name: '상하이 · 와이탄', type: 'city', lon: 121.49, lat: 31.24, scene: { kind: 'city', style: 'shanghai' } },
  ],
  Russia: [
    { id: 'ru_moscow', name: '모스크바 · 붉은광장', type: 'capital', lon: 37.62, lat: 55.754, scene: { kind: 'landmark', style: 'redsquare' } },
    { id: 'ru_vladi', name: '블라디보스토크 · 루스키섬', type: 'city', lon: 131.89, lat: 43.02, scene: { kind: 'landmark', style: 'bridge' } },
    { id: 'ru_vostochny', name: '보스토치니 우주기지', type: 'launch', lon: 128.33, lat: 51.88, scene: { kind: 'launch', style: 'ru' } },
    { id: 'ru_baikal', name: '바이칼 호수', type: 'mountain', lon: 106.5, lat: 52.5, scene: { kind: 'mountain', style: 'lake' } },
  ],
  Japan: [
    { id: 'jp_shibuya', name: '도쿄 · 시부야', type: 'capital', lon: 139.7, lat: 35.66, scene: { kind: 'city', style: 'tokyo' } },
    { id: 'jp_fuji', name: '후지산', type: 'mountain', lon: 138.73, lat: 35.36, dx: -8, dy: 4, scene: { kind: 'mountain', style: 'fuji' } },
    { id: 'jp_osaka', name: '오사카 · 도톤보리', type: 'city', lon: 135.5, lat: 34.67, scene: { kind: 'city', style: 'tokyo' } },
  ],
  'United States of America': [
    { id: 'us_dc', name: '워싱턴 D.C. · 백악관', type: 'capital', lon: -77.036, lat: 38.897, scene: { kind: 'landmark', style: 'whitehouse' } },
    { id: 'us_ny', name: '뉴욕 · 타임스스퀘어', type: 'city', lon: -73.985, lat: 40.758, dy: -8, scene: { kind: 'city', style: 'ny' } },
    { id: 'us_canyon', name: '그랜드캐니언', type: 'mountain', lon: -112.11, lat: 36.1, scene: { kind: 'mountain', style: 'canyon' } },
  ],
  Vietnam: [
    { id: 'vn_hanoi', name: '하노이 · 호안끼엠', type: 'capital', lon: 105.85, lat: 21.03, scene: { kind: 'city', style: 'hanoi' } },
  ],
  France: [{ id: 'fr_paris', name: '파리 · 에펠탑', type: 'capital', lon: 2.29, lat: 48.86, scene: { kind: 'landmark', style: 'eiffel' } }],
  'United Kingdom': [{ id: 'uk_london', name: '런던 · 빅벤', type: 'capital', lon: -0.12, lat: 51.5, scene: { kind: 'landmark', style: 'bigben' } }],
  Egypt: [{ id: 'eg_giza', name: '기자 · 피라미드', type: 'landmark', lon: 31.13, lat: 29.98, scene: { kind: 'landmark', style: 'pyramid' } }],
};

// 대상이 있을 수 있는 곳 (가중치 w). kw = SNS 검색에 걸리는 키워드
export const SPOTS = [
  { poi: 'nk_square', country: 'North Korea', foreign: false, area: '평양', dir: '수도 평양', transport: 'car', act: '열병식 준비 점검', station: '평양역', kw: ['평양', '김일성광장', '열병식', '교통통제'], w: 3 },
  { poi: 'nk_wonsan', country: 'North Korea', foreign: false, area: '원산', dir: '동해안', transport: 'train', act: '해안 휴양지 휴식', station: '원산역', kw: ['원산', '갈마', '해변', '동해안', '1호열차'], w: 3 },
  { poi: 'nk_masik', country: 'North Korea', foreign: false, area: '마식령', dir: '동해안', transport: 'car', act: '스키장 현지지도', station: '원산역', kw: ['마식령', '스키장', '현지지도', '동해안'], w: 1 },
  { poi: 'nk_paektu', country: 'North Korea', foreign: false, area: '삼지연', dir: '북부 산악지대', transport: 'train', act: '백두산 등정', station: '삼지연역', kw: ['백두산', '삼지연', '천지', '1호열차'], w: 2 },
  { poi: 'nk_myohyang', country: 'North Korea', foreign: false, area: '향산', dir: '북서부 내륙 산간', transport: 'car', act: '특각(별장) 휴식', station: '향산역', kw: ['묘향산', '향산', '특각'], w: 1 },
  { poi: 'nk_hamhung', country: 'North Korea', foreign: false, area: '함흥', dir: '동해안 북부', transport: 'train', act: '비료공장 현지지도', station: '함흥역', kw: ['함흥', '흥남', '비료공장', '현지지도', '1호열차'], w: 2 },
  { poi: 'nk_sohae', country: 'North Korea', foreign: false, area: '동창리', dir: '서해안', transport: 'car', act: '위성 발사 참관', station: '—', kw: ['동창리', '서해위성발사장', '위성발사', '미사일'], w: 2 },
  { poi: 'nk_sinuiju', country: 'North Korea', foreign: false, area: '신의주', dir: '북서부 국경', transport: 'train', act: '수해 복구 현지지도', station: '신의주역', kw: ['신의주', '압록강', '수해', '1호열차', '현지지도'], w: 1 },
  { poi: 'ru_vladi', country: 'Russia', foreign: true, area: '블라디보스토크', dir: '러시아 극동', transport: 'train', act: '북러 정상회담', station: '블라디보스토크역', border: '두만강 철교', kw: ['블라디보스토크', '루스키섬', '정상회담', '1호열차', '러시아'], w: 2 },
  { poi: 'ru_vostochny', country: 'Russia', foreign: true, area: '보스토치니', dir: '러시아 극동 내륙', transport: 'train', act: '우주기지 시찰 및 회담', station: '치올콥스키역', border: '두만강 철교', kw: ['보스토치니', '우주기지', '러시아', '1호열차', '정상회담'], w: 1 },
  { poi: 'ru_moscow', country: 'Russia', foreign: true, area: '모스크바', dir: '러시아 서부', transport: 'plane', act: '기념행사 참석', station: '브누코보 공항', kw: ['모스크바', '붉은광장', '참매1호', '러시아'], w: 1 },
  { poi: 'cn_beijing', country: 'China', foreign: true, area: '베이징', dir: '중국 수도권', transport: 'train', act: '북중 정상회담', station: '베이징역', border: '압록강 철교(단둥)', kw: ['베이징', '천안문', '정상회담', '1호열차', '중국', '단둥'], w: 2 },
];

export const CONTACTS = [
  { id: 'nis', name: '박 과장', org: '국정원 대북정보팀', rel: 0.9, busy: 0.1, clues: ['border', 'direction', 'capital'], look: { group: 'ko', role: 'civ', female: false, age: 47 } },
  { id: 'osint', name: '노아 킴', org: '민간 위성영상 분석가', rel: 0.8, busy: 0.15, clues: ['transport', 'direction'], look: { group: 'en', role: 'civ', female: false, age: 31 } },
  { id: 'journalist', name: '엘렌 추', org: '외신 베이징 특파원', rel: 0.7, busy: 0.25, clues: ['activity', 'border'], look: { group: 'zh', role: 'civ', female: true, age: 36 } },
  { id: 'defector', name: '리성호', org: '탈북민 · 前 호위사령부 운전병', rel: 0.65, busy: 0.15, clues: ['favorites', 'transport'], look: { group: 'nk', role: 'civ', female: false, age: 52 } },
  { id: 'diplomat', name: '한스 뮐러', org: '평양 주재 유럽 외교관', rel: 0.85, busy: 0.45, clues: ['capital', 'activity'], look: { group: 'de', role: 'civ', female: false, age: 58 } },
];

export const HACK_SYSTEMS = [
  { id: 'cctv', name: '현지 교통 CCTV망', desc: '지금 있는 나라의 도로 CCTV에서 VIP 차량 행렬을 찾습니다.', diff: 1, repeat: true },
  { id: 'rail', name: '북한 철도성 운행 DB', desc: '특별열차(1호 열차)의 최근 운행 기록을 빼냅니다.', diff: 2 },
  { id: 'atc', name: '동북아 항공 관제 기록', desc: '전용기 "참매 1호"의 비행 계획을 조회합니다.', diff: 2 },
  { id: 'guard', name: '호위사령부 암호 통신', desc: '1호 행사 작전구역 코드를 해독합니다. 실패 시 경계도 급상승.', diff: 3 },
];
