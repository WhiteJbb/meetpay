# Plan.md

CLAUDE.md Working Rules에 따라, 구현 전에는 이 문서를 먼저 작성/갱신한다.
새 기능을 구현할 때마다 아래에 "## YYYY-MM-DD 계획: <기능명>" 섹션을
추가하고, 완료 후 실제 결과와 차이가 있으면 갱신한다.

---

## 2026-07-07 계획: MVP 구현 (소급 작성)

> 참고: 이 섹션은 Working Rules 도입 전에 이미 진행된 MVP 구현
> 내용을 규칙에 맞춰 소급 정리한 것이다. 이후 계획은 구현 전에 먼저
> 작성한다.

### 목표

`docs/PlanningDoc.md`의 MVP 범위를 실제 동작하는 웹 서비스로 구현.

### 범위

1. 모임 생성 및 참여자 등록(실명 + 이메일)
2. 지출 항목 등록(부분 참여 지정, 다국통화, 영수증 첨부)
3. 정산 계산(최소 이체 횟수, 다국통화 환산)
4. 공유 링크를 통한 결과 조회(익명 접근)
5. 이력 보관 만료 처리(90일)

### 기술 선택

- Next.js(App Router) + TypeScript + Prisma/SQLite
  (`docs/DecisionLog.md` §2 참고)

### 데이터 모델

- `Group`(모임), `Participant`(참여자), `Expense`(지출),
  `ExpenseShare`(지출-참여자 분담 조인 테이블)

### 구현 순서

1. Prisma 스키마 설계 및 마이그레이션
2. 통화 변환 유틸 + 정산(최소 이체) 알고리즘
3. 모임 생성 페이지/서버 액션
4. 모임 대시보드 페이지
5. 지출 추가/수정 페이지(부분 참여, 다국통화, 영수증 업로드)
6. 정산 결과 페이지(공유 링크, 만료 안내)
7. 만료 데이터 처리 로직
8. 빌드/타입체크 + 브라우저(Playwright)로 golden path 검증

### 검증 기준

- `tsc --noEmit`, `next build` 통과
- 브라우저에서 모임 생성 → 지출 등록(부분 참여 + 다국통화 포함) →
  정산 결과 확인까지 실제로 구동되고, 계산 결과가 수기 계산과 일치할 것

실제 진행 경과와 발생한 이슈는 `docs/WorkLog.md`, 의사결정 근거는
`docs/DecisionLog.md`를 참고.

---

## 2026-07-07 계획: 페르소나 검토 반영분 구현 (IA 개정판 대응)

### 목표

`docs/IA.md` 개정(페르소나 검토 전체 반영, DecisionLog §7)에 맞춰
기존 MVP 코드를 갱신한다. 사용자가 IA 반영과 구현을 승인함
(구현 승인 시점에 계좌 필드로 인한 DB 스키마 변경 필요성을 사전
고지함).

### 데이터 모델 변경 (Prisma)

- `Participant.email`: 필수 → 선택(`String?`). 동명이인이 있을 때만
  앱 레벨 검증으로 이메일을 요구한다. `@@unique([groupId, email])`은
  유지(SQLite에서 NULL 중복 허용).
- `Participant.bankAccount`(`String?`) 추가 — "은행명 + 계좌번호"
  자유 입력 한 필드(개인정보, 선택 입력).
- `Group.viewToken`(`String? @unique`) 추가 — 열람 전용 결과 링크용
  토큰. 생성 시 UUID 발급, 기존 데이터는 접근 시점에 지연 발급
  (기존 행 때문에 필수 컬럼 추가 시 필요한 데이터 리셋을 피하는
  비파괴 마이그레이션).

### 라우트/화면 변경

| 위치 | 변경 |
|------|------|
| `/groups/new` | 참여자 행: 이름(필수)+이메일(선택)+계좌(선택). 기준 통화(KRW) 안내 문구. 서버 검증: 동명이인 시 이메일 필수·중복 불가 |
| `/groups/[id]` (모임 홈) | 기준 통화 표시, 지출 총액(KRW 환산), 참여자별 순 잔액 요약, 참여자 관리 섹션(추가/수정(details 인라인 폼)/삭제 — 지출 연관 참여자는 삭제 불가), 지출 목록 영수증 아이콘, 버튼명 "정산 결과 보기"/"모임 링크 복사 (편집 가능)"+권한 안내 문구. 목록의 삭제 버튼은 지출 수정 화면으로 이동(확인 단계 포함) |
| `/groups/[id]/expenses/*` | 환산 미리보기(비KRW 입력 시 "≈ N KRW"), 지출일 입력(기본 오늘), "저장 후 계속 추가"(생성 모드), 삭제 버튼+confirm(수정 모드) |
| `/groups/[id]/settlement` | 적용 환율 표(+고정 참고 환율 안내), 이체 목록에 받는 사람 계좌 표시/복사, 내 항목 강조(이름 선택), 원본 통화별 지출 내역(영수증 열람 포함), "결과 링크 복사 (열람 전용)"(=`/r/[token]`), "모임 홈으로 돌아가기" |
| `/r/[token]` (신설) | 열람 전용 정산 결과 직행. settlement와 동일한 뷰 컴포넌트를 읽기 전용 모드로 렌더(편집 진입 링크/버튼 미노출) |

