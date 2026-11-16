# 공개 API와 통합

패키지 이름은 `@hyeonse/design-system`입니다. `v0.3.0`은 `./tokens.css`, `./components.css`, `./preferences`, `./react`, `./primitives`, `./catalog.json`, `./catalog.schema.json`을 제공합니다. `./primitives`는 `v0.3.0`에서 추가되었으며 `v0.2.0`에는 없습니다. 사용 중인 패키지의 `package.json`과 타입 선언을 기준으로 확인하세요. 내부 `src/`나 `dist/` 경로를 직접 가져오지 않습니다.

## CSS

```css
@import '@hyeonse/design-system/tokens.css';
@import '@hyeonse/design-system/components.css';
```

`tokens.css`는 의미별 색상, 간격, 글자 크기, 조작 상태 토큰과 화면 설정 선택자를 제공합니다. `components.css`는 설정 UI와 네 가지 기본 컴포넌트 클래스를 포함합니다. 전역 리셋이나 앱의 모든 HTML 요소 스타일을 적용하지 않습니다. 두 파일을 각각 한 번 불러오세요. 토큰 역할은 [기초 규칙](foundations.md), 컴포넌트 사용은 [컴포넌트 안내](components.md)에 있습니다.

## 화면 설정 유틸

`@hyeonse/design-system/preferences`의 `Preferences`는 `theme`(`system/light/dark`), `accent`(`cobalt/forest/coral`), `density`(`comfortable/compact`), `corners`(`crisp/soft`), `motion`(`full/reduced`)을 가집니다. `defaultPreferences`는 차례로 `system`, `cobalt`, `comfortable`, `crisp`, `full`입니다.

| 이름 | 목적 |
| --- | --- |
| `preferencesKey`, `defaultPreferences` | 기본 저장 키와 설정 |
| `validatePreferences(value, defaults?)`, `parsePreferences(raw, defaults?)`, `serializePreferences` | 저장값 검증·읽기·쓰기. 유효한 저장값이 사이트 기본값보다 우선 |
| `resolvedTheme`, `effectiveMotion` | 기기 설정을 적용한 값 계산 |
| `createPreferenceScript(storageKey?, defaults?)`, `preferenceScript` | 첫 페인트 전에 루트 `data-*` 속성 적용 |

기본 저장 키는 `hyeonse-site-preferences`입니다. 초기 스크립트를 문서 `<head>`에서 CSS보다 먼저 실행하세요. 저장 문자열을 HTML에 직접 연결하지 말고 제공 함수를 사용합니다. 별도 저장 키나 기본값을 쓰면 스크립트와 Provider에 동일하게 전달하세요. 기본 내보내기는 기존의 `crisp` 모서리를 유지합니다.

## 화면 설정 React API

`@hyeonse/design-system/react`는 `PreferencesProvider`, `usePreferences`, `ThemeToggle`, `PreferencesPanel`을 제공합니다. Provider의 자식은 훅에서 `preferences`, `setPreference(key, value)`, `resetPreferences()`를 받습니다. 두 UI 컴포넌트의 `locale`은 `ko` 또는 `en`이며 기본값은 `ko`입니다.

```tsx
import { PreferencesProvider, ThemeToggle, PreferencesPanel } from '@hyeonse/design-system/react';
import { createPreferenceScript } from '@hyeonse/design-system/preferences';

const defaults = { corners: 'soft' } as const;
const firstPaintScript = createPreferenceScript(undefined, defaults);
// 문서 <head>에서 CSS보다 먼저 firstPaintScript 실행

export function Settings() {
  return <PreferencesProvider defaults={defaults}>
    <ThemeToggle locale="ko" />
    <PreferencesPanel locale="ko" />
  </PreferencesProvider>;
}
```

Provider는 현재 탭의 값을 갱신한 뒤 저장 가능한 환경에서 localStorage에 기록하고 설정 변경 이벤트를 보냅니다. 이벤트 기본 이름은 `hyeonse:preferences`이며 `eventName`으로 변경할 수 있습니다. 기존 이벤트의 `detail` 계약은 유지됩니다. 다른 탭의 저장 변경과 기기 색상·움직임 변경도 반영합니다. 저장소에 접근할 수 없는 환경에서도 기본값으로 동작합니다. 초기화 역시 사이트 기본값을 사용합니다. 기기의 움직임 감소 설정은 앱에서 `motion='full'`을 골라도 우선합니다.

## 기본 컴포넌트

`@hyeonse/design-system/primitives`는 `Button`, `TextField`, `Checkbox`, `Badge`와 각각의 Props 타입을 제공합니다. React 19 네이티브 속성과 `ref`를 전달합니다. `Input`, `Card`, `Dialog`, `Select`는 내보내지 않습니다. props, 상태, 폼 예제는 [컴포넌트 안내](components.md)를 확인하세요. 이 진입점은 `v0.2.0`에 없습니다.

## 버전별 조회

설치된 패키지에서 `npm exec --no -- hds list`, `hds show Button`, `hds tokens --focus-ring`, `hds search disabled`를 실행하세요. 저장소 안에서는 `npm run hds -- ...`를 사용합니다. `--json` 성공 응답은 `schemaVersion: 1`, `package`, `type`, `data`를 포함합니다. `entry.props`는 직접 선언한 props만 나열하며 상속된 네이티브 속성과 `ref`는 `show`의 `typeContext.declarations` 및 공개 `.d.ts`에서 확인합니다. [AI 활용 안내](ai.md)에 조회 절차가 있습니다.
