import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';
import { BrowserRouter as Router } from 'react-router-dom';
import { TopicProvider } from './TopicContext.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TopicProvider>
      <Router>
        <App />
      </Router>
    </TopicProvider>
  </React.StrictMode>
);




reportWebVitals();
