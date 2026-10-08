# Hyeonse Design System 작업 지침

이 저장소는 개인 프로젝트용 디자인 시스템입니다. 기존 화면의 목적과 실제 사용 맥락을 먼저 확인하고, 역할 토큰과 검증 가능한 상태를 기준으로 작업합니다.

- 공개 계약은 `package.json`의 exports, `src/`, `docs/api.md`를 함께 확인합니다. 문서만 보고 존재하지 않는 컴포넌트를 가정하지 않습니다.
- 기존 포트폴리오의 디자인 원칙은 `docs/foundations.md`에 요약되어 있습니다. 원본 구현이 필요할 때만 `https://github.com/hyeonse-swing/hyeonse-portfolio/blob/main/DESIGN_SYSTEM.md`를 참고합니다.
- 새 화면이나 이관은 사용자 범위와 기존 동작을 보존합니다. 토큰 매핑은 색 값의 근접성보다 의미와 대비를 먼저 봅니다.
- 상태 변경은 키보드, 좁은 화면, 밝음·어두움, 기기 움직임 감소 설정에서 확인합니다. 확인하지 않은 상태를 통과했다고 기록하지 않습니다.
- 외부 사이트 게시, 커밋·푸시·PR 생성은 별도 요청 없이 진행하지 않습니다.
- `skills/hyeonse-design-system/SKILL.md`는 이 저장소와 함께 제공하는 개인용 작업 지침입니다. 설치하거나 전역 설정을 바꾸지 않습니다.
