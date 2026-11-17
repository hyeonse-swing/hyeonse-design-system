import { Container, Grid, Inline, Stack, SizeProvider } from '@hyeonse/design-system/layout';
import { Button, TextField } from '@hyeonse/design-system/primitives';
import { Card } from '@hyeonse/design-system/display';

export function LayoutSizingExample() {
  return <SizeProvider size="sm"><Container size="lg"><Stack gap="xl">
    <Grid columns={2} size="sm"><Card title="기본 정보"><TextField label="프로젝트 이름" inputSize={24} /></Card><Card title="공유 설정">공개 범위를 정해요.</Card></Grid>
    <Inline size="sm" justify="end"><Button variant="secondary">취소</Button><Button size="md">저장</Button></Inline>
  </Stack></Container></SizeProvider>;
}
