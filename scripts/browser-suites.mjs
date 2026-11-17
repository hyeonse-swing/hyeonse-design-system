import assert from 'node:assert/strict';

async function category(page, base, name) {
  await page.goto(base);
  await page.locator(`[data-library-category="${name}"]`).click();
  await page.locator(`[data-suite="${name}"]`).waitFor();
  return page.locator(`[data-suite="${name}"]`);
}

async function waitForFocus(page, locator) {
  await page.waitForFunction(element => element === document.activeElement, await locator.elementHandle());
}

export async function exerciseFields(page, base) {
  const scope = await category(page, base, 'fields');
  await scope.getByLabel('표시 이름', { exact: true }).fill('Browser example');
  await scope.getByLabel('추가 설명', { exact: true }).fill('Several\nlines');
  const select = scope.getByRole('combobox', { name: '소속 팀', exact: true });
  await select.click();
  assert.equal(await page.getByRole('option', { name: '종료된 팀', exact: true }).getAttribute('aria-disabled'), 'true');
  await page.getByRole('option', { name: '디자인', exact: true }).click();
  assert.match(await select.innerText(), /디자인/);
  await select.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await waitForFocus(page, select);
  assert.equal(await select.evaluate(element => element === document.activeElement), true);

  const search = scope.getByRole('combobox', { name: '담당 팀 검색', exact: true });
  await search.fill('운영');
  await page.getByRole('option', { name: '운영', exact: true }).waitFor();
  await search.press('ArrowDown');
  await search.press('Enter');
  assert.equal(await search.inputValue(), '운영');
  const multi = scope.getByRole('combobox', { name: '협업 팀', exact: true });
  await multi.fill('운영');
  await page.getByRole('option', { name: '운영', exact: true }).click();
  assert.deepEqual(await scope.locator('form').evaluate(form => new FormData(form).getAll('members')), ['frontend', 'operations']);
  // A closed Base UI combobox uses Escape to clear selection. Firefox already
  // closes this popup after the option click, so only dismiss an open popup.
  if (await multi.getAttribute('aria-expanded') === 'true') await multi.press('Escape');
  await scope.getByRole('button', { name: '프론트엔드 제거', exact: true }).click();
  await scope.getByRole('switch', { name: '알림 사용', exact: true }).focus();
  await page.keyboard.press('Space');
  assert.equal(await scope.getByRole('switch', { name: '알림 사용', exact: true }).getAttribute('aria-checked'), 'false');
  const radio = scope.getByRole('radio', { name: '나만 보기', exact: true });
  await radio.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await scope.getByRole('radio', { name: '팀 보기', exact: true }).getAttribute('aria-checked'), 'true');
  await scope.getByRole('button', { name: '값 증가', exact: true }).click();
  assert.equal(await scope.getByLabel('초대 수', { exact: true }).inputValue(), '3');
  const number = scope.getByLabel('초대 수', { exact: true });
  await number.fill('20');
  await number.press('Tab');
  assert.equal(await scope.getByRole('button', { name: '값 증가', exact: true }).isDisabled(), true);
  await number.fill('0');
  await number.press('Tab');
  assert.equal(await scope.getByRole('button', { name: '값 감소', exact: true }).isDisabled(), true);
  await number.fill('3');
  await number.press('Tab');
  const slider = scope.getByRole('slider', { name: '진행 단계', exact: true });
  await slider.focus();
  await slider.press('ArrowRight');
  assert.equal(await slider.inputValue(), '50');
  await scope.getByLabel('예정 날짜', { exact: true }).fill('2026-12-01');
  await scope.getByLabel('참고 파일', { exact: true }).setInputFiles({ name: 'example.pdf', mimeType: 'application/pdf', buffer: Buffer.from('local fixture') });
  const password = scope.getByLabel('접속 코드', { exact: true });
  await password.fill('browser-secret-42');
  await scope.getByRole('button', { name: '비밀번호 표시', exact: true }).click();
  assert.equal(await password.getAttribute('type'), 'text');
  await scope.getByRole('button', { name: '비밀번호 숨기기', exact: true }).click();
  assert.equal(await password.getAttribute('type'), 'password');
  const form = await scope.locator('form').evaluate(element => {
    const data = new FormData(element);
    return { team: data.get('team'), member: data.get('member'), members: data.getAll('members'), notifications: data.get('notifications'), visibility: data.get('visibility'), invites: data.get('invites'), dueDate: data.get('dueDate'), file: data.get('attachment')?.name };
  });
  assert.deepEqual(form, { team: 'design', member: 'operations', members: ['operations'], notifications: null, visibility: 'team', invites: '3', dueDate: '2026-12-01', file: 'example.pdf' });
  await scope.getByRole('button', { name: '폼 값 확인', exact: true }).click();
  assert.equal((await scope.locator('.demo-status').innerText()).includes('browser-secret-42'), false, 'Demo never echoes a password');
  await scope.getByRole('button', { name: '초기화', exact: true }).click();
  assert.equal(await scope.getByLabel('표시 이름', { exact: true }).inputValue(), '');
  assert.equal(await scope.getByLabel('초대 수', { exact: true }).inputValue(), '2');
  assert.equal(await scope.getByRole('switch', { name: '알림 사용', exact: true }).getAttribute('aria-checked'), 'true');
  assert.deepEqual(await scope.locator('form').evaluate(element => new FormData(element).getAll('members')), ['frontend']);
  return { nativeAndCustomFormValues: true, keyboard: true, reset: true, passwordDisplay: true };
}

