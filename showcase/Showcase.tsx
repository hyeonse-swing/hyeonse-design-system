import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { PreferencesPanel, PreferencesProvider, ThemeToggle, usePreferences } from '../dist/react.js';
import { Badge, Button, Checkbox, TextField } from '../dist/primitives.js';
import { NativeSelect } from '../dist/fields.js';
import type { ButtonProps } from '../dist/primitives.js';
import catalog from '../dist/catalog.json';
import { SizingDemo } from './SizingDemo.js';
import { ComponentLibrary } from './ComponentLibrary.js';
import { SectionNavigation } from './SectionNavigation.js';

type Token = (typeof catalog.tokens)[number];
type TokenGroup = 'all' | 'color' | 'space' | 'type' | 'other' | 'shadow';

const sections = [
  ['overview', '시스템 소개', '01'], ['tokens', '토큰 탐색', '02'],
  ['components', '컴포넌트', '03'], ['preferences', '화면 설정', '04'],
  ['start', '시작하기', '05'], ['api', 'API 참조', '06'],
] as const;
const componentCount = catalog.entries.filter(entry => entry.kind === 'component').length;
const version = catalog.package.version;
const formCode = `import { Button, TextField, Checkbox, Badge }
  from '@hyeonse/design-system/primitives';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

<form onSubmit={handleSubmit}>
  <TextField label="프로젝트 이름" name="project"
    hint="언제든 바꿀 수 있어요." error={error} required />
  <Checkbox label="팀과 공유하기" name="shared" />
  <Button type="submit" loading={saving}
    loadingLabel="저장 중…">프로젝트 만들기</Button>
</form>`;
const settingsCode = `import { createPreferenceScript }
  from '@hyeonse/design-system/preferences';
import { PreferencesProvider, PreferencesPanel }
  from '@hyeonse/design-system/react';

const defaults = { corners: 'soft' } as const;
// CSS보다 먼저 <head>에서 실행
const initialScript = createPreferenceScript(undefined, defaults);

<PreferencesProvider defaults={defaults}>
  <PreferencesPanel locale="ko" />
</PreferencesProvider>`;

function groupFor(token: Token): Exclude<TokenGroup, 'all'> {
  if (/^--(space-|gutter|control-min-size)/.test(token.name)) return 'space';
  if (/^--(font-|text-|leading-)/.test(token.name)) return 'type';
  if (token.name.startsWith('--shadow-')) return 'shadow';
  if (/^--(radius-|duration-)/.test(token.name)) return 'other';
  return 'color';
}

function TokenSymbol({ token }: { token: Token }) {
  const group = groupFor(token);
  const value = `var(${token.name})`;
  const style = group === 'color' ? { background: value } : group === 'shadow' ? { boxShadow: value } : undefined;
  return <span className="token-symbol" aria-hidden="true" style={style}>{style ? '' : group === 'type' ? 'Aa' : '↔'}</span>;
}

function Arrow() { return <span aria-hidden="true">↗</span>; }

function CopyButton({ value, label = '복사' }: { value: string; label?: string }) {
  const [message, setMessage] = useState('');
  const onCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setMessage('복사했어요.');
    } catch {
      setMessage('코드를 직접 선택해 복사해 주세요.');
    }
  };
  return <div className="copy-control">
    <Button variant="ghost" size="sm" onClick={onCopy} aria-label={label}>{label}<span aria-hidden="true"> ⧉</span></Button>
    <span className="copy-status" role="status">{message}</span>
  </div>;
}

function CodeBlock({ code, label, language = 'TSX' }: { code: string; label: string; language?: string }) {
  return <div className="code-block">
    <div className="code-heading"><span>{language}</span><CopyButton value={code} label={`${label} 복사`} /></div>
    <pre tabIndex={0} role="group" aria-label={label}><code>{code}</code></pre>
  </div>;
}

function SectionTitle({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: ReactNode }) {
  return <header className="section-heading">
    <div><p className="eyebrow">{number} / {eyebrow}</p><h2>{title}</h2></div>
    <p className="section-description">{children}</p>
  </header>;
}

