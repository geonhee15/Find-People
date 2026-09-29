// 세계 지도 데이터 로딩 + 스캔라인 래스터라이저 (안티앨리어싱 없는 픽셀 정확 채우기)
/* global d3, topojson */
import { hashStr, mulberry32, pick } from './util.js';

export const KO = {
  'South Korea': '대한민국', 'North Korea': '북한', China: '중국', Japan: '일본', Russia: '러시아', 'United States of America': '미국',
  Canada: '캐나다', Mexico: '멕시코', Brazil: '브라질', Argentina: '아르헨티나', Chile: '칠레', Peru: '페루', Colombia: '콜롬비아', Venezuela: '베네수엘라',
  Bolivia: '볼리비아', Ecuador: '에콰도르', Paraguay: '파라과이', Uruguay: '우루과이', Cuba: '쿠바', 'United Kingdom': '영국', France: '프랑스',
  Germany: '독일', Italy: '이탈리아', Spain: '스페인', Portugal: '포르투갈', Netherlands: '네덜란드', Belgium: '벨기에', Switzerland: '스위스',
  Austria: '오스트리아', Poland: '폴란드', Czechia: '체코', Sweden: '스웨덴', Norway: '노르웨이', Finland: '핀란드', Denmark: '덴마크', Iceland: '아이슬란드',
  Ireland: '아일랜드', Greece: '그리스', Turkey: '튀르키예', Ukraine: '우크라이나', Belarus: '벨라루스', Romania: '루마니아', Hungary: '헝가리',
  Bulgaria: '불가리아', Serbia: '세르비아', Croatia: '크로아티아', Egypt: '이집트', Libya: '리비아', Algeria: '알제리', Morocco: '모로코', Tunisia: '튀니지',
  Sudan: '수단', Ethiopia: '에티오피아', Kenya: '케냐', Tanzania: '탄자니아', Nigeria: '나이지리아', Ghana: '가나', 'South Africa': '남아프리카공화국',
  'Dem. Rep. Congo': '콩고민주공화국', Angola: '앙골라', Namibia: '나미비아', Botswana: '보츠와나', Zimbabwe: '짐바브웨', Zambia: '잠비아', Madagascar: '마다가스카르',
  Mali: '말리', Niger: '니제르', Chad: '차드', Somalia: '소말리아', Senegal: '세네갈', Cameroon: '카메룬', 'Saudi Arabia': '사우디아라비아', Iran: '이란',
  Iraq: '이라크', Syria: '시리아', Jordan: '요르단', Israel: '이스라엘', 'United Arab Emirates': '아랍에미리트', Qatar: '카타르', Kuwait: '쿠웨이트',
  Oman: '오만', Yemen: '예멘', Afghanistan: '아프가니스탄', Pakistan: '파키스탄', India: '인도', Nepal: '네팔', Bangladesh: '방글라데시', 'Sri Lanka': '스리랑카',
  Myanmar: '미얀마', Thailand: '태국', Laos: '라오스', Cambodia: '캄보디아', Vietnam: '베트남', Malaysia: '말레이시아', Singapore: '싱가포르',
  Indonesia: '인도네시아', Philippines: '필리핀', Taiwan: '대만', Mongolia: '몽골', Kazakhstan: '카자흐스탄', Uzbekistan: '우즈베키스탄',
  Turkmenistan: '투르크메니스탄', Kyrgyzstan: '키르기스스탄', Tajikistan: '타지키스탄', Georgia: '조지아', Armenia: '아르메니아', Azerbaijan: '아제르바이잔',
  Australia: '호주', 'New Zealand': '뉴질랜드', 'Papua New Guinea': '파푸아뉴기니', Greenland: '그린란드', Antarctica: '남극', 'Hong Kong': '홍콩',
  Guatemala: '과테말라', Honduras: '온두라스', Nicaragua: '니카라과', Panama: '파나마', 'Costa Rica': '코스타리카', Haiti: '아이티', 'Dominican Rep.': '도미니카공화국',
  Estonia: '에스토니아', Latvia: '라트비아', Lithuania: '리투아니아', Slovakia: '슬로바키아', Slovenia: '슬로베니아', Moldova: '몰도바', Lebanon: '레바논',
  Mozambique: '모잠비크', Uganda: '우간다', Mauritania: '모리타니', 'Central African Rep.': '중앙아프리카공화국', 'S. Sudan': '남수단', Gabon: '가봉', Congo: '콩고',
  'Côte d\'Ivoire': '코트디부아르', 'Burkina Faso': '부르키나파소', Guinea: '기니', Malawi: '말라위', Eritrea: '에리트레아', Bhutan: '부탄', Brunei: '브루나이', 'Timor-Leste': '동티모르',
  Luxembourg: '룩셈부르크', Albania: '알바니아', Macedonia: '북마케도니아', Montenegro: '몬테네그로', 'Bosnia and Herz.': '보스니아', Cyprus: '키프로스',
  Jamaica: '자메이카', 'W. Sahara': '서사하라', Fiji: '피지', Guyana: '가이아나', Suriname: '수리남', Rwanda: '르완다', Burundi: '부룬디', Benin: '베냉', Togo: '토고',
  'Sierra Leone': '시에라리온', Liberia: '라이베리아', Djibouti: '지부티', Lesotho: '레소토', eSwatini: '에스와티니', Bahrain: '바레인', Palestine: '팔레스타인', 'El Salvador': '엘살바도르',
};
// 수도 좌표 (없으면 중심점 사용)
export const CAPITALS = {
  'United Kingdom': ['런던', -0.12, 51.5], France: ['파리', 2.35, 48.86], Germany: ['베를린', 13.4, 52.52], Italy: ['로마', 12.5, 41.9], Spain: ['마드리드', -3.7, 40.42],
  Canada: ['오타와', -75.7, 45.42], Mexico: ['멕시코시티', -99.13, 19.43], Brazil: ['브라질리아', -47.9, -15.8], Argentina: ['부에노스아이레스', -58.4, -34.6],
  Australia: ['캔버라', 149.13, -35.28], India: ['뉴델리', 77.2, 28.6], Egypt: ['카이로', 31.24, 30.04], Turkey: ['앙카라', 32.85, 39.93], Iran: ['테헤란', 51.39, 35.69],
  'Saudi Arabia': ['리야드', 46.72, 24.69], Thailand: ['방콕', 100.5, 13.75], Vietnam: ['하노이', 105.85, 21.03], Indonesia: ['자카르타', 106.85, -6.2],
  Philippines: ['마닐라', 120.98, 14.6], Mongolia: ['울란바토르', 106.9, 47.9], Kazakhstan: ['아스타나', 71.45, 51.17], Ukraine: ['키이우', 30.52, 50.45],
  Poland: ['바르샤바', 21.01, 52.23], Sweden: ['스톡홀름', 18.07, 59.33], Norway: ['오슬로', 10.75, 59.91], Finland: ['헬싱키', 24.94, 60.17],
  'South Africa': ['프리토리아', 28.19, -25.75], Nigeria: ['아부자', 7.49, 9.06], Kenya: ['나이로비', 36.82, -1.29], Ethiopia: ['아디스아바바', 38.75, 9.03],
  Peru: ['리마', -77.04, -12.05], Chile: ['산티아고', -70.65, -33.45], Colombia: ['보고타', -74.07, 4.71], Pakistan: ['이슬라마바드', 73.05, 33.68],
  Malaysia: ['쿠알라룸푸르', 101.69, 3.14], Taiwan: ['타이베이', 121.56, 25.03], 'New Zealand': ['웰링턴', 174.78, -41.29], Greece: ['아테네', 23.73, 37.98],
  Cuba: ['아바나', -82.37, 23.11], Laos: ['비엔티안', 102.6, 17.97], Cambodia: ['프놈펜', 104.92, 11.56], Myanmar: ['네피도', 96.13, 19.76],
  Belarus: ['민스크', 27.56, 53.9], Iraq: ['바그다드', 44.36, 33.31], Syria: ['다마스쿠스', 36.29, 33.51], Israel: ['예루살렘', 35.21, 31.77],
  Netherlands: ['암스테르담', 4.9, 52.37], Belgium: ['브뤼셀', 4.35, 50.85], Switzerland: ['베른', 7.45, 46.95], Austria: ['빈', 16.37, 48.21],
  Portugal: ['리스본', -9.14, 38.72], Ireland: ['더블린', -6.26, 53.35], Denmark: ['코펜하겐', 12.57, 55.68], Venezuela: ['카라카스', -66.9, 10.5],
  Algeria: ['알제', 3.06, 36.75], Morocco: ['라바트', -6.84, 34.02], Afghanistan: ['카불', 69.17, 34.53], Bangladesh: ['다카', 90.41, 23.81],
  Nepal: ['카트만두', 85.32, 27.72], Uzbekistan: ['타슈켄트', 69.24, 41.3], 'United Arab Emirates': ['아부다비', 54.37, 24.45], Singapore: ['싱가포르', 103.82, 1.35],
  Iceland: ['레이캬비크', -21.9, 64.15], Greenland: ['누크', -51.72, 64.18], Hungary: ['부다페스트', 19.04, 47.5], Romania: ['부쿠레슈티', 26.1, 44.43],
};

