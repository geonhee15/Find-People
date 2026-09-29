// 정적 데이터: 나라별 장소(POI). 대상별 데이터는 targets.js
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
    { id: 'us_ny', name: '뉴욕 · 타임스스퀘어', type: 'city', lon: -73.985, lat: 40.758, dy: -12, dx: -2, scene: { kind: 'city', style: 'ny' } },
    { id: 'us_trumptower', name: '뉴욕 · 트럼프 타워', type: 'city', lon: -73.974, lat: 40.762, dx: 12, dy: 2, scene: { kind: 'city', style: 'trumptower' } },
    { id: 'us_bedminster', name: '뉴저지 · 베드민스터 골프클럽', type: 'golf', lon: -74.67, lat: 40.66, dx: -12, dy: 10, scene: { kind: 'golf', style: 'nj' } },
    { id: 'us_maralago', name: '팜비치 · 마러라고', type: 'beach', lon: -80.037, lat: 26.677, scene: { kind: 'resort' } },
    { id: 'us_canyon', name: '그랜드캐니언', type: 'mountain', lon: -112.11, lat: 36.1, scene: { kind: 'mountain', style: 'canyon' } },
  ],
  Vietnam: [
    { id: 'vn_hanoi', name: '하노이 · 호안끼엠', type: 'capital', lon: 105.85, lat: 21.03, scene: { kind: 'city', style: 'hanoi' } },
  ],
  France: [{ id: 'fr_paris', name: '파리 · 에펠탑', type: 'capital', lon: 2.29, lat: 48.86, scene: { kind: 'landmark', style: 'eiffel' } }],
  'United Kingdom': [
    { id: 'uk_london', name: '런던 · 빅벤', type: 'capital', lon: -0.12, lat: 51.5, scene: { kind: 'landmark', style: 'bigben' } },
    { id: 'uk_turnberry', name: '스코틀랜드 · 턴베리 골프장', type: 'golf', lon: -4.83, lat: 55.32, scene: { kind: 'golf', style: 'scotland' } },
  ],
  Egypt: [{ id: 'eg_giza', name: '기자 · 피라미드', type: 'landmark', lon: 31.13, lat: 29.98, scene: { kind: 'landmark', style: 'pyramid' } }],
};

// 1945년 시간여행 모드 전용 장소 (여기 없는 나라는 옛 도시 스타일로 자동 생성)
export const COUNTRY_POIS_1945 = {
  Germany: [
    { id: 'de_bunker', name: '베를린 · 총통 관저 벙커', type: 'ruins', lon: 13.381, lat: 52.512, dx: 10, dy: 4, scene: { kind: 'ruins', style: 'bunker' } },
    { id: 'de_gate', name: '베를린 · 브란덴부르크 문', type: 'landmark', lon: 13.377, lat: 52.516, dx: -10, dy: -6, scene: { kind: 'ruins', style: 'gate' } },
    { id: 'de_berghof', name: '오버잘츠베르크 · 베르크호프', type: 'mountain', lon: 13.04, lat: 47.63, scene: { kind: 'mountain', style: 'alps' } },
    { id: 'de_flensburg', name: '플렌스부르크 항구', type: 'harbor', lon: 9.43, lat: 54.79, scene: { kind: 'harbor', style: 'uboat' } },
  ],
  Austria: [{ id: 'at_braunau', name: '브라우나우암인', type: 'village', lon: 13.2, lat: 48.2, scene: { kind: 'village', style: 'old' } }],
  Argentina: [
    { id: 'ar_bariloche', name: '바릴로체 · 나우엘우아피 호수', type: 'mountain', lon: -71.3, lat: -41.13, scene: { kind: 'mountain', style: 'lake' } },
    { id: 'ar_buenos45', name: '부에노스아이레스 항구', type: 'harbor', lon: -58.37, lat: -34.6, scene: { kind: 'harbor', style: 'port' } },
  ],
  'United Kingdom': [{ id: 'uk_london45', name: '런던 · 빅벤', type: 'capital', lon: -0.12, lat: 51.5, scene: { kind: 'landmark', style: 'bigben' } }],
};
export function poiListFor(country, era) {
  return era === 1945 ? COUNTRY_POIS_1945[country] : COUNTRY_POIS[country];
}
