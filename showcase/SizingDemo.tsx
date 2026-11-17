import { useState } from 'react';
import { SizeProvider, Container, Stack, Inline, Grid } from '../dist/layout.js';
import type { Size } from '../dist/layout.js';
import { Button, TextField, Badge } from '../dist/primitives.js';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Tabs, TabsList, TabsTab, TabsPanel } from '../dist/display.js';
import { Select } from '../dist/fields.js';
import { Dialog } from '../dist/overlays.js';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg', 'xl'];
export function SizingDemo() {
  const [size, setSize] = useState<Size>('md');
  return <article className="component-card sizing-demo" id="component-sizing">
    <div className="component-title"><span className="component-index">SIZE</span><h3>크기와 레이아웃</h3><Badge>5단계</Badge></div>
    <p>영역의 크기를 바꾸면 안쪽 버튼·입력·카드·표·모달에도 함께 적용돼요. 필요한 요소만 따로 지정할 수도 있어요.</p>
    <fieldset className="sizing-picker"><legend>영역 크기</legend>{sizes.map(value => <label key={value}><input type="radio" name="demo-size" value={value} checked={size === value} onChange={() => setSize(value)} />{value.toUpperCase()}</label>)}</fieldset>
    <div className="sizing-button-row" role="group" aria-label="버튼 크기 비교">{sizes.map(value => <Button key={value} size={value} variant="secondary">{value.toUpperCase()}</Button>)}</div>
    <SizeProvider size={size}><Container fluid className="sizing-surface"><Stack>
      <Inline justify="between"><strong>프로젝트 설정</strong><Badge tone="success">저장됨</Badge></Inline>
      <Tabs defaultValue="overview"><TabsList aria-label="크기 예제 탭"><TabsTab value="overview">기본 정보</TabsTab><TabsTab value="members">멤버</TabsTab></TabsList><TabsPanel value="overview"><Grid>
        <Card title="작업 공간" description="카드의 안쪽 여백도 크기에 맞춰 바뀌어요."><Stack><TextField label="공간 이름" defaultValue="작은 기록실" /><Select label="공유 범위" defaultValue="private" options={[{ value: 'private', label: '나만 보기' }, { value: 'team', label: '팀과 공유' }]} /></Stack></Card>
        <Card title="초대 현황"><Table><TableHeader><TableRow><TableHead>역할</TableHead><TableHead>인원</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>편집자</TableCell><TableCell>2명</TableCell></TableRow><TableRow><TableCell>열람자</TableCell><TableCell>4명</TableCell></TableRow></TableBody></Table></Card>
      </Grid></TabsPanel><TabsPanel value="members">함께 사용할 멤버를 관리해요.</TabsPanel></Tabs>
      <Inline><Button>변경 사항 저장</Button><Button size="xs" variant="ghost">항상 XS</Button><Dialog title="변경 사항 미리보기" trigger={<Button variant="secondary">크기별 모달 열기</Button>}><Stack><p>모달과 포털 안의 요소도 선택한 크기를 이어받아요.</p><Select label="모달 공유 범위" defaultValue="private" options={[{ value: 'private', label: '나만 보기' }, { value: 'team', label: '팀과 공유' }]} /><Button>확인</Button></Stack></Dialog></Inline>
    </Stack></Container></SizeProvider>
    <pre tabIndex={0} role="group" aria-label="크기와 레이아웃 예제"><code>{`import { SizeProvider, Stack, Grid } from '@hyeonse/design-system/layout';\n\n<SizeProvider size="${size}">\n  <Stack gap="lg">\n    <Grid columns={2}>…</Grid>\n    <Button>영역 크기 상속</Button>\n    <Button size="xs">개별 지정</Button>\n  </Stack>\n</SizeProvider>`}</code></pre>
    <p className="sizing-note">기본 MD 버튼은 36px이에요. 터치 기기에서는 작은 크기도 최소 44px의 조작 영역을 유지해요. 화면 설정의 간격 조절은 선택한 크기 안에서 여백만 바꿔요.</p>
  </article>;
}
