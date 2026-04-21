import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { loadRuntimeConfig } from './api';
import { clearClientStorageIfNewDistributionBuild } from './utils/distributionStorageReset';

// Packaged builds: drop stale localhost session/cache when exe/zip was rebuilt
clearClientStorageIfNewDistributionBuild();

// Load runtime configuration before rendering the app
// This allows the .exe to read config from .env file
loadRuntimeConfig().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

