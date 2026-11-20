# Hyeonse Design System 작업 지침

이 저장소는 개인 프로젝트용 디자인 시스템입니다. 기존 화면의 목적과 실제 사용 맥락을 먼저 확인하고, 역할 토큰과 검증 가능한 상태를 기준으로 작업합니다.

- 공개 계약은 `package.json`의 exports, `src/`, `docs/api.md`를 함께 확인합니다. 문서만 보고 존재하지 않는 컴포넌트를 가정하지 않습니다.
- 필요한 API·토큰은 빌드 후 `npm run hds -- list`, `show <이름>`, `tokens <이름>`, `example <ID>`로 조회합니다. `--json`은 구조화 응답입니다. 소비 앱에서는 설치된 패키지의 `npm exec --no -- hds`를 사용합니다.
- `dist/catalog.json`, `llms.txt`, `llms-full.txt`는 생성 파일입니다. 사용 설명·역할은 `metadata/catalog.mjs`, 타입은 공개 선언, 토큰 값은 `src/tokens.css`, 예제는 `examples/`에서 갱신한 뒤 `npm run verify`로 함께 확인합니다.
- 기존 포트폴리오의 디자인 원칙은 `docs/foundations.md`에 요약되어 있습니다. 원본 구현이 필요할 때만 `https://github.com/hyeonse-swing/hyeonse-portfolio/blob/main/DESIGN_SYSTEM.md`를 참고합니다.
- 새 화면이나 이관은 사용자 범위와 기존 동작을 보존합니다. 토큰 매핑은 색 값의 근접성보다 의미와 대비를 먼저 봅니다.
- 상태 변경은 키보드, 좁은 화면, 밝음·어두움, 기기 움직임 감소 설정에서 확인합니다. 확인하지 않은 상태를 통과했다고 기록하지 않습니다.
- 외부 사이트 게시, 커밋·푸시·PR 생성은 별도 요청 없이 진행하지 않습니다.
- `skills/hyeonse-design-system/SKILL.md`는 이 저장소와 함께 제공하는 개인용 작업 지침입니다. 설치하거나 전역 설정을 바꾸지 않습니다.

## HDS를 배포할 때

1. 새 버전을 공개한 뒤 `node scripts/check-side-projects.mjs`를 실행합니다. 공개 매니페스트·아카이브와 개인 소비 프로젝트 기본 브랜치의 패키지·잠금 파일을 대조합니다. `gh search code '@hyeonse/design-system' --owner hyeonse-swing --filename package.json`으로 새 소비처도 확인하고, 운영 중인 프로젝트는 점검 목록에 추가합니다.
2. 이전 버전을 쓰는 소비 앱마다 공개 아카이브 URL과 잠금 파일을 함께 올립니다. CSS·테마 스크립트 등을 복사해 제공하는 앱은 해당 자산도 갱신합니다. 이미 같은 버전이면 기존 배포의 소스와 공개 동작을 확인합니다.
3. 각 앱의 기존 배포 경로로 변경을 전달합니다. 웹은 운영 도메인에서 실제 HDS 화면을 확인하고, npm으로 배포하는 앱은 새 버전을 깨끗한 환경에 설치해 검사합니다. 기본 브랜치와 운영 소스가 다르면 양쪽에 동일한 HDS 변경을 적용하고 기존 운영 소스를 기준으로 배포합니다.
4. 마지막에 점검 명령을 다시 실행하고 HDS 버전, 소비 앱 커밋·배포 버전, 운영 웹 또는 공개 설치본에서 확인한 결과를 릴리스 기록에 남깁니다. 이 확인까지가 HDS 릴리스 범위입니다.
