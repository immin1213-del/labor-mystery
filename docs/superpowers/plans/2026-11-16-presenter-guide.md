# 진행자용 설명 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝터에 띄워 넘기며 게임 진행 방법을 설명하는 15장짜리 페이지 `guide/index.html`을 만들고 허브에서 연결한다.

**Architecture:** 빌드 없는 단일 정적 HTML(기존 사이트와 동일). 각 장은 `<section class="slide">`이고, 작은 인라인 스크립트가 현재 장 하나만 보이게 하며 키보드로 넘긴다. 게임 화면 모형은 게임의 색 토큰·버튼 모양을 흉내 낸 HTML/CSS로 직접 그린다(이미지 없음).

**Tech Stack:** HTML/CSS/바닐라 JS, `../pretendard.woff2`, 검증은 Node 스크립트 + Playwright 스크린샷.

**Spec:** `docs/superpowers/specs/2026-11-16-presenter-guide-design.md`

## Global Constraints

- 16:9 가로, 1920×1080과 1280×720 프로젝터에서 스크롤 없이 한 장이 화면에 다 들어올 것.
- 색 토큰은 허브 `index.html`의 `:root` 값 그대로(`--ink:#f1e7cd` `--ink-2:#e4d3a3` `--ink-3:#b3945a` `--paper:#f8f1dc` `--seal:#a1402a` `--gold:#8a6a2b` `--text:#2b2314` `--text-dim:#79693f`), 폰트 `../pretendard.woff2`.
- 예시 인물·증거는 가상(실제 4개 사건 인물명 사용 금지). 예: "홍길동(사측)", "김영희(근로자측)".
- 규칙 수치는 게임과 동일: 사건 파악 10분·자기소개 4분·증거 라운드 5분×3·토론 15분·투표 2분, 토큰 라운드당 2개, 증거 36장, 공개 카드 무료 열람, 조 코드 17자 이내.
- 사용자가 볼 문구는 한국어. 깊이는 "전체적인 설명" — 장마다 설명 3~4줄.

## Review Focus

- 브라우저 창 크기가 4:3이거나 작을 때 슬라이드 내용이 잘리거나 겹치지 않아야 한다 → Task 1 레이아웃을 `min(100vw, 177.78vh)` 기준 스케일로.
- 클리커는 PageDown/PageUp(일부는 →/←, 스페이스)을 보낸다 → 전부 처리되는지 Task 1 검증.
- 마지막 장에서 다음 키, 첫 장에서 이전 키를 눌러도 멈춰 있어야 한다(되감기/에러 없음).
- 새로고침해도 보던 장이 유지되면 편하다 → URL 해시 `#5`로 장 번호 보존.
- 옛 규칙 문구("최소 1·2·3장")가 어디에도 남지 않아야 한다 → Task 3 검증 스크립트.

---

### Task 1: 슬라이드 뼈대 + 넘기기

**Files:**
- Create: `guide/index.html`
- Create: `tools/check-guide.js` (검증 스크립트)

**Interfaces:**
- Produces: `<section class="slide" data-title="...">` 15개 자리, `go(n:number):void`(0부터, 범위 밖이면 고정, `location.hash = "#"+(n+1)` 갱신), 하단 `#counter`("n / 15"), 전체화면 버튼 `#fsBtn`.

- [ ] **Step 1: 검증 스크립트 작성** — `node tools/check-guide.js`가 `guide/index.html`을 읽어 다음을 단언하고 실패 시 exit 1: `<section class="slide"` 개수 === 15, 각 slide에 `data-title` 존재, 문자열 `최소 1·2·3장` 없음, 실제 사건 인물명(`김도윤`,`박기준`,`백태우`,`이서현`,`오동석`,`박현석`,`남경아`,`서민준`,`유정한`,`조은서`,`문석영`,`배기현`,`한도윤`,`오세진`,`윤채린`,`차민재`,`하지원`,`구예린`,`이기철`,`김동현`,`정미선`,`박동수`,`최명희`,`강인호`) 없음.
- [ ] **Step 2: 실행해 실패 확인** — `node tools/check-guide.js` → FAIL(파일 없음).
- [ ] **Step 3: 뼈대 구현** — 15개 빈 slide(제목만), 키 처리: `ArrowRight`/`PageDown`/` `(스페이스)/`Enter` → 다음, `ArrowLeft`/`PageUp`/`Backspace` → 이전, `Home`/`End`, 화면 클릭 오른쪽 절반=다음·왼쪽 절반=이전; 로드 시 해시에서 장 번호 복원. 레이아웃: 고정 1920×1080 캔버스를 `transform: scale()`로 창에 맞춤(letterbox). 하단에 "← → 로 넘기기" 힌트·카운터·`← 사건 목록으로`(`../`) 링크.
- [ ] **Step 4: 검증 통과 확인** — 인물명·옛 문구 검사는 통과, slide 수 15 통과.
- [ ] **Step 5: Commit** — `git add guide/index.html tools/check-guide.js && git commit -m "Add presenter guide slide shell"`