function TokenExplorer() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<TokenGroup>('all');
  const [values, setValues] = useState<Record<string, string>>({});
  const { preferences } = usePreferences();
  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      setValues(Object.fromEntries(catalog.tokens.map(token => [token.name, style.getPropertyValue(token.name).trim()])));
    };
    update();
    window.addEventListener('hyeonse:preferences', update);
    return () => window.removeEventListener('hyeonse:preferences', update);
  }, [preferences]);

  const filtered = useMemo(() => {
    const search = query.normalize('NFKC').trim().toLowerCase();
    return catalog.tokens.filter(token => (group === 'all' || groupFor(token) === group) &&
      [token.name, token.role, token.value, values[token.name], ...token.overrides.flatMap(item => [item.selector, item.media, item.value])]
        .filter(Boolean).join(' ').toLowerCase().includes(search));
  }, [group, query, values]);
  return <section id="tokens" className="catalog-section" aria-labelledby="tokens-heading">
    <SectionTitle number="02" eyebrow="FOUNDATIONS" title="값보다 먼저, 역할부터.">이름·용도·상태로 토큰을 찾으세요. 현재 값은 선택한 테마와 강조색에 맞춰 바뀝니다.</SectionTitle>
    <h3 id="tokens-heading" className="sr-only">디자인 토큰 탐색</h3>
    <div className="foundation-notes">
      <div><span className="foundation-number">Aa</span><h3>읽기의 위계</h3><p>DM Sans와 Noto Sans KR. 작은 레이블부터 본문까지 정해진 글자 크기와 행간을 사용해요.</p></div>
      <div><span className="foundation-space" aria-hidden="true"><i /><i /><i /><i /></span><h3>일정한 간격</h3><p>4px부터 64px까지. 다섯 단계 크기로 조절하고, 터치 기기는 조작 영역 44px를 유지해요.</p></div>
      <div><span className="foundation-colors" aria-hidden="true"><i /><i /><i /></span><h3>역할을 가진 색</h3><p>바탕·글자·조작 경계·상태를 나눠, 밝고 어두운 화면 모두에서 같은 의미를 전달해요.</p></div>
    </div>
    <div className="token-toolbar">
      <TextField label="토큰 검색" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: accent, forest, spacing" />
      <NativeSelect label="종류" value={group} onValueChange={value => { if (value) setGroup(value as TokenGroup); }} options={[
        { value: 'all', label: '모든 토큰' }, { value: 'color', label: '색과 상태' },
        { value: 'space', label: '간격과 크기' }, { value: 'type', label: '글자' },
        { value: 'other', label: '모서리와 움직임' }, { value: 'shadow', label: '그림자' },
      ]} />
    </div>
    <div className="results-heading"><p role="status">{filtered.length} / {catalog.tokens.length}개 토큰</p><span>현재 화면의 계산된 값</span></div>
    {filtered.length ? <div className="token-list">
      {filtered.map(token => <details key={token.name} className="token-row">
        <summary><TokenSymbol token={token} /><span className="token-identity"><code>{token.name}</code><span>{token.role}</span></span><code className="token-value">{values[token.name] || token.value}</code><span className="expand-icon" aria-hidden="true">+</span></summary>
        <div className="token-detail"><CodeBlock code={`var(${token.name})`} label={`${token.name} CSS 변수`} language="CSS" />
          <p><strong>기본값</strong> <code>{token.value}</code></p>
          {token.overrides.length > 0 ? <ul className="condition-list">{token.overrides.map((override, index) => <li key={index}><code>{override.media ? `@media ${override.media} · ` : ''}{override.selector}</code><span>→ <code>{override.value}</code></span></li>)}</ul> : <p className="muted">테마나 기기 조건에 따른 별도 값이 없어요.</p>}
        </div>
      </details>)}
    </div> : <div className="empty-state"><h3>일치하는 토큰이 없어요.</h3><p>이름 일부나 forest, dark 같은 조건으로 다시 찾아보세요.</p><Button variant="secondary" onClick={() => { setQuery(''); setGroup('all'); }}>검색 초기화</Button></div>}
    <p className="section-footnote">원시 팔레트와 구분선은 본문 글자색으로 쓰지 않아요. 링크에는 <code>--accent-text</code>, 채운 버튼에는 <code>--accent-solid</code>와 <code>--on-accent</code>를 함께 사용하세요.</p>
  </section>;
}

