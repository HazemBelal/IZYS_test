import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt'));
  const [user, setUser] = useState<any | null>(null);

  const isAuthenticated = !!token;

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('jwt', newToken);
    
    // Decode JWT to get user info (basic implementation)
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({
        id: payload.userId,
        userLogin: payload.userLogin,
        role: payload.role
      });
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt');
    window.location.href = '/login';
  };

  useEffect(() => {
    // Check if token exists and is valid on app start
    const storedToken = localStorage.getItem('jwt');
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp > currentTime) {
          setToken(storedToken);
          setUser({
            id: payload.userId,
            userLogin: payload.userLogin,
            role: payload.role
          });
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        console.error('Error validating stored token:', error);
        logout();
      }
    }
  }, []);

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
    user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 