export async function exerciseOverlays(page, base) {
  const scope = await category(page, base, 'overlays');
  const trigger = scope.getByRole('button', { name: '드롭다운 메뉴', exact: true });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('menu').waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
  await page.keyboard.press('Enter');
  await scope.getByRole('status').filter({ hasText: '편집을 선택했어요.' }).waitFor();
  await page.getByRole('menu').waitFor({ state: 'hidden' });
  await waitForFocus(page, trigger);
  assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
  await trigger.click();
  await page.getByRole('menuitemcheckbox', { name: '상단에 고정', exact: true }).click();
  await page.keyboard.press('Escape');
  await trigger.click();
  assert.equal(await page.getByRole('menuitemcheckbox', { name: '상단에 고정', exact: true }).getAttribute('aria-checked'), 'true');
  await page.getByRole('menuitem', { name: '공유', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitem', { name: '링크 복사', exact: true }).click();
  await scope.getByRole('status').filter({ hasText: '링크 복사를 선택했어요.' }).waitFor();
  await scope.getByRole('button', { name: '우클릭 메뉴', exact: true }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: '편집', exact: true }).click();
  const dialogTrigger = scope.getByRole('button', { name: '대화상자', exact: true });
  await dialogTrigger.click();
  const dialog = page.getByRole('dialog', { name: '프로젝트 설정', exact: true });
  await dialog.waitFor();
  await dialog.getByRole('combobox', { name: '프로젝트 공개 범위', exact: true }).click();
  await page.getByRole('option', { name: '비공개', exact: true }).click();
  assert.match(await dialog.getByRole('combobox').innerText(), /비공개/);
  await dialog.getByRole('button', { name: '추가 설정', exact: true }).click();
  await page.getByRole('menuitem', { name: '보관 설정', exact: true }).click();
  await dialog.getByRole('button', { name: '공개 범위 도움말', exact: true }).click();
  const nestedPopover = page.getByRole('dialog', { name: '공개 범위 안내', exact: true });
  await nestedPopover.getByRole('button', { name: '닫기', exact: true }).click();
  await nestedPopover.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('.hds-dialog__popup')?.contains(document.activeElement));
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => document.querySelector('.hds-dialog__popup')?.contains(document.activeElement));
    assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, `Modal retains keyboard focus: ${await page.evaluate(() => document.activeElement?.outerHTML)}`);
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await waitForFocus(page, dialogTrigger);
  assert.equal(await dialogTrigger.evaluate(element => element === document.activeElement), true);
  await scope.getByRole('button', { name: '삭제 확인', exact: true }).click();
  const alert = page.getByRole('alertdialog', { name: '프로젝트를 삭제할까요?', exact: true });
  await alert.getByRole('button', { name: '취소', exact: true }).click();
  assert.equal((await scope.getByRole('status').innerText()).includes('프로젝트를 삭제했어요.'), false);
  await scope.getByRole('button', { name: '삭제 확인', exact: true }).click();
  await alert.getByRole('button', { name: '삭제', exact: true }).click();
  await alert.waitFor({ state: 'hidden' });
  await scope.getByRole('status').filter({ hasText: '프로젝트를 삭제했어요.' }).waitFor();
  await scope.getByRole('button', { name: '사이드 시트', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '작업 상세', exact: true });
  await sheet.waitFor();
  await sheet.getByRole('combobox', { name: '담당자', exact: true }).fill('임현');
  await page.getByRole('option', { name: '임현세', exact: true }).click();
  assert.equal(await sheet.getByRole('combobox', { name: '담당자', exact: true }).inputValue(), '임현세');
  assert.equal(await sheet.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= -1 && rect.right <= innerWidth + 1; }), true, 'Sheet fits viewport');
  await sheet.getByRole('button', { name: '닫기', exact: true }).click();
  await scope.getByRole('button', { name: '팝오버', exact: true }).click();
  const popover = page.getByRole('dialog', { name: '최근 알림', exact: true });
  await popover.waitFor();
  await page.keyboard.press('Escape');
  await popover.waitFor({ state: 'hidden' });
  const tooltipTrigger = scope.getByRole('button', { name: '단축키 도움말', exact: true });
  await scope.getByRole('button', { name: '팝오버', exact: true }).focus();
  // Safari's macOS default skips buttons with plain Tab; Option-Tab includes them.
  await page.keyboard.press(page.context().browser().browserType().name() === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  assert.equal(await tooltipTrigger.evaluate(element => element === document.activeElement), true);
  // Base UI 1.9 tooltips are supplementary visual labels; the trigger owns its name.
  const tooltip = page.locator('.hds-tooltip__popup');
  await tooltip.waitFor();
  assert.equal(await tooltip.innerText(), '단축키 도움말');
  await page.keyboard.press('Escape');
  await tooltip.waitFor({ state: 'hidden' });
  await scope.getByRole('button', { name: '토스트 알림', exact: true }).click();
  const toast = page.locator('.hds-toast').filter({ hasText: '저장 완료' });
  await toast.waitFor();
  await page.keyboard.press('F6');
  await page.waitForFunction(() => document.activeElement?.classList.contains('hds-toast__viewport'));
  await toast.getByRole('button', { name: '알림 닫기', exact: true }).click();
  await toast.waitFor({ state: 'hidden' });
  return { menuAndSubmenu: true, contextMenu: true, nestedPortals: true, focusTrapAndReturn: true, confirmAndCancel: true, sheet: true, popover: true, tooltip: true, toast: true };
}

