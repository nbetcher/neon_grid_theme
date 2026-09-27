import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@neon-grid/kit-core/theme.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
