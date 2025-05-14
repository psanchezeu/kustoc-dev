import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Comprobar si el usuario tiene una sesión activa
    const checkUserSession = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // En un caso real, verificaríamos el token con el servidor
          // Por ahora, simulamos un usuario autenticado para el MVP
          setUser({
            id: 'admin-id',
            name: 'Administrador',
            email: 'admin@kustoc.com',
            role: 'admin'
          });
        }
      } catch (error) {
        console.error('Error al verificar la sesión del usuario:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // En un entorno real, esta sería una llamada a la API
      // Para el MVP, simplemente simulamos un inicio de sesión exitoso
      if (email === 'admin@kustoc.com' && password === 'admin') {
        const mockUser = {
          id: 'admin-id',
          name: 'Administrador',
          email: 'admin@kustoc.com',
          role: 'admin'
        };
        
        setUser(mockUser);
        localStorage.setItem('authToken', 'mock-jwt-token');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
