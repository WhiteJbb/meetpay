# 랜딩 디자인 리뷰 — task-20261031-018 (r1a1 구현 + r2a1 증거·문서 정정 + r3a1 간격 보정)

> **상태: 소스 구현·핸드오프 완료 / 실행 검증 전(UNRUN).** 이 문서와 구현은
> 소스만 보고 작성했다. 계약(loopback=true)상 localhost·브라우저·테스트·lint·
> build·캡처를 **실행하지 않았다**. 이는 구현 실패가 아니라 **QA(Cheki) 담당으로
> 미룬 항목**이다. 실제 렌더 캡처는 **하나도 없다**. 완료 증거는 QA가 **동일
> 커밋**에서 만든 실제 캡처와 Cheki의 독립 시각 리뷰이며, 그 외의 별도 승인·머지
> 게이트는 요구되지 않았고 이 문서도 두지 않는다. 이 문서의 어떤 내용도 "최종
> 시각 승인"을 뜻하지 않는다.

## R3. 리비전 3 (r3a1) 변경 · 출처 · QA 상태

### R3.1 소스 출처 (inherited source commit vs fresh-main base)

- 이 워크트리(`WhiteJbb/task-20261031-018-r3a1`)는 **새로 만든 main 기준**
  (`8f71ebb`)에서 시작했고, 시작 시점에는 랜딩 파일이 **없었다**. r3a1은 r1/r2
  구현을 이어받는 브랜치가 아니다.
- 같은 작업의 직전 구현은 **리비전 2 커밋 `9453240d4930803c57faf35a0457c9d82201519b`**
  (prior card t_ab33f2fa 완료 기록으로 확인됨)이다. 이 커밋은 `8f71ebb`의 직계 후손이며
  merge-base가 `8f71ebb`이므로, `HEAD` 대비 차이는 task-018 파일뿐이다.
- 그 커밋에서 **읽기 전용 `git show <commit>:<path>`로 내용을 확인한 뒤 일반 파일
  쓰기로 복원한 8개 파일**: `src/app/page.tsx`, `src/app/landing.module.css`,
  `src/components/landing/{SettlementSpecimen.tsx, StartSteps.tsx, settlementExample.ts}`,
  `tests/landing.test.mjs`, `scripts/landing-qa.mjs`, `docs/landing-design-review.md`.
  checkout / reset / rebase / cherry-pick / commit은 쓰지 않았다.
- 복원하지 않은 것: r2 커밋이 수정한 `docs/{DecisionLog,Plan,PromptLog,WorkLog}.md`
  (범위 지시: 관련 없는 문서 제외), package 파일, `layout.tsx`, `globals.css`,
  다른 화면, `GroupCard` 등 main의 기존 수정. 이들은 `8f71ebb` 그대로다.
- 복원한 7개 비문서 파일은 `9453240`과 **내용이 동일**하며(복사), 아래 R3.2의 한 줄만
  다르다. 이 문서는 R3 섹션·제목·§4 간격 문구를 제외하면 r2 문서와 같다.

### R3.2 피드백 보정 (최소 수정)

- 피드백: 랜딩 CSS `.steps`의 모바일 `padding-block: 56px`가 문서화·테스트된 간격
  스케일 4/8/12/16/24/32/48/64/80 밖이다.
- 수정: `src/app/landing.module.css`의 `.steps` 기본(모바일) `padding-block`을
  **56px → 48px**로 변경. 이 한 줄이 이번 리비전의 유일한 코드 변경이다
  (`landing.module.css:437` 부근, `.steps` 규칙).
- 48px을 고른 이유: 같은 파일에서 그린 스테이지의 모바일 섹션 패딩이 이미 48px이라
  두 섹션의 세로 리듬이 같아진다. 64px로 키울 만한 레이아웃상 이유는 없다
  (단계 목록의 상단 간격 32px, 항목 패딩 24px는 그대로). ≥960px의 `80px 64px`는
  변경 없음.
- 테스트는 약화하지 않았다. `tests/landing.test.mjs`의 간격 스케일 테스트
  ("spacing values stay on the 4/8/12/16/24/32/48/64/80 scale")는 r2와 동일하며,
  `padding-block: 56px`는 `padding(-…)` 선언 패턴에 걸려 이 테스트를 통과하지
  못했을 값이다. 수정 후 값은 스케일 안이다. **테스트는 이번에도 실행하지 않았다.**
- 의도 보존: 다크/그린 서비스 전용 레이아웃, 한국어 분할 정산 메시지, `/groups/new`
  CTA, 완결된 정산 예시는 그대로다. 리디자인·새 모션 없음.

### R3.3 QA·캡처 상태 (정정 없이 그대로 유지)

- **브라우저 QA와 캡처는 아직 미완료**다. QA 환경에 Chromium 실행 파일이 없어
  브라우저가 필요한 검사를 수행하지 못했다. **독립 브라우저 QA 통과를 주장하지 않는다.**
- 이번 r3a1 에이전트는 localhost 서버, 브라우저, lint, build, 테스트를 실행하지 않았고
  브라우저를 설치하지도, 샌드박스를 우회하지도 않았다. 보고는 **정적 소스 검사**뿐이다.
- 이전 PM의 "레퍼런스 사이트를 외부에서 직접 열어 봤다"는 주장은 **철회된 상태**이며
  (§2.1) 그대로 유지한다. 이번 리비전에서 새 외부 브라우징은 없다(네트워크 없음).