### 구현 노트

- 정산 결과 화면은 `SettlementView` 공용 컴포넌트로 추출해
  `readOnly` 플래그로 두 라우트에서 공유.
- 이체 목록(계좌 복사, 내 항목 강조)은 클라이언트 컴포넌트
  `TransferList`로 분리.
- 참여자 서버 액션 추가: `addParticipant`, `updateParticipant`,
  `deleteParticipant`(지출 연관 시 거부). 완료 후 모임 홈으로
  redirect(서버 액션 단일 왕복 재렌더 활용).
- `currency.ts`의 환율 테이블 export를 추가해 클라이언트 미리보기와
  정산 결과 환율 표에서 재사용.
- 지출 폼에 `date` 필드 추가(기존 폼에 없었음 — IA의 "지출일 기본값
  오늘" 항목), 서버 액션에서 파싱해 저장.

### 정책 결정(구현 세부)

- 지출에 연관된(지출자이거나 분담자인) 참여자는 삭제 불가로 처리하고
  사유를 UI에 표시 — 데이터 정합성을 깨지 않는 보수적 기본값.
  (PlanningDoc 4.1의 "상세 설계 단계에서 결정" 항목의 구현 결정,
  DecisionLog에 기록)

### 검증 기준

- `tsc --noEmit`, `next build` 통과.
- Playwright 골든 패스: 모임 생성(이메일 없이, 계좌 1명 입력) →
  지출 등록(KRW 전원 + JPY 부분 참여, 지출일 기본값) → 저장 후 계속
  추가 동작 → 모임 홈에서 총액/순 잔액 확인 → 참여자 추가/삭제 →
  정산 결과에서 환율 표·계좌 복사 버튼·내 항목 강조 확인 → 열람 전용
  `/r/[token]` 직행 및 편집 버튼 미노출 확인. 계산 결과 수기 검산.

### 결과 (구현 완료 후 기록)

- 위 검증 기준 전부 충족(38개 체크 통과, 콘솔 에러 없음, 수기 검산
  일치). 상세는 `docs/WorkLog.md` "IA 개정분 구현".
- 계획 대비 달라진 점: 지출일 저장을 UTC 자정으로 통일(검증 중 표시
  하루 밀림 버그 발견 → 수정, DecisionLog §8), `prisma migrate dev`
  대신 `migrate diff` + `migrate deploy` 사용(비대화형 환경 제약).

---

## 2026-07-09 계획: `docs/DesignSystem.html` 반영 — 전체 화면 리스킨

### 목표

DecisionLog §10에서 결정한 새 디자인 시스템(클린 카드 기반, 그린
accent, Pretendard 단일 폰트)을 실제 앱 화면 전체에 적용한다. 사용자
지시("디자인 시스템 적용해서 전체 디자인 전면 수정해줘")에 따라
진행하며, §10에서 이미 "디자인 방향 변경" Approval Gate 승인을
받아둔 상태다.

### 범위

- **토큰만 교체, 구조는 유지**: 화면 구성(섹션 순서, 필드, 문구)은
  IA.md 그대로 두고 색·라운드·그림자·폰트·버튼 형태만 교체한다.
  새 컴포넌트 타입(진짜 Modal, Tabs, Skeleton 등)은 이번 범위에
  포함하지 않는다 — 현재 앱에 해당 UI 패턴이 없고(`window.confirm`
  기반 확인 등), 도입하려면 별도 상호작용 설계가 필요하기 때문.
- Tailwind CSS 변수 토큰(`globals.css`의 `@theme inline`)을
  DesignSystem.html 값으로 교체 — 변수 **이름은 유지**(`--muted`,
  `--accent-hover` 등 기존 클래스 재사용 극대화), 값만 교체.
  - `--bg` `#EFEBE0`→`#F6F5F0`, `--ink` `#22201A`→`#1B211D`,
    `--muted` `#6E6656`→`#6B7268`, `--accent` `#8C6415`→`#12B76A`,
    `--accent-hover` `#6E4E10`→`#0C8F53`, `--accent-ink`
    `#FFFFFF`→`#06301D`(라이트 그린 위 명도 대비를 위해 흰 글자 대신
    어두운 그린 글자로 전환), `--border` `#DEDACB`→`#E3E0D5`,
    `--positive` `#2F7A4D`→`#12B76A`(accent와 통일), `--negative`
    `#B23B3B`→`#E5484D`.
  - `--radius-token`(카드/보더 반경) 6px→14px. 입력창 전용
    `--radius-input`(8px) 신설 — DesignSystem.html은 입력창을 카드보다
    작은 반경으로 구분함.
  - `--shadow-card` 값을 DesignSystem.html 톤(더 부드러운 이중 그림자)
    으로 교체.
  - 폰트: `font-display`/`font-body` 두 Tailwind 유틸리티를 모두
    Pretendard 한 폰트로 통일(제목/본문 폰트 분리 폐지). 숫자용
    `font-data`(IBM Plex Mono)는 유지.
- `layout.tsx`: `IBM_Plex_Sans_KR`/`Gowun_Dodum` google font 로딩 제거,
  Pretendard는 CDN(`cdn.jsdelivr.net/gh/orioncactus/pretendard`)
  `<link>`로 로드(Research.md 참고, Pretendard는 next/font/google
  미지원). `IBM_Plex_Mono`는 유지.
- 버튼류: 카드/입력창은 `rounded-token`/`rounded-input` 유지, **CTA·
  submit 버튼과 링크 버튼만 `rounded-full`(pill)으로 전환** —
  DesignSystem.html의 "모든 버튼은 pill" 규칙.
- "절취선(ticket-divider)" 모티프 제거(§10에서 이미 폐기 결정) —
  `globals.css`의 `.ticket-divider` 규칙 삭제, 사용 중인
  `page.tsx`·`SettlementView.tsx`에서 단순 구분선(`border-t
  border-border`)으로 교체.
- 대상 파일: `globals.css`, `layout.tsx`, `page.tsx`(랜딩),
  `groups/new/page.tsx`, `groups/[id]/page.tsx`,
  `groups/[id]/settlement/page.tsx`(변경 없음, SettlementView 경유),
  `expenses/new`·`expenses/[expenseId]/page.tsx`(변경 없음, ExpenseForm
  경유), `components/ExpenseForm.tsx`, `components/SettlementView.tsx`,
  `components/TransferList.tsx`, `components/CopyLinkButton.tsx`,
  `components/ExpiryBanner.tsx`, `components/ConfirmSubmitButton.tsx`.

### 검증 기준

- `tsc --noEmit`, `next build` 통과.
- 브라우저(Playwright)로 랜딩 → 모임 생성 → 모임 홈 → 지출 추가 →
  정산 결과 → `/r/[token]` 전 화면 데스크톱+모바일(390px) 스크린샷,
  버튼이 실제로 pill 형태로 렌더되는지, 색 대비(accent 버튼 위 텍스트
  가독성)를 `getComputedStyle`로 확인.

### 결과 (구현 완료 후 기록)

- `tsc --noEmit`, `next build` 통과. Playwright로 랜딩→모임 생성→지출
  추가→모임 홈→정산 결과 전 구간을 데스크톱(1280px)/모바일(390px)
  양쪽에서 실제로 구동, 콘솔 에러 0건.
- `getComputedStyle`로 CTA 버튼 확인: `background-color:
  rgb(18,183,106)`(#12B76A), `color: rgb(6,48,29)`(#06301D),
  `border-radius`가 매우 큰 값(사실상 완전 라운드, `rounded-full`
  정상 적용), `font-family`가 `Pretendard, ...` 순으로 정상 로드.
  입력창 `border-radius: 8px`(`rounded-input`) 확인.
- **재현한 함정**: `next build`로 프로덕션 `.next`를 먼저 만든 뒤 바로
  `next dev`를 띄웠더니 Turbopack이 이전 빌드의 CSS 청크를 캐시에서
  재사용해 옛 브랜드 톤(#8C6415 브라스)이 그대로 렌더링됨. `.next`
  삭제 후 `next dev` 재기동으로 해결 — 토큰 값만 바꾸는 리스킨
  작업 후에는 `.next` 캐시를 지우고 검증해야 함을 확인.
- **범위에서 제외**: DesignSystem.html의 Modal/Tabs/Loading
  Skeleton/Permission Denied 등 새 컴포넌트 타입은 계획대로 이번
  리스킨에 포함하지 않음(기존 화면에 대응하는 상호작용이 없음). 필요
  시 별도 작업으로 진행.
