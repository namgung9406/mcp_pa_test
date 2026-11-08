# WorkHub 통합 업무 허브

프로젝트·업무 요청, IT 서비스·장애 요청, 구매·지출 승인을 하나의 PCF 코드 구성 요소로 구현한 Canvas 앱용 시연 프로그램입니다. 동일한 React 화면을 오프라인 HTML과 PCF에서 실행합니다.

## 제공 형태

- `WorkHubSolution`의 관리형·비관리형 솔루션 ZIP: Power Apps의 **솔루션 → 솔루션 가져오기**로 설치합니다.
- 빈 Canvas 앱에 `WorkHub` 코드 구성 요소 하나를 삽입하고 `Width = Parent.Width`, `Height = Parent.Height`, `X = 0`, `Y = 0`으로 설정합니다.
- 이 VS Code 묶음의 `../Original`에는 DEV에서 편집기·WorkHub 화면 정상 표시를 사용자가 확인한 v4 `.msapp`이 있습니다. `../Canvas-v4`는 해당 파일을 그대로 펼친 구조 확인용 폴더입니다.
- PCF를 삽입한 앱을 동일한 솔루션에 추가해 내보내면, 이후 회사 환경 간에는 Canvas 앱과 PCF를 함께 이동할 수 있습니다.

## 로컬 개발

Node.js 22, npm, .NET 8, Power Platform CLI를 사용했습니다.

```powershell
npm ci
npm run typecheck
npm run build:release
npm run preview:build
npm run test:ui
node scripts/check-domain.mjs
node scripts/check-pcf.mjs
dotnet build ../WorkHubSolution/WorkHubSolution.cdsproj --configuration Release
```

UI 검증 스크립트는 Microsoft Edge가 설치된 Windows에서 실행합니다. `dist/WorkHub-미리보기.html`은 서버 없이 파일을 열면 동작합니다. `?readonly=1`을 붙이면 읽기 전용 시연 모드입니다.

## 구조와 구현 결정

- `_scheme/work.ts`: 전체 업무 스키마를 먼저 정의하고 Pick과 Zod 추론으로 입력 타입을 파생합니다.
- `_const/seed.ts`: 세 업무 영역 각 8건, 총 24건의 가상 데이터와 예시 로그를 생성합니다.
- `_service/demoService.ts`: 메모리 저장소, 변경 검증, 로그 기록을 담당합니다.
- `_hooks/useWorkspace.ts`: TanStack Query로 조회·변경·캐시 갱신을 관리합니다.
- `_util/metrics.ts`: 날짜 계산과 대시보드 집계입니다.
- `App.tsx`: 통합 대시보드, 목록, 상세, 신규 등록, 댓글, 활동 로그, 가이드입니다.
- `styles/input.css`: Tailwind `@apply`를 사용한 레이아웃과 `wh-` 접두사 스타일입니다. 전역 preflight를 꺼서 Canvas 호스트 스타일에 영향을 주지 않습니다.
- `index.ts`: PCF 생명주기, 크기 추적, 입력 반영, 선택 ID 출력을 구현합니다.

PCF StandardControl 안에 React 18과 의존성을 함께 번들합니다. 외부 CDN, 웹폰트, 커넥터, 자체 인증, localStorage, sessionStorage, 직접 fetch 호출을 사용하지 않습니다. Canvas PCF에서 지원하지 않는 Dataverse WebAPI를 호출하지 않습니다. Next.js 서버 구성은 이 PCF 프로젝트에 해당하지 않습니다.

## PCF 속성

| 속성 | 방향 | 기본값 | 설명 |
|---|---|---|---|
| userName | 입력, 텍스트 | 김민서 | 가상 사용자 표시명 |
| readOnly | 입력, Boolean | false | 등록·수정·댓글 UI 미렌더링 |
| selectedId | 출력, 텍스트 | 빈 문자열 | 상세 화면에서 선택한 WH 번호 |

`readOnly`와 Canvas의 비활성 상태를 함께 반영합니다. 이 값은 데모 UI 제어이며 실제 보안 권한이 아닙니다.

## 데이터와 운영 전환

데이터는 컴포넌트 인스턴스의 메모리에만 존재합니다. 다시 실행하거나 구성 요소가 재생성되면 초기화됩니다. 상태와 댓글은 목록·집계·로그에 동시에 반영됩니다. 감사 로그 역시 시연용이며 영구 저장이나 변조 방지 기능을 제공하지 않습니다. 구매의 승인 완료는 실제 결제·전자결재를 실행하지 않습니다.

운영 전환 시 Canvas 커넥터 또는 검증된 서버 인터페이스를 통해 저장소를 연결해야 합니다. 서버에서 사용자와 리소스 권한, ID, 상태 전이, 구매 금액을 검증하고 감사 기록을 생성해야 합니다. 클라이언트 표시명·상태·요약 금액을 신뢰하지 않아야 합니다. 실 서비스의 승인자 분리, 승인 취소/반려, 첨부파일, SLA, 알림, 동시 수정 방지, 영구 저장은 현재 구현 범위에 없습니다.

## 검증 범위

TypeScript strict 검사, Microsoft PCF ESLint·production 번들 빌드, .NET 솔루션 패키징, 로컬 Edge에서 UI 시나리오와 실제 PCF bundle의 모의 호스트 생명주기를 검사합니다. 사용자가 회사 DEV의 솔루션 가져오기 및 v4 Canvas 편집기·화면 정상 표시를 확인했습니다. Studio에서 모든 업무 시나리오와 게시 실행을 직접 검증한 것은 아닙니다. 솔루션 빌드 성공이 테넌트 가져오기 성공을 보장하지 않습니다.

실행 의존성 `npm audit --omit=dev` 결과 취약점 0건입니다. 개발 도구의 전이 의존성에는 moderate 경고 13건이 남았습니다. Microsoft PCF 빌드 도구와 ESLint 관련 경로이며 실행 번들 의존성에는 포함되지 않습니다. `npm audit fix`로 해소되지 않아 강제 버전 재정의를 적용하지 않았습니다.

React를 단일 번들로 포함하므로 webpack의 244 KiB 권고치를 넘는 성능 경고가 있습니다. PCF 제약에 맞춰 런타임 분할 로딩을 사용하지 않았으며 정상 production 빌드를 확인합니다.
