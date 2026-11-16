# Hyeonse Design System

개인 프로젝트에서 같은 시각 언어와 화면 설정을 재사용하기 위한 작은 디자인 시스템입니다. 흰 바탕, 짙은 글자, 코발트 강조색을 기본으로 하며 포레스트·코랄 강조색과 다크 화면을 지원합니다. 출발점은 [포트폴리오의 실제 구현](https://github.com/hyeonse-swing/hyeonse-portfolio/blob/main/DESIGN_SYSTEM.md)입니다.

## 사용

`v0.3.0` 릴리스는 CSS·화면 설정 React API·`hds` CLI·카탈로그에 더해 `Button`, `TextField`, `Checkbox`, `Badge`를 제공합니다. GitHub 태그에서 설치합니다. npm 레지스트리에는 배포하지 않습니다.

```sh
npm install github:hyeonse-swing/hyeonse-design-system#v0.3.0
```

배포하는 앱에서는 검증한 전체 커밋 SHA로 고정하는 것을 권장합니다. GitHub 설치는 저장소에 포함된 빌드된 `dist/`를 사용합니다.

이 작업 트리의 개발 의존성에는 Node.js 22.22.2 이상 또는 24.15 이상이 필요합니다. 현재 개발 기준은 Node.js 24.22.1입니다. 소비 앱의 지원 범위는 패키지의 실제 실행 코드와 해당 앱 환경을 확인하세요.

로컬 [쇼케이스](index.html)는 패키지 컴포넌트를 쓰는 정적 React 문서 작업대입니다. 다음 명령으로 `.site/`를 만든 뒤 `http://127.0.0.1:4347/`에서 확인할 수 있습니다. 이 절차는 공개 배포를 뜻하지 않습니다.

```sh
npm ci
npm run build:site
python3 -m http.server 4347 --bind 127.0.0.1 --directory .site
```

개인용 스킬은 소비 프로젝트에서 다음 명령으로 추가할 수 있습니다.

```sh
npx skills add hyeonse-swing/hyeonse-design-system --skill hyeonse-design-system
```

## AI와 함께 찾기

`hds`와 구조화 카탈로그는 `v0.2.0`부터 사용할 수 있습니다. 기존 `v0.1.0` 태그에는 없습니다. 새 컴포넌트와 토큰은 `v0.3.0`을 설치한 프로젝트에서 조회할 수 있습니다.

설치한 **해당 패키지 버전**의 API, 토큰, 예제를 읽으려면 `hds` CLI를 사용합니다. 패키지를 설치한 소비 프로젝트에서는 `npm exec --no -- hds ...`, 이 저장소에서는 `npm run hds -- ...`로 실행합니다. 조회 명령은 설치나 소스 수정을 하지 않습니다. 전체 사용 흐름은 [AI 활용 안내](docs/ai.md)에 있습니다.

```sh
npm exec --no -- hds list
npm exec --no -- hds show PreferencesProvider
npm exec --no -- hds tokens --accent-text
npm exec --no -- hds search preferences
npm exec --no -- hds search disabled
npm exec --no -- hds docs
```

모든 명령에 `--json`을 붙일 수 있습니다. 카탈로그와 스키마는 `@hyeonse/design-system/catalog.json`, `@hyeonse/design-system/catalog.schema.json`에서 가져옵니다. 패키지 루트의 `llms.txt`는 색인, `llms-full.txt`는 생성된 전체 참조입니다. 검색은 이름뿐 아니라 상태·조건·값도 찾습니다. 카탈로그의 `entry.props`는 컴포넌트가 직접 선언한 속성만 담습니다. 상속한 네이티브 DOM 속성과 `ref`는 전체 TypeScript 선언에서 확인하세요.

CSS만 필요한 화면에는 두 파일을 순서대로 불러옵니다.

```css
@import '@hyeonse/design-system/tokens.css';
@import '@hyeonse/design-system/components.css';
```

React 화면에서는 `@hyeonse/design-system/react`의 `PreferencesProvider`, `ThemeToggle`, `PreferencesPanel`, `usePreferences`를 사용합니다. 초기 테마 깜빡임을 줄이려면 `@hyeonse/design-system/preferences`의 `preferenceScript`를 문서 `<head>`에 CSS보다 먼저 삽입하세요. 다른 저장 키가 필요하면 `createPreferenceScript(storageKey)`를 사용하고 Provider에도 같은 `storageKey`를 전달합니다. 기본 저장 키는 `hyeonse-site-preferences`입니다.

`v0.3.0`의 폼 기본 컴포넌트는 `@hyeonse/design-system/primitives`에서 가져옵니다. [컴포넌트 안내](docs/components.md)와 [폼 예제](examples/form-controls.tsx)를 참고하세요. 일반 `Input`, `Card`, `Dialog`, `Select` React 내보내기는 없습니다.

```tsx
import { PreferencesProvider, ThemeToggle, PreferencesPanel } from '@hyeonse/design-system/react';
import { preferenceScript } from '@hyeonse/design-system/preferences';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

// 서버 문서의 <head> 안에서 CSS보다 먼저: <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
export function DisplaySettings() {
  return <PreferencesProvider><ThemeToggle locale="ko" /><PreferencesPanel locale="ko" /></PreferencesProvider>;
}
```

설정 키나 이벤트 이름을 바꾸는 경우에는 [API 문서](docs/api.md)의 적용 범위를 확인하세요. 글꼴 파일은 [출처와 라이선스](THIRD_PARTY_NOTICES.md)를 확인한 뒤 제품 자산으로 따로 제공해야 합니다.

사이트별 기본 모서리를 부드럽게 하려면 첫 페인트 스크립트와 Provider에 같은 기본값을 전달합니다. 저장된 유효한 선택은 그대로 우선하며, 기본 내보내기인 `preferenceScript`와 `defaultPreferences`는 각진 모서리를 유지합니다.

```tsx
import { createPreferenceScript } from '@hyeonse/design-system/preferences';

const siteDefaults = { corners: 'soft' } as const;
const siteScript = createPreferenceScript(undefined, siteDefaults);
// <head>의 <script dangerouslySetInnerHTML={{ __html: siteScript }} />
// <PreferencesProvider defaults={siteDefaults}>...</PreferencesProvider>
```

## 구성

- [기초 규칙](docs/foundations.md): 색의 역할, 글자, 밀도, 모서리, 움직임.
- [API와 통합](docs/api.md): CSS 선택자와 TypeScript·React 공개 API.
- [컴포넌트](docs/components.md): 폼 기본 컴포넌트와 접근성 사용법.
- [AI 활용 안내](docs/ai.md): 설치 버전에서 API·토큰·예제를 조회하는 방법.
- [개인용 스킬](skills/hyeonse-design-system/SKILL.md): 새 화면 제작, 확장, 토큰 매핑, 이관, 리뷰와 문서화의 작업 기준.

`src/`가 로컬 작업 코드의 기준이며 쇼케이스는 패키지 출력을 검토하는 정적 문서입니다. 새 기능을 쓰기 전 설치한 패키지 버전을 확인하세요.

[실제 통합 검증 기록](docs/verification.md)에는 포트폴리오 이관 전후 비교와 확인 범위를 남겼습니다.

## 소비 앱의 CSS 점검

패키지 빌드 후 소비 앱 루트에서 `hds-audit <consumer-root> [config-relative-path]`를 실행할 수 있습니다. 기본 설정 파일은 소비 앱 루트의 `design-system.audit.json`입니다. [설정 형식과 한계](docs/audit.md)를 확인하세요. 이 검사는 CSS의 원시 색상 사용과 공유 토큰 재정의를 점검하며, TypeScript·JavaScript·3D 머티리얼까지 검사했다는 뜻은 아닙니다.
