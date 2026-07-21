import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const STORAGE_KEY = 'bls_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe(token)
      .then(({ user: meUser, team: meTeam }) => {
        setUser(meUser);
        setTeam(meTeam);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { token: newToken } = await api.login(email, password);
    const me = await api.getMe(newToken);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(me.user);
    setTeam(me.team);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await api.logout(token).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setTeam(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, team, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