export const geo = { features: [], byName: new Map(), idRaster: null, RW: 2048, RH: 1024 };

function continentOf(name, lon, lat) {
  if (name === 'Antarctica' || lat < -60) return 'Antarctica';
  if (name === 'Russia') return 'Asia';
  if (name === 'Greenland') return 'North America';
  if (lon < -30) return lat > 13 ? 'North America' : lat > 7 && lon < -77 ? 'North America' : 'South America';
  if (lon > 110 && lat < -8) return 'Oceania';
  if (lon > 160 || lon < -150) return 'Oceania';
  if (lat > 35 && lon < 45 && lon > -30) return lon > 26 && lat < 42 ? 'Asia' : 'Europe';
  if (lat > 45 && lon < 60) return 'Europe';
  if (lon > -20 && lon < 52 && lat < 36 && !(lon > 34 && lat > 12)) return 'Africa';
  return 'Asia';
}
export const CONT_KO = { Asia: '아시아', Europe: '유럽', Africa: '아프리카', 'North America': '북아메리카', 'South America': '남아메리카', Oceania: '오세아니아', Antarctica: '남극' };
const LAND_COLORS = {
  Asia: ['#8fbf5a', '#a7c46a', '#c4c774', '#7fb356', '#b7b86a'],
  Europe: ['#7fbf6a', '#94c979', '#6fae5c', '#a6cf82'],
  Africa: ['#d8b86a', '#c9a55a', '#b9b060', '#dcc27a', '#a8b25a'],
  'North America': ['#86b95a', '#9fc76b', '#78a852', '#b0c56e'],
  'South America': ['#62a94e', '#76b85a', '#8ec463', '#5a9a48'],
  Oceania: ['#d0a35e', '#c9b36a', '#9fbf62'],
  Antarctica: ['#eef4f8'],
};

