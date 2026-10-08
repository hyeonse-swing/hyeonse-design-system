# Hyeonse Design System

개인 프로젝트에서 같은 시각 언어와 화면 설정을 재사용하기 위한 작은 디자인 시스템입니다. 흰 바탕, 짙은 글자, 코발트 강조색을 기본으로 하며 포레스트·코랄 강조색과 다크 화면을 지원합니다. 출발점은 [포트폴리오의 실제 구현](https://github.com/hyeonse-swing/hyeonse-portfolio/blob/main/DESIGN_SYSTEM.md)입니다.

## 사용

Node.js 22 이상과 npm을 사용합니다. npm 레지스트리에 게시하지 않고 GitHub 버전에서 설치합니다.

```sh
npm install github:hyeonse-swing/hyeonse-design-system#v0.1.0
```

배포하는 앱에서는 검증한 전체 커밋 SHA로 고정하는 것을 권장합니다. 빌드된 `dist/`가 저장소에 포함되어 설치 시 별도 빌드는 필요하지 않습니다. 저장소를 개발하거나 견본을 확인할 때는 다음을 실행합니다.

```sh
cd hyeonse-design-system
npm ci
npm run build
npm run check
npm test
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/`을 열면 [쇼케이스](index.html)를 볼 수 있습니다. 빌드된 `dist/`를 참조하므로 먼저 `npm run build`를 실행해야 합니다.

개인용 스킬은 소비 프로젝트에서 다음 명령으로 추가할 수 있습니다.

```sh
npx skills add hyeonse-swing/hyeonse-design-system --skill hyeonse-design-system
```

CSS만 필요한 화면에는 두 파일을 순서대로 불러옵니다.

```css
@import '@hyeonse/design-system/tokens.css';
@import '@hyeonse/design-system/components.css';
```

React 화면에서는 `@hyeonse/design-system/react`의 `PreferencesProvider`, `ThemeToggle`, `PreferencesPanel`, `usePreferences`를 사용합니다. 초기 테마 깜빡임을 줄이려면 `@hyeonse/design-system/preferences`의 `preferenceScript`를 문서 `<head>`에 CSS보다 먼저 삽입하세요. 다른 저장 키가 필요하면 `createPreferenceScript(storageKey)`를 사용하고 Provider에도 같은 `storageKey`를 전달합니다. 기본 저장 키는 `hyeonse-site-preferences`입니다.

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

## 구성

- [기초 규칙](docs/foundations.md): 색의 역할, 글자, 밀도, 모서리, 움직임.
- [API와 통합](docs/api.md): CSS 선택자와 TypeScript·React 공개 API.
- [개인용 스킬](skills/hyeonse-design-system/SKILL.md): 새 화면 제작, 확장, 토큰 매핑, 이관, 리뷰와 문서화의 작업 기준.

`src/`가 배포 코드의 기준이며 쇼케이스는 그 출력을 검토하는 정적 문서입니다. 쇼케이스의 예시 마크업은 CSS 상태 견본입니다. 라이브러리에서 일반 Button·Input React 컴포넌트를 제공한다는 의미는 아닙니다.

[실제 통합 검증 기록](docs/verification.md)에는 포트폴리오 이관 전후 비교와 확인 범위를 남겼습니다.

## 소비 앱의 CSS 점검

패키지 빌드 후 소비 앱 루트에서 `hds-audit <consumer-root> [config-relative-path]`를 실행할 수 있습니다. 기본 설정 파일은 소비 앱 루트의 `design-system.audit.json`입니다. [설정 형식과 한계](docs/audit.md)를 확인하세요. 이 검사는 CSS의 원시 색상 사용과 공유 토큰 재정의를 점검하며, TypeScript·JavaScript·3D 머티리얼까지 검사했다는 뜻은 아닙니다.