- 등록된 `preview_capture`가 이제 제공되며, **디자이너가 커밋 후 시도**한다. 실제
  캡처가 생성되면 그것은 **디자이너 증거**이지 **Cheki의 독립 QA가 아니다**. 이 문서의
  "완료 증거 = 동일 커밋 QA 캡처 + Cheki 독립 시각 리뷰" 기준은 바뀌지 않는다.
  디자이너 캡처는 그 기준을 대체하지 않으며, 생성되더라도 커밋 SHA와 함께 출처를
  구분해 기록해야 한다.

## 0. 소스 인수 vs QA 대기

| 구분 | 내용 | 상태 |
| --- | --- | --- |
| 소스 인수(이번 단계) | AC1–AC5 소스 구현, 정적 근거(§12 지도), 예시 산수, QA 스크립트·지침 작성 | 소스에서 확인 가능한 범위까지 완료 |
| QA 대기(실행 전) | 단위 테스트, lint, build, 브라우저 렌더, 모든 캡처, 실제 대비·포커스·모션 확인, 전체 회귀 | **UNRUN** (구현 실패 아님) |

실행하지 않은 검사: `node --experimental-vm-modules --test tests/landing.test.mjs tests/group-card.test.mjs`,
`npm run lint`, `npm run build`, `scripts/landing-qa.mjs`, 모든 브라우저 캡처. r2a1과 r3a1 모두
위 전부를 실행하지 않았으며, 파일 복원과 문서 정정 외의 어떤 코드도 실행하지 않았다.

## 1. 의도

- 처음 온 사람이 첫 화면에서 바로 "모임 지출을 나눠 정산해 주는 서비스"임을
  알고, 실제 동작하는 `/groups/new` CTA를 본다.
- 승인된 다크 그린 시스템(토큰), Pretendard + IBM Plex Mono를 유지하고
  워드마크/헤더는 두지 않는다(DecisionLog §17·§18).
- 데스크톱: 짧고 구체적인 한국어 메시지와, 지출 → 잔액 → 송금까지 이어지는
  완결된 예시 카드를 나란히 둔다.
- 모바일: 메시지 → CTA → 예시 → 시작 3단계 순서.
- 모션은 버튼 피드백 150ms만. 진입·리빌·루프 애니메이션, 가짜 컨트롤 없음.

## 2. 레퍼런스 관찰 (이전 실행 r1a1의 `.palette/` 캡처)

### 2.1 출처와 누가 무엇을 봤는가

- **캡처·1차 검토**: 이전 디자이너 실행(r1a1)이 `reference_capture`로 공개
  페이지 여섯 장을 **직접 캡처**하고 `vision_analyze`로 **직접 검토**했다.
- **재확인**: 현재 디자이너 실행(r2a1)이 같은 PNG 여섯 장을 `vision_analyze`로
  다시 열어 아래 관찰을 재확인했다고 개발자가 전달했다.
- **보지 않은 주체(정정)**: PM은 레퍼런스 사이트를 시각적으로 보지 않았다
  (PM `web_extract` 실패). Lumi task-019는 텍스트만 읽었고 렌더를 보지 않았다.
  따라서 "PM이 시각적으로 확인했다"는 이전 문구는 **철회**한다.
- **이 문서를 정정한 에이전트(소스 작업 에이전트)는 이 이미지들을 열어 보지
  않았다.** r3a1 에이전트도 마찬가지다. 아래 관찰 표는 위 디자이너 실행들의 관찰을
  출처와 함께 옮긴 것이다.
- 이 PNG들은 **meetpay 구현 캡처가 아니며 모션의 증거도 아니다.** 정지 이미지라
  레퍼런스의 애니메이션에 대해서는 아무것도 주장하지 않는다.
- 새 레퍼런스 수집, 합성/대체 이미지는 없다.

### 2.2 파일 경로 (이전 실행 워크트리, 읽기 전용 자산)

디렉터리: `/Users/dg/orca/workspaces/meetpay/task-20261031-018-r1a1/.palette/`
(브랜치 `WhiteJbb/task-20261031-018-r1a1`, 커밋 `4bd8d33`의 워크트리. `.palette/`는
저장소에 커밋되지 않은 작업 자산이므로 이 저장소 체크아웃에는 없다. 이 워크트리에
복사하지 않았다.)

| 파일(위 디렉터리 기준) | 캡처 URL | 페이지 title |
| --- | --- | --- |
| `reference-1-1440.png`, `reference-1-390.png` | https://cash.app/ | Send, Receive, Invest, & Manage Your Money with Cash App |
| `reference-2-1440.png`, `reference-2-390.png` | https://tricount.com/ | tricount \| Free bill splitting app. No ads. |
| `reference-3-1440.png`, `reference-3-390.png` | https://www.splitwise.com/ | Split expenses with friends. :: Splitwise |

URL과 title은 r1a1 디자이너의 `reference_capture` 출력에서 온 값이다.

### 2.3 관찰, 채택, 기각 (r1a1 디자이너 관찰 + r2a1 디자이너 재확인)

