# AI와 함께 디자인 시스템 사용하기

작업 중인 앱에 설치된 `@hyeonse/design-system` 버전을 기준으로 답을 찾습니다. 먼저 화면의 목적과 기존 동작을 확인하고, 필요한 공개 API·역할 토큰·예제만 조회하세요. 카탈로그는 사용 가능한 항목을 찾는 자료이고, 실제 통합 계약은 해당 버전의 공개 내보내기와 TypeScript 선언입니다.

공개 안정 태그 `v0.3.0`을 설치하면 `Button`, `TextField`, `Checkbox`, `Badge`를 사용할 수 있습니다. [버전 고정 `v0.4.0` 아카이브](https://design-system.hyeonse.dev/releases/hyeonse-design-system-0.4.0.tgz)는 `layout`, `fields`, `overlays`, `display`를 추가합니다. npm 레지스트리나 GitHub `v0.4.0` 태그 릴리스는 아닙니다. `v0.2.0`에는 기본 컴포넌트가 없으며, `v0.1.0`에는 `hds`와 구조화 카탈로그도 없습니다. 현재 아카이브와 이전 GitHub 태그의 설치 절차는 [README](../README.md)에 있습니다.

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

화면 설정 API는 `@hyeonse/design-system/react`의 `PreferencesProvider`, `usePreferences`, `ThemeToggle`, `PreferencesPanel`입니다. `v0.3.0`의 기본 컴포넌트는 `@hyeonse/design-system/primitives`의 `Button`, `TextField`, `Checkbox`, `Badge`입니다. `v0.4.0` 아카이브에서는 `SizeProvider`·`Container`·`Stack`·`Inline`·`Grid`가 `/layout`, `Input`·`Select`가 `/fields`, `Dialog`가 `/overlays`, `Card`가 `/display`에 있습니다. `/display`에는 Tabs·Table 같은 조합의 하위 요소도 있으므로 내보내기 수를 독립 컴포넌트 수로 해석하지 마세요. 토큰으로 만든 앱 고유 카드 예제는 `examples/token-card.html`과 `examples/token-card.css`에 있습니다.

`v0.4.0` 아카이브를 설치한 소비 앱에서는 `npm exec --no -- hds list --json`, `npm exec --no -- hds show Select --json`, `npm exec --no -- hds show useToast --json`처럼 조회하세요. 이 저장소에서 소스를 확인할 때는 로컬 빌드 후 `npm run hds -- ...`를 사용합니다. 이전 GitHub 태그를 설치한 앱의 결과와 혼동하지 말고, 사용 전 `package.version` 및 공개 서브패스를 확인하세요. 필드의 값·검색어·선택 상태, 오버레이의 열림 상태와 이벤트, 표시 요소의 조합 구조는 [컴포넌트 안내](components.md)와 공개 타입 선언을 함께 읽으세요.

`v0.4.0` 크기 API를 사용할 때는 `hds show SizeProvider`, `hds show Grid`, `hds show Input` 등으로 `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`과 별도 `inputSize?: number`를 구분하세요. 생략한 크기는 상위 Provider·레이아웃에서 상속하고 기본은 `md`이며, 자식의 명시적 크기는 상속값을 덮어씁니다. 포털로 열린 UI도 같은 크기를 유지합니다. 터치 포인터 환경의 최소 조작 영역은 44px이고, 일반 포인터의 `xs`는 28px 높이입니다. [크기와 밀도](foundations.md#크기와-밀도)를 참고하세요.

설정 기본값을 바꾼다면 첫 페인트 스크립트의 `createPreferenceScript(storageKey?, defaults?)`와 `PreferencesProvider`의 `storageKey?`, `defaults?`를 함께 맞춥니다. 유효한 저장값이 기본값보다 우선합니다. `examples/preferences.ts`와 `examples/display-settings.tsx`는 이 조합을 보여줍니다. 세부 공개 계약은 [API 문서](api.md), 기본 컴포넌트 사용은 [컴포넌트 안내](components.md), 시각 역할은 [기초 규칙](foundations.md)을 참고하세요.

## 참고한 접근

이 구성은 [Astryx CLI](https://github.com/meta/astryx/tree/main/packages/cli)의 구조화된 조회 방식과 [컴포넌트별 문서 메타데이터 예](https://github.com/meta/astryx/blob/main/packages/core/src/Button/Button.doc.mjs)처럼 구현과 설명을 가깝게 두는 접근을 참고했습니다. Hyeonse Design System은 기존 CSS·React 계약과 역할 토큰을 유지합니다. Astryx의 컴포넌트 목록이나 프레임워크를 복제하지 않으며, DTCG 형식이나 MCP 서버를 제공한다고 뜻하지 않습니다.
