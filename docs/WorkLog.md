# 작업 로그 (Process / WorkLog)

진행한 작업과 발생한 오류·수정 내역을 시간순으로 기록한다 (CLAUDE.md
Working Rules 항목 6).

---

## 2026-07-07

### 기획 단계

- `docs/ProjectContext.md` 작성(배경/목표).
- 기획자 역할 서브에이전트 정의 파일(`.claude/agents/planner.md`) 생성.
  - 이슈: 같은 세션 내에서 방금 만든 커스텀 에이전트가 즉시 인식되지
    않음(`Agent type 'planner' not found`). 세션 시작 시 로드된 에이전트
    목록이 고정되어 있어서로 추정. 해결: 이번 세션은 general-purpose
    에이전트로 동일 지시문을 실행해 우회. 이후 세션에서는 `planner`가
    정상 인식됨(안내 메시지 참고).
- 10문10답 진행 → 사용자 답변 수집 → `docs/PlanningDoc.md` 작성.
- `docs/Personas.md`, `docs/UserScenarios.md`, `docs/IA.md` 작성.

### 구현 단계

- 기술 스택 확인(AskUserQuestion) → Next.js + TypeScript + SQLite 선택.
- `create-next-app`으로 프로젝트 스캐폴딩(App Router, TS, Tailwind,
  src 디렉터리). 기존 `docs/` 폴더는 보존됨을 확인.
- Prisma 설치 및 `prisma init --datasource-provider sqlite`.
- 스키마 설계: `Group`, `Participant`, `Expense`, `ExpenseShare` 모델
  (`prisma/schema.prisma`).
- `npx prisma migrate dev --name init` 실행, SQLite DB 생성 확인.
- **오류 1**: `PrismaClient`를 인자 없이 `new PrismaClient()`로 생성하니
  타입 에러(`Expected 1 arguments, but got 0`) 발생.
  - 원인: Prisma 7부터 드라이버 어댑터가 필수로 바뀜(예:
    `new PrismaClient({ adapter })`).
  - 수정: `@prisma/adapter-better-sqlite3` 설치 후
    `src/lib/prisma.ts`에서 어댑터를 생성해 주입.
- **오류 2**: 어댑터 클래스 이름 오타(`PrismaBetterSQLite3` vs 실제
  export명 `PrismaBetterSqlite3`).
  - 수정: 올바른 export 이름으로 교체 후 `tsc --noEmit` 통과 확인.
- `src/lib/currency.ts`(고정 환율 변환), `src/lib/settlement.ts`
  (그리디 최소 이체 알고리즘), `src/lib/group.ts`(만료 처리) 작성.
- 서버 액션 `src/app/actions.ts` 작성: 모임 생성, 지출 생성/수정/삭제,
  영수증 파일 업로드(`public/uploads/receipts`).
- 페이지 구현: 랜딩(`/`), 모임 생성(`/groups/new`), 모임 대시보드
  (`/groups/[id]`), 지출 추가/수정(`/groups/[id]/expenses/...`), 정산
  결과(`/groups/[id]/settlement`).
- 공통 컴포넌트: `CopyLinkButton`, `ExpiryBanner`, `ExpenseForm`.
- `.gitignore`에 Prisma SQLite DB 파일, 업로드 폴더 추가.

### 검증 단계

- `npx tsc --noEmit` 통과.
- `npm run build`(Next.js production build) 성공, 라우트 트리 확인.
- 브라우저 동작 검증을 위해 `run` 스킬 사용 → 이 환경에는
  `chromium-cli`가 없어 Playwright(+Chromium 바이너리)를 설치해 대체.
- 개발 서버(`npm run dev`) 백그라운드 실행 후 Playwright 스크립트로
  골든 패스 구동:
  1. 랜딩 → 모임 생성(참여자 3명: 지현/민수/수아)
  2. 지출 1: 저녁 식사 90,000 KRW, 전원 분담
  3. 지출 2: 노래방 30 USD, 민수 결제, 지현·민수만 분담(수아 제외)
  4. 정산 결과 확인
  5. 지출 수정 폼 진입 확인
