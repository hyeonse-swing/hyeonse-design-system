'use client';

import { useState } from 'react';
import { Button } from '@hyeonse/design-system/primitives';
import { AlertDialog, ContextMenu, Dialog, DropdownMenu, Popover, Sheet, ToastProvider, Tooltip, useToast } from '@hyeonse/design-system/overlays';
import type { MenuEntry } from '@hyeonse/design-system/overlays';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

function OverlayControls() {
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState('');
  const toast = useToast();
  const items: MenuEntry[] = [
    { kind: 'action', id: 'copy', label: '복사', onSelect: () => setStatus('복사했어요.') },
    { kind: 'checkbox', id: 'pin', label: '상단에 고정', checked: pinned, onCheckedChange: setPinned },
    { kind: 'submenu', id: 'move', label: '이동', items: [
      { kind: 'action', id: 'archive', label: '보관함', onSelect: () => setStatus('보관함으로 이동했어요.') },
    ] },
    { kind: 'separator', id: 'divider' },
    { kind: 'action', id: 'remove', label: '삭제', danger: true, onSelect: () => setStatus('삭제를 선택했어요.') },
  ];

  return <div>
    <DropdownMenu trigger={<Button type="button" variant="secondary">작업 메뉴</Button>} items={items} />
    <ContextMenu trigger={<button type="button">우클릭 메뉴 영역</button>} items={items} />
    <Dialog trigger={<Button type="button" variant="secondary">대화상자 열기</Button>} title="프로젝트 설정" description="변경할 항목을 확인하세요." footer={<Button type="button" onClick={() => setStatus('저장했어요.')}>저장</Button>}>
      설정 내용
    </Dialog>
    <AlertDialog trigger={<Button type="button" variant="secondary">삭제 확인</Button>}
      title="프로젝트를 삭제할까요?" description="삭제 후에는 되돌릴 수 없습니다."
      confirmLabel="삭제" cancelLabel="취소" onConfirm={() => setStatus('삭제했어요.')} />
    <Sheet trigger={<Button type="button" variant="secondary">상세 패널</Button>} title="프로젝트 상세" side="right" size="md">
      상세 내용을 여기에 표시합니다.
    </Sheet>
    <Popover trigger={<Button type="button" variant="secondary">도움말 보기</Button>} title="도움말" description="최근 작업 내용을 확인하세요.">
      필요한 정보를 여기에 표시합니다.
    </Popover>
    <Tooltip trigger={<Button type="button" variant="ghost" aria-label="단축키 도움말">단축키</Button>} content="단축키 도움말" />
    <Button type="button" onClick={() => toast.add({ title: '저장 완료', description: '변경 사항을 저장했어요.', tone: 'success' })}>알림 보기</Button>
    <p role="status">{status}</p>
  </div>;
}

export function OverlayPatterns() {
  return <ToastProvider><OverlayControls /></ToastProvider>;
}
