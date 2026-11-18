import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NativeSelect } from '../../src/fields.js';
import { NativeDialog } from '../../src/overlays.js';

function NativeAlternatives() {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [controlledTeam, setControlledTeam] = useState<string | null>('design');
  return <main>
    <h1>Native accessibility alternatives</h1>
    <form id="native-form">
      <NativeSelect label="Team" name="team" required hint="Choose one team" options={[
        { value: 'design', label: 'Design' }, { value: 'operations', label: 'Operations' },
      ]} />
      <NativeSelect label="Controlled team" name="controlledTeam" value={controlledTeam} onValueChange={setControlledTeam} options={[
        { value: 'design', label: 'Design' }, { value: 'operations', label: 'Operations' },
      ]} />
      <button type="reset">Reset fields</button>
    </form>
    <NativeDialog trigger={<button type="button" id="open-native">Open native dialog</button>}
      title="Native settings" description="Choose a visibility setting" closeLabel="Close native dialog">
      <NativeSelect label="Visibility" name="visibility" defaultValue="private" options={[
        { value: 'private', label: 'Private' }, { value: 'public', label: 'Public' },
      ]} />
      <fieldset><legend>Mode</legend>
        <label><input type="radio" name="mode" value="standard" defaultChecked />Standard</label>
        <label><input type="radio" name="mode" value="advanced" />Advanced</label>
      </fieldset>
      <div role="textbox" aria-label="Notes" contentEditable suppressContentEditableWarning>Draft</div>
      <button type="button">Inside action</button>
    </NativeDialog>
    <NativeDialog trigger={<button type="button" id="open-controlled">Open controlled dialog</button>}
      title="Controlled settings" open={controlledOpen} onOpenChange={setControlledOpen}>
      <button type="button">Controlled action</button>
    </NativeDialog>
    <button type="button" id="after-native">After dialog</button>
  </main>;
}

createRoot(document.getElementById('consumer')!).render(<NativeAlternatives />);
