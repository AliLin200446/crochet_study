import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {restore} from './store';
import './style.css';
restore();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