| 서비스 | 관찰(정지 캡처 기준) | 채택 | 기각 |
| --- | --- | --- | --- |
| Cash App (`reference-1-*`) | 데스크톱 1440: 전면 채도 높은 그린. 왼쪽 큰 헤드라인, 가운데 과하게 큰 폰 목업, 오른쪽 짧은 설명 + 흰 pill CTA. 모바일 390: 헤드라인과 폰을 세로로 쌓고, 이어서 제품·사진·지표 구역이 길게 이어짐 | 짧은 메시지와 어두운 제품 UI의 대비, 그린 위 pill CTA | 과하게 큰 폰 프레임, 브랜드 자산/로고, 이용자 수·별점 지표 |
| tricount (`reference-2-*`) | 어두운 인물 사진 히어로, 쿠키 동의 패널이 히어로를 가림. 그 아래 번호 붙은 3개 절차 항목. 이 캡처들은 중간에 매우 긴 빈 구간이 있다 — **보이지 않은 내용은 추정하지 않는다** | 번호만 있는 평범한 3단계 시작 안내 | 스톡 사진, 쿠키 UI, 우리가 보증하지 않는 주장 |
| Splitwise (`reference-3-*`) | 밝은 기하학 히어로, 이어서 다크/틸/오렌지 기능-폰 블록, 보라 PRO 구역, 기능 체크리스트, 언론/사용자 후기 블록. 모바일은 같은 블록을 세로로 쌓음 | 잔액·지출 숫자 화면으로 효익을 설명하는 방식 → 이해 가능한 숫자 예시 | 다색 마케팅 타일, 보라 프로모, 후기, 우리에게 없는 기능 목록 |

## 3. 구조

```
<main .page>
  <section .stage aria-labelledby=landing-title>    ← 풀블리드 accent 그린
    <div .hero>                                      ← ≥960px 2열
      <div .message>  eyebrow · h1 · 본문 · CTA(Link /groups/new) · 보조 문구
      <section .specimen>  h2(정산 예시 / 금요일 저녁 모임) · 지출 · 잔액 · 송금 · 각주
  <section .steps aria-labelledby=landing-steps-title> ← 다크 배경
    h2 · <ol> 3단계 · 텍스트 링크(/groups/new)
```

- 헤딩: h1 1개, h2 2개(예시 카드, 시작 3단계), 하위는 h3.
- 전부 서버 컴포넌트. `"use client"`·상태·이펙트 없음. 모든 정보가 서버
  렌더 HTML에 있다.
- 파일: `src/app/page.tsx`, `src/app/landing.module.css`,
  `src/components/landing/{SettlementSpecimen.tsx, StartSteps.tsx, settlementExample.ts}`.
  `Avatar`는 읽기 전용 재사용(수정 없음).

### 브레이크아웃 (부모 max-640 그대로)

- `layout.tsx`의 `max-w-[640px] px-4 py-10` 래퍼는 바꾸지 않는다.
- `--content = min(1120px, 100vw - 2 × gutter)`, gutter는 640px 미만 20px,
  이상 32px. `.stage`·`.steps`는 `margin-inline: calc((100% - var(--content)) / 2)`로
  부모 중심에 맞춰 폭을 넓힌다.
- **스크롤바 안전성(소스 추론, 미검증)**: 클래식 스크롤바가 있으면 100vw는
  스크롤바 폭만큼 문서보다 넓다. 요소 오른쪽 끝 = 문서 중심 + content/2 이고
  content ≤ 100vw − 40px이므로, 스크롤바 폭이 40px 미만(일반적으로 0–17px)이면
  문서 폭을 넘지 않는다. overflow 숨김으로 감추지 않는다(`overflow: hidden/clip`
  없음, 테스트로 고정). 실제 넘침 여부는 QA 렌더에서만 확인된다.
- 그린 배경만 `box-shadow: 0 0 0 100vmax var(--accent)` + `clip-path: inset(0 -100vmax)`로
  화면 양끝까지 칠한다. box-shadow는 스크롤 영역을 만들지 않는다(ink overflow).
  카드 "그림자+테두리+면 겹치기" 금지 규칙과는 무관한 배경 기법이다.
- `.stage`의 `margin-top: -40px`가 `py-10` 상단 여백을 상쇄해 뷰포트 맨 위부터 시작.
- 위험: 강제 색상 모드(Windows 고대비)에서는 box-shadow가 제거되어 그린이
  콘텐츠 폭 밖에 칠해지지 않는다. 텍스트는 시스템 색으로 읽힌다.

## 4. 토큰 · 타입 · 그리드 · 모션

**색** (globals.css `:root`, 값 변경 없음)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--bg` | `#14170f` | 페이지, CTA 배경 |
| `--surface` | `#1e231a` | 예시 카드 면 |
| `--ink` | `#edefe7` | 다크 위 본문, CTA 글자 |
| `--muted` | `#a6ac9c` | 카드·단계 보조 텍스트 |
| `--accent` | `#23d67f` | 스테이지, 카드 라벨, 받을 돈, 송금 금액, 단계 번호, 결과 구분선 |
| `--accent-ink` | `#06301d` | 스테이지 위 모든 텍스트, CTA 포커스 링 |
| `--border` | `#333a2c` | 행 구분선 |

그린 위 텍스트는 전부 `--accent-ink`(muted/투명도 사용 안 함). 예외: `Avatar`의
파스텔 이름 색은 기존 컴포넌트 그대로(실제 정산 화면과 같은 사람 식별 색).

