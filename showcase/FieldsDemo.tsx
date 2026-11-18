import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Input, Textarea, Select, NativeSelect, Combobox, MultiSelect, Switch, RadioGroup, Slider, NumberField, DateField, FileInput, PasswordField } from '../dist/fields.js';

const teams = [
  { value: 'design', label: '디자인' },
  { value: 'frontend', label: '프론트엔드' },
  { value: 'operations', label: '운영' },
  { value: 'retired', label: '종료된 팀', disabled: true },
];

export function FieldsDemo() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [team, setTeam] = useState<string | null>(null);
  const [member, setMember] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>(['frontend']);
  const [message, setMessage] = useState('폼 값을 로컬에서만 확인합니다.');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selected: string[] = [];
    data.forEach((value, key) => selected.push(`${key}: ${key === 'secret' ? (value ? '입력됨' : '비어 있음') : value instanceof File ? (value.name ? '선택됨' : '선택 안 함') : value}`));
    setMessage(selected.join(' · ') || '입력된 값이 없습니다.');
  }

  return <section data-suite="fields" className="component-card hds-fieldsDemo" aria-labelledby="fields-demo-title">
    <div className="component-title"><span className="component-index">13 FIELDS</span><h3 id="fields-demo-title">입력과 선택 필드</h3></div>
    <p>검색어와 선택값, 파일과 날짜를 포함한 공통 폼 요소입니다. 브라우저 기본 선택 목록도 직접 비교할 수 있습니다. 제출 결과는 화면에만 표시합니다.</p>
    <form className="demo-form" onSubmit={submit} onReset={() => { setTeam(null); setMember(null); setMembers(['frontend']); setMessage('입력값을 초기화했습니다.'); }}>
      <fieldset disabled={!ready} className="hds-fieldsDemo__fieldset"><legend className="sr-only">공통 입력 필드 예제</legend>
      <div className="hds-fieldsDemo__grid">
        <div className="hds-field"><label className="hds-field__label" htmlFor="fields-alias">표시 이름</label><Input id="fields-alias" name="alias" placeholder="예: 작은 작업실" /></div>
        <Textarea label="추가 설명" name="notes" rows={3} hint="여러 줄을 입력할 수 있어요." />
        <Select label="소속 팀" name="team" options={teams} value={team} onValueChange={setTeam} placeholder="팀 선택" />
        <NativeSelect label="소속 팀 (브라우저 기본 선택)" name="nativeTeam" options={teams} placeholder="팀 선택" />
        <Combobox label="담당 팀 검색" name="member" options={teams} value={member} onValueChange={setMember} placeholder="팀 이름 검색" />
        <MultiSelect label="협업 팀" name="members" options={teams} value={members} onValueChange={setMembers} placeholder="팀을 검색하세요" />
        <Switch label="알림 사용" name="notifications" defaultChecked hint="스위치를 눌러 바꿔 보세요." />
        <RadioGroup label="공유 범위" name="visibility" options={[{ value: 'personal', label: '나만 보기' }, { value: 'team', label: '팀 보기' }]} defaultValue="personal" />
        <Slider label="진행 단계" name="progress" min={0} max={100} defaultValue={40} step={10} />
        <NumberField label="초대 수" name="invites" min={0} max={20} defaultValue={2} />
        <DateField label="예정 날짜" name="dueDate" />
        <FileInput label="참고 파일" name="attachment" accept=".pdf,.png,.jpg" />
        <PasswordField label="접속 코드" name="secret" hint="보기 버튼으로 입력을 확인할 수 있어요." autoComplete="new-password" />
      </div>
      <div className="form-actions"><button type="submit" className="hds-button hds-button--primary hds-button--md">폼 값 확인</button><button type="reset" className="hds-button hds-button--secondary hds-button--md">초기화</button></div>
      </fieldset>
      <p role="status" className="demo-status">{message}</p>
    </form>
  </section>;
}
