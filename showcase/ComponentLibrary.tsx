import { useState } from 'react';
import { Button } from '../dist/primitives.js';
import catalog from '../dist/catalog.json';
import { FieldsDemo } from './FieldsDemo.js';
import { OverlaysDemo } from './OverlaysDemo.js';
import { DisplayDemo } from './DisplayDemo.js';

const categories = [
  { id: 'fields', label: '입력·선택', description: '문자, 숫자, 날짜부터 검색과 다중 선택까지.' },
  { id: 'overlays', label: '메뉴·레이어', description: '작업 메뉴, 확인 창, 보조 설명과 알림.' },
  { id: 'display', label: '탐색·표시', description: '탐색 구조, 데이터 표현과 처리 상태.' },
] as const;

export function ComponentLibrary() {
  const [category, setCategory] = useState<typeof categories[number]['id']>('fields');
  const current = categories.find(item => item.id === category)!;
  const entries = catalog.entries.filter(entry => entry.importPath.endsWith(`/${category}`));
  return <div className="component-library" id="component-library">
    <div className="library-heading"><div><span className="eyebrow">THE COMPONENT LIBRARY</span><h3>화면에 필요한 요소들을 한곳에.</h3></div><p>종류를 고른 뒤 직접 조작해 보세요. 예제의 입력과 동작은 이 화면 안에서만 처리됩니다.</p></div>
    <div className="library-categories" role="group" aria-label="컴포넌트 종류">
      {categories.map(item => <Button key={item.id} variant={category === item.id ? 'primary' : 'secondary'} aria-pressed={category === item.id} data-library-category={item.id} onClick={() => setCategory(item.id)}>{item.label}</Button>)}
    </div>
    <p className="library-description" role="status">{current.description}</p>
    <div className="library-index" aria-label={`${current.label} 공개 API`} role="group">{entries.map(entry => <code key={entry.id}>{entry.id}</code>)}</div>
    <div className="import-note"><code>@hyeonse/design-system/{category}</code><a href="./docs/components.md">사용법·지원 범위 보기 ↗</a></div>
    <div className="library-stage" aria-label={`${current.label} 예제`} role="region">
      {category === 'fields' && <FieldsDemo />}
      {category === 'overlays' && <OverlaysDemo />}
      {category === 'display' && <DisplayDemo />}
    </div>
  </div>;
}