**대비 — 소스 수준 산수(런타임 확인 아님)**. WCAG 상대 휘도 공식
(`c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`, `L = 0.2126R + 0.7152G + 0.0722B`,
비율 `(L밝 + 0.05)/(L어두 + 0.05)`)을 토큰 hex 값에 적용한 값이다. 계산 구현은
`tests/landing.test.mjs:258-274`이며 케이스는 `:282-296`이다. **이번 실행에서는
테스트를 실행하지 않았다.** 손으로 검산한 항목은 accent-ink / accent 하나뿐이다
(L(accent) ≈ 0.4995, L(accent-ink) ≈ 0.0224 → (0.5495)/(0.0724) ≈ 7.59). 나머지
값은 r1a1 문서의 계산값을 승계한 것이며 QA 테스트 실행에서 재확인된다.

| 전경 / 배경 | 비율 | 테스트 하한 |
| --- | --- | --- |
| accent-ink / accent (스테이지 텍스트, 포커스 링) | 7.59 | 4.5 / 3 |
| ink / bg (CTA 글자) | 15.62 | 4.5 |
| bg / accent (CTA 형태) | 9.49 | 3 |
| ink / surface | 13.81 | 4.5 |
| muted / surface | 6.87 | 4.5 |
| accent / surface | 8.39 | 4.5 |
| muted / bg | 7.77 | 4.5 |
| accent / bg (단계 번호, 텍스트 링크 전역 포커스 링) | 9.49 | 4.5 |

런타임에서만 확인되는 것(위 산수와 구분): 실제 렌더 색, 폰트 로드 후 안티앨리어싱,
`Avatar` 파스텔 이름 색과 `--surface`의 대비(토큰 밖 색이라 위 표에 없음).

**타입**: Pretendard(display/body), IBM Plex Mono(`font-data`, 모든 금액 +
`tabular-nums`). 최소 13px.

| 요소 | 크기 / 행간 / 굵기 |
| --- | --- |
| h1 | 40/1.12 (<360px: 36), ≥640: 48/1.1, ≥960: 56/1.08, ≥1100: 64/1.08 · 800 · −0.035em · keep-all |
| eyebrow | 14 · 700 · +0.02em |
| 본문 | 17 (≥960: 18) / 1.6 · 500 · 최대 30em |
| CTA | 17 · 700 · 높이 52px pill |
| 카드 제목 / 라벨 | 20·700 / 13·700 |
| 행 텍스트 / 금액 / 보조 | 15·600 / 15 mono / 13 |
| 송금 행 | 이름 18·700, 금액 20·600 mono |
| 단계 h2 / h3 / 본문 | 28 (≥960: 36)·800 / 20·700 / 15·1.6 |

**그리드·간격**: 콘텐츠 최대 1120px. ≥960px에서 `0.95fr / 1.05fr`, 열 간격
48px(≥1100: 64px), 세로 가운데 정렬. 그 미만은 1열이며 메시지·카드 최대
600px. 스테이지 상하 48px(≥960: 80px), 시작 섹션 **48px(≥960: 80/64px)** — r3a1에서
모바일 값을 56px에서 48px로 보정(R3.2). 간격은
4/8/12/16/24/32/48/64/80만 사용(예외: 브레이크아웃 calc, −40px 오프셋, gutter
20/32px, 카드 반경 14px = `--radius-token`). 카드: 단일 `--surface` 면, 그림자·
테두리 없음, 패딩 24px(<360: 24/16, ≥640: 32px). 결과 구역은 중첩 카드 대신
2px accent 상단 선 하나로 구분.

**모션**: CTA hover `translateY(-1px)`, active `translateY(0)` + `opacity .88`,
텍스트 링크 hover/active 투명도. 모두 `var(--t-fast)`(150ms) `var(--ease)`.
`prefers-reduced-motion: reduce`에서 `transition: none`, `transform: none`.
`@keyframes`·animation·스크롤 연동 없음. 숨겨졌다 나타나는 내용이 없으므로
모션을 줄여도 사라지는 콘텐츠가 없다.

**포커스**: 전역 포커스 링(2px accent)은 그린 위에서 보이지 않으므로 CTA만
`3px solid var(--accent-ink)`, offset 3px로 교체하고 전역 규칙의
`border-radius: 4px`를 pill(999px)로 되돌린다. CTA에는 평소 투명한 2px
테두리가 있어 강제 색상 모드에서 버튼 경계가 드러난다. 다크 섹션의 텍스트
링크는 전역 accent 링을 상속한다(`globals.css:91-100`). 터치 영역: CTA 52px,
텍스트 링크 44px.

## 5. 예시 산수 (화면에 "정산 예시"로 표시되는 가상 모임)

참여자 지현·민재·수아 3명, 세 지출 모두 3명이 같은 금액으로 나눈다.

| 지출 | 결제 | 금액 |
| --- | --- | --- |
| 저녁 식사 | 지현 | 100,000원 |
| 카페 | 민재 | 40,000원 |
| 택시 | 수아 | 10,000원 |
| **합계** | | **150,000원** |
| **1인당 부담** | 150,000 ÷ 3 | **50,000원** |

| 사람 | 낸 돈 | 잔액(낸 돈 − 50,000) |
| --- | --- | --- |
| 지현 | 100,000 | 받을 돈 50,000 |
| 민재 | 40,000 | 보낼 돈 10,000 |
| 수아 | 10,000 | 보낼 돈 40,000 |

