# AI와 함께 디자인 시스템 사용하기

작업 중인 앱에 설치된 `@hyeonse/design-system` 버전을 기준으로 답을 찾습니다. 먼저 화면의 목적과 기존 동작을 확인하고, 필요한 공개 API·역할 토큰·예제만 조회하세요. 카탈로그는 사용 가능한 항목을 찾는 자료이고, 실제 통합 계약은 해당 버전의 공개 내보내기와 TypeScript 선언입니다.

`v0.3.0`을 설치하면 `Button`, `TextField`, `Checkbox`, `Badge`를 사용할 수 있습니다. `v0.2.0`에는 이 컴포넌트가 없으며, `v0.1.0`에는 `hds`와 구조화 카탈로그도 없습니다. GitHub 태그 설치 절차는 [README](../README.md)에 있습니다.

## 읽기 전용 조회

패키지를 설치한 소비 프로젝트에서 다음처럼 실행합니다. 이 저장소에서 작업할 때는 각 명령의 `npm exec --no -- hds`를 `npm run hds --`로 바꿉니다. 전역 설치나 출처가 다른 npm 패키지 검색 없이 로컬 패키지의 CLI를 실행합니다.

| 명령 | 조회 대상 |
| --- | --- |
| `hds list` | 공개 런타임 내보내기 목록 |
| `hds show <export-name>` | 지정한 공개 내보내기의 타입과 사용 정보. UI 외 설정 유틸도 포함 |
| `hds tokens [name]` | 역할 토큰 목록 또는 한 토큰. 이름은 `--accent-text`, `accent-text` 모두 허용 |
| `hds example <id>` | 카탈로그에 등록된 사용 예제 |
| `hds search <words>` | API·토큰·예제의 이름뿐 아니라 상태·조건·값 검색 |
| `hds docs` | 설치 방법과 적용 범위 |
| `hds manifest` | CLI 명령·응답 형식과 카탈로그 위치·해시 |
| `hds --help` | 명령 도움말 |

```sh
npm exec --no -- hds list --json
npm exec --no -- hds show createPreferenceScript --json
npm exec --no -- hds tokens --accent-text --json
npm exec --no -- hds search theme --json
npm exec --no -- hds search disabled --json
```

모든 조회 명령은 `--json`을 지원합니다. 성공 응답은 `schemaVersion: 1`, `package: { name, version }`, `type`, `data`를 담습니다. 실패 응답은 `error: { code, message, suggestions? }`를 담고 종료 코드가 0이 아닙니다. 자동화는 성공 여부와 `schemaVersion`을 확인한 뒤 `data`를 읽으세요. 카탈로그 `entry.props`는 컴포넌트가 직접 선언한 props만 담습니다. 상속한 네이티브 DOM 속성과 `ref`는 `hds show`의 전체 타입 선언 또는 패키지 `.d.ts`에서 확인하세요.

CLI를 사용할 수 없는 환경에서는 패키지의 공개 `./catalog.json`과 `./catalog.schema.json`을 읽거나, 패키지 루트의 `llms.txt` 색인과 `llms-full.txt` 전체 참조를 확인할 수 있습니다. 예제 원본은 `examples/`에 있으며 카탈로그와 참조 문서는 빌드된 출력에서 생성됩니다. TypeScript 선언과 실제 앱의 프레임워크 구성을 확인한 뒤 적용하세요.

## 적용 경계

화면 설정 API는 `@hyeonse/design-system/react`의 `PreferencesProvider`, `usePreferences`, `ThemeToggle`, `PreferencesPanel`입니다. `v0.3.0`의 기본 컴포넌트는 `@hyeonse/design-system/primitives`의 `Button`, `TextField`, `Checkbox`, `Badge`입니다. 일반 `Input`, `Card`, `Dialog`, `Select` React 내보내기는 없습니다. 토큰으로 만든 앱 고유 카드는 소비 앱 소유입니다. `examples/token-card.html`과 `examples/token-card.css`가 그 예입니다.

설정 기본값을 바꾼다면 첫 페인트 스크립트의 `createPreferenceScript(storageKey?, defaults?)`와 `PreferencesProvider`의 `storageKey?`, `defaults?`를 함께 맞춥니다. 유효한 저장값이 기본값보다 우선합니다. `examples/preferences.ts`와 `examples/display-settings.tsx`는 이 조합을 보여줍니다. 세부 공개 계약은 [API 문서](api.md), 기본 컴포넌트 사용은 [컴포넌트 안내](components.md), 시각 역할은 [기초 규칙](foundations.md)을 참고하세요.

## 참고한 접근

이 구성은 [Astryx CLI](https://github.com/meta/astryx/tree/main/packages/cli)의 구조화된 조회 방식과 [컴포넌트별 문서 메타데이터 예](https://github.com/meta/astryx/blob/main/packages/core/src/Button/Button.doc.mjs)처럼 구현과 설명을 가깝게 두는 접근을 참고했습니다. Hyeonse Design System은 기존 CSS·React 계약과 역할 토큰을 유지합니다. Astryx의 컴포넌트 목록이나 프레임워크를 복제하지 않으며, DTCG 형식이나 MCP 서버를 제공한다고 뜻하지 않습니다.