### Task 2: 15장 내용 + 화면 모형

**Files:**
- Modify: `guide/index.html`

**Interfaces:**
- Consumes: Task 1의 slide 자리·CSS 토큰.
- Produces: 재사용 CSS 클래스 `.mock`(폰 화면 모형 틀), `.mock-btn`, `.pin`(번호 원형 표시 ①②③, 모형 위에 절대위치), `.notes`(오른쪽 설명 목록).

- [ ] **Step 1: 장별 내용 채우기** — 배치: 왼쪽 `.mock`(게임 모형) + 오른쪽 `.notes`(제목 + 3~4줄, `.pin` 번호와 대응). 장 구성(설계 문서 순서 그대로):
  1 표지 "ER 미스터리 — 진행 방법"(전체 약 60분) · 2 게임 한눈에(6명=사측3·근로자측3, 재심 심문회의 역할극, 증거→토론→투표) · 3 전체 흐름표(가로 타임라인, 단계별 시간) · 4 입장 화면(이름+조 코드, 같은 코드끼리 연결, 17자 이내) · 5 배역 선택(선착순, NPC로 진행, 6/6 되면 "🎬 사건 시작하기") · 6 상단바(단계·시간·🎫토큰·❓지금 할 일·🗺관계도·📁내 증거함·🙋다음 단계 준비·세션 나가기, 스크롤하면 접힘) · 7 내 신원(입장·배경·관계·목표, 🔒비밀은 흐림→누르면 보임, "아직 말하지 말 것") · 8 사건 개요(쉬운 법리 가이드·초심 판정 요지·타임라인) · 9 증거대① 가져가기(36장, 라운드당 토큰 2개, 한 장은 한 명만, 출처 옆 진영 표시) · 10 증거대② 공개하기(전원 알림, 누구나 무료 열람, 내 증거함에 모임, 공개 여부가 결말에 영향) · 11 다음 단계로 넘어가는 법(전원 "다음 단계 준비" 또는 시간 종료) · 12 교차검증 토론(쟁점표: 법적 요건→사측 주장/근로자측 주장) · 13 최종 투표(두 쟁점 각각, 결말 4가지, 전원 투표해야 결과) · 14 결과 화면(판정·개인 점수·인물 결말·쟁점 해설·사건의 전말) · 15 시작 전 체크(폰 새로고침, 조 코드 공유, "❓지금 할 일" 언제든 다시 보기).
- [ ] **Step 2: 검증** — `node tools/check-guide.js` PASS.
- [ ] **Step 3: 화면 확인** — 로컬 서버(`python -m http.server 8765`) + Playwright로 1920×1080, 1280×720, 1024×768 각각 장 1·6·9·14 스크린샷; 잘림·겹침 없음, `#5` 해시로 열면 5번째 장, 마지막 장에서 → 눌러도 15/15 유지.
- [ ] **Step 4: Commit** — `git commit -am "Fill presenter guide slides with game screen mockups"`

### Task 3: 허브 연결 + 옛 규칙 문구 수정

**Files:**
- Modify: `index.html:142-158`(`.howto` 블록)
- Modify: `tools/check-guide.js`(허브도 검사)

- [ ] **Step 1: 검증 확장** — `index.html`에 `최소 1·2·3장` 없음, `href="guide/"` 링크 존재를 단언 → 실행해 FAIL 확인.
- [ ] **Step 2: 허브 수정** — `.howto` 3번 항목을 현재 규칙으로 교체: "증거 36장 중 라운드마다 토큰 2개로 '가져가기'(한 장은 한 명만), '공개하기'한 카드는 누구나 무료 열람. 전원이 '다음 단계 준비'를 누르거나 시간이 끝나면 다음 라운드로." `.howto` 아래(또는 summary 바로 아래)에 `<a class="..." href="guide/">📽 진행자용 설명 화면 (프로젝터용)</a>` 버튼 추가(허브 기존 버튼 스타일 재사용).
- [ ] **Step 3: 검증 PASS + 허브 스크린샷 확인**
- [ ] **Step 4: Commit** — `git commit -am "Link presenter guide from hub and update outdated rule text"`
