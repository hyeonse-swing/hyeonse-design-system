# 컴포넌트

이 페이지는 기존 GitHub 태그 `v0.3.0`부터 제공한 `@hyeonse/design-system/primitives`와 `v0.4.0` 아카이브의 확장 컴포넌트를 설명합니다. `v0.2.0`에는 이 진입점이 없습니다. [README의 설치 절차](../README.md)를 참고하세요. 네 컴포넌트 모두 React 19 함수 컴포넌트이며 해당 네이티브 요소의 속성과 `ref`를 전달합니다. 스타일을 위해 `tokens.css`와 `components.css`를 불러옵니다.

| 컴포넌트 | 요소와 직접 선언한 props | 사용 |
| --- | --- | --- |
| `Button` | `button`; `variant?: 'primary' \| 'secondary' \| 'ghost'`, `size?: 'sm' \| 'md'`, `loading?`, `loadingLabel?` | 작업을 실행할 때. 기본 `type="button"`이므로 폼 제출에는 `type="submit"`을 명시 |
| `TextField` | `input`; 필수 `label`, `type?: 'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'`, `hint?`, `error?` | 한 줄 텍스트 입력. 기본 `type="text"` |
| `Checkbox` | `input type="checkbox"`; 필수 `label`, `hint?`, `error?` | 독립적인 참/거짓 선택 |
| `Badge` | `span`; `tone?: 'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger'` | 짧은 상태나 분류를 텍스트와 함께 표시 |

```tsx
import { Badge, Button, Checkbox, TextField } from '@hyeonse/design-system/primitives';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

export function SignupForm() {
  return <form>
    <TextField label="이메일" name="email" type="email" required hint="연락받을 주소" />
    <Checkbox label="소식 받기" name="updates" />
    <Button type="submit">제출</Button>
    <Badge tone="neutral">준비 중</Badge>
  </form>;
}
```

`Button`의 `loading`은 네이티브 `disabled`와 `aria-busy`를 켜서 다시 누르지 못하게 합니다. 비어 있지 않은 `loadingLabel`을 주면 로딩 중 표시 문구와 접근 가능한 이름이 그 값으로 바뀝니다. 이때 전달한 `aria-labelledby`는 로딩 중에만 적용하지 않고, 로딩이 끝나면 다시 적용합니다. 로딩 중에도 작업 완료·실패는 앱이 설명해야 합니다.

`TextField`와 `Checkbox`는 `label`을 실제 입력 요소에 연결합니다. `hint`와 `error`는 입력 요소에 전달한 `id`와 독립적으로 생성된 ID로 `aria-describedby`에 연결되며, 기존에 전달한 `aria-describedby`도 유지합니다. `error`가 있으면 `aria-invalid=true`를 적용합니다. 오류를 해결하는 방법을 텍스트로 쓰고, 제출 검증과 오류 상태 갱신은 앱에서 처리하세요. `className`은 외부 래퍼가 아니라 입력 요소에 적용됩니다.

`Checkbox`는 네이티브 `checked`, `defaultChecked`, `name`, `value`, `disabled`, `readOnly` 속성을 받습니다. `readOnly`일 때는 클릭과 키보드로 발생한 상태 변경을 막고 `aria-readonly=true`를 설정하면서 초점과 폼 값은 유지합니다. 선택값을 바꿀 수 없음을 설명해야 한다면 `hint`를 함께 쓰세요.

`Badge`는 기본적으로 알림이나 live region이 아닌 `span`입니다. 색만으로 상태를 구분하지 말고 문구를 넣으세요. 긴급한 변경을 읽어줘야 한다면 앱에서 문맥에 맞는 알림 영역을 별도로 구성합니다. `Badge` 자체는 상호작용 요소가 아닙니다.

공개 안정 태그 `v0.3.0`의 기본 입력과 버튼은 `compact` 설정에서도 최소 44px 조작 영역을 유지합니다. 아래의 `v0.4.0` 크기 체계에서는 일반 포인터의 더 작은 단계가 적용되고, 터치 포인터가 있는 기기에서 최소 44px을 확보합니다. 화면 설정 UI의 조작 요소는 기존 44px 기준을 유지합니다. 포커스 윤곽선은 키보드 조작 시 표시되고 OS 고대비 설정과 움직임 감소 설정을 고려합니다. [실제 상태 있는 폼 예제](../examples/form-controls.tsx)를 참고하세요.

