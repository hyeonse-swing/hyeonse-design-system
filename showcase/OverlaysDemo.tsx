import { useState } from 'react';
import { Button } from '../dist/primitives.js';
import { Select, NativeSelect, Combobox } from '../dist/fields.js';
import { AlertDialog, ContextMenu, Dialog, NativeDialog, DropdownMenu, Popover, Sheet, ToastProvider, Tooltip, useToast } from '../dist/overlays.js';
import type { MenuEntry } from '../dist/overlays.js';

function DemoControls() {
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState('메뉴와 대화상자를 직접 열어 보세요.');
  const [visibility, setVisibility] = useState<string | null>('team');
  const [owner, setOwner] = useState<string | null>(null);
  const toast = useToast();
  const items: MenuEntry[] = [
    { kind: 'action', id: 'edit', label: '편집', onSelect: () => setMessage('편집을 선택했어요.') },
    { kind: 'checkbox', id: 'pin', label: '상단에 고정', checked, onCheckedChange: setChecked },
    { kind: 'submenu', id: 'share', label: '공유', items: [
      { kind: 'action', id: 'copy-link', label: '링크 복사', onSelect: () => setMessage('링크 복사를 선택했어요.') },
    ] },
    { kind: 'separator', id: 'divider' },
    { kind: 'action', id: 'delete', label: '삭제', danger: true, onSelect: () => setMessage('삭제를 선택했어요.') },
  ];

  return <div className="hds-demoOverlays" data-suite="overlays">
    <div className="hds-demoOverlays__controls">
      <DropdownMenu trigger={<Button type="button" variant="secondary">드롭다운 메뉴</Button>} items={items} />
      <ContextMenu trigger={<Button type="button" variant="secondary">우클릭 메뉴</Button>} items={items} />
      <Dialog trigger={<Button type="button" variant="secondary">대화상자</Button>} title="프로젝트 설정" description="기본 설정을 확인하세요." footer={<Button type="button" onClick={() => setMessage('설정을 저장했어요.')}>저장</Button>}>
        <div className="hds-demoOverlays__form">
          <Select label="프로젝트 공개 범위" options={[{ value: 'team', label: '팀 공개' }, { value: 'private', label: '비공개' }]} value={visibility} onValueChange={setVisibility} />
          <DropdownMenu trigger={<Button variant="secondary">추가 설정</Button>} items={[{ kind: 'action', id: 'archive', label: '보관 설정', onSelect: () => setMessage('보관 설정을 선택했어요.') }]} />
          <Popover trigger={<Button variant="ghost">공개 범위 도움말</Button>} title="공개 범위 안내"><p>팀 공개 항목은 팀 구성원과 공유합니다.</p></Popover>
        </div>
      </Dialog>
      <NativeDialog trigger={<Button type="button" variant="secondary">네이티브 대화상자</Button>} title="기본 설정" description="브라우저 기본 선택 목록을 사용할 수 있습니다.">
        <NativeSelect label="기본 공개 범위" options={[{ value: 'private', label: '비공개' }, { value: 'team', label: '팀 공개' }]} defaultValue="private" />
      </NativeDialog>
      <AlertDialog trigger={<Button type="button" variant="secondary">삭제 확인</Button>}
        title="프로젝트를 삭제할까요?" description="이 작업은 되돌릴 수 없습니다."
        cancelLabel="취소" confirmLabel="삭제" onConfirm={() => setMessage('프로젝트를 삭제했어요.')} />
      <Sheet trigger={<Button type="button" variant="secondary">사이드 시트</Button>} title="작업 상세" description="오른쪽에서 열리는 패널입니다." side="right" size="md">
        <Combobox label="담당자" placeholder="이름 검색" options={[{ value: 'hyeonse', label: '임현세' }, { value: 'guest', label: '게스트' }]} value={owner} onValueChange={setOwner} />
        <p>목록은 패널 밖으로 펼쳐지며, 선택한 값은 패널을 닫았다 열어도 유지됩니다.</p>
      </Sheet>
      <Popover trigger={<Button type="button" variant="secondary">팝오버</Button>} title="최근 알림" description="새 알림이 없습니다.">
        중요한 상태는 페이지에서도 확인할 수 있습니다.
      </Popover>
      <Tooltip trigger={<Button type="button" variant="ghost">단축키 도움말</Button>} content="단축키 도움말" />
      <Button type="button" onClick={() => toast.add({ title: '저장 완료', description: '변경 사항을 저장했어요.', tone: 'success' })}>토스트 알림</Button>
    </div>
    <p role="status">{message}</p>
  </div>;
}

export function OverlaysDemo() {
  return <ToastProvider><DemoControls /></ToastProvider>;
}
