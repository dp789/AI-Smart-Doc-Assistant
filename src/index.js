import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// Use createRoot for React 18 compatibility
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

registerServiceWorker();
