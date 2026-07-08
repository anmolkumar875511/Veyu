import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './AppRouter.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SidebarProvider } from './components/layout/SidebarContext.jsx';
import './index.css';

const container = document.getElementById('root');

if (!container) {
    throw new Error(
        '[main.jsx] Could not find #root element. ' +
            'Make sure index.html has <div id="root"></div>.'
    );
}

createRoot(container).render(
    <StrictMode>
        <ThemeProvider>
            <SidebarProvider>
                <AppRouter />
            </SidebarProvider>
        </ThemeProvider>
    </StrictMode>
);
