import assert from 'node:assert/strict';

const afterTwoFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

export async function exerciseNativeDialogForm(page, base) {
  await page.goto(base + '__consumer/native-dialog-form.html');
  const controlledTrigger = page.locator('#controlled-trigger');
  const controlledDialog = page.locator('dialog').first();
  await controlledTrigger.click();
  await page.locator('#nested-trigger').click();
  await page.locator('#nested-submit').click();
  await page.waitForFunction(() => {
    const inner = document.querySelector('#nested-submit')?.closest('dialog');
    return inner && !inner.open && document.querySelector('dialog')?.open && document.activeElement?.id === 'nested-trigger';
  });
  const nested = await page.evaluate(() => ({
    outerOpen: document.querySelector('dialog').open,
    innerOpen: document.querySelector('#nested-submit').closest('dialog').open,
    innerReturnValue: document.querySelector('#nested-submit').closest('dialog').returnValue,
    focusedElement: document.activeElement?.id,
    requests: window.dialogRequests,
  }));
  assert.deepEqual(nested, { outerOpen: true, innerOpen: false, innerReturnValue: 'nested', focusedElement: 'nested-trigger', requests: [true] }, 'A child dialog form closes only its owner');

  await page.locator('#controlled-submit').click();
  await page.waitForFunction(() => window.dialogRequests?.length === 2);
  await afterTwoFrames(page);
  const rejected = await page.evaluate(() => {
    const dialog = document.querySelector('dialog');
    return {
      expanded: document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded'),
      open: dialog.open,
      focusInside: dialog.contains(document.activeElement),
      returnValue: dialog.returnValue,
      requests: window.dialogRequests,
    };
  });
  assert.deepEqual(rejected, { expanded: 'true', open: true, focusInside: true, returnValue: '', requests: [true, false] }, 'Rejected method=dialog close keeps the controlled modal and focus open');

  await controlledDialog.locator(':scope > header > .hds-dialog__close').click();
  await page.waitForFunction(() => window.dialogRequests?.length === 3);
  assert.equal(await controlledDialog.evaluate(dialog => dialog.open), true, 'A rejected explicit close keeps the modal open');
  await page.locator('#parent-close').click();
  await page.waitForFunction(() => !document.querySelector('dialog')?.open && document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded') === 'false' && document.activeElement?.id === 'controlled-trigger');
  const independentClose = await page.evaluate(() => ({ returnValue: document.querySelector('dialog').returnValue, requests: window.dialogRequests }));
  assert.deepEqual(independentClose, { returnValue: '', requests: [true, false, false] }, 'A later explicit close request clears the prior form value');
  await controlledTrigger.click();
  await page.waitForFunction(() => document.querySelector('dialog')?.open && window.dialogRequests?.length === 4);

  await controlledDialog.evaluate(dialog => dialog.close());
  await page.waitForFunction(() => window.dialogRequests?.length === 5 && document.querySelector('dialog')?.open);
  await afterTwoFrames(page);
  const recovered = await page.evaluate(() => {
    const dialog = document.querySelector('dialog');
    return { open: dialog.open, expanded: document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded'), focusInside: dialog.contains(document.activeElement), requests: window.dialogRequests };
  });
  assert.deepEqual(recovered, { open: true, expanded: 'true', focusInside: true, requests: [true, false, false, true, false] }, 'A native close cannot leave a controlled modal closed or dispatch a stale second close');

  await page.locator('#allow-close').click();
  await page.locator('#controlled-submit').click();
  await page.waitForFunction(() => {
    const dialog = document.querySelector('dialog');
    return !dialog.open && document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded') === 'false' && document.activeElement?.id === 'controlled-trigger';
  });
  await afterTwoFrames(page);
  const accepted = await page.evaluate(() => ({
    open: document.querySelector('dialog').open,
    expanded: document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded'),
    returnValue: document.querySelector('dialog').returnValue,
    focusedElement: document.activeElement?.id,
    requests: window.dialogRequests,
  }));
  assert.deepEqual(accepted, { open: false, expanded: 'false', returnValue: 'save', focusedElement: 'controlled-trigger', requests: [true, false, false, true, false, false] }, 'Accepted controlled form close preserves returnValue and restores trigger focus');

  await controlledTrigger.click();
  await page.locator('#async-close').click();
  await page.locator('#controlled-async-submit').click();
  await page.waitForFunction(() => window.dialogRequests?.length === 8);
  await afterTwoFrames(page);
  assert.equal(await controlledDialog.evaluate(dialog => dialog.open), true, 'The modal stays open while the owner validates a form submission');
  await page.locator('#finish-validation').click();
  await page.waitForFunction(() => !document.querySelector('dialog')?.open && document.querySelector('dialog')?.returnValue === 'save-async' && document.activeElement?.id === 'controlled-trigger');
  const asynchronousAcceptance = await page.evaluate(() => ({ returnValue: document.querySelector('dialog').returnValue, requests: window.dialogRequests }));
  assert.deepEqual(asynchronousAcceptance, { returnValue: 'save-async', requests: [true, false, false, true, false, false, true, false] }, 'Delayed acceptance retains the submitted value');

  await controlledTrigger.click();
  await page.locator('#rapid-reopen').click();
  await controlledDialog.locator(':scope > header > .hds-dialog__close').click();
  await page.waitForFunction(() => window.dialogRequests?.length >= 10);
  await afterTwoFrames(page);
  const rapidReopen = await page.evaluate(() => {
    const dialog = document.querySelector('dialog');
    return { open: dialog.open, expanded: document.querySelector('#controlled-trigger')?.getAttribute('aria-expanded'), focusInside: dialog.contains(document.activeElement), requests: window.dialogRequests };
  });
  assert.deepEqual(rapidReopen, { open: true, expanded: 'true', focusInside: true, requests: [true, false, false, true, false, false, true, false, true, false] }, 'A queued native close event cannot close a dialog reopened in a microtask');
  await page.locator('#parent-close').click();
  await page.waitForFunction(() => !document.querySelector('dialog')?.open && document.activeElement?.id === 'controlled-trigger');

  const uncontrolledTrigger = page.locator('#uncontrolled-trigger');
  await uncontrolledTrigger.click();
  await page.locator('#uncontrolled-submit').click();
  await page.waitForFunction(() => !document.querySelector('#uncontrolled-submit').closest('dialog').open && document.querySelector('#uncontrolled-close-count')?.textContent === '1' && document.activeElement?.id === 'uncontrolled-trigger');
  const uncontrolled = await page.evaluate(() => ({ open: document.querySelector('#uncontrolled-submit').closest('dialog').open, returnValue: document.querySelector('#uncontrolled-submit').closest('dialog').returnValue, focusedElement: document.activeElement?.id, closeCount: document.querySelector('#uncontrolled-close-count')?.textContent }));
  assert.deepEqual(uncontrolled, { open: false, returnValue: 'dismiss', focusedElement: 'uncontrolled-trigger', closeCount: '1' }, 'Uncontrolled native form close retains browser semantics');
  await uncontrolledTrigger.click();
  await page.waitForFunction(() => document.querySelector('#uncontrolled-submit').closest('dialog').open && document.querySelector('#uncontrolled-trigger')?.getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#uncontrolled-submit').closest('dialog').open && document.querySelector('#uncontrolled-close-count')?.textContent === '2' && document.activeElement?.id === 'uncontrolled-trigger');

  await page.locator('#image-trigger').click();
  await page.locator('#image-submit').click({ position: { x: 6, y: 6 } });
  await page.waitForFunction(() => !document.querySelector('#image-submit').closest('dialog').open && document.activeElement?.id === 'image-trigger');
  const imageResult = await page.locator('#image-submit').evaluate(input => input.closest('dialog').returnValue);
  assert.match(imageResult, /^\d+,\d+$/, 'Native image submission returns coordinates');
  return { imageResult, nested, rejected, independentClose, recovered, accepted, asynchronousAcceptance, rapidReopen, uncontrolled, immediateReopen: true };
}
