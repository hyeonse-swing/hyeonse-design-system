# 공개 API와 통합

패키지 이름은 `@hyeonse/design-system`입니다. 공개 안정 태그 `v0.3.0`은 `./tokens.css`, `./components.css`, `./preferences`, `./react`, `./primitives`, `./catalog.json`, `./catalog.schema.json`을 제공합니다. `v0.4.0` [버전 고정 아카이브](https://design-system.hyeonse.dev/releases/hyeonse-design-system-0.4.0.tgz)에서 `./layout`, `./fields`, `./overlays`, `./display`를 추가했습니다. `v0.4.1`은 필드와 스타일을, `v0.4.2`는 설치 안내를 보완했습니다. [`v0.4.3` 설치 아카이브](https://design-system.hyeonse.dev/releases/hyeonse-design-system-0.4.3.tgz)는 `./fields`에 `NativeSelect`, `./overlays`에 `NativeDialog`를 추가합니다. GitHub `v0.4.x` 태그나 npm 레지스트리 릴리스는 아닙니다. `./primitives`는 `v0.3.0`에서 추가되었으며 `v0.2.0`에는 없습니다. 사용 중인 패키지의 `package.json`과 타입 선언을 기준으로 확인하세요. 내부 `src/`나 `dist/` 경로를 직접 가져오지 않습니다.

## 설치

```sh
npm install https://design-system.hyeonse.dev/releases/hyeonse-design-system-0.4.3.tgz
```

[릴리스 매니페스트](https://design-system.hyeonse.dev/releases/manifest.json)의 `version`, `url`, `sha256`, `integrity`로 버전과 파일 무결성을 확인하세요. 기존 GitHub `v0.3.0` 태그에는 기본 컴포넌트 네 개가 있고 새 `layout`·`fields`·`overlays`·`display` 진입점은 없습니다. Base UI 1.9.0을 쓰는 컴포넌트에는 WebKit VoiceOver 초점 가드의 이름 누락([상위 이슈 #5237](https://github.com/mui/base-ui/issues/5237))이 남아 있습니다. 고정 선택과 일반 모달에는 `NativeSelect`, `NativeDialog`를 선택할 수 있습니다. [브라우저 검증 범위](code-freeze.md#브라우저-검사-범위)를 확인하세요.

## CSS

```css
@import '@hyeonse/design-system/tokens.css';
@import '@hyeonse/design-system/components.css';
```

`tokens.css`는 의미별 색상, 간격, 글자 크기, 조작 상태 토큰과 화면 설정 선택자를 제공합니다. `components.css`는 설정 UI와 컴포넌트 스타일을 포함합니다. 전역 리셋이나 앱의 모든 HTML 요소 스타일을 적용하지 않습니다. 두 파일을 각각 한 번 불러오세요. 토큰 역할은 [기초 규칙](foundations.md), 컴포넌트 사용은 [컴포넌트 안내](components.md)에 있습니다.

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

Provider는 현재 탭의 값을 갱신한 뒤 저장 가능한 환경에서 localStorage에 기록하고 설정 변경 이벤트를 보냅니다. 이벤트 기본 이름은 `hyeonse:preferences`이며 `eventName`으로 변경할 수 있습니다. 이벤트의 `detail`은 현재 `Preferences` 값의 사본입니다. 같은 문서에서 같은 `storageKey`를 사용하는 Provider는 값을 공유하므로 `defaults`도 동일하게 지정하세요. 이 Provider들에서 저장·초기화·다른 탭의 저장 변경이 일어나면, 현재 등록된 서로 다른 `eventName`마다 이벤트가 한 번씩 전달됩니다. 이벤트마다 독립된 `detail` 사본을 받습니다. 서로 다른 저장 키를 사용해도 화면의 `data-*` 속성은 문서 루트 하나에 적용되며, 마지막으로 적용한 Provider의 값이 보입니다. 다른 탭의 저장 변경과 기기 색상·움직임 변경도 반영합니다. 저장소에 접근할 수 없는 환경에서도 기본값으로 시작하고 현재 탭의 선택은 유지됩니다. 기기의 움직임 감소 설정은 앱에서 `motion='full'`을 골라도 우선합니다.

## 기본 컴포넌트

`@hyeonse/design-system/primitives`는 `Button`, `TextField`, `Checkbox`, `Badge`와 각각의 Props 타입을 제공합니다. React 19 네이티브 속성과 `ref`를 전달합니다. 이 진입점은 `v0.2.0`에 없습니다.

`v0.4.0` 아카이브의 새 진입점은 다음과 같습니다. 이 API를 쓰는 소비 앱은 React와 React DOM 19가 필요하며, CSS는 `tokens.css` 다음 `components.css` 순서로 불러옵니다. 패키지에는 MIT 라이선스의 `@base-ui/react@1.9.0`이 런타임 의존성으로 고정되어 있습니다. 컴포넌트별 상태와 예제는 [컴포넌트 안내](components.md)를 확인하세요.

| 공개 진입점 | 런타임 내보내기 |
| --- | --- |
| `@hyeonse/design-system/layout` | `SizeProvider`, `Container`, `Stack`, `Inline`, `Grid` |
| `@hyeonse/design-system/fields` | `Input`, `Textarea`, `Select`, `Combobox`, `MultiSelect`, `Switch`, `RadioGroup`, `Slider`, `NumberField`, `DateField`, `FileInput`, `PasswordField` |
| `@hyeonse/design-system/overlays` | `DropdownMenu`, `ContextMenu`, `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`, `ToastProvider`, `useToast` |
| `@hyeonse/design-system/display` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel`; `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionPanel`; `Collapsible`, `CollapsibleTrigger`, `CollapsiblePanel`; `Breadcrumb`, `Pagination`, `Stepper`, `SegmentedControl`, `Toggle`; `Card`; `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`; `Alert`, `Avatar`, `Separator`, `Skeleton`, `Spinner`, `Progress`, `EmptyState`, `AspectRatio`, `ScrollArea`, `Label`, `VisuallyHidden` |

`display` 목록에는 Tabs·Accordion·Table 등의 조합용 하위 요소가 포함됩니다. 각 내보내기가 독립된 완성형 컴포넌트라는 뜻은 아닙니다. 타입 내보내기는 각 진입점의 공개 선언에서 확인하세요.

`layout`은 `Size`(`'xs' | 'sm' | 'md' | 'lg' | 'xl'`)와 각 Props 타입도 내보냅니다. `SizeProvider`의 `size`는 필수이며 DOM 요소를 추가하지 않습니다. `Container`, `Stack`, `Inline`, `Grid`의 `size`는 선택 사항이고, 생략하면 상위 레이아웃이나 Provider의 값을 상속합니다. 어디에도 지정하지 않으면 `md`입니다. 자식 컴포넌트의 명시적 `size`가 상속값보다 우선하며, 포털로 표시되는 필드 목록과 오버레이도 크기 범위를 유지합니다. `Stack`·`Inline`·`Grid`의 `gap`은 같은 다섯 단계의 별도 간격 설정입니다. `Grid`는 `columns?: 1 | 2 | 3 | 4`, `minItemWidth?: string`, `Container`는 `fluid?: boolean`을 받습니다. `Inline`은 `align`, `justify`, `wrap`을 지원합니다. [크기 예제](components.md#크기와-레이아웃)를 참고하세요.

`v0.4.0`의 시각 크기 `size`는 네이티브 `<input size={number}>`의 문자 너비와 다릅니다. `TextField`, `Checkbox`, `Input`, `Slider`, `DateField`, `FileInput`, `PasswordField`에서 네이티브 숫자 속성이 필요하면 `inputSize?: number`를 사용하세요. CSS 크기 단계와 최소 조작 영역은 [기초 규칙](foundations.md#크기와-밀도)을 참고하세요.

## 버전별 조회

설치된 패키지에서 `npm exec --no -- hds list`, `hds show Button`, `hds tokens --focus-ring`, `hds search disabled`를 실행하세요. 저장소 안에서는 `npm run hds -- ...`를 사용합니다. `--json` 성공 응답은 `schemaVersion: 1`, `package`, `type`, `data`를 포함합니다. `entry.props`는 직접 선언한 props만 나열하며 상속된 네이티브 속성과 `ref`는 `show`의 `typeContext.declarations` 및 공개 `.d.ts`에서 확인합니다. [AI 활용 안내](ai.md)에 조회 절차가 있습니다.
