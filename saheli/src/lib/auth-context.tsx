import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface AuthUser {
  userId: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userId: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ComponentChildren }) {
  // Auth state lives purely in memory — deliberately never stored in browser storage
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (userId: string, username: string) => {
    setUser({ userId, username });
  };

  const logout = () => {
    setUser(null);
    // Push browser hash to login on logout
    window.location.hash = 'Login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