잔액 합 = 0. 송금 2건: **민재 → 지현 10,000원**, **수아 → 지현 40,000원**. 이후
모든 잔액이 0이 된다. 합계·1인당·잔액은 `settlementExample.ts`에서 지출 목록으로
계산하고, 송금 2건은 테스트가 실제 `computeSettlement`(src/lib/settlement.ts)
결과와 대조한다(**테스트 미실행**). 실제 알고리즘은 금액 큰 순으로 내보내므로
(수아 먼저) 화면 순서만 다르고 내용은 같다. "한 번에/한 줄로 끝" 같은 송금 횟수
주장은 하지 않는다. 예시는 가상이며 저장·자동 송금을 흉내 내지 않는다.

## 6. 문구의 사실 확인 (기존 구현 기준)

| 문구 | 근거 |
| --- | --- |
| 가입 없이 시작 | 인증 흐름 없음. `createGroup`(actions.ts)은 이름·참여자만 받음. `/groups/new` AppBar 부제도 "가입 없이 링크로 바로 시작해요" |
| 참여자는 이름만 있으면 돼요 | 이메일·계좌는 선택 입력. 동명이인일 때만 이메일 필요(DecisionLog §7) — 예외라서 첫 화면 문구에서는 생략 |
| 결과는 링크로 공유 / 받은 사람은 결과만 | 정산 화면의 "결과 링크 복사 (열람 전용)" → `/r/[token]` 읽기 전용 `SettlementView` |
| 보낼 금액을 계산해요 | `computeSettlement` 잔액 + 이체 목록 |
| 결제한 사람과 금액, 함께 나눌 사람을 골라 기록 | 지출 폼의 결제자·금액·분담 참여자 |
| 실제 송금은 직접 해요 | 결제/송금 연동 없음(이체 목록과 계좌 표시만) |

이전 랜딩 미리보기는 잔액 지현 +6,000 / 민재 +24,000 / 수아 −30,000에 송금을
수아→민재 24,000원 1건만 보여 줘, 지현 +6,000과 수아 −6,000이 미해결로 남는
**불완전한 송금 예시**였다. 그런데도 "이체는 이 한 줄로 끝"이라고 적혀 있어
예시와 문구가 맞지 않았다. 그래서 지출부터 송금까지 끝까지 맞는 예시로 바꿨다.
이전 잔액이 표시된 합계(282,000원)와 맞는지는 지출 내역이 없어 판단하지 않았다.
"최소 이체 횟수" 표현은 서비스 자체의 정산 방식(그리디, `settlement.ts`) 설명으로
다른 화면에 남아 있으며, 이번 작업은 그것을 틀렸다고 보지 않는다. 새 랜딩
문구에서 송금 횟수를 약속하지 않은 이유는 예시를 가볍게 유지하려는 범위 선택이다.

## 7. 실행 제한과 실행하지 않은 검사 (UNRUN)

계약(loopback=true): 이 환경에서 localhost 서버, 테스트, lint, build, 브라우저,
캡처를 **실행하지 않았다**. 대체 실행도 하지 않았다. 이들은 **구현 결함이 아니라
QA 담당으로 미뤄진 미실행 항목**이다. (`node --check`는 허용되나 필수가 아니며,
r2a1·r3a1에서는 실행하지 않았다. r1a1은 새 `.mjs` 두 파일에 구문 파싱만 했다고 기록했다.
r3a1이 한 확인은 읽기 전용 `git show`/`git diff` 같은 정적 검사뿐이다.)

QA(Cheki)가 실행할 것:
- `node --experimental-vm-modules --test tests/landing.test.mjs tests/group-card.test.mjs`
- `npm run lint`, `npm run build`(Prisma generate → next build 순서 유지 확인)
- `scripts/landing-qa.mjs`(한 번도 실행되지 않은 스크립트 — 스크립트 결함은 페이지
  결함과 구분해서 보고)
- 모든 브라우저 캡처와 독립 시각 리뷰

## 8. QA 사양 (동일 커밋에서)

1. 검토 대상 커밋 SHA를 고정하고, 그 커밋으로 빌드한 서버를 **격리된 QA DB**로
   띄운다. 프로덕션 데이터·프로덕션 호스트 사용 금지.
2. `node --experimental-vm-modules --test tests/landing.test.mjs tests/group-card.test.mjs`,
   `npm run lint`, `npm run build`.
