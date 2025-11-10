import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <ThemeProvider>
                <HashRouter>
                    <App />
                </HashRouter>
            </ThemeProvider>
        </React.StrictMode>
    );
}
