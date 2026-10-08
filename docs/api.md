# 공개 API와 통합

패키지 이름은 `@hyeonse/design-system`입니다. 공개 진입점은 `./tokens.css`, `./components.css`, `./preferences`, `./react`입니다. 내부 `src/`나 `dist/` 경로를 소비 앱에서 직접 가져오지 않습니다.

## CSS

`tokens.css`는 역할 색과 화면 설정 선택자를 제공합니다. `components.css`는 현재 `ThemeToggle`과 `PreferencesPanel`의 `.hds-*` 스타일을 제공합니다. 일반 버튼·입력 컴포넌트 전체를 스타일링하는 전역 CSS는 아닙니다. 애플리케이션은 이 두 파일을 각각 한 번 불러와야 합니다.

## 설정 유틸

`@hyeonse/design-system/preferences`는 `Preferences` 타입과 다음 값을 공개합니다.

| 이름 | 목적 |
| --- | --- |
| `preferencesKey`, `defaultPreferences` | 기본 저장 키와 설정 |
| `validatePreferences`, `parsePreferences`, `serializePreferences` | 저장값의 안전한 읽기·쓰기 |
| `resolvedTheme`, `effectiveMotion` | 기기 설정을 적용한 값 계산 |
| `createPreferenceScript(storageKey?)`, `preferenceScript` | 첫 페인트 전에 루트 `data-*` 속성 적용 |

스크립트는 `<head>`에서 CSS보다 먼저 실행합니다. 사용자 저장 문자열을 HTML에 직접 연결하지 말고 제공 함수를 사용합니다. 별도 저장 키를 쓰면 스크립트와 React Provider에 동일한 키를 전달합니다.

## React

`@hyeonse/design-system/react`는 `PreferencesProvider`, `usePreferences`, `ThemeToggle`, `PreferencesPanel`을 제공합니다. Provider는 자식 컴포넌트에 `preferences`, `setPreference(key, value)`, `resetPreferences()`를 제공합니다. 두 UI 컴포넌트의 `locale`은 `ko` 또는 `en`이며 기본값은 `ko`입니다.

```tsx
<PreferencesProvider storageKey="hyeonse-site-preferences" eventName="hyeonse:preferences">
  <ThemeToggle locale="ko" />
  <PreferencesPanel locale="ko" />
</PreferencesProvider>
```

Provider는 현재 탭에서 값을 갱신하고 저장 가능한 환경에서는 localStorage에 보존합니다. 다른 탭의 저장 변경과 기기 색상·움직임 설정 변경도 반영합니다. `eventName`으로 설정 변경 이벤트 이름을 지정할 수 있습니다. 설정을 읽는 컴포넌트는 Provider 안에 두세요.