function ButtonPlayground() {
  const [variant, setVariant] = useState<NonNullable<ButtonProps['variant']>>('primary');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [count, setCount] = useState(0);
  const code = `<Button variant="${variant}"${loading ? ' loading loadingLabel="저장 중…"' : ''}${disabled ? ' disabled' : ''}>\n  변경 사항 저장\n</Button>`;
  return <article className="component-card" id="component-button">
    <div className="component-title"><span className="component-index">01</span><h3>Button</h3><Badge>동작</Badge></div>
    <p>행동의 우선순위와 처리 중 상태를 표현해요. 기본 <code>type="button"</code>으로 폼을 뜻하지 않게 제출하는 일을 막습니다.</p>
    <div className="playground">
      <div className="playground-stage"><Button variant={variant} loading={loading} loadingLabel="저장 중…" disabled={disabled} onClick={() => setCount(count + 1)}>변경 사항 저장 <Arrow /></Button><p role="status" className="demo-status">{count ? `${count}번 동작했어요.` : '눌러서 동작을 확인하세요.'}</p></div>
      <div className="playground-options"><NativeSelect label="모양" value={variant} onValueChange={value => { if (value) setVariant(value as typeof variant); }} options={[
        { value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'ghost', label: 'Ghost' },
      ]} /><Checkbox label="로딩 상태" checked={loading} onChange={event => setLoading(event.target.checked)} /><Checkbox label="비활성 상태" checked={disabled} onChange={event => setDisabled(event.target.checked)} /></div>
    </div>
    <CodeBlock code={code} label="Button 예제" />
  </article>;
}

function FormPlayground() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError('프로젝트 이름을 입력해 주세요.');
      setMessage('입력 내용을 확인해 주세요.');
      event.currentTarget.querySelector<HTMLInputElement>('input[name="project"]')?.focus();
      return;
    }
    setError('');
    setMessage(`“${name.trim()}” ${shared ? '팀 공유' : '개인'} 프로젝트를 미리 확인했어요. 실제 저장은 하지 않아요.`);
  }
  return <article className="component-card form-example" id="component-textfield">
    <div className="component-title"><span className="component-index">02 / 03</span><h3>TextField & Checkbox</h3></div>
    <p>레이블·힌트·오류 안내가 입력과 연결돼요. 체크박스는 네이티브 키보드 조작과 폼 값을 그대로 사용합니다.</p>
    <form className="demo-form" onSubmit={submit} noValidate>
      <fieldset className="demo-fields" disabled={!ready}>
      <legend className="sr-only">프로젝트 입력 예제</legend>
      <TextField name="project" label="프로젝트 이름" placeholder="예: 작은 기록실" hint="이름은 언제든 바꿀 수 있어요." value={name} onChange={event => { setName(event.target.value); if (error) setError(''); setMessage(''); }} error={error} required maxLength={40} autoComplete="off" />
      <Checkbox name="shared" label="팀과 공유하기" hint="체크하면 이 예제의 안내 문구가 바뀝니다." checked={shared} onChange={event => setShared(event.target.checked)} />
      <div className="form-actions"><Button type="submit">프로젝트 확인 <Arrow /></Button><span className="local-tag">로컬 예제</span></div>
      </fieldset>
      <p role="status" className="demo-status">{message || '빈 이름으로 제출해 오류 안내를 확인해 보세요.'}</p>
    </form>
    <details className="usage-code"><summary>폼 예제 코드 보기 <span aria-hidden="true">+</span></summary><CodeBlock code={formCode} label="폼 예제" /></details>
  </article>;
}