3. `BASE_URL=http://127.0.0.1:<port> node scripts/landing-qa.mjs` — **한 번도 실행되지
   않은 스크립트**다. 첫 실행은 QA가 하며, 스크립트 결함은 페이지 결함과 구분해 보고한다.
   - 환경 변수
     - `BASE_URL`(기본 `http://127.0.0.1:3000`). loopback이 아니면 거부(종료 코드 2).
       격리된 QA 호스트에 한해 `QA_ALLOW_REMOTE=1`. 프로덕션 금지.
     - `COMMIT_SHA`(기본 `git rev-parse HEAD`). 파일명과 manifest에 들어간다.
     - `OUT_DIR`(기본 `${TMPDIR ?? os.tmpdir()}/meetpay-landing-qa-<sha7>/`). 워크트리
       밖이 기본값이라 산출물이 실수로 커밋되지 않는다. QA는 보관할 경로를 명시해서
       넘기는 것을 권장.
   - 폭 1920, 1440, 1100, 390, 320: 첫 화면(뷰포트) + 전체 페이지 캡처.
   - 각 폭에서 `documentElement.scrollWidth === clientWidth`, h1 1개, `/groups/new`
     링크 2개, CTA 높이 ≥ 48px, 스테이지 top = 0, 예시 금액 텍스트 존재.
   - 1440: CTA hover 캡처, 키보드 Tab으로 CTA 포커스 + 외곽선 확인 캡처,
     Enter로 기존 `/groups/new` 폼(`input[name=name]`) 도달 캡처.
   - reduced motion(1440, 390): CTA hover 시 transform 없음 + **전체 페이지** 캡처
     (모든 내용이 모션 없이 보이는지 확인).
   - CTA 피드백 프레임 스트립(1440, 일반 / reduced motion 각각): hover 전, hover 직후,
     약 +80ms, 약 +180ms를 CTA 주변만 잘라 개별 파일로 저장(`animations: "allow"`).
     프레임마다 실제 경과 ms와 계산된 `transform`을 manifest에 기록한다. 캡처 자체에
     시간이 걸리므로 오프셋은 근사치이고, 판단은 기록된 실제 경과 시간으로 한다.
     정지 캡처만으로는 모션을 판단할 수 없어서 넣은 항목이다.
     - 일반: 마지막 프레임이 `translateY(-1px)`(matrix …, -1)에 도달해야 함.
     - reduced: 모든 프레임에서 `transform: none`.
   - 콘솔 에러·page error를 실패로 기록.
   - 처리되지 않은 오류(탐색·캡처 실패 등)는 `fatal: …` 실패로 manifest에 기록되고
     종료 코드 1로 끝난다. 실패가 하나라도 있으면 "All scripted checks passed"를
     출력하지 않는다.
   - 이 스크립트는 Chromium 실행 파일이 필요하다. 이전 QA 환경에는 그것이 없어
     실행되지 못했다(R3.3). Chromium이 준비된 환경에서만 실행할 수 있다.
4. 수동(격리 QA DB에서만): 전체 회귀 — 모임 생성 → 지출 추가 → 정산 결과 → 결과 링크
   `/r/[token]` 열람 전용 확인. 스크립트는 이 흐름을 만들지 않는다(폼 제출 없음).
5. 수동 시각 확인 포인트: 960–1099px에서 h1 "누가 얼마 보낼지"가 한 줄 유지되는지,
   320px에서 금액·이름이 잘리지 않는지, 1440×900 첫 화면에 메시지·CTA·송금 2건이
   보이는지(높이를 강제하지는 않음), 클래식 스크롤바 환경(Windows 또는
   `--force-overlay-scrollbars` 없이)에서 가로 스크롤 없음, Pretendard CDN이
   막히면 대체 서체로 줄바꿈이 바뀔 수 있으니 QA 환경의 폰트 로드 여부 기록.
   모바일(390/320)에서 스테이지와 시작 3단계 섹션의 상하 여백이 같은 48px로
   읽히는지(R3.2)도 확인.
6. 산출물 이름: `<sha7>_<width>w_<route>_<theme>_<kind>.png`
   (예: `abc1234_1440w_root_dark_full.png`,
   `abc1234_1440w_root_dark_cta-motion-normal-02-t80.png`). `manifest.json`에 전체 커밋 SHA,
   BASE_URL, 테마, 캡처 시각, 각 파일의 폭·경로·종류, 체크 결과를 담는다.
   모든 증거는 같은 커밋 SHA에서 나온 것이어야 한다(출처 일치).
7. **완료 증거**: 위 동일 커밋 QA 실제 캡처와 Cheki의 독립 시각 리뷰. 별도의
   디자이너 전용 사전 리뷰·머지 승인 단계는 요구되지 않으며 두지 않는다.
   디자이너가 `preview_capture`로 만든 캡처가 있다면 디자이너 증거로만 기록하며
   Cheki 독립 QA를 대체하지 않는다(R3.3).
   알려진 `/_global-error` prerender `workStore` 빌드 이슈(task-017 r2)는 이 작업
   범위 밖이며, 발생 시 단계와 에러를 별도로 기록.

## 9. Audit (소스 기준 자기 점검)

흔한 "AI/템플릿 랜딩" 징후를 소스에서 점검했다. 시각적 징후는 캡처 전이라 끝까지
판단할 수 없다(§11).

- **그린 풀블리드 스테이지 + 다크 페이지**: 새 선택이 아니라 기존 아이덴티티다
  (accent 그린 히어로 DecisionLog §14–§15, 다크 테마 §16). 토큰 값 변경 없음.
- **pill CTA, 14px 카드**: 기존 시스템 기본값(globals.css 주석의 `rounded-full`
  버튼 / `rounded-token` 카드)을 그대로 따른 것이다.
- **번호 3열**: 서비스를 실제로 쓰는 순서를 담은 절차형 `ol`이다. 아이콘·카드 면·
  그림자 없이 번호와 구분선만 있고, 각 항목은 기능 홍보가 아니라 사용 단계다.
  모바일에서는 세로 목록이 된다. 장식용 기능 카드 3개가 아니다.
