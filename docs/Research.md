# Research.md

기술/라이브러리 조사 및 리서치 내용을 기록한다. 특정 선택을 한 이유는
`docs/DecisionLog.md`에, 조사 과정에서 알게 된 사실/제약은 여기에
남긴다.

---

## 2026-07-07

### Prisma 7의 드라이버 어댑터 필수화

- 설치된 `prisma`/`@prisma/client` 버전은 7.8.0.
- 이 버전부터 `new PrismaClient()`를 인자 없이 호출하면 타입 에러가
  발생한다. `PrismaClientConstructor`가 `options: Prisma.Subset<...>`를
  필수 인자로 요구하도록 바뀌었고, 실제로는 `adapter`(드라이버 어댑터)를
  넘겨야 동작한다(예: Postgres는 `PrismaPg`).
- SQLite의 경우 `@prisma/adapter-better-sqlite3` 패키지의
  `PrismaBetterSqlite3` 클래스를 사용한다(패키지명과 다르게 export된
  클래스명은 `SQLite`가 아니라 `Sqlite` 대소문자 표기임에 주의).
- `prisma.config.ts`는 `datasource.url`을 `DATABASE_URL` 환경변수로
  설정하지만, 이는 Prisma CLI(migrate 등)용 설정이고 런타임(Next.js
  앱)에서는 별도로 `PrismaClient`에 어댑터를 명시적으로 넘겨줘야 한다.
- SQLite 파일 경로는 CLI 실행 시 프로젝트 루트(cwd) 기준으로
  해석되어 `./dev.db`(프로젝트 루트)에 생성됨을 확인. 런타임 코드에서도
  동일한 상대 경로 기준(`file:./dev.db`)을 기본값으로 맞춰야 CLI가 만든
  DB와 같은 파일을 가리킨다.

## 2026-07-09

### Pretendard 폰트 로딩 방식

- Pretendard는 Google Fonts에 등록되어 있지 않아 `next/font/google`로
  로드 불가. jsDelivr CDN(`cdn.jsdelivr.net/gh/orioncactus/pretendard`)
  링크로 로드하거나, 프로덕션에서는 `next/font/local`로 자체 호스팅해야
  한다. `docs/DesignSystem.html`은 참고 문서라 CDN 링크를 그대로
  사용했지만, 실제 앱(`src/app/layout.tsx`)에 적용할 때는 자체 호스팅
  방식을 다시 검토 필요(외부 CDN 장애/로딩 지연 리스크).
- Claude Artifact 미리보기는 CSP로 외부 폰트 요청을 차단하므로
  Pretendard 대신 시스템 폰트로 폴백되어 보인다 — 실제 브라우저에서
  파일을 열거나 배포했을 때와 미리보기 화면의 폰트가 다를 수 있음.

### 최소 이체 정산 알고리즘

- 참여자별 순 잔액(낸 돈 - 부담액)을 계산한 뒤, 잔액이 양수인
  사람(받을 사람)과 음수인 사람(낼 사람)을 각각 내림차순 정렬해 가장 큰
  채권자와 채무자를 그리디하게 매칭하는 방식을 채택.
- 이 방식은 최소 이체 "횟수"를 엄밀하게 최소화하는 최적해는 아니지만
  (완전 최적화는 NP-hard에 가까운 조합 탐색이 필요), 실무적으로 참여자
  수가 적은(소규모 모임, 2~10명) 상황에서는 충분히 효율적인 이체
  목록을 만들어낸다. `docs/PlanningDoc.md` §9에서 결정한 "소규모 모임
  위주" 범위와 부합.
- 반올림 오차 누적을 막기 위해 0.5(원 미만) 단위의 epsilon을 두고 그
  이하 잔액은 이체 대상에서 제외.

### 브라우저 동작 검증 도구

- 이 환경에는 `run` 스킬이 기본 권장하는 `chromium-cli`가 설치되어
  있지 않음(`command not found`).
- 대체로 `playwright` npm 패키지 + `npx playwright install chromium`으로
  헤드리스 Chromium을 직접 설치해 구동 스크립트를 작성함. Windows
  환경에서도 정상 동작 확인(Chrome for Testing 149.x 다운로드/구동).
- 참고: `docs/WorkLog.md`에 실제 검증 시나리오와 결과 기록.

### 환율 처리 방식

- 실시간 환율 API 연동은 조사하지 않고(공급자 선택, 인증키 관리,
  캐싱 정책 등 추가 결정이 필요하다고 판단) MVP 범위에서는 고정
  참고 환율 테이블(`src/lib/currency.ts`)로 대체하기로 결정
  (`docs/DecisionLog.md` §4 참고). 추후 실제 API 연동 시 이 테이블을
  대체하는 형태로 확장 가능하도록 `toBaseCurrency()` 함수 경계를
  분리해둠.
