import { renderToString } from 'react-dom/server';
import { Showcase } from './Showcase.js';

export function renderShowcase() {
  return renderToString(<Showcase />);
}
