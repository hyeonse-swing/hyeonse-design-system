import { hydrateRoot } from 'react-dom/client';
import { Showcase } from './Showcase.js';

hydrateRoot(document.getElementById('catalog-root')!, <Showcase />);
