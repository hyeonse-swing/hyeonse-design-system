import { Tabs, TabsList, TabsTab, TabsPanel, Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel, Breadcrumb, Card, Alert, Progress } from '@hyeonse/design-system/display';

export function DisplayPatterns() {
  return <>
    <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '설정' }]} />
    <Tabs defaultValue="overview"><TabsList activateOnFocus><TabsTab value="overview">개요</TabsTab><TabsTab value="details">상세</TabsTab></TabsList><TabsPanel value="overview">개요 내용</TabsPanel><TabsPanel value="details">상세 내용</TabsPanel></Tabs>
    <Accordion defaultValue={['shipping']}><AccordionItem value="shipping"><AccordionHeader><AccordionTrigger>배송 안내</AccordionTrigger></AccordionHeader><AccordionPanel>평균 2일이 걸립니다.</AccordionPanel></AccordionItem></Accordion>
    <Card title="주문 상태" description="오늘의 주문" footer="최종 갱신: 오늘"><Progress value={45} label="주문 진행률" /></Card>
    <Alert tone="success" title="저장 완료">변경사항을 저장했습니다.</Alert>
  </>;
}
