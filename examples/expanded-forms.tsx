'use client';

import { useState } from 'react';
import { Input, Textarea, Select, Combobox, MultiSelect, Switch, RadioGroup, Slider, NumberField, DateField, FileInput, PasswordField } from '@hyeonse/design-system/fields';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

export function ExpandedForms({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [country, setCountry] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>(['ko']);
  const [search, setSearch] = useState<string | null>(null);

  return <form onSubmit={event => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }}>
    <label htmlFor="expanded-alias">표시 이름</label>
    <Input id="expanded-alias" name="alias" required autoComplete="nickname" />
    <Textarea label="소개" name="bio" rows={3} hint="간단한 설명을 입력하세요." />
    <Select label="거주 국가" name="country" options={languages} placeholder="국가 선택" value={country} onValueChange={setCountry} required />
    <Combobox label="기본 언어" name="primaryLanguage" options={languages} value={search} onValueChange={setSearch} />
    <MultiSelect label="사용 언어" name="languages" options={languages} value={skills} onValueChange={setSkills} />
    <Switch label="알림 허용" name="notifications" defaultChecked hint="언제든 바꿀 수 있습니다." />
    <RadioGroup label="접근 수준" name="access" options={[{ value: 'viewer', label: '읽기' }, { value: 'editor', label: '편집' }]} defaultValue="viewer" />
    <Slider label="알림 빈도" name="frequency" min={0} max={10} defaultValue={5} />
    <NumberField label="초대 인원" name="seats" min={1} max={20} defaultValue={2} />
    <DateField label="시작 날짜" name="startDate" />
    <FileInput label="첨부 파일" name="attachment" accept=".pdf,.png" />
    <PasswordField label="접속 비밀번호" name="password" minLength={8} autoComplete="new-password" />
    <button type="submit">입력 확인</button>
  </form>;
}
