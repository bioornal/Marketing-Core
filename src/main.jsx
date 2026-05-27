import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import './styles/tokens.css';
import './styles/ui.css';
import './styles/shell.css';
import './styles/series-shell.css';
import './styles/studio.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
