import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { AuthState, User } from "@/types";
import {
  createUserAccount,
  signInUser,
  signOutUser,
  onAuthStateChange,
  simulateAuthStateChange,
} from "@/services/firebase";

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Session storage for current user
const CURRENT_USER_KEY = "social_network_current_user";

const useAuthStore = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        simulateAuthStateChange(user);
      } catch (error) {
        console.error("Error loading saved user:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await signInUser(email, password);

      if (result.success && result.user) {
        // Save to session storage
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));

        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Simulate auth state change
        simulateAuthStateChange(result.user);

        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await createUserAccount(
        email,
        password,
        username,
        fullName,
      );

      if (result.success && result.user) {
        // Save to session storage
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));

        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Simulate auth state change
        simulateAuthStateChange(result.user);

        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error || "Registration failed" };
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      localStorage.removeItem(CURRENT_USER_KEY);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      simulateAuthStateChange(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = (user: User) => {
    setState((prev) => ({ ...prev, user: { ...user } }));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  };

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthStore();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
