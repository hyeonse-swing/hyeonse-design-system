# 소비 앱 CSS 점검

`hds-audit <consumer-root> [config-relative-path]`는 소비 앱 안의 CSS를 재귀적으로 검사합니다. 설정 경로를 생략하면 `<consumer-root>/design-system.audit.json`을 읽습니다. 패키지를 빌드한 뒤 실행합니다.

```sh
hds-audit ./my-app
hds-audit ./my-app config/design-system.audit.json
```

설정 예시:

```json
{
  "paths": ["src"],
  "exceptions": {
    "src/components/IdentityBadge.module.css": {
      "reason": "physical material colors",
      "colors": { "#30372f": 2 }
    }
  },
  "overrideTokens": {
    "src/styles/global.css": ["--gutter"]
  }
}
```

설정은 JSON 객체여야 합니다. `paths`를 생략하면 `["src"]`를 검사합니다. 명시할 때는 비어 있지 않은 경로 문자열 배열이어야 하며, 각 경로는 소비 앱 루트 안에 존재하는 디렉터리여야 합니다. 지정한 경로에서 CSS 파일을 하나도 찾지 못하면 검사가 실패합니다. 중첩되거나 중복된 경로에 있는 CSS 파일은 한 번만 셉니다.

`exceptions`는 특정 파일의 원시 색상과 허용 횟수를 이유와 함께 적습니다. 각 예외에는 비어 있지 않은 `reason`과 `colors` 객체가 필요하며, 허용 횟수는 0 이상의 유한한 정수여야 합니다. `overrideTokens`는 특정 파일에서 재정의해도 되는 토큰 이름의 문자열 배열을 명시합니다. 예외는 실제 목적에 필요한 값만 좁게 유지하세요.

설정 파일과 탐색 시작 경로는 실제 경로를 확인하며 소비 앱 루트 밖으로 나갈 수 없습니다. 탐색 중 발견한 심볼릭 링크는 CSS 파일과 디렉터리 및 다른 파일을 포함해 오류로 처리합니다. 숨김 항목과 `node_modules`는 기존처럼 탐색하지 않습니다. 설정에서 직접 지정한 디렉터리 심볼릭 링크는 실제 대상이 소비 앱 루트 안의 디렉터리인 경우에만 사용할 수 있습니다. CSS 파일 경로는 실제 위치를 기준으로 예외 설정과 대조합니다.

검사는 주석을 제외한 CSS의 원시 hex/rgb/hsl/lab/lch 색상 사용과 공유 토큰의 허용되지 않은 재정의를 보고합니다. 새 CSS 파일도 지정 경로 아래에 있으면 검사 대상입니다. TypeScript, JavaScript, 캔버스, WebGL/3D 머티리얼, 런타임 계산 색상은 검사하지 않으므로 결과를 앱 전체의 토큰 준수 증명으로 해석하지 않습니다.