function Components() {
  return <section id="components" className="catalog-section">
    <SectionTitle number="03" eyebrow="COMPONENTS" title="자주 쓰는 화면 요소, 같은 기준으로.">아래 UI는 패키지에서 직접 가져왔어요. 상태를 바꾸고 사용 코드를 확인해 보세요.</SectionTitle>
    <div className="import-note"><code>@hyeonse/design-system/primitives</code><span>React 19 · 기본 HTML 속성과 ref 지원</span></div>
    <SizingDemo />
    <ComponentLibrary />
    <h3 className="core-components-heading">기본 버튼·입력·상태 표시</h3>
    <div className="components-grid"><ButtonPlayground /><FormPlayground /></div>
    <article className="badge-example" id="component-badge"><div className="component-title"><span className="component-index">04</span><h3>Badge</h3></div><p>색과 함께 상태를 텍스트로 전해요. 자동 알림 역할을 부여하지 않아 알림이 필요한 곳에서만 직접 정할 수 있어요.</p><div className="badge-row"><Badge>대기</Badge><Badge tone="accent">선택됨</Badge><Badge tone="success">완료</Badge><Badge tone="warning">확인 필요</Badge><Badge tone="danger">오류</Badge></div><CodeBlock code={'<Badge tone="success">완료</Badge>'} label="Badge 예제" /></article>
    <div className="state-notes"><p><strong>키보드</strong> Tab으로 이동하고 Enter·Space로 조작해 보세요.</p><p><strong>입력 상태</strong> 오류에는 안내 문구와 <code>aria-invalid</code>가 함께 적용돼요.</p><p><strong>실제 기본값</strong> 밀도가 바뀌어도 조작 영역과 레이블은 유지돼요.</p></div>
  </section>;
}

function Preferences() {
  const { preferences } = usePreferences();
  return <section id="preferences" className="catalog-section">
    <SectionTitle number="04" eyebrow="PREFERENCES" title="읽는 사람의 선택까지.">밝기·강조색·간격·모서리를 바꿔 전체 화면의 반응을 확인하세요. 기기의 움직임 감소 설정이 우선해요.</SectionTitle>
    <PreferencesPanel />
    <details className="usage-code"><summary>현재 설정과 연결 코드 보기 <span aria-hidden="true">+</span></summary><div className="settings-code-grid"><CodeBlock code={JSON.stringify(preferences, null, 2)} label="현재 화면 설정" language="JSON" /><CodeBlock code={settingsCode} label="설정 통합 코드" /></div></details>
    <p className="section-footnote">설정은 저장 가능한 환경에서 이 브라우저에 보관돼요. 저장소가 차단돼도 현재 탭의 조작은 계속 사용할 수 있습니다.</p>
  </section>;
}

function Start() {
  return <section id="start" className="catalog-section">
    <SectionTitle number="05" eyebrow="GET STARTED" title="작게 가져와, 바로 연결하기.">CSS만 사용하거나 필요한 React 컴포넌트를 가져올 수 있어요. 전역 리셋이나 앱 전체 이관은 필요하지 않습니다.</SectionTitle>
    <aside className="release-notice"><Badge tone="accent">v{version}</Badge><p>현재 v{version} 패키지는 이 사이트의 버전 고정 아카이브로 제공합니다. 폼·메뉴·레이어·탐색·피드백·레이아웃 컴포넌트를 포함해요. npm 레지스트리나 GitHub v{version} 태그 릴리스는 아닙니다.</p></aside>
    <ol className="setup-steps"><li><div><span className="step-number">01</span><h3>패키지 설치</h3><p>소비 프로젝트에서 아래 아카이브 URL을 설치해요. 기존 GitHub v0.3.0 태그에는 기본 컴포넌트 네 개만 있습니다. <a href="./releases/manifest.json">릴리스 매니페스트</a>에서 버전과 파일 무결성을 확인할 수 있어요.</p></div><CodeBlock language="SHELL" label="패키지 설치 명령" code={`npm install https://design-system.hyeonse.dev/releases/hyeonse-design-system-${version}.tgz`} /></li><li><div><span className="step-number">02</span><h3>스타일 한 번 불러오기</h3><p>토큰을 먼저, 컴포넌트 스타일을 뒤에 불러와요. 글꼴은 앱의 자산으로 준비하세요.</p></div><CodeBlock language="CSS" label="공개 스타일 가져오기" code={"@import '@hyeonse/design-system/tokens.css';\n@import '@hyeonse/design-system/components.css';"} /></li><li><div><span className="step-number">03</span><h3>필요한 만큼 사용하기</h3><p>필요한 모듈에서 컴포넌트를 가져와요. 화면 설정과 토스트는 각각 Provider를 연결합니다.</p></div><CodeBlock label="컴포넌트 가져오기" code={"import { Button, TextField }\n  from '@hyeonse/design-system/primitives';\n\n<TextField label=\"이름\" name=\"name\" />\n<Button onClick={onSave}>저장</Button>"} /></li></ol>
    <p className="section-footnote">WebKit에서 HDS가 만든 Base UI 초점 가드에는 이름을 붙이고, 고정 선택과 일반 모달에는 브라우저 기본 컴포넌트를 사용합니다. <a href="https://github.com/mui/base-ui/issues/5237" target="_blank" rel="noreferrer">상위 이슈 #5237 <span className="sr-only">새 창</span></a>와 <a href="./docs/code-freeze.md">보조 기술 검증 범위</a>를 확인하세요.</p>
    <div className="document-links"><a href="./docs/api.md">전체 통합 문서 <Arrow /></a><a href="./docs/components.md">컴포넌트 사용 기준 <Arrow /></a><a href="./docs/ai.md">AI·CLI 사용 안내 <Arrow /></a><a href="./llms-full.txt">생성된 전체 참조 <Arrow /></a></div>
  </section>;
}

