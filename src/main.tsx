import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/styles/global.css';
import 'virtual:uno.css';
import App from '@/App.tsx';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found!');
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
