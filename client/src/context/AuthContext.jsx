/**
 * AuthContext — Shares the logged-in user, their role and the JWT with the whole app,
 * plus login, register, logout and updateUser actions. If the API rejects the token
 * later (expired or revoked), the session is cleared and protected pages redirect to login.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import { SESSION_EXPIRED_EVENT } from '../utils/constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => authService.getStoredSession());
  // While a saved token is being verified, protected pages show a spinner instead of redirecting.
  const [loading, setLoading] = useState(() => Boolean(authService.getStoredSession().token));

  // On first load, confirm the saved token is still valid (GET /auth/me).
  useEffect(() => {
    if (!authService.getStoredSession().token) return undefined;
    let active = true;
    authService
      .getCurrentUser()
      .then((user) => {
        if (active) setSession((current) => ({ ...current, user }));
      })
      .catch(() => {
        if (!active) return;
        authService.logout();
        setSession({ token: null, user: null });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // The API rejected the token mid-session (axiosClient already cleared localStorage).
  useEffect(() => {
    const onExpired = () => setSession({ token: null, user: null });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    setSession(result);
    return result.user;
  }, []);

  const register = useCallback(async (details) => {
    const result = await authService.register(details);
    setSession(result);
    return result.user;
  }, []);

  /** Clears the token and user, then sends the visitor to the home page. */
  const logout = useCallback(() => {
    authService.logout();
    setSession({ token: null, user: null });
    navigate('/', { replace: true });
  }, [navigate]);

  const updateUser = useCallback((user) => setSession((current) => ({ ...current, user })), []);

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      role: session.user?.role ?? null,
      isAuthenticated: Boolean(session.user && session.token),
      loading,
      login,
      register,
      logout,
      updateUser,
    }),
    [session, loading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
