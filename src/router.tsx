import React, { useState, useEffect } from 'react';
import App from './App';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { isSessionAuthenticated } from './utils/auth';

export const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSessionAuthenticated());

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setIsAuthenticated(isSessionAuthenticated());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const normalized = currentPath.toLowerCase().replace(/\/$/, '') || '/';

  if (normalized === '/adminpanel') {
    if (!isAuthenticated) {
      return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
    }
    return <AdminPanel onLogout={() => setIsAuthenticated(false)} />;
  }

  return <App />;
};
