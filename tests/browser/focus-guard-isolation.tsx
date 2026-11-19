import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Select } from '../../dist/fields.js';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Menu } from '@base-ui/react/menu';
import { DropdownMenu } from '../../dist/overlays.js';

const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

function FocusGuardIsolation() {
  const [rawOpen, setRawOpen] = useState(false);
  const [hdsOpen, setHdsOpen] = useState(false);
  return <main>
    <Select label="HDS team" options={options} />
    <BaseSelect.Root items={options}>
      <BaseSelect.Trigger aria-label="Unrelated team"><BaseSelect.Value placeholder="Choose" /></BaseSelect.Trigger>
      <BaseSelect.Portal><BaseSelect.Positioner><BaseSelect.Popup><BaseSelect.List>
        {options.map(option => <BaseSelect.Item key={option.value} value={option.value} label={option.label}><BaseSelect.ItemText>{option.label}</BaseSelect.ItemText></BaseSelect.Item>)}
      </BaseSelect.List></BaseSelect.Popup></BaseSelect.Positioner></BaseSelect.Portal>
    </BaseSelect.Root>
    <button type="button" onClick={() => { setRawOpen(true); setHdsOpen(true); }}>Show adjacent menus</button>
    <Menu.Root open={rawOpen} onOpenChange={setRawOpen}>
      <Menu.Trigger render={<button type="button" id="raw-menu">Raw menu</button>} />
      <Menu.Portal><Menu.Positioner className="raw-menu-positioner"><Menu.Popup className="raw-menu-popup">
        <Menu.Item>Raw item<span data-hds-focus-portal="" aria-hidden="true" /></Menu.Item>
      </Menu.Popup></Menu.Positioner></Menu.Portal>
    </Menu.Root>
    <DropdownMenu trigger={<button type="button" id="hds-menu">HDS menu</button>} open={hdsOpen}
      items={[{ kind: 'action', id: 'go', label: 'HDS item', onSelect() {} }]} />
  </main>;
}

createRoot(document.getElementById('consumer')!).render(<FocusGuardIsolation />);
