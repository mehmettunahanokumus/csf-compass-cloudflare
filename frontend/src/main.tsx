import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize theme before React renders to prevent flash of wrong theme
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('csf-theme') || 'system';
  const root = document.documentElement;

  if (savedTheme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', systemTheme);
  } else {
    root.setAttribute('data-theme', savedTheme);
  }
};

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
