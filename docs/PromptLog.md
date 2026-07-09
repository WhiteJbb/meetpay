# 프롬프트 로그

사용자가 준 주요 프롬프트 원문을 시간순으로 기록한다. (CLAUDE.md
Working Rules 항목 7에 따라 관리, 2026-07-07부터 소급 기록 시작)

---

## 2026-07-07

### 1. 프로젝트 착수 지시

```
모임 더치페이 정산 웹을 만들 거야. 구현은 아직 하지 말고,
먼저 배경과 목표를 docs/ProjectContext.md에 기록해줘.

그 다음 기획자 서브에이전트를 만들어서 서비스를
구체화하기 위한 10문10답을 나에게 던져줘.

내 답변을 바탕으로 기획서를 만들고, 이후
IA / UserScenarios / Personas 문서로 나눠서 진행하자.
```

### 2. 10문10답 답변

```
1. B, 2. A, 3. 실명, 동명이인은 이메일로, 4. A, 5. C, 6. B, 7. 다국통화지원, 8. B, 9. 소규모 위주, 10. 기간 후 삭제
```

### 3. 구현 시작 지시

```
구현시작해줘
```

(이어서 기술 스택을 묻는 질문에 "Next.js + TypeScript + SQLite" 선택)

### 4. 작업 규칙(Working Rules) 등록 지시

```
# Working Rules

- 프로젝트 배경과 중요한 대화는 별도 MD에 기록한다.
- 구현 전에는 반드시 Plan.md를 작성한다.
- IA · UserScenarios · Personas는 독립 문서로 관리한다.
- 사용자의 결정이 필요한 부분은 진행하지 말고 질문한다.
- 주요 의사결정은 DecisionLog.md에 남긴다.
- 오류와 수정 내역은 Process.md 또는 WorkLog.md에 기록한다.
- 프롬프트 원문은 PromptLog.md에 저장한다.

이거 프로젝트 CLAUDE.md에 두고 지침 따라줘
```

### 5. Required Artifacts 등록 지시

```
# Required Artifacts

docs/ProjectContext.md
docs/IA.md
docs/Personas.md
docs/Process.md
docs/PromptLog.md
docs/ReviewChecklist.md
docs/Plan.md
docs/UserScenarios.md
docs/DecisionLog.md
docs/WorkLog.md
docs/Research.md

이것도 넣어줘 CLAUDE.md에
```

### 6. Approval Gates 등록 지시

```
# Approval Gates — 멈추고 사용자에게 물어볼 것

- IA changes
- DB schema changes
- External API added
- Payment / order flow changes
- Data deletion or migration
- Scope beyond Plan.md
- New page is added
- Auth flow changes
- Design direction changes
- New library / dependency
- Deployment to production
- Personal data fields added

이것도 추가해주고
```

### 7. 페르소나 재정의 지시

```
지금 있는 Personas.md에 핵심 고객 페르소나 3명을 정의하고 수정해줘. 이름 · 역할 · 상황 · 불편함 · 성공 기준 포함.
이후 IA · 디자인 · 개발 · 런칭 검토에서 계속 이 3명의 관점으로 피드백해줘.
```

### 8. 페르소나 서브에이전트 IA 검토 지시

```
방금 작성한 IA를 3명의 서브에이전트
관점에서 검토해줘.

각 페르소나별로:
1. 헷갈리는 화면
2. 부족한 기능
3. 불필요한 단계
4. 우선 개선점
```

### 9. 리뷰 결과 저장 위치 지시

```
리뷰 결과는
ReviewChecklist.md에 저장해
```

### 10. 페르소나 검토 결과 전체 반영 승인

```
세명이 불편했던 지점들 다 반영해서 IA 업데이트해
```

### 11. IA 개정분 구현 지시

```
구현해줘
```

(직전 답변에서 "구현 전 Plan.md 갱신 필요, 계좌 정보는 DB 스키마
변경 필요"를 고지한 상태에서 받은 지시 — 스키마 변경 포함 구현 승인으로
기록)

### 12. 총무 메인 시나리오 작성 지시

```
IA를 기준으로, 총무가 모임 생성부터 정산 마감까지 가는 메인 시나리오 1개를 화면 · 액션 · 시스템 반응 단위로 작성해줘
```

### 13. 전체 화면 비주얼 디자인 지시

```
화면 예쁘게 만들어줘
```
