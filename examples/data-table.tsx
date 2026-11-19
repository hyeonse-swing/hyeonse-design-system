import { useState } from 'react';
import { DataTable, type DataTableSort } from '@hyeonse/design-system/display';

type ReturnRow = { id: string; received: string; product: string; holdReason: string; status: string };
const returns: ReturnRow[] = [
  { id: 'RET-2418', received: '2026-11-10', product: '코튼 재킷', holdReason: '상태 재확인', status: '재검수 대기' },
  { id: 'RET-2419', received: '2026-11-11', product: '셔츠', holdReason: '포장 확인', status: '재검수 대기' },
  { id: 'RET-2420', received: '2026-11-11', product: '셔츠', holdReason: '상품 라벨 확인', status: '재검수 대기' },
  { id: 'RET-2421', received: '2026-11-12', product: '가방', holdReason: '손잡이 확인', status: '재검수 대기' },
];

export function HeldReturns() {
  const [sort, setSort] = useState<DataTableSort>({ columnId: 'received', direction: 'asc' });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openedRowId, setOpenedRowId] = useState<string | null>(null);
  const pageSize = 2;
  // A server-backed consumer may sort/page before passing its current page.
  const ordered = [...returns].sort((a, b) => {
    const field = sort.columnId as 'received' | 'id';
    const compared = a[field].localeCompare(b[field], 'ko');
    return (sort.direction === 'asc' ? compared : -compared) || a.id.localeCompare(b.id);
  });
  const rows = ordered.slice((page - 1) * pageSize, page * pageSize);
  return <>
    <DataTable<ReturnRow>
      caption="보류 재검수 목록"
      columns={[
        { id: 'id', header: '반품 번호', sortable: true, cell: row => row.id },
        { id: 'received', header: '접수일', sortable: true, cell: row => row.received },
        { id: 'product', header: '상품', cell: row => row.product },
        { id: 'holdReason', header: '보류 사유', cell: row => row.holdReason },
        { id: 'status', header: '상태', cell: row => <><span>{row.status}</span> <button type="button" onClick={() => setOpenedRowId(row.id)}>상세 열기 {row.id}</button></> },
      ]}
      rows={rows}
      getRowId={row => row.id}
      getRowLabel={row => row.product}
      sort={sort}
      onSortChange={next => { setSort(next); setPage(1); }}
      selectedRowId={selectedRowId}
      onSelectedRowIdChange={setSelectedRowId}
      page={page}
      pageCount={Math.max(1, Math.ceil(returns.length / pageSize))}
      onPageChange={setPage}
      pageSize={pageSize}
      totalRows={returns.length}
    />
    {openedRowId && <p role="status">상세 대상 {openedRowId}</p>}
  </>;
}
