# 더치페이 정산 웹

모임(친구, 여행, 회식 등)에서 발생한 지출을 기록하면 **최소 이체
횟수**로 정산 결과를 자동 계산해주는 웹 서비스. 로그인 없이 링크
공유만으로 참여자 전원이 결과를 확인할 수 있다.

## 이 저장소의 성격 — 작업 방식 비교 실험

이 프로젝트는 발표자료용 비교 실험으로 만들어졌다. **동일한
모델(Claude Sonnet, medium reasoning effort)** 로, 아래 두 가지
작업 방식의 결과물을 비교한다.

| | 비교군 | 이 저장소 |
|---|---|---|
| 지시 방식 | "이거 해줘" 식의 최소 지시만 제공 | 구조화된 프로세스 지시 |
| 작업 절차 | 별도 규칙 없음 | 아래 "작업 프로세스" 참고 |
| 산출 문서 | 없음 | 기획/계획/의사결정/작업 로그 전부 기록 |

즉 이 저장소는 **"체계적인 프로세스를 강제했을 때 결과물이 어떻게
달라지는가"** 를 보여주기 위한 실험군이다. 실제 화면/기능 자체보다,
`docs/` 아래에 쌓인 기록이 이 비교의 핵심 산출물이다.

## 작업 프로세스

이 저장소에서는 다음 규칙을 강제했다(`CLAUDE.md` 참고).

1. **구현 전 계획 작성**: 코드를 쓰기 전에 반드시 `docs/Plan.md`에
   범위·데이터 모델·구현 순서·검증 기준을 먼저 적는다.
2. **승인 게이트**: IA 변경, DB 스키마 변경, 새 라이브러리 추가,
   디자인 방향 전환처럼 되돌리기 어려운 결정은 임의로 진행하지
   않고 먼저 사용자에게 확인한다.
3. **의사결정 기록**: 무엇을, 왜 그렇게 결정했는지를
   `docs/DecisionLog.md`에 남긴다(현재 18개 항목).
4. **작업/오류 기록**: 진행 경과와 발생한 문제·수정 내역을
   `docs/WorkLog.md`에 시간순으로 남긴다.
5. **프롬프트 원문 보존**: 사용자가 준 주요 지시를 그대로
   `docs/PromptLog.md`에 저장한다.
6. **페르소나 기반 검토**: `docs/Personas.md`에 정의한 3명의 핵심
   페르소나(주최자/다국통화 참여자/결과 열람자) 관점으로 IA·디자인·
   구현 결과를 각각 검토한다.
7. **실제 구동 검증**: 타입체크·빌드에 그치지 않고 Playwright로
   브라우저를 직접 띄워 golden path를 구동해 확인한다.

이 절차와 산출물 전체는 `docs/Process.md`에 정리돼 있고, 아래 문서
목록에서 각 산출물을 확인할 수 있다.

## 문서 목록 (`docs/`)

| 문서 | 내용 |
|---|---|
| `ProjectContext.md` | 프로젝트 배경과 목표 |
| `PlanningDoc.md` | 10문10답 기반 서비스 기획서 |
| `Plan.md` | 구현 전 작성한 단계별 계획 |
| `IA.md` | 정보 구조 — 화면 목록과 화면 간 흐름 |
| `UserScenarios.md` | 사용자 시나리오 |
| `Personas.md` | 핵심 페르소나 3명 |
| `DecisionLog.md` | 주요 의사결정과 근거 |
| `WorkLog.md` | 작업 진행 내역, 오류와 수정 이력 |
| `Process.md` | 작업 방식/절차 규칙 |
| `PromptLog.md` | 사용자 프롬프트 원문 |
| `ReviewChecklist.md` | 완료 전 점검 체크리스트 |
| `Research.md` | 기술/라이브러리 조사 내용 |
| `DesignSystem.html` | 무드보드 기반 디자인 시스템 문서 |

## 주요 기능

- 모임 생성 및 참여자 등록(실명, 이메일·계좌는 선택)
- 지출 항목 등록 — 부분 참여 지정, 다국통화 입력, 영수증 첨부
- **최소 이체 횟수** 정산 알고리즘으로 자동 계산
- 모임 링크(편집 가능)/결과 링크(열람 전용) 2종 공유 체계
- 90일 미활동 시 데이터 자동 삭제(개인정보 보관 최소화)

## 기술 스택

- [Next.js](https://nextjs.org) 16(App Router) + TypeScript
- [Prisma](https://www.prisma.io) + SQLite(`@prisma/adapter-better-sqlite3`)
- Tailwind CSS v4
- [Playwright](https://playwright.dev) — 실제 브라우저 구동 검증

## 시작하기

```bash
npm install

# .env에 DATABASE_URL 설정(SQLite 파일 경로) 후
npx prisma migrate deploy   # 또는 최초 1회: npx prisma migrate dev

npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

```bash
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```
