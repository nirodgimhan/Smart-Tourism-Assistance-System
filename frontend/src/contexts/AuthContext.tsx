
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "tourist" | "admin" | "researcher";
  language: "en" | "si";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(): Promise<void> {
    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
