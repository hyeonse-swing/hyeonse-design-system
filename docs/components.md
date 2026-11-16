# 기본 컴포넌트

이 페이지는 `v0.3.0`의 `@hyeonse/design-system/primitives`를 설명합니다. `v0.2.0`에는 이 진입점이 없습니다. [README의 GitHub 태그 설치 절차](../README.md)를 참고하세요. 네 컴포넌트 모두 React 19 함수 컴포넌트이며 해당 네이티브 요소의 속성과 `ref`를 전달합니다. 스타일을 위해 `tokens.css`와 `components.css`를 불러옵니다.

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

`Button`의 `loading`은 네이티브 `disabled`와 `aria-busy`를 켜서 다시 누르지 못하게 합니다. `loadingLabel`을 주면 로딩 중 표시 문구와 접근 가능한 이름이 그 값으로 바뀝니다. 로딩 중에도 작업 완료·실패는 앱이 설명해야 합니다.

`TextField`와 `Checkbox`는 `label`을 실제 입력 요소에 연결합니다. `hint`와 `error`는 생성된 ID로 `aria-describedby`에 연결되며, 기존에 전달한 `aria-describedby`도 유지합니다. `error`가 있으면 `aria-invalid=true`를 적용합니다. 오류를 해결하는 방법을 텍스트로 쓰고, 제출 검증과 오류 상태 갱신은 앱에서 처리하세요. `className`은 외부 래퍼가 아니라 입력 요소에 적용됩니다.

`Checkbox`는 네이티브 `checked`, `defaultChecked`, `name`, `value`, `disabled`, `readOnly` 속성을 받습니다. `readOnly`일 때는 클릭과 키보드로 발생한 상태 변경을 막고 `aria-readonly=true`를 설정하면서 초점과 폼 값은 유지합니다. 선택값을 바꿀 수 없음을 설명해야 한다면 `hint`를 함께 쓰세요.

`Badge`는 기본적으로 알림이나 live region이 아닌 `span`입니다. 색만으로 상태를 구분하지 말고 문구를 넣으세요. 긴급한 변경을 읽어줘야 한다면 앱에서 문맥에 맞는 알림 영역을 별도로 구성합니다. `Badge` 자체는 상호작용 요소가 아닙니다.

간격을 줄이는 `compact` 설정에서도 입력과 버튼의 최소 조작 영역은 44px을 유지합니다. 포커스 윤곽선은 키보드 조작 시 표시되고 OS 고대비 설정과 움직임 감소 설정을 고려합니다. [실제 상태 있는 폼 예제](../examples/form-controls.tsx)를 참고하세요. 일반 `Input`, `Card`, `Dialog`, `Select` React 내보내기는 없습니다.