export async function exerciseDisplay(page, base) {
  const scope = await category(page, base, 'display');
  const first = scope.getByRole('tab', { name: '개요', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await scope.getByRole('tab', { name: '활동', exact: true }).getAttribute('aria-selected'), 'true');
  await scope.getByRole('tabpanel').filter({ hasText: '최근 변경 사항과 팀의 활동' }).waitFor();
  await page.keyboard.press('Home');
  assert.equal(await first.getAttribute('aria-selected'), 'true');
  const accordion = scope.getByRole('button', { name: '자주 묻는 질문', exact: true });
  await accordion.click();
  assert.equal(await accordion.getAttribute('aria-expanded'), 'true');
  await accordion.press('Enter');
  assert.equal(await accordion.getAttribute('aria-expanded'), 'false');
  const collapsible = scope.getByRole('button', { name: '자세히 보기', exact: true });
  await collapsible.click();
  assert.equal(await collapsible.getAttribute('aria-expanded'), 'true');
  await collapsible.click();
  const pagination = scope.locator('.hds-pagination');
  await pagination.getByRole('button', { name: '다음 페이지', exact: true }).click();
  assert.equal(await pagination.locator('[aria-current="page"]').innerText(), '3');
  const toggle = scope.getByRole('button', { name: '격자', exact: true });
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(await scope.getByRole('button', { name: '목록', exact: true }).getAttribute('aria-pressed'), 'false');
  const table = scope.getByRole('table', { name: '주문 요약', exact: true });
  assert.equal(await table.getByRole('columnheader').count(), 2);
  assert.equal(await scope.getByRole('progressbar', { name: '진행률', exact: true }).getAttribute('aria-valuenow'), '40');
  assert.equal(await scope.getByRole('img', { name: '임현세', exact: true }).isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  return { tabKeyboard: true, accordion: true, collapsible: true, pagination: true, selection: true, tableSemantics: true, feedback: true };
}

export async function exerciseExpandedAccessibility(page, base, check, snapshot) {
  // Keep axe in a document without Playwright accessible-name queries. Firefox
  // crashes when both traverse this complex tree; role/name contracts are tested
  // separately by exerciseFields, exerciseOverlays, and exerciseDisplay.
  const checked = [];
  for (const name of ['fields', 'overlays', 'display']) {
    const scope = await category(page, base, name);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['light', 'dark']) {
        await page.locator(`input[type="radio"][name$="-theme"][value="${theme}"]`).check();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}/${width}/${theme} overflow`);
        await check(page);
        if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark')) {
          await scope.scrollIntoViewIfNeeded();
          await snapshot(page, `${name}-${width}-${theme}`);
        }
        checked.push(`${name}/${width}/${theme}`);
      }
    }
  }
  let scope = await category(page, base, 'fields');
  await scope.locator('button.hds-field__trigger[aria-label="소속 팀"]').click();
  await page.locator('[role="option"]:visible').filter({ hasText: /^디자인$/ }).waitFor();
  await check(page);
  await page.keyboard.press('Escape');
  await page.locator('.hds-field__popup').waitFor({ state: 'hidden' });
  await page.evaluate(() => { window.__hdsA11yHiddenBeforeCombo = new WeakSet(document.querySelectorAll('[aria-hidden="true"]')); });
  await scope.locator('input.hds-field__comboInput[placeholder="팀 이름 검색"]').fill('운영');
  await page.locator('[role="option"]:visible').filter({ hasText: /^운영$/ }).waitFor();
  await check(page);
  await page.keyboard.press('Escape');
  scope = await category(page, base, 'overlays');
  for (const [trigger, role, name] of [
    ['드롭다운 메뉴', 'menu', null],
    ['대화상자', 'dialog', '프로젝트 설정'],
    ['삭제 확인', 'alertdialog', '프로젝트를 삭제할까요?'],
    ['사이드 시트', 'dialog', '작업 상세'],
    ['팝오버', 'dialog', '최근 알림'],
  ]) {
    await scope.locator('button').filter({ hasText: new RegExp(`^${trigger}$`) }).click();
    const surface = page.locator(`[role="${role}"]:visible`);
    if (name) await surface.filter({ hasText: name }).waitFor();
    await surface.waitFor();
    await check(page);
    assert.equal(await surface.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= -1 && rect.right <= innerWidth + 1; }), true, `${trigger} fits viewport`);
    if (trigger === '대화상자') {
      await surface.locator('button.hds-field__trigger[aria-label="프로젝트 공개 범위"]').click();
      await page.locator('[role="option"]:visible').filter({ hasText: /^비공개$/ }).waitFor();
      await check(page);
      await page.keyboard.press('Escape');
    }
    await page.keyboard.press('Escape');
    await surface.waitFor({ state: 'hidden' });
    checked.push(`open/${trigger}`);
  }
  await scope.locator('button').filter({ hasText: /^토스트 알림$/ }).click();
  await page.locator('.hds-toast').waitFor();
  // A fixed toast can cover the underlying status text on narrow screens.
  // Scan the visible notification, then close it and inspect the whole page so
  // both surfaces retain every axe rule without an indeterminate bgOverlap.
  await check(page, '.hds-toast');
  await page.locator('.hds-toast__close').click();
  await page.locator('.hds-toast').waitFor({ state: 'hidden' });
  await check(page);
  checked.push('open/toast', 'open/select', 'open/combobox', 'open/nested-select');
  return checked;
}

export async function exerciseFocusGuards(page, base) {
  const observations = [];
  const scenarios = ['select', 'combobox', 'multi', 'menu', 'dialog', 'nested-select', 'alert', 'sheet', 'nested-combobox', 'popover', 'toast'];
  async function open(name) {
    const fields = ['select', 'combobox', 'multi'].includes(name);
    const scope = await category(page, base, fields ? 'fields' : 'overlays');
    if (name === 'select') await scope.getByRole('combobox', { name: '소속 팀', exact: true }).click();
    if (name === 'combobox' || name === 'multi') await scope.getByRole('combobox', { name: name === 'multi' ? '협업 팀' : '담당 팀 검색', exact: true }).fill('운영');
    const triggers = { menu: '드롭다운 메뉴', dialog: '대화상자', 'nested-select': '대화상자', alert: '삭제 확인', sheet: '사이드 시트', 'nested-combobox': '사이드 시트', popover: '팝오버', toast: '토스트 알림' };
    if (triggers[name]) await scope.getByRole('button', { name: triggers[name], exact: true }).click();
    if (name === 'nested-select') await page.getByRole('combobox', { name: '프로젝트 공개 범위', exact: true }).click();
    if (name === 'nested-combobox') await page.getByRole('combobox', { name: '담당자', exact: true }).fill('임현');
    const surface = fields || name.startsWith('nested-') ? '.hds-field__popup' : name === 'menu' ? '.hds-menu__popup' : name === 'popover' ? '.hds-popover__popup' : name === 'toast' ? '.hds-toast' : '.hds-dialog__popup';
    await page.locator(surface).waitFor();
  }
  for (const scenario of scenarios) {
    await open(scenario);
    const count = await page.locator('[data-base-ui-focus-guard][tabindex="0"]').count();
    if (!count) observations.push({ scenario, guards: 0 });
    for (let index = 0; index < count; index++) {
      if (index > 0) await open(scenario);
      await page.locator('[data-base-ui-focus-guard][tabindex="0"]').nth(index).evaluate(element => element.focus());
      await page.waitForFunction(() => {
        const active = document.activeElement;
        return active instanceof HTMLElement && active !== document.body && active.isConnected && !active.hasAttribute('data-base-ui-focus-guard') && !active.closest('[aria-hidden="true"], [inert]') && active.getClientRects().length > 0;
      }, undefined, { timeout: 1000 });
      observations.push({ scenario, guard: index, redirected: true, destination: await page.evaluate(() => ({ tag: document.activeElement.tagName, role: document.activeElement.getAttribute('role') })) });
    }
    if (['dialog', 'alert', 'sheet'].includes(scenario)) {
      await open(scenario);
      for (const key of ['Tab', 'Shift+Tab']) {
        for (let index = 0; index < 10; index++) {
          await page.keyboard.press(key);
          await page.waitForFunction(() => document.querySelector('.hds-dialog__popup')?.contains(document.activeElement));
        }
      }
      observations.push({ scenario, keyboardSteps: 20, trapped: true });
    }
  }
  return observations;
}

export async function exerciseComboboxDismissal(page, base) {
  const observations = [];
  for (const name of ['담당 팀 검색', '협업 팀', '담당자']) {
    for (const action of ['Tab', 'Shift+Tab', 'outside-click']) {
      const nested = name === '담당자';
      const scope = await category(page, base, nested ? 'overlays' : 'fields');
      if (nested) await scope.getByRole('button', { name: '사이드 시트', exact: true }).click();
      await page.evaluate(() => { window.__hdsA11yHiddenBeforeCombo = new WeakSet(document.querySelectorAll('[aria-hidden="true"]')); });
      await page.getByRole('combobox', { name, exact: true }).fill(nested ? '임현' : '운영');
      await page.locator('.hds-field__popup').waitFor();
      const hiddenCount = await page.evaluate(() => {
        window.__hdsHiddenDuringCombo = [...document.querySelectorAll('[aria-hidden="true"]')].filter(element => !window.__hdsA11yHiddenBeforeCombo.has(element) && !element.hasAttribute('data-base-ui-focus-guard'));
        return window.__hdsHiddenDuringCombo.length;
      });
      if (action === 'outside-click') {
        if (nested) await page.getByRole('dialog', { name: '작업 상세', exact: true }).locator('.hds-dialog__title').click();
        else await scope.locator('#fields-alias').click();
      } else await page.keyboard.press(action);
      await page.locator('.hds-field__popup').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => window.__hdsHiddenDuringCombo.every(element => !element.isConnected || element.getAttribute('aria-hidden') !== 'true'));
      assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[aria-hidden="true"], [inert]'))), false, 'Dismissal restores access before focus leaves the combobox');
      observations.push({ name, action, temporaryHiddenElements: hiddenCount, restored: true });
    }
  }
  return observations;
}
