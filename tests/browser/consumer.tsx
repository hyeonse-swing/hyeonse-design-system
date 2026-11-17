import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, Checkbox, TextField } from '@hyeonse/design-system/primitives';
import { PreferencesPanel, PreferencesProvider, usePreferences } from '@hyeonse/design-system/react';

function Consumer() {
  const [actions, setActions] = useState(0);
  const [submits, setSubmits] = useState(0);
  const [readonlyChanges, setReadonlyChanges] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => { document.body.dataset.consumerReady = 'true'; }, []);
  return <main>
    <h1>Component consumer checks</h1>
    <form id="native-form" onSubmit={event => { event.preventDefault(); setSubmits(value => value + 1); }}>
      <TextField id="project" name="project" label="Project" hint="Project help" error="Project example error" defaultValue="initial" />
      <TextField id="project-hint" name="other" label="Second project" />
      <TextField id="project-error" label="Third project" />
      <TextField label="Read-only text" name="readonlyText" value="unchanged" readOnly />
      <Checkbox id="flag" name="flag" label="Editable checkbox" hint="Flag help" error="Flag example error" />
      <Checkbox id="flag-hint" label="Second checkbox" />
      <Checkbox id="flag-error" label="Third checkbox" />
      <Checkbox name="readonly" value="yes" label="Readonly checkbox" defaultChecked readOnly onChange={() => setReadonlyChanges(value => value + 1)} />
      <Checkbox name="disabled" value="yes" label="Disabled checkbox" defaultChecked disabled />
      <fieldset disabled><legend>Disabled fieldset</legend><TextField name="fieldset" label="Disabled by fieldset" defaultValue="excluded" /></fieldset>
      <div className="actions"><Button onClick={() => setActions(value => value + 1)}>Action</Button><Button type="submit">Submit</Button><Button type="reset" variant="secondary">Reset form</Button></div>
    </form>
    <p>Action count: <output id="actions">{actions}</output>; submit count: <output id="submits">{submits}</output>; readonly changes: <output id="readonly-changes">{readonlyChanges}</output></p>
    <section aria-label="Loading name">
      <p id="save-name">Save changes</p>
      <Checkbox label="Set loading" checked={loading} onChange={event => setLoading(event.target.checked)} />
      <Button loading={loading} loadingLabel="Saving changes" aria-labelledby="save-name">Save changes</Button>
    </section>
    <section aria-label="Status examples" className="statuses"><Badge>Pending</Badge><Badge tone="accent">Selected</Badge><Badge tone="success">Complete</Badge><Badge tone="warning">Review</Badge><Badge tone="danger">Error</Badge></section>
  </main>;
}

function Settings({ name }: { name: 'A' | 'B' }) {
  const { preferences } = usePreferences();
  return <section aria-label={`Settings ${name}`}><PreferencesPanel locale="en" /><output data-settings={name}>{JSON.stringify(preferences)}</output></section>;
}

createRoot(document.getElementById('consumer')!).render(<Consumer />);
for (const name of ['A', 'B'] as const) {
  createRoot(document.getElementById(`settings-${name}`)!).render(<PreferencesProvider storageKey="hds-browser-settings"><Settings name={name} /></PreferencesProvider>);
}