- **eyebrow**: 계약이 요구한 서비스 식별 문구다. 텍스트만 있고 배지·pill 모양이 아니다.
- **그 밖의 징후**: 소스에서는 찾지 못했다 — 그라디언트·글로우·블러 없음, 이모지·
  아이콘 세트 없음, 배지·지표·후기 없음, 폰/브라우저 프레임 같은 가짜 UI 크롬 없음,
  진입·스크롤 애니메이션 없음, 일러스트 없음, "올인원/간편한 솔루션" 같은 범용
  SaaS 문구 없음. 데스크톱은 가운데 정렬 일색이 아닌 좌측 정렬 2열이다.

## 10. Rejected (검토 후 버린 것)

- 레퍼런스에서 버린 것: §2.3의 기각 열 참조(큰 폰 프레임·브랜드 자산·이용자 수/별점
  지표, 스톡 사진·쿠키 UI·보증할 수 없는 주장, 다색 마케팅 타일·보라 프로모·후기·
  없는 기능 목록).
- `width: 100vw; margin-left: calc(50% - 50vw)`(이전 방식): 클래식 스크롤바 폭만큼
  가로 넘침이 생길 수 있음.
- 래퍼에 `overflow-x: hidden/clip`: 넘침 버그를 감춤.
- 절대 위치 의사 요소로 배경 확장: 스크롤 가능 영역을 늘림.
- `layout.tsx` 수정으로 폭 해제: 범위 밖.
- 결과 구역을 카드 안의 카드로: 중첩 카드 금지 → 2px accent 구분선 하나.
- 렌더 시 `computeSettlement`로 송금 계산: 표시 순서가 금액순으로 바뀜 → 명시
  데이터 + 테스트에서 실제 알고리즘과 대조.
- 잔액을 `--negative`(빨강)로 표시: 계약의 토큰 목록 밖 → "받을 돈/보낼 돈" 라벨 +
  accent/ink.
- 단계에 아이콘, 별도 CTA 밴드, 스크롤 리빌, 클라이언트 JS.
- 예시에 송금 횟수 약속 문구("한 줄로/한 번에 끝").
- 저장/자동 송금을 흉내 내는 예시 상호작용.
- (r3a1) 시작 섹션 모바일 패딩을 56px로 두고 테스트 스케일에 56을 추가: 테스트 약화.
  64px로 확대: 스테이지(48px)와 리듬이 어긋나고 레이아웃상 근거 없음.

## 11. Open — 캡처 대기 (UNRUN)

동일 커밋 QA 캡처와 Cheki의 독립 시각 리뷰 전까지 아래는 열린 상태다.

- 모든 시각 판단: 960–1099px h1 줄바꿈, 320px 카드 행 배치, 1440×900 첫 화면 구성,
  Avatar 파스텔과 `--surface`의 어울림, 카드 정보 밀도, 강제 색상 모드의 스테이지 가장자리,
  클래식 스크롤바 환경의 넘침, QA 환경의 Pretendard 로드 여부, 모바일 섹션 여백 리듬(R3.2).
- 모션: CTA 피드백 프레임 스트립으로만 판단 가능.
- `tests/landing.test.mjs`, `scripts/landing-qa.mjs`: 미실행. 첫 실행에서 수정이
  필요할 수 있다(스크립트 결함은 페이지 결함과 구분).
- lint/build: 미실행. 알려진 `/_global-error` 빌드 이슈는 범위 밖.
- 브라우저 QA/캡처: QA 환경의 Chromium 실행 파일 부재로 미완료(R3.3).

## 12. 정적 증거 지도 (AC1–AC5, 줄 번호)

줄 번호는 이 워크트리의 현재 소스 기준이다(r3a1의 CSS 수정은 값만 바꿨고 줄 수는
그대로라 r2 줄 번호와 같다).
**모두 소스 읽기 근거이며 런타임 확인이 아니다.**

### AC1 — 한국어 정체성·효익·CTA·흐름
| 근거 | 위치 |
| --- | --- |
| 단일 `main`, 스테이지 `section` + `aria-labelledby` | `src/app/page.tsx:14-15` |
| eyebrow "모임 지출 · 더치페이 정산" | `src/app/page.tsx:18` |
| (참고) 예시 카드는 히어로 우측 열에 배치 | `src/app/page.tsx:40` |
| h1 "함께 쓴 돈, 누가 얼마 보낼지 한눈에." | `src/app/page.tsx:19-25` |
| 효익 문구(지출 기록 → 금액 계산, 가입 없이, 링크 공유) | `src/app/page.tsx:26-29` |
| 실제 `Link` → `/groups/new`, "새 모임 만들기" | `src/app/page.tsx:31-33` |
| 가입 없이 바로 시작 보조 문구 | `src/app/page.tsx:34-36` |
| 시작 3단계 섹션(`ol`) | `src/components/landing/StartSteps.tsx:27-48`, `page.tsx:44` |
| 시작 3단계 문구(만들기/기록/공유) | `src/components/landing/StartSteps.tsx:10-23` |
| 텍스트 링크 → `/groups/new` | `src/components/landing/StartSteps.tsx:43-45` |
| 문구 사실 확인 | 이 문서 §6 |
| 소스 검사 테스트(미실행) | `tests/landing.test.mjs:119-150` |

