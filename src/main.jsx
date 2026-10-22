import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App';
import { ThemeProvider } from './lib/theme';
import { StoreProvider } from './store/store';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ThemeProvider><StoreProvider><App /></StoreProvider></ThemeProvider></React.StrictMode>
);
