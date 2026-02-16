import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeFromDB } from './store/database.ts';

// Load persisted data from IndexedDB before rendering the app.
// This ensures Zustand stores are hydrated with saved game progress,
// vocabulary tracking, and settings before any component mounts.
initializeFromDB().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
