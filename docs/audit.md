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

`paths`는 검사할 CSS 탐색 시작 위치입니다. `exceptions`는 특정 파일의 원시 색상과 허용 횟수를 이유와 함께 적습니다. `overrideTokens`는 특정 파일에서 재정의해도 되는 토큰 이름을 명시합니다. 예외는 실제 목적에 필요한 값만 좁게 유지하세요.

검사는 주석을 제외한 CSS의 원시 hex/rgb/hsl/lab/lch 색상 사용과 공유 토큰의 허용되지 않은 재정의를 보고합니다. 새 CSS 파일도 지정 경로 아래에 있으면 검사 대상입니다. TypeScript, JavaScript, 캔버스, WebGL/3D 머티리얼, 런타임 계산 색상은 검사하지 않으므로 결과를 앱 전체의 토큰 준수 증명으로 해석하지 않습니다.
