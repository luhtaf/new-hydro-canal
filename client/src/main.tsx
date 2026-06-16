import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { initTheme } from './shared/stores/theme.js';
import { initRole } from './shared/stores/role.js';
import './shared/styles/globals.css';

// Sinkron class body (dark / role) sebelum render pertama → cegah flash.
initTheme();
initRole();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
