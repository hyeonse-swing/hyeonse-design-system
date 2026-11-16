'use client';

import { useState } from 'react';
import { Badge, Button, Checkbox, TextField } from '@hyeonse/design-system/primitives';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';

type FormValues = { email: string; updates: boolean };

export function FormControls({ onSubmit, saving = false, emailError }: {
  onSubmit: (values: FormValues) => void;
  saving?: boolean;
  emailError?: string;
}) {
  const [email, setEmail] = useState('');
  const [updates, setUpdates] = useState(false);

  return <form onSubmit={event => {
    event.preventDefault();
    onSubmit({ email, updates });
  }}>
    <TextField
      label="이메일"
      name="email"
      type="email"
      autoComplete="email"
      required
      hint="연락받을 주소를 입력해 주세요."
      error={emailError}
      value={email}
      onChange={event => setEmail(event.currentTarget.value)}
    />
    <Checkbox
      label="업데이트 소식 받기"
      name="updates"
      checked={updates}
      onChange={event => setUpdates(event.currentTarget.checked)}
    />
    <Button type="submit" loading={saving} loadingLabel="저장 중">저장</Button>
    <Badge tone={emailError ? 'danger' : 'neutral'}>{emailError ? '이메일 확인 필요' : '입력 중'}</Badge>
  </form>;
}