// geoPath → 투영된 링 목록 (d3가 클리핑/재샘플링 처리)
export function projectedRings(feature, projection) {
  const rings = [];
  let cur = null;
  const ctx = {
    moveTo(x, y) { cur = [[x, y]]; rings.push(cur); },
    lineTo(x, y) { cur.push([x, y]); },
    closePath() {}, arc() {}, beginPath() {},
  };
  d3.geoPath(projection, ctx)(feature);
  return rings;
}
// 짝수-홀수 스캔라인 채우기
export function fillRings(rings, W, H, cb) {
  const rows = new Array(H);
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = ring[i], [x1, y1] = ring[(i + 1) % n];
      if (y0 === y1) continue;
      const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
      const r0 = Math.max(0, Math.ceil(ya - 0.5)), r1 = Math.min(H - 1, Math.ceil(yb - 0.5) - 1);
      for (let r = r0; r <= r1; r++) {
        const yc = r + 0.5;
        (rows[r] || (rows[r] = [])).push(x0 + ((yc - y0) * (x1 - x0)) / (y1 - y0));
      }
    }
  }
  for (let r = 0; r < H; r++) {
    const xs = rows[r];
    if (!xs) continue;
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(W - 1, Math.ceil(xs[k + 1] - 0.5) - 1);
      if (b >= a) cb(r, a, b);
    }
  }
}
export function rasterize(features, projection, W, H) {
  const ids = new Uint16Array(W * H);
  for (const f of features) {
    const rings = projectedRings(f.feature, projection);
    fillRings(rings, W, H, (r, a, b) => ids.fill(f.idx, r * W + a, r * W + b + 1));
  }
  return ids;
}

function largestPolygon(feature) {
  const g = feature.geometry;
  if (g.type === 'Polygon') return feature;
  let best = null, bestA = -1;
  for (const coords of g.coordinates) {
    const f = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const a = d3.geoArea(f);
    if (a > bestA) { bestA = a; best = f; }
  }
  return best;
}
// 화면 맞춤용: 가장 큰 폴리곤의 20% 이상인 조각들만
export function mainParts(feature) {
  const g = feature.geometry;
  if (g.type === 'Polygon') return feature;
  const parts = g.coordinates.map((c) => ({ c, a: d3.geoArea({ type: 'Feature', geometry: { type: 'Polygon', coordinates: c } }) }));
  const max = Math.max(...parts.map((p) => p.a));
  return { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: parts.filter((p) => p.a >= max * 0.2).map((p) => p.c) } };
}

export async function loadGeo() {
  const topo = await fetch('vendor/countries-50m.json').then((r) => r.json());
  const fc = topojson.feature(topo, topo.objects.countries);
  let idx = 1;
  for (const f of fc.features) {
    if (!f.geometry) continue;
    const name = f.properties.name;
    const main = largestPolygon(f);
    const [lon, lat] = d3.geoCentroid(main);
    const cont = continentOf(name, lon, lat);
    const r = mulberry32(hashStr(name));
    const cap = CAPITALS[name];
    const c = {
      idx, name, ko: KO[name] || name, feature: f, main, centroid: [lon, lat], cont,
      area: d3.geoArea(f), color: pick(r, LAND_COLORS[cont]),
      capital: cap ? { name: cap[0], lon: cap[1], lat: cap[2] } : null,
    };
    if (name === 'Greenland') c.color = '#e4eef4';
    geo.features[idx] = c;
    geo.byName.set(name, c);
    idx++;
  }
  // 겹치는 경우 큰 나라를 먼저 칠해 작은 나라가 위로 오게
  const order = geo.features.filter(Boolean).sort((a, b) => b.area - a.area);
  const proj = d3.geoEquirectangular().scale(geo.RW / (2 * Math.PI)).translate([geo.RW / 2, geo.RH / 2]);
  geo.idRaster = rasterize(order, proj, geo.RW, geo.RH);
  geo.list = order;
  return geo;
}
export function countryAtLonLat(lon, lat) {
  const u = Math.floor(((lon + 180) / 360) * geo.RW) % geo.RW;
  const v = Math.min(geo.RH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * geo.RH)));
  return geo.features[geo.idRaster[v * geo.RW + ((u + geo.RW) % geo.RW)]] || null;
}