### AC2 — 완결된 검증 가능한 예시
| 근거 | 위치 |
| --- | --- |
| 참여자·지출·송금 데이터 | `src/components/landing/settlementExample.ts:33-45` |
| 합계·1인당·잔액을 지출에서 계산 | `settlementExample.ts:47-62` |
| 카드 렌더(지출, 합계, 1인당, 잔액, 송금 2건, 각주) | `src/components/landing/SettlementSpecimen.tsx:22-108` |
| 받을 돈/보낼 돈 라벨 | `SettlementSpecimen.tsx:75` |
| 단일 `--surface` 면, 14px 반경 | `src/app/landing.module.css:206-211` |
| 150,000 ÷ 3 = 50,000, 잔액 +50,000/−10,000/−40,000, 송금 10,000+40,000 | 이 문서 §5, 테스트 `tests/landing.test.mjs:43-106` (미실행) |
| 실제 `computeSettlement`와 대조 | `tests/landing.test.mjs:84-106` (미실행) |

### AC3 — 기존 라우트·기능·범위 보존
| 근거 | 위치 |
| --- | --- |
| 링크 2개만 `/groups/new` (히어로 CTA, 하단 텍스트 링크) | `page.tsx:31`, `StartSteps.tsx:43` |
| 예시 카드는 읽기 전용(버튼·링크·핸들러 없음) | `SettlementSpecimen.tsx` 전체, 테스트 `tests/landing.test.mjs:129-139` |
| 저장·자동 송금 시뮬레이션 없음, 클라이언트 JS 없음 | 테스트 `tests/landing.test.mjs:152-160` |
| 부모 레이아웃 무변경 확인 | 테스트 `tests/landing.test.mjs:215-223` |
| 범위 밖 파일 | `layout.tsx`, `globals.css`, 다른 UI, `lib/`, `prisma/`, package 파일은 이 작업에서 수정하지 않음(`git status`로 확인) |

### AC4 — 반응형·시맨틱·포커스·대비·모션 감소
| 근거 | 위치 |
| --- | --- |
| 브레이크포인트 640 / 960 / 1100 | `landing.module.css:27,61,78,109,116,123,139,219,437,452,477` |
| 브레이크포인트 <360(헤드라인 36px, 카드 패딩 24/16), <480(CTA 늘림) | `landing.module.css:103-107,213-217,189-193` |
| 시작 섹션 모바일 패딩 48px (r3a1: 56→48) | `landing.module.css` `.steps` 규칙(≈431-434) |
| 헤딩 h1/h2/h3 및 `aria-labelledby` | `page.tsx:15,19`, `SettlementSpecimen.tsx:23-24,33,61,89`, `StartSteps.tsx:27-28,36` |
| 목록 시맨틱(`ul`/`ol`), 장식 화살표 `aria-hidden`, 스크린리더용 `sr-only` 문장 | `SettlementSpecimen.tsx:34,62,90,93,98`, `StartSteps.tsx:31,44` |
| 네이티브 링크(`Link`→`<a>`), 가짜 버튼 없음 | `page.tsx:31`, `StartSteps.tsx:43` |
| CTA 포커스 링 3px accent-ink, pill 반경 | `landing.module.css:183-187` |
| 텍스트 링크는 전역 `a:focus-visible` 상속 | `src/app/globals.css:91-100` |
| 터치 영역 CTA 52px, 텍스트 링크 44px | `landing.module.css:157`, `landing.module.css:523` |
| 대비 계산 구현 | `tests/landing.test.mjs:258-274`; 케이스 `:282-296` (소스 수준, 미실행) |
| 150ms 피드백, `transition` | `landing.module.css:167-170,531`; 토큰 `globals.css:31,34` |
| reduced motion: `transition: none`, `transform: none` | `landing.module.css:543-553` |
| 모션 감소 시 숨겨지는 콘텐츠 없음(진입·리빌 없음) | `@keyframes`/animation 없음 — 테스트 `tests/landing.test.mjs:232-243` (미실행) |

### AC5 — 정확한 설계 문서·출처·QA 핸드오프
| 근거 | 위치 |
| --- | --- |
| 레퍼런스 URL·title·파일 경로·출처(이전 r1a1 실행) | 이 문서 §2.1–§2.2 |
| 관찰·채택·기각 | 이 문서 §2.3 |
| 정정: PM/Lumi는 시각 확인하지 않음, 이 에이전트도 이미지를 보지 않음 | 이 문서 §2.1 |
| 소스 출처(9453240 상속, main 기준 8f71ebb 새 시작) | 이 문서 R3.1 |
| 예시 산수 | 이 문서 §5 |
| QA 사양: 폭 1920/1440/1100/390/320 | 이 문서 §8.3, `scripts/landing-qa.mjs:47-53` |
| 키보드 → 기존 폼 진입 | `scripts/landing-qa.mjs:205-236` |
| reduced motion + 프레임 스트립 | `scripts/landing-qa.mjs:116-159,238-261` |
| 오버플로·에러 검사, fatal 기록, 종료 코드 | `scripts/landing-qa.mjs:166-203,263-282` |
| loopback 거부, 읽기 전용 | `scripts/landing-qa.mjs:36-39` |
| 전체 회귀(생성→지출→정산→읽기 전용 결과, 격리 QA DB, 동일 커밋 출처) | 이 문서 §8.1, §8.4, §8.6 |
| UNRUN 표시, Chromium 부재, 디자이너 캡처 ≠ Cheki QA | 이 문서 머리말, R3.3, §0, §7, §11; `scripts/landing-qa.mjs:5-8` |
