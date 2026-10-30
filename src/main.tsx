import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminSettingsProvider } from './context/AdminSettingsContext';
import { Router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminSettingsProvider>
      <Router />
    </AdminSettingsProvider>
  </React.StrictMode>
);
