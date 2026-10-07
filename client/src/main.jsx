/**
 * main.jsx — App entry point: global styles, router and the theme/auth providers.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/pawcruz.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* v7_startTransition stays off so logging out lands on Home in the same render (no /login bounce). */}
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
