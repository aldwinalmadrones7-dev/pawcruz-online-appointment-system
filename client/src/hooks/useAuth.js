/**
 * useAuth — Reads the AuthContext (user, role, token, login, register, logout, updateUser).
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
