import { useState } from 'react';
import { Tabs, TabsList, TabsTab, TabsPanel, Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel, Collapsible, CollapsibleTrigger, CollapsiblePanel, Breadcrumb, Pagination, Stepper, SegmentedControl, Toggle, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, Alert, Avatar, Separator, Skeleton, Spinner, Progress, EmptyState, AspectRatio, ScrollArea, Label, VisuallyHidden } from '../dist/display.js';
import { Input } from '../dist/fields.js';

export function DisplayDemo() {
  const [page, setPage] = useState(2);
  const [view, setView] = useState(['list']);
  return <section data-suite="display" aria-label="탐색과 표시 컴포넌트 예시">
    <div className="demo-group">
      <h3>페이지와 내용 탐색</h3>
      <Breadcrumb items={[{ label: '컴포넌트', href: '#components' }, { label: '탐색과 표시' }]} />
      <Tabs defaultValue="overview">
        <TabsList aria-label="프로젝트 정보" activateOnFocus><TabsTab value="overview">개요</TabsTab><TabsTab value="activity">활동</TabsTab><TabsTab value="archive" disabled>보관함</TabsTab></TabsList>
        <TabsPanel value="overview">작업의 요약과 진행 상태를 한눈에 확인합니다.</TabsPanel>
        <TabsPanel value="activity">최근 변경 사항과 팀의 활동을 모아 봅니다.</TabsPanel>
      </Tabs>
      <Pagination page={page} pageCount={5} onPageChange={setPage} />
      <p className="demo-status" aria-live="polite">현재 {page}페이지 · 항목 {(page - 1) * 3 + 1}–{page * 3}</p>
      <Stepper currentStep={2} steps={[{ label: '접수' }, { label: '검토' }, { label: '완료' }]} />
    </div>
    <div className="demo-grid">
      <div className="demo-group">
        <h3>접고 펼치는 내용</h3>
        <Accordion><AccordionItem value="faq"><AccordionHeader><AccordionTrigger>자주 묻는 질문</AccordionTrigger></AccordionHeader><AccordionPanel>방향키로 제목을 이동하고 Enter 또는 Space로 내용을 열 수 있어요.</AccordionPanel></AccordionItem></Accordion>
        <Collapsible><CollapsibleTrigger>자세히 보기</CollapsibleTrigger><CollapsiblePanel>추가 설명이 필요할 때 펼쳐서 읽는 독립적인 영역입니다.</CollapsiblePanel></Collapsible>
      </div>
      <div className="demo-group">
        <h3>보기 방식과 카드</h3>
        <SegmentedControl value={view} onValueChange={setView} aria-label="보기 방식"><Toggle value="list">목록</Toggle><Toggle value="grid">격자</Toggle></SegmentedControl>
        <Card title="작은 작업실" description="새로운 프로젝트를 준비하고 있어요." footer={<span className="demo-status">{view.includes('grid') ? '격자 보기 선택됨' : view.includes('list') ? '목록 보기 선택됨' : '보기 방식 선택 해제됨'}</span>}><p>제목·본문·하단 정보를 하나로 묶습니다.</p></Card>
      </div>
    </div>
    <div className="demo-group">
      <h3>표와 데이터</h3>
      <Table><TableCaption>주문 요약</TableCaption><TableHeader><TableRow><TableHead>상품</TableHead><TableHead>수량</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>노트</TableCell><TableCell>1</TableCell></TableRow><TableRow><TableCell>펜</TableCell><TableCell>3</TableCell></TableRow></TableBody></Table>
    </div>
    <div className="demo-grid">
      <div className="demo-group">
        <h3>상태와 피드백</h3>
        <Alert tone="success" title="저장 완료">변경 사항을 저장했어요.</Alert>
        <Alert tone="warning" title="확인이 필요해요">제출 전에 입력한 내용을 다시 확인하세요.</Alert>
        <div className="demo-actions"><Avatar alt="임현세" fallback="임" /><span>이미지가 없을 때도 이름을 전달합니다.</span></div>
        <Separator />
        <div className="demo-actions"><Spinner label="예제 불러오는 중" /><Skeleton width={100} height={20} /><span className="demo-status">로딩 상태 예시</span></div>
        <p className="demo-status">진행률 40%</p><Progress value={40} label="진행률" />
      </div>
      <div className="demo-group">
        <h3>빈 화면과 콘텐츠 영역</h3>
        <EmptyState title="아직 항목이 없어요" description="새 항목을 추가하면 이곳에 표시됩니다." />
        <AspectRatio ratio={2} className="demo-ratio"><span>2 : 1 비율 영역</span></AspectRatio>
        <ScrollArea label="공지 목록" maxHeight={100}><ul className="demo-scroll-list"><li>첫 번째 공지</li><li>두 번째 공지</li><li>세 번째 공지</li><li>네 번째 공지</li><li>다섯 번째 공지</li></ul></ScrollArea>
        <div><Label htmlFor="demo-name">이름</Label><Input id="demo-name" placeholder="표시할 이름" /><VisuallyHidden>이 입력은 레이블 연결 예시입니다.</VisuallyHidden></div>
      </div>
    </div>
  </section>;
}
