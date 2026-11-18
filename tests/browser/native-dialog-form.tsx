import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NativeDialog } from '../../dist/overlays.js';

function App() {
  const [open, setOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [allowClose, setAllowClose] = useState(false);
  const [deferClose, setDeferClose] = useState(false);
  const [awaitingValidation, setAwaitingValidation] = useState(false);
  const [reopenOnClose, setReopenOnClose] = useState(false);
  const reopenedRef = useRef(false);
  const [uncontrolledCloseCount, setUncontrolledCloseCount] = useState(0);
  (window as typeof window & { dialogRequests?: boolean[] }).dialogRequests ??= [];

  return <main>
    <NativeDialog
      trigger={<button type="button" id="controlled-trigger">Open controlled</button>}
      title="Controlled form"
      open={open}
      onOpenChange={next => {
        window.dialogRequests!.push(next);
        if (!next && deferClose) setAwaitingValidation(true);
        else if (next || allowClose) setOpen(next);
        if (!next && reopenOnClose && !reopenedRef.current) {
          reopenedRef.current = true;
          queueMicrotask(() => setOpen(true));
        }
      }}>
      <button type="button" id="allow-close" onClick={() => setAllowClose(true)}>Allow close</button>
      <button type="button" id="parent-close" onClick={() => setOpen(false)}>Parent closes independently</button>
      <button type="button" id="async-close" onClick={() => setDeferClose(true)}>Await validation</button>
      <button type="button" id="finish-validation" disabled={!awaitingValidation} onClick={() => { setAwaitingValidation(false); setOpen(false); }}>Finish validation</button>
      <button type="button" id="rapid-reopen" onClick={() => { reopenedRef.current = false; setDeferClose(false); setReopenOnClose(true); }}>Reopen in a microtask</button>
      <form method="dialog"><button type="submit" value="save" id="controlled-submit">Save</button><button type="submit" value="save-async" id="controlled-async-submit">Save after validation</button></form>
      <NativeDialog trigger={<button type="button" id="nested-trigger">Open nested</button>} title="Nested form">
        <form method="dialog"><button type="submit" value="nested" id="nested-submit">Close nested</button></form>
      </NativeDialog>
    </NativeDialog>
    <NativeDialog
      trigger={<button type="button" id="uncontrolled-trigger">Open uncontrolled</button>}
      title="Uncontrolled form"
      onOpenChange={next => { if (!next) setUncontrolledCloseCount(count => count + 1); }}>
      <form method="dialog"><button type="submit" value="dismiss" id="uncontrolled-submit">Dismiss</button></form>
    </NativeDialog>
    <NativeDialog trigger={<button id="image-trigger">Open image form</button>} title="Image form" open={imageOpen} onOpenChange={setImageOpen}>
      <form method="dialog"><input id="image-submit" type="image" alt="Submit image" value="image" width="48" height="48" /></form>
    </NativeDialog>
    <output id="uncontrolled-close-count">{uncontrolledCloseCount}</output>
  </main>;
}

declare global {
  interface Window { dialogRequests?: boolean[] }
}

createRoot(document.getElementById('consumer')!).render(<App />);