- 결과 검증: 정산 계산이 손계산과 일치(수아→지현 30,000 / 민수→지현
  9,750 / 지현 순잔액 +39,750 KRW), 콘솔 에러 없음, 스크린샷으로 화면
  정상 렌더링 확인.
- 검증에 사용한 임시 스크립트(`smoke-test.js`)와 스크린샷은 작업 종료
  후 삭제.

### 문서 체계 정비 (CLAUDE.md Working Rules / Required Artifacts / Approval Gates 도입)

- CLAUDE.md에 Working Rules 7개 항목, Required Artifacts 11개 문서
  목록, Approval Gates(승인 필요 항목 12개) 섹션을 추가.
- 누락되어 있던 `docs/Process.md`, `docs/ReviewChecklist.md`,
  `docs/Research.md`를 신규 작성.
- `docs/Personas.md`를 "이름·역할·상황·불편함·성공 기준" 구조로
  재정의(김지현/박민수/이수아 3명 유지, 필드만 표준화).
- `docs/Process.md`에 "페르소나 기반 검토" 절 추가: 이후 IA·디자인·
  개발·런칭 검토 시 이 3명의 관점으로 피드백하도록 규칙화.

### 페르소나 기반 IA 검토 (1회차, 반영 보류)

`docs/Personas.md`의 3명 관점으로 현재 `docs/IA.md`를 검토. 사용자가
"IA는 수정하지 않고 피드백만 남긴다"를 선택해 IA.md는 변경하지 않음
(Approval Gate: IA changes 해당 — 사용자 확인 결과 보류로 결정).

- **김지현(주최자)**: 지출이 여러 건 쌓였을 때 대시보드에서 총
  지출 합계나 "마감 여부"를 바로 보기 어려움. 개선 후보로 남김.
- **박민수(다국통화 참여자)**: 영수증 첨부 여부가 지출 목록에서
  한눈에 안 보임(상세 진입 후에만 확인 가능). 개선 후보로 남김.
- **이수아(결과 확인 참여자)**: IA §2의 "공유 링크 접속 시 대시보드
  또는 정산 결과 중 어디로 진입할지 미확정" 부분에 대해, 이수아의
  성공 기준("링크 클릭 한 번으로 결과 확인")을 고려하면 정산 결과
  화면으로 바로 진입하는 편이 더 부합한다는 의견을 남김.

다음 IA/디자인 논의 시 위 3가지를 함께 검토한다.

### 페르소나별 리뷰 서브에이전트 생성

`docs/Personas.md`의 3명을 각각 읽기 전용(Read/Glob/Grep) 리뷰
서브에이전트로 등록: `.claude/agents/persona-jihyun.md`,
`persona-minsu.md`, `persona-sooah.md`. 각 에이전트는 해당 페르소나의
역할·상황·불편함·성공 기준을 시스템 프롬프트에 담아, 주어진 산출물을
그 페르소나 1인칭 관점으로 평가하고 개선 후보를 제안하되 문서/코드는
직접 수정하지 않도록 정의함. `docs/Process.md`의 "페르소나 기반 검토"
절에서 이 세 에이전트를 참조하도록 갱신.

- 참고(이전 사례): `.claude/agents/planner.md`를 만들었을 때, 같은
  세션 내에서는 새 커스텀 에이전트가 즉시 인식되지 않는 현상이 있었음
  (세션 시작 시 로드된 에이전트 목록이 고정). 이번에도 동일하게, 이번
  세션에서 바로 호출하려면 인식 여부를 먼저 확인해야 함.

### 페르소나 서브에이전트 IA 검토 (2회차, 서브에이전트 병렬 실행)

`persona-jihyun` / `persona-minsu` / `persona-sooah` 세 서브에이전트를
병렬 실행해 `docs/IA.md`를 각 페르소나 관점(헷갈리는 화면 / 부족한
기능 / 불필요한 단계 / 우선 개선점)으로 검토. 검토 결과는 사용자에게
보고했으며, IA 변경·개인정보 필드 추가·정책 변경에 해당하는 항목은
모두 Approval Gate 대상이므로 **개선 후보 제안만 하고 IA.md는 수정하지
않음**. 주요 공통 발견:

