# 기초 규칙

## 시각 방향

흰 종이 같은 바탕에 선명한 검정과 코발트 한 점을 둡니다. 정보는 여백, 얇은 구분선, 명확한 활자 위계로 나눕니다. 장식보다 읽기와 조작의 정확도가 우선입니다. 포레스트와 코랄은 같은 역할의 대체 강조색입니다.

## 역할 토큰

| 역할 | 변수 | 기본값 |
| --- | --- | --- |
| 페이지·본문 | `--paper`, `--ink` | `#ffffff`, `#101114` |
| 보조 글자·구분선 | `--muted`, `--line` | `#5a606b`, `#d8dbe3` |
| 묶음·떠 있는 면 | `--surface`, `--surface-raised` | `#f3f5f8`, `#ffffff` |
| 강조 면·그 위 글자 | `--accent-solid`, `--on-accent` | `#204cfc`, `#ffffff` |
| 링크·선택·포커스 | `--accent-text` | `#204cfc` |
| 반전 패널 | `--inverse-surface`, `--inverse-ink` | `#101114`, `#ffffff` |

강조색은 코발트 `#204cfc`, 포레스트 `#087451`, 코랄 `#b93d20`입니다. 다크 화면은 `#111318`을 바탕으로 사용하고 읽기용 강조색을 별도로 밝힙니다. 강조 면에는 `--on-accent`, 일반 바탕 위 링크에는 `--accent-text`를 사용합니다. 원시 색 하나를 두 역할에 공용하지 않습니다.

`v0.3.0`부터 `--control-border`, `--focus-ring`, `--disabled-ink`, `--disabled-surface`와 성공·주의·위험 상태의 `--success-*`, `--warning-*`, `--danger-*` 토큰이 있습니다. 상태를 색만으로 전달하지 말고 텍스트·레이블과 함께 쓰세요. 토큰의 현재 값과 조건부 오버라이드는 설치한 버전의 `hds tokens <name>`으로 확인합니다. 이 추가 토큰은 `v0.2.0`에 포함되지 않습니다.

## 글자와 형태

영문은 DM Sans, 한국어는 Noto Sans KR을 기본 서체로 사용합니다. 쇼케이스는 로컬 글꼴을 쓰며, 한국어 파일은 빌드할 때 현재 화면 문구에 맞춰 서브셋을 갱신합니다. 원본 파일의 해시와 생성 자산의 문자 범위를 함께 확인합니다. 글꼴은 소비 패키지에 포함하지 않으므로 새 제품은 필요한 문자 범위에 맞는 자산을 준비해야 합니다.

기본 카드 모서리는 `0px`, 조작 요소는 `2px`입니다. 부드러운 설정에서 각각 `20px`, `12px`가 됩니다. `v0.4.0` 패키지는 `--space-1`부터 `--space-8`, `--text-xs/sm/base/lg`, `--leading-body`, `--duration-fast`를 공유합니다. 촘촘한 설정은 `--space-factor`를 `1`에서 `.8`로 바꿉니다.

## 크기와 밀도

`v0.4.0` 아카이브는 컴포넌트와 레이아웃에 공통 `xs/sm/md/lg/xl` 크기를 적용합니다. `size`를 생략하면 가장 가까운 `SizeProvider`나 레이아웃 값을 물려받고, 최상위 기본값은 `md`입니다. 크기는 조작 높이·글자·안쪽 여백·지시자·레이아웃 간격에 적용되며, `compact` 밀도는 `--space-factor`를 통해 간격과 여백을 추가로 줄입니다.

| 크기 | 조작 높이 | 글자 | 가로 안쪽 여백 | 레이아웃 간격 |
| --- | ---: | ---: | ---: | ---: |
| `xs` | 28px | 12px | 8px | 4px |
| `sm` | 32px | 13px | 10px | 8px |
| `md` | 36px | 14px | 12px | 12px |
| `lg` | 40px | 15px | 14px | 16px |
| `xl` | 48px | 16px | 16px | 24px |

일반 포인터에서 작은 조작 요소는 `xs` 기준 28px까지 내려갑니다. `any-pointer: coarse` 환경에서는 조작 요소의 최소 영역을 44px로 키웁니다. 크기 변수 `--hds-control-height`, `--hds-control-font`, `--hds-control-px`, `--hds-control-py`, `--hds-layout-gap`, `--hds-layout-padding`, `--hds-indicator-size`는 `data-hds-size` 범위에서 정해집니다. 화면 설정 UI는 이 새 크기 API와 별개로 기존 최소 44px 조작 영역을 유지합니다. 공개 안정 태그 `v0.3.0`의 크기 동작은 설치된 태그 기준으로 확인하세요.

## 방문자 설정

테마 `system/light/dark`, 강조색 `cobalt/forest/coral`, 간격 `comfortable/compact`, 모서리 `crisp/soft`, 움직임 `full/reduced`를 허용합니다. 저장값은 열거형으로 검증합니다. 기기의 움직임 감소 설정이 켜져 있으면 사용자가 `full`을 선택했더라도 화면의 유효 움직임을 줄입니다. 움직임은 정보나 기능의 유일한 전달 수단이 되지 않아야 합니다.

`data-theme`, `data-accent`, `data-density`, `data-corners`, `data-motion`이 문서 루트에 적용됩니다. `system`은 현재 기기 색상 설정에 따라 `data-theme`의 `light/dark`로 해석됩니다. JavaScript 없이도 CSS의 다크 미디어 쿼리가 기기 설정을 따릅니다.
