# FIND PEOPLE

픽셀 그래픽 추적 시뮬레이션 게임. 지구본에서 나라를 고르고, 그 나라의 랜드마크·산·도시로 들어가서,
수십 명의 군중 속에서 **단 한 사람**을 찾아내세요.

추적 대상 3명 — **김정은** · **도널드 트럼프** · **아돌프 히틀러**(1945년 시간여행 모드).
찾아서 포획하면 **교도소 도감**에 수감됩니다. PC · 태블릿 · 폰(가로/세로) 모두 지원.

## 플레이

**온라인: <https://geonhee15.github.io/Find-People/>** · 스프라이트 갤러리: <https://geonhee15.github.io/Find-People/sprites.html>

로컬 실행:

```bash
python3 -m http.server 5173
```

브라우저에서 <http://localhost:5173> 접속. (ES 모듈이라 파일을 직접 여는 방식은 안 됩니다.)
빌드 과정도, 외부 의존성 설치도 필요 없습니다.

## 조작

| 입력 | 동작 |
|---|---|
| 드래그 / 휠 | 지구본 회전 / 확대 |
| 클릭 / 탭 | 나라·장소 이동, 인물 신원 조회 |
| 핀치 (터치) | 지구본 확대 |
| `T` | 🔭 망원경 (얼굴 확대, 터치에선 드래그하면 손가락 위에 돋보기) |
| `P` `S` `H` | 📞 전화 · 📱 SNS · 💻 해킹 |
| `R` `W` | 🛸 드론 · 🎧 도청 |
| `N` `D` | 📓 수첩(단서) · 📁 대상 정보 |
| `Esc` / `G` | 뒤로 / 지구본 |

## 게임 규칙

- 제한 시간 안에 대상을 찾아 **신원 조회 카드가 일치**하면 **포획** → 교도소 도감에 수감
- 전화·탐문·도청 대사는 타자 애니메이션 + 동물의 숲 스타일 옹알이 목소리(한글 모음 포먼트 합성)로 나옵니다
- 모든 행동은 게임 시간을 소모 (이동, 통화 1h, SNS 2h, 해킹 3h, 조회 15분, 탐문 30분)
- 북한에서 수상한 행동을 하면 **경계도** 상승, 100%면 체포
- 대역이 있습니다. 얼굴형 · 안경 · 점을 잘 비교하세요

자세한 설계는 [PLAN.md](PLAN.md) 참고.

## 구조

```
index.html        게임 셸
style.css         픽셀 UI 스타일
sprites.html      스프라이트 갤러리 (생성된 모든 픽셀 아트 보기)
src/
  main.js         게임 상태 · 루프 · 입력(마우스/터치/핀치) · 이동/시간/경계도 · 포획/결과
  targets.js      추적 대상 정의 (외형, 시대, 후보 위치, 정보원, 단서 문구, 해킹·도청 대상, 대사)
  prison.js       교도소 도감 (저장 + 감방 픽셀 씬)
  voice.js        옹알이 음성 합성 + 타자 애니메이션
  globe.js        픽셀 지구본 (역투영 래스터 렌더링)
  countryview.js  나라 지도 (국경 래스터화, 지형, POI)
  sceneview.js    장소: 군중 시뮬레이션, 망원경 렌즈, 인물 클릭
  scenes.js       장소 배경 픽셀 아트 (절차 생성)
  people.js       인물 외형/신상 생성, 스프라이트 (군중·얼굴·흉상)
  art.js          16×16 아이콘 도트
  story.js        시나리오와 단서 생성 (전화/SNS/해킹/탐문)
  data.js         나라별 장소 (현대 / 1945)
  geo.js          세계 지도 로딩, 스캔라인 래스터라이저
  ui.js           HUD · 사이드 패널 · 모달
vendor/           d3-geo, topojson-client, world-atlas 50m, Galmuri 폰트
```

## 크레딧

- 지도 데이터: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) (Public Domain)
- [d3-geo](https://github.com/d3/d3-geo), [topojson-client](https://github.com/topojson/topojson-client) (ISC)
- 폰트: [Galmuri](https://github.com/quiple/galmuri) by Lee Minseo (SIL OFL 1.1, `vendor/fonts/OFL.txt`)

본 게임은 실존·역사 인물을 소재로 한 패러디 픽션이며, 등장하는 모든 단서·정보원·SNS 게시물·주변 인물은 가상입니다.