- (3명 공통) "정산 결과"와 "결과 공유 링크(읽기 전용)"의 이원화가
  혼란 유발 — 링크 체계와 진입 경로("상세 설계 단계에서 확정"으로
  보류된 부분)를 IA 단계에서 확정할 필요.
- (지현·수아) 정산 결과에 계좌 정보 표시가 없어 UserScenarios 시나리오
  3과 불일치(단, 개인정보 필드 추가라 Approval Gate 대상).
- (지현) 참여자 추가/수정 진입점·지출 삭제 흐름이 IA에 없음
  (PlanningDoc 4.1과 불일치), 대시보드에 지출 총액 없음, 이메일 필수
  입력이 "1분 내 생성" 목표를 위협.
- (민수) 적용 환율/기준 통화 표시 부재, 지출 입력 시 환산 미리보기
  부재, 영수증 "열람" 경로 부재.
- (수아) 열람용 링크는 정산 결과로 직행 필요, "내 항목 강조" 장치 필요.

반영 여부는 사용자 결정 대기 중. 사용자 지시에 따라 검토 결과 전체를
`docs/ReviewChecklist.md` 하단 "페르소나 IA 검토 결과" 섹션에 체크박스
목록으로 저장함(결정/반영 시 체크 + DecisionLog 기록).

### 페르소나 검토 결과 전체 반영 — IA 개정

사용자가 "세명이 불편했던 지점들 다 반영해서 IA 업데이트해"로 전체
반영을 승인(Approval Gate: IA 변경 + 개인정보 필드 추가 + 정책 변경
해당, 결정 내용은 `docs/DecisionLog.md` §7).