function ApiReference() {
  const [query, setQuery] = useState('');
  const entries = catalog.entries.filter(entry => `${entry.id} ${entry.kind} ${entry.summary} ${entry.keywords.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section id="api" className="catalog-section">
    <SectionTitle number="06" eyebrow="REFERENCE" title="코드와 함께 움직이는 문서.">현재 패키지의 공개 선언에서 가져온 API예요. 설치된 버전에서는 hds CLI로도 같은 내용을 찾을 수 있어요.</SectionTitle>
    <TextField label="API 검색" type="search" placeholder="예: Button, theme, 설정" value={query} onChange={event => setQuery(event.target.value)} />
    <p className="result-count" role="status">{entries.length}개 API</p>
    <div className="api-list">{entries.map(entry => <details className="api-entry" key={entry.id} id={`api-${entry.id}`}><summary><strong>{entry.id}</strong><span>{entry.kind}</span><span className="expand-icon" aria-hidden="true">+</span></summary><div className="api-detail"><p>{entry.summary}</p><CodeBlock code={`import { ${entry.id} } from '${entry.importPath}';`} label={`${entry.id} 가져오기`} language="TS" />
      {'props' in entry && entry.props && <div className="props-scroll"><table><caption>컴포넌트가 직접 정의한 props</caption><thead><tr><th scope="col">속성</th><th scope="col">타입</th><th scope="col">필수</th></tr></thead><tbody>{entry.props.map(prop => <tr key={prop.name}><th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code></td><td>{prop.required ? '필수' : '선택'}</td></tr>)}</tbody></table></div>}
      <ul className="api-guidance">{entry.usage.map(text => <li key={text}>{text}</li>)}{entry.accessibility.map(text => <li key={text}>{text}</li>)}</ul>
      {entry.limitations.length > 0 && <p className="api-limits">{entry.limitations.join(' ')}</p>}
      <CodeBlock code={`npm exec --no -- hds show ${entry.id} --json`} label={`${entry.id} CLI 조회 명령`} language="SHELL" />
    </div></details>)}</div>
    {!entries.length && <div className="empty-state"><p>일치하는 API가 없어요.</p><Button variant="secondary" onClick={() => setQuery('')}>검색 초기화</Button></div>}
    <p className="section-footnote">HTML 기본 속성과 ref는 각 컴포넌트의 공개 타입에 포함돼요. 더 자세한 선언·상태·한계는 <a href="./dist/catalog.json">카탈로그 JSON</a>과 <a href="./llms-full.txt">전체 참조</a>에서 확인하세요.</p>
  </section>;
}

function Catalog() {
  const [specimenName, setSpecimenName] = useState('작은 기록실');
  const [specimenChecked, setSpecimenChecked] = useState(false);
  return <>
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <header className="masthead"><a className="brand" href="#overview"><span className="brand-mark" aria-hidden="true">H<span>·</span></span><span>HYEONSE <br />DESIGN SYSTEM</span></a><div className="masthead-actions"><span className="build-version">v{version}</span><ThemeToggle /><a className="source-link" href="https://github.com/hyeonse-swing/hyeonse-design-system" target="_blank" rel="noreferrer">GitHub <Arrow /></a></div></header>
    <div className="catalog-shell"><aside className="catalog-sidebar"><div className="sidebar-intro"><span className="eyebrow">THE WORKING REFERENCE</span><p>만드는 화면이 달라도,<br />같은 기준으로.</p></div><SectionNavigation sections={sections} /><div className="sidebar-bottom"><span className="system-status"><i aria-hidden="true" /> VERSION {version}</span><p>명확한 형태.<br />유연한 화면.</p><a href="./docs/verification.md">이전 통합 검증 기록 <Arrow /></a></div></aside>
    <main id="main">
      <section className="hero" id="overview" aria-labelledby="hero-title"><div className="hero-top"><p className="eyebrow">Hyeonse Design System</p><span className="hero-edition">v{version} · 사용 안내</span></div><h1 id="hero-title">명확한 기준.<br /><em>일관된 인터페이스.</em></h1><p className="hero-description">색과 간격부터 입력과 피드백까지.<br />직접 사용하고 검증할 수 있는 작은 디자인 시스템입니다.</p><div className="hero-actions"><a className="primary-link" href="#components">컴포넌트 사용해 보기 <Arrow /></a><a className="text-link" href="#start">프로젝트에 연결하기 <Arrow /></a></div>
      <div className="hero-specimen" role="group" aria-label="디자인 시스템 컴포넌트 작업대">
        <div className="specimen-heading"><div><span className="specimen-label">실제 컴포넌트 미리보기</span><strong>입력에서 상태까지</strong></div><span className="specimen-version">@hyeonse/design-system</span></div>
        <div className="specimen-body"><div className="specimen-stage">
          <div className="specimen-stage-header"><span>미리보기</span><Badge tone={specimenChecked ? 'success' : 'accent'}>{specimenChecked ? '확인됨' : '입력 중'}</Badge></div>
          <TextField label="프로젝트 이름" name="specimen-project" value={specimenName} onChange={event => { setSpecimenName(event.target.value); setSpecimenChecked(false); }} maxLength={40} hint="이 예제는 저장되지 않아요." />
          <div className="specimen-action"><Button onClick={() => setSpecimenChecked(true)} disabled={!specimenName.trim()}>상태 확인</Button><p role="status">{specimenChecked ? `“${specimenName.trim()}” 입력을 확인했어요.` : '이름을 바꾸고 상태를 확인해 보세요.'}</p></div>
        </div><div className="specimen-anatomy"><p>이 화면에 적용된 역할 토큰</p><dl><div><dt>배경</dt><dd><code>--paper</code></dd></div><div><dt>강조</dt><dd><code>--accent-solid</code></dd></div><div><dt>텍스트</dt><dd><code>--ink</code></dd></div><div><dt>경계</dt><dd><code>--control-border</code></dd></div></dl><a href="#tokens">토큰의 현재 값 보기 <Arrow /></a></div></div>
      </div>
      <nav className="hero-index" aria-label="디자인 시스템 둘러보기"><a href="#tokens"><span>역할 토큰</span><strong>{catalog.tokens.length}개</strong><Arrow /></a><a href="#components"><span>컴포넌트 API</span><strong>{componentCount}개</strong><Arrow /></a><a href="#preferences"><span>화면 설정</span><strong>5가지</strong><Arrow /></a></nav></section>
      <TokenExplorer /><Components /><Preferences /><Start /><ApiReference />
      <footer className="footer"><div><span>HYEONSE DESIGN SYSTEM</span><p>개인 프로젝트에서 함께 쓰는 화면의 기준.</p></div><a href="#overview">처음으로 ↑</a></footer>
    </main></div>
  </>;
}

export function Showcase() {
  return <PreferencesProvider><Catalog /></PreferencesProvider>;
}