## v0.4.0 패키지 아카이브의 확장

다음 컴포넌트는 기존 GitHub `v0.3.0` 태그에 없고 [버전 고정 `v0.4.0` 아카이브](https://design-system.hyeonse.dev/releases/hyeonse-design-system-0.4.0.tgz)에 있습니다. React와 React DOM 19가 필요한 아카이브의 `@hyeonse/design-system/layout`, `/fields`, `/overlays`, `/display`에서 각각 가져옵니다. `tokens.css`와 `components.css`를 순서대로 불러오세요. [공개 진입점 전체 목록](api.md#기본-컴포넌트)은 API 문서를 참고하세요.

### 크기와 레이아웃

`v0.4.0` 컴포넌트와 레이아웃은 `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`을 사용합니다. 기본값은 `md`입니다. `SizeProvider`는 필수 `size`를 자식에게 전달하며 DOM 요소를 추가하지 않습니다. `Container`, `Stack`, `Inline`, `Grid`에 준 `size`도 하위 요소로 전달됩니다. 자식의 명시적 `size`가 상속값보다 우선합니다. 포털로 열린 목록과 오버레이도 선택한 크기를 유지합니다.

```tsx
import { Container, Grid, SizeProvider, Stack } from '@hyeonse/design-system/layout';
import { Button } from '@hyeonse/design-system/primitives';
import { Input } from '@hyeonse/design-system/fields';

export function CompactForm() {
  return <SizeProvider size="sm">
    <Container><Stack gap="sm">
      <Grid columns={2} minItemWidth="12rem">
        <Input aria-label="이름" />
        <Input aria-label="별명" size="xs" inputSize={20} />
      </Grid>
      <Button type="button">저장</Button>
    </Stack></Container>
  </SizeProvider>;
}
```

`Container`는 크기별 최대 너비와 좌우 안쪽 여백을 적용하고 `fluid`로 최대 너비 제한을 풀 수 있습니다. `Grid`의 `columns`는 1~4, `minItemWidth`는 CSS 길이 문자열입니다. `Stack`, `Inline`, `Grid`의 `gap`은 상속 크기와 별도로 지정할 수 있습니다. `Inline`은 정렬·배치·줄바꿈을 설정합니다. `v0.4.0` 네이티브 입력 계열에서 문자 너비를 정하는 숫자 속성은 `inputSize`로 전달합니다. [크기 토큰과 조작 영역](foundations.md#크기와-밀도)을 참고하세요.

### 필드 (`fields`)

| 컴포넌트 | 입력 계약과 용도 |
| --- | --- |
| `Input` | 레이블 없는 네이티브 한 줄 입력. 사용처에서 `<label htmlFor>` 또는 접근 가능한 이름을 제공. `text/email/search/tel/url`만 지원 |
| `Textarea` | 레이블·설명·오류가 있는 네이티브 여러 줄 입력 |
| `Select` | 고정 항목 중 하나를 선택. `value/defaultValue`는 `string \| null`, `onValueChange`도 같은 값을 전달 |
| `NativeSelect` | 브라우저 네이티브 단일 선택. `Select`와 같은 `value/defaultValue/onValueChange` 모델이며 검색·`readOnly`는 제공하지 않음 |
| `Combobox` | 고정 항목을 검색해 하나 선택. 선택값과 검색 문자열(`inputValue/onInputValueChange`)은 별개 |
| `MultiSelect` | 고정 항목을 여러 개 선택하고 칩으로 제거. `value/defaultValue`는 문자열 배열, `onValueChange`는 `string[]` 전달 |
| `Switch` | 참/거짓 설정. `checked/defaultChecked`와 `onCheckedChange(boolean)` 사용 |
| `RadioGroup` | 배타적 선택. `value/defaultValue`와 `onValueChange(string)` 사용 |
| `Slider` | 네이티브 단일 값 범위 입력. `min/max/step`과 `aria-valuetext` 지원 |
| `NumberField` | 수량 입력과 증감 버튼. `onValueChange`는 `number \| null` 전달 |
| `DateField` | 네이티브 `input type="date"`. 브라우저·OS 날짜 UI를 사용하며 달력 조합이나 날짜 범위 선택은 제공하지 않음 |
| `FileInput` | 네이티브 파일 선택. `accept/multiple` 지원, `value/defaultValue` 제어 불가 |
| `PasswordField` | 네이티브 비밀번호 입력과 표시 전환 버튼. 표시 상태는 컴포넌트 내부에서 관리 |

`v0.4.3`부터 고정 항목 선택에 `NativeSelect`를 사용할 수 있습니다. 브라우저의 `<select>`를 그대로 사용해 Base UI 초점 가드를 만들지 않습니다. 빈 문자열은 선택 전 문구에 예약되어 있으므로 항목 `value`는 서로 다른 비어 있지 않은 문자열이어야 합니다. 필수 선택에는 빈 문구가 유효한 값이 아니며, 선택 UI의 모양과 키보드 동작은 브라우저와 운영체제를 따릅니다. 네이티브 `<select>`에는 읽기 전용 상태가 없어 `readOnly`를 받지 않습니다. `v0.4.4`에서는 제어형 `value`와 옵션의 기본 선택을 동기화하므로 `form.reset()` 직후의 동기 `FormData`도 현재 제어값을 반환합니다.

```tsx
import { NativeSelect } from '@hyeonse/design-system/fields';

<NativeSelect label="팀" name="team" required options={[
  { value: 'design', label: '디자인' },
  { value: 'operations', label: '운영' },
]} />
```

레이블이 있는 필드는 `label`이 필수이며 `hint`, `error`와 전달한 `aria-describedby`를 입력에 연결합니다. `error`를 주면 `aria-invalid`가 적용됩니다. `Select`, `Combobox`, `MultiSelect`, `RadioGroup`의 옵션은 서로 다른 문자열 `value`를 사용하세요. 검색 텍스트는 자유 입력 제출값이 아닙니다. `Switch`의 꺼짐 상태는 `uncheckedValue`를 지정하지 않으면 제출값이 없습니다. 검증 규칙, 오류 문구, 제어 상태는 앱이 관리합니다. 네이티브 폼 reset은 비제어 값을 최초 기본값으로 되돌리며, `form="id"`로 연결한 외부 폼도 지원합니다. reset이 취소되면 값은 바뀌지 않습니다. 제어형 `value`·`checked`·`inputValue`는 호출자가 초기화해야 하며, reset 자체로 값 변경 콜백을 호출하지 않습니다. [폼 예제](../examples/expanded-forms.tsx)를 참고하세요.

### 오버레이 (`overlays`)

`DropdownMenu`와 `ContextMenu`는 `items`에 `action`, `checkbox`, `separator`, `submenu` 종류를 받습니다. 각 항목에 안정적인 `id`를 주고 체크 상태와 실행 결과는 앱에서 관리합니다. `ContextMenu`의 중요한 작업은 보이는 대체 조작도 제공하세요. `danger`는 시각 표현일 뿐 확인 절차가 아닙니다.

`Dialog`, `AlertDialog`, `Sheet`, `Popover`는 제목과 트리거를 받습니다. `Tooltip`은 포커스 가능한 트리거와 짧은 텍스트 `content`를 받으며, 시각적 보조 레이블 용도이므로 트리거 자체의 접근 가능한 이름을 제공하고 필수 정보나 터치 전용 안내를 넣지 마세요. [Base UI 사용 지침](https://base-ui.com/react/components/tooltip#usage-guidelines)을 따릅니다. 트리거로 전달하는 컴포넌트는 DOM props와 ref를 전달해야 합니다. 메뉴와 대화상자 계열은 `open/defaultOpen/onOpenChange`를 지원합니다. 제어형 `open`을 사용하면 콜백에서 앱 상태를 갱신하세요.

`v0.4.3`의 `NativeDialog`는 일반 모달에 쓸 수 있는 `<dialog>` 기반 대안입니다. `Dialog`와 같은 `trigger/title/description/children/footer/open/defaultOpen/onOpenChange/size`를 받습니다. 브라우저의 모달 최상위 레이어를 사용하고 Tab·Shift+Tab은 컴포넌트가 내부 조작 요소 사이에서 순환시킵니다. `v0.4.4`에서는 macOS WebKit이 내부 버튼을 건너뛰는 경우에도 다음 버튼으로 즉시 초점을 옮깁니다. Escape, 닫기 버튼, 바깥 클릭으로 닫고 트리거로 초점을 돌립니다. 트리거는 `onClick`과 ARIA 속성을 실제 DOM 버튼까지 전달해야 합니다. 검색 목록·메뉴 등 Base UI 팝업을 안에 넣으면 그 팝업의 초점 가드는 여전히 생깁니다. 복잡한 중첩 팝업이 없는 모달에서 `NativeSelect`와 함께 사용하세요.

```tsx
import { NativeDialog } from '@hyeonse/design-system/overlays';
import { NativeSelect } from '@hyeonse/design-system/fields';

<NativeDialog trigger={<button type="button">설정 열기</button>} title="설정">
  <NativeSelect label="공개 범위" options={[{ value: 'private', label: '비공개' }, { value: 'public', label: '공개' }]} />
</NativeDialog>
```

Chromium·Firefox·WebKit 자동 검사에서 두 네이티브 대안의 접근성 트리 이름, 폼 선택·초기화, 모달 초점 순환·닫힘·복귀를 확인했습니다. 실제 VoiceOver 발화와 가상 커서 이동은 이 검사만으로 증명되지 않습니다. 기존 Base UI `Select`·`Dialog` 및 다른 팝업의 WebKit 이름 없는 가드도 그대로 남습니다. [접근성 검증 범위](code-freeze.md#브라우저-검사-범위)를 확인하세요.

`AlertDialog`는 확인 버튼에서만 `onConfirm`을 호출합니다. 비동기 확인 중에는 중복 실행을 막고, 거절된 Promise는 대화상자를 열린 채로 두며 `onError`로 전달합니다. `pending`과 `confirmDisabled`는 앱이 제어합니다. `Sheet`에는 `side='left'|'right'`와 공통 다섯 단계 `size`가 있습니다. `ToastProvider` 안에서 `useToast().add({ title, description?, tone?, timeout? })`를 호출하면 ID가 반환되고 `close(id)`로 닫을 수 있습니다. 기본 표시 제한은 3개, 기본 제한 시간은 5000ms입니다. `viewportLabel`(기본 `알림`)과 `closeLabel`(기본 `알림 닫기`)로 접근 가능한 이름을 지정합니다. F6으로 알림 영역에 이동할 수 있습니다. 토스트만으로 지속적으로 필요한 중요 정보를 전달하지 마세요. [오버레이 예제](../examples/overlay-patterns.tsx)를 참고하세요.

### 탐색·표시 (`display`)

`Tabs`, `Accordion`, `Collapsible`은 Root와 하위 요소를 조합합니다. `SegmentedControl`과 `Toggle`은 선택·눌림 상태를 나타내며, 제어형 값과 이벤트는 공개 타입 선언을 확인하세요. `Breadcrumb`는 경로, `Pagination`은 `page/pageCount/onPageChange`, `Stepper`는 `steps/currentStep`를 받습니다. `Pagination`의 페이지는 1부터 시작하고, `Stepper`의 현재 단계도 1부터 시작합니다.

`Card`는 내용 표면, `Table`과 그 하위 요소는 의미 있는 HTML 표를 만듭니다. `Table`은 이름 붙은 키보드 스크롤 영역으로 감싸지만 정렬·필터·가상 스크롤·행 선택을 제공하는 데이터 그리드는 아닙니다. `Alert`, `Avatar`, `Separator`, `Skeleton`, `Spinner`, `Progress`, `EmptyState`, `AspectRatio`, `ScrollArea`, `Label`, `VisuallyHidden`은 상태 또는 표현을 위한 조각입니다. `Alert`의 기본 role은 danger에서 `alert`, 나머지는 `status`입니다. `Progress`에는 접근 가능한 `label`이 필수이고 값이 없으면 미정 상태로 표시합니다. [표시 예제](../examples/display-patterns.tsx)를 참고하세요.