- `docs/IA.md` 전면 개정:
  - §1 "공유 링크 체계" 신설 — 모임 링크(편집)/결과 링크(열람 전용)
    2종 확정, 결과 링크는 정산 결과 직행, "결과 공유 링크(읽기 전용)"
    별도 화면 폐지(정산 결과 화면의 읽기 전용 모드로 통합).
  - 화면 목록/흐름도 갱신 — "정산하기" → "정산 결과 보기", 지출
    추가/수정/**삭제**, 저장 후 계속 추가 분기, 참여자 관리(모임 홈 내
    섹션), 정산 결과 → 모임 홈 복귀 경로.
  - 구성 요소 보강 — 모임 생성(이메일 조건부 필수, 계좌 선택 입력,
    기준 통화 안내), 모임 홈(총액·순 잔액 요약, 영수증 아이콘), 지출
    폼(환산 미리보기, 지출일 기본 오늘), 정산 결과(적용 환율 표, 계좌
    표시/복사, 내 항목 강조, 영수증 열람).
- 문서 정합성 갱신: `docs/PlanningDoc.md`(4.1, §3, §5),
  `docs/UserScenarios.md`(시나리오 1·2 버튼/링크 명칭).
- `docs/ReviewChecklist.md`의 페르소나 검토 항목 18건 전부 체크 완료
  처리 + 상태 문구 추가.
- **코드 구현은 미착수** — IA 개정분 구현 전 `docs/Plan.md` 갱신 필요.
  계좌 정보는 DB 스키마 변경(Participant에 계좌 필드) 수반, Plan.md
  갱신 시점에 별도 확인 후 진행.

### IA 개정분 구현 (페르소나 검토 반영)

`docs/Plan.md`의 "페르소나 검토 반영분 구현" 계획에 따라 진행. 스키마
변경 승인 경위와 세부 결정은 `docs/DecisionLog.md` §8.

- **스키마/마이그레이션**: `Participant.email` 선택화,
  `Participant.bankAccount` 추가, `Group.viewToken` 추가.
  - 이슈: `prisma migrate dev`가 비대화형 환경을 지원하지 않아 실패.
    해결: `prisma migrate diff`로 SQL 생성 →
    `prisma/migrations/20260707120000_persona_feedback_ia/` 에 저장 →
    `prisma migrate deploy`로 적용(기존 데이터 보존 확인).
- **서버 액션**(`src/app/actions.ts`): createGroup(이메일/계좌 선택
  입력 + 동명이인 검증 + viewToken 발급), addParticipant /
  updateParticipant / deleteParticipant(지출 연관·최소 인원 가드),
  지출 생성/수정에 지출일 파싱, "저장 후 계속 추가" 분기.
- **화면**: 모임 생성 폼(3필드 참여자 행, 기준 통화 안내), 모임
  홈(지출 총액·순 잔액 요약 카드, 참여자 관리 섹션, 영수증 아이콘,
  "정산 결과 보기" + 조회 액션 안내 문구, "모임 링크 복사 (편집
  가능)"), 지출 폼(환산 미리보기, 지출일 기본 오늘, 저장 후 계속
  추가, 수정 모드 삭제 버튼+confirm), 정산 결과를 `SettlementView`
  공용 컴포넌트로 추출(적용 환율 표, 이체별 받는 계좌 표시/복사,
  내 항목 강조 `TransferList`, 원본 통화 지출 내역+영수증 열람),
  열람 전용 라우트 `/r/[token]` 신설(정산 결과 직행, 편집 진입 미노출).
- **오류 1(실제 버그)**: 지출일이 하루 밀려 표시됨(로컬 자정 저장 ↔
  UTC 기준 표시). 수정: UTC 자정으로 저장하도록 `parseExpenseDate`
  변경 후 재검증.
- **오류 2(검증 스크립트 버그)**: 모임 생성 후 URL 대기 정규식이
  `/groups/new` 자체에 매칭, 참여자 행 선택자가 순 잔액 요약의
  이름과 충돌, 서버 액션 완료 전에 단언이 실행되는 타이밍 문제.
  각각 정규식 부정 전방탐색, 섹션 스코프 선택자, `waitFor` 대기로
  수정(제품 코드 문제 아님).
- **오류 3(환경)**: 이전 세션의 dev 서버(3000 포트)가 남아 있어 새
  서버 기동 실패 → 잔존 프로세스 종료 후 진행.
- **검증**: `tsc --noEmit`·`next build` 통과. Playwright 골든 패스
  38개 체크 전부 통과, 콘솔 에러 없음 — 이메일 없이 모임 생성(계좌
  포함), KRW 전원 분담 + JPY 부분 분담(환산 미리보기 ≈108,000 KRW),
  저장 후 계속 추가, 총액 198,000/순 잔액(+6,000/+24,000/-30,000)
  수기 검산 일치, 참여자 추가·수정·삭제 및 삭제 불가 가드, 정산
  결과의 환율 표(1 JPY = 9 KRW)·계좌 복사·내 항목 강조, `/r/[token]`
  열람 전용 직행(편집 링크 미노출), 잘못된 토큰 404. 검증용 임시
  스크립트/스크린샷은 스크래치패드에만 생성(저장소 외부), dev DB에
  테스트 모임 데이터가 남아 있음(개발용이라 유지).

### 총무 메인 시나리오 작성 (planner 서브에이전트)

사용자 지시로 planner 서브에이전트가 개정 IA 기준의 상세 메인
시나리오(총무: 모임 생성 → 정산 마감)를 `docs/UserScenarios.md` 말미에
추가. 17단계, 3개 국면(모임 생성 / 지출 기록·중간 점검 / 정산
마감·공유), 컬럼은 단계·화면·총무의 액션·시스템 반응. 검수에서
참여자 표기 불일치("김지현" → "지현") 1건 수정. 검수 중 아래 문서-코드
불일치 1건을 발견해 남은 이슈에 추가.

### 전체 화면 비주얼 디자인 (design-boost 스킬)

사용자 지시("화면 예쁘게 만들어줘")로 모든 화면에 "정산 장부(영수증)"
콘셉트의 디자인 시스템을 적용. 세부 색/폰트/레이아웃 결정은
`docs/DecisionLog.md` §9 참고.

- **변경 파일**: `src/app/globals.css`(토큰 전면 재작성),
  `src/app/layout.tsx`(폰트 3종 + 상단 워드마크 헤더),
  `src/app/page.tsx`(랜딩을 미니 영수증 데모 히어로로 재작성),
  `src/app/groups/new/page.tsx`, `src/app/groups/[id]/page.tsx`,
  `src/app/groups/[id]/expenses/new/page.tsx`,
  `src/app/groups/[id]/expenses/[expenseId]/page.tsx`,
  `src/components/ExpenseForm.tsx`, `src/components/SettlementView.tsx`
  (시그니처 절취선 추가), `src/components/TransferList.tsx`(스태거
  페이드인 추가), `src/components/CopyLinkButton.tsx`,
  `src/components/ExpiryBanner.tsx`, `src/components/ConfirmSubmitButton.tsx`.
- **검증**: `tsc --noEmit`·`next build` 통과. Playwright로 랜딩/모임
  생성/모임 홈/지출 폼/정산 결과를 데스크톱(900px)과 모바일(390px)
  양쪽에서 스크린샷 촬영해 오버플로·겹침 없음 확인. 라벨 텍스트가
  스크린샷 압축 때문에 브라운톤으로 보여 색상 버그로 의심했으나,
  `page.evaluate(getComputedStyle)`로 실제 렌더링 색상이
  `rgb(34,32,26)`(의도한 잉크색)임을 확인해 오탐으로 정리.
  기존 Tailwind 잔여 클래스(`neutral-*`, `green-700`, `amber-*` 등)가
  남아있지 않은지 전체 grep으로 재확인.
- **범위 결정**: 다크 모드는 기존에도 죽은 코드였고 요청도 없어
  이번 작업 범위에서 제외(라이트 모드만 완성).
- 검증용 스크린샷/스크립트는 스크래치패드에만 생성(저장소 외부).

### 남은 이슈 / TODO

- **만료 기산 시점 불일치**: IA/시나리오는 "만료는 마지막 활동 시점
  기준 기산"이라고 하나, 구현은 모임 생성 시 `expiresAt`(+90일)을
  고정하고 이후 활동 시 갱신하지 않음(`src/lib/group.ts`). 활동 시점
  갱신 로직 추가 또는 문서 표현 수정 중 택일 필요(사용자 결정 사항).
- 실시간 환율 API 연동 미구현(고정값 사용 중, `docs/DecisionLog.md` §4).
- 만료 데이터의 정기 배치 삭제(cron) 미구현, 현재는 접근 시점 지연
  삭제만 적용.
- 영수증은 로컬 파일 시스템에 저장 중 — 배포 환경에서는 영구 스토리지
  필요.
- 실제 송금 API 연동, 로그인 기반 계정 시스템은 MVP 이후 확장 범위로
  보류.

## 2026-07-09

### 디자인 시스템(`docs/DesignSystem.html`) 전체 화면 반영

`docs/Plan.md` "DesignSystem.html 반영 — 전체 화면 리스킨" 계획에 따라
진행. DecisionLog §10에서 결정한 새 토큰(웜 그레이 배경, 화이트 카드,
그린 accent `#12B76A`, Pretendard 단일 폰트, pill 버튼)을 화면 구조는
그대로 둔 채 색·폰트·라운드·그림자 토큰만 교체하는 방식으로 적용.

- 변경 파일: `globals.css`(색/라운드/그림자/폰트 토큰, `.ticket-divider`
  삭제), `layout.tsx`(Google Fonts 2종 제거, Pretendard CDN 링크 추가,
  IBM Plex Mono만 유지), `page.tsx`·`groups/new/page.tsx`·
  `groups/[id]/page.tsx`·`ExpenseForm.tsx`·`CopyLinkButton.tsx`·
  `SettlementView.tsx`(CTA 버튼 `rounded-token`→`rounded-full`, 입력창
  `rounded-token`→`rounded-input`, 절취선 → 단순 구분선).
- Tailwind 유틸리티 이름(`text-muted`, `bg-accent`, `text-accent-ink`
  등)은 그대로 유지하고 CSS 변수 값만 바꿔서, 컴포넌트 코드 대부분은
  건드리지 않고 색상 전환을 끝냄. 버튼/입력창처럼 라운드 반경이
  카드와 달라야 하는 요소만 className을 개별 수정.
- **발견한 문제**: `next build`(프로덕션)를 먼저 실행한 뒤 `next dev`를
  띄우면 Turbopack이 이전 빌드의 CSS 캐시를 재사용해 옛 브랜드 색이
  그대로 렌더링됨(`getComputedStyle`로 확인 전까지 못 알아챔). `.next`
  디렉터리를 삭제하고 dev 서버를 재기동해 해결.
- 검증: `tsc --noEmit`/`next build` 통과. Playwright로 랜딩 → 모임
  생성 → 지출 추가 → 모임 홈 → 정산 결과를 데스크톱(1280px)/
  모바일(390px)에서 실제 구동, 콘솔 에러 0건, 버튼 pill 형태·accent
  색·Pretendard 폰트 로드를 `getComputedStyle`로 재확인.
- 범위 밖으로 남긴 것: DesignSystem.html의 Modal/Tabs/Loading
  Skeleton/Permission Denied 등 앱에 대응 화면이 없는 컴포넌트 타입은
  이번 리스킨에 포함하지 않음.

### 참여자 아바타 색 시스템 추가 (토큰 리스킨 후속)

사용자 피드백("디자인이 거의 비슷해 보인다") → DecisionLog §11 참고.
색·라운드 토큰만 바꾼 리스킨은 레이아웃이 그대로라 체감 변화가
작았음. `src/lib/avatarColor.ts` + `src/components/Avatar.tsx`로
참여자별 컬러 아바타 시스템을 만들어 참여자/지출/정산 관련 화면
전체(랜딩 미리보기 포함)에 적용하고, "수정/삭제" 텍스트 링크를 pill
버튼으로, 헤더에 브랜드 배지를, 지출 총액 카드를 다크 스탯 카드로
바꿔 실제로 체감되는 시각 차이를 만듦.

- 변경 파일(신규): `src/lib/avatarColor.ts`, `src/components/Avatar.tsx`.
- 변경 파일(기존): `layout.tsx`(브랜드 배지), `page.tsx`(랜딩 미리보기
  아바타), `groups/new/page.tsx`(입력 중 실시간 아바타, 클라이언트
  상태로 이름 추적), `groups/[id]/page.tsx`(참여자·지출 목록 아바타,
  액션 pill 버튼, 다크 스탯 카드), `ExpenseForm.tsx`(참여자 체크박스
  → 아바타 pill 칩, `has-[:checked]` 스타일), `SettlementView.tsx`
  (잔액 목록 아바타), `TransferList.tsx`(이체 행·선택 칩 아바타),
  `ConfirmSubmitButton.tsx`(기본 스타일을 pill 버튼으로).
- 검증: `tsc --noEmit`/`next build`(캐시 삭제 후) 통과. Playwright로
  전 구간 재구동, 데스크톱/모바일 스크린샷에서 아바타 겹침·잘림 없음
  확인, 콘솔 에러 0건.

### DesignSystem.html 컴포넌트 타입 실제 도입 (구조 리스킨 2차)

사용자가 "왜 자꾸 전 형식을 유지하는거야"라고 재차 지적 — §11까지는
색·아바타 같은 표면만 바꿨고 페이지 골격(단순 h1, 세로 나열,
window.confirm, 기본 404)은 그대로였던 게 원인. DecisionLog §12
참고. DesignSystem.html에서 "범위 밖"으로 미뤄뒀던 컴포넌트 타입을
실제로 도입.

- 신규 컴포넌트: `AppBar.tsx`(내비게이션), `GroupCard.tsx`(모임
  카드), `Tabs.tsx`(탭), `ConfirmDialog.tsx`(네이티브 `<dialog>`
  기반 모달 — `window.confirm` 대체), `EmptyState.tsx`(빈 상태).
- 신규 라우트 파일: `src/app/not-found.tsx`(Permission Denied 화면 —
  이전엔 Next.js 기본 404 그대로였음), `src/app/groups/[id]/loading.tsx`
  (로딩 스켈레톤).
- 변경 파일: `groups/new/page.tsx`·`expenses/new/page.tsx`·
  `expenses/[expenseId]/page.tsx`·`SettlementView.tsx`(h1 →
  AppBar), `groups/[id]/page.tsx`(헤더 → GroupCard, 참여자/지출
  세로 나열 → Tabs, 참여자 삭제 window.confirm → ConfirmDialog, 빈
  지출 목록 → EmptyState), `ExpenseForm.tsx`(지출 삭제도
  ConfirmDialog로 전환 — 기존 폼 내부의 `formAction` 트릭 버튼을
  폼 바깥의 독립 ConfirmDialog로 이동), `globals.css`(`.skeleton`
  shimmer 애니메이션, `<dialog>` 기본 스타일 리셋).
- 검증: `tsc --noEmit`/`next build`(캐시 삭제) 통과. Playwright로
  골든 패스 재구동 + 참여자 탭 클릭, 삭제 확인 모달이 실제로
  `<dialog open>` 상태가 되는지 확인, 존재하지 않는 모임 ID로 접근해
  새 Permission Denied 화면이 뜨는지 확인. 콘솔 에러 0건.
- 범위 밖: DesignSystem의 Tables(데스크톱 표 형태 지출 목록)는
  카드/리스트와 중복 구현 비용 대비 효과가 낮다고 보고 계속 보류.

### 색 토큰 5종 누락분 추가 (배경색 재지적 대응)

사용자가 스크린샷을 보내며 "페이지 배경이 이 색이 아니지 않니?
디자인시스템에서 색상 다 적용해"라고 지적. DecisionLog §13 참고.
`docs/DesignSystem.html`에 정의된 토큰 중 `surface-alt`,
`accent-soft`, `warn`/`warn-soft`, `negative-soft`가 `globals.css`에
한 번도 추가되지 않고 인라인 `color-mix()`로만 임시 대체돼 있었던
게 근본 원인.

- `globals.css` `@theme inline`에 5개 토큰 정식 추가.
- 11곳의 인라인 `color-mix()`/임의값 클래스를 전부 새 토큰 유틸리티로
  교체(대상 파일은 DecisionLog §13 참고). 딤 처리용 알파 블렌드 1곳만
  의도적으로 유지.
- `GroupCard`의 만료 배지 색이 accent(그린)로 잘못 구현돼 있던 것을
  발견 — DesignSystem.html 스펙대로 `warn`/`warn-soft`로 수정.
- 미사용 `ConfirmSubmitButton.tsx` 삭제(죽은 코드).
- **사고 및 복구**: 검증차 `next build`를 다시 돌리다 `.next` 캐시가
  오염되어 켜져 있던 사용자의 dev 서버가 새 CSS 토큰을 반영 못 하는
  상태가 됨. 컴파일된 CSS 파일을 직접 열어 `.bg-warn-soft` 규칙
  존재를 확인하는 방식으로 원인을 특정하고, 서버 재기동 +
  `.next` 삭제로 복구.
- 검증: `tsc --noEmit`/`next build` 통과. 만료 배지
  `getComputedStyle`이 `#FBF3DA`/`#B98900`(정확히 토큰값)로 렌더되는
  것 확인. Playwright 골든 패스 재구동, 콘솔 에러 0건.

### 랜딩 히어로 풀블리드 컬러 블록 추가 (넓은 화면 여백 문제 대응)

사용자가 1920px 스크린샷으로 "이게 적용된 걸로 보이냐"고 재차 지적.
DecisionLog §14 참고. 색 토큰은 정확했지만 넓은 화면에서 콘텐츠가
가운데 640px에만 있고 나머지가 전부 빈 베이지 여백이라 "안 꾸며진
페이지"처럼 보였던 게 원인.

- `src/app/page.tsx` 최상단에 `calc(50% - 50vw)` breakout 기법으로
  뷰포트 전체 폭 accent 그린 히어로 배너 추가(레퍼런스 1의 민트/다크
  대비 무드를 랜딩 첫인상에 반영).
- 검증: `tsc --noEmit`/`next build` 통과, 1920px에서 가로 스크롤
  발생하지 않음(`scrollWidth === clientWidth`) 확인, 390px 모바일도
  정상. 콘솔 에러 0건.
- `next build`를 dev 서버가 켜진 상태에서 다시 실행했기 때문에(§13
  에서 겪은 캐시 오염 패턴) 이번엔 곧바로 서버를 재기동해 사전에
  예방.

### 배경색 재변경 + 랜딩 히어로 무드 전환 (블랙×네온그린)

배경색이 픽셀 단위로 정확히 적용됐음을 증명했음에도 사용자가 값
자체를 더 뚜렷한 톤으로 바꿔달라고 요청. DecisionLog §15 참고.

- `--bg` `#F6F5F0`→`#E3F0E9`(세이지 민트, 흰색과 확실히 구분),
  `--accent-soft`·`--border`도 새 배경과 어울리게 같이 조정.
- 랜딩 히어로 배경을 accent 그린 → `bg-ink`(다크)로 바꾸고 헤드라인
  강조 구간만 accent 그린으로 네온처럼 강조(레퍼런스 2 무드).
- 검증: `elementFromPoint`로 실제 렌더 픽셀에서 새 배경색 재확인,
  `tsc --noEmit`/`next build` 통과, `next build` 직후 곧바로 `.next`
  삭제+재기동으로 캐시 오염 사전 예방. Playwright 1920px/390px
  스크린샷, 콘솔 에러 0건.

### 라이트 → 다크 테마 전면 전환

사용자가 `docs/DesignSystem.html` 색상 팔레트 스크린샷을 보내며
"코드 말고 저 보이는 색상 기준으로 맞춰달라"고 요청. DecisionLog
§16 참고. 분석 결과 사용자의 브라우저가 다크 모드였고, 문서의 스와치
색상(`var()` 참조, 다크모드 값으로 렌더)과 hex 텍스트 라벨(라이트
값 하드코딩)이 서로 안 맞게 표시되고 있었음 — 이게 오늘 반복된
"배경색 불일치" 지적들의 실제 근본 원인이었을 가능성이 큼.

- `globals.css` `:root`를 문서의 다크모드 스와치 값으로 전면 교체
  (`bg #14170F`, `ink #EDEFE7` 등). `accent-ink`만 대비 확보를 위해
  어두운 값(`#06301D`)으로 보정.
- `page.tsx` 히어로를 `bg-accent`(네온 그린) + `bg-ink` CTA(다크
  테마에서 밝은 색으로 반전)로 재구성 — 페이지 자체가 이미 어두워져
  별도 다크 밴드가 불필요해짐.
- `ConfirmDialog`의 모달 딤 배경이 `var(--ink)`를 썼던 것을
  `bg-black/50`으로 고정(테마 반전에 따른 역효과 방지).
- 검증: `tsc --noEmit`/`next build` 통과, 빌드 직후 캐시 삭제+재기동.
  Playwright로 골든 패스 전 구간(랜딩/모임 생성/모임 홈/참여자 탭/
  지출 추가/정산 결과) 데스크톱+모바일 스크린샷, 배경색 픽셀
  재확인(`#14170F` 정확 일치), 콘솔 에러 0건.

### 전역 헤더 제거 + 랜딩 히어로/미리보기 카드 재정비

사용자 요청으로 모든 페이지 상단의 "정산" 워드마크 헤더를 제거하고
브랜드 마크는 랜딩 히어로 안으로 옮김(DecisionLog §17). 히어로가
뷰포트 맨 위까지 꽉 차도록 상단 여백을 상쇄하고 헤드라인을 3줄/더
큰 크기로 재편집. "모임 예시" 미리보기 카드에 eyebrow 라벨과 accent
상단 바를 추가.

- 변경 파일: `layout.tsx`(헤더 제거), `page.tsx`(히어로 재구성,
  미리보기 카드 라벨 추가).
- 하위 페이지는 이미 AppBar가 자체 내비게이션을 제공해 전역 헤더
  없이도 공백이 없음을 확인.
- 검증: `tsc --noEmit`/`next build` 통과, 빌드 직후 캐시 삭제+재기동,
  Playwright 1920px/390px 스크린샷, 콘솔 에러 0건.
