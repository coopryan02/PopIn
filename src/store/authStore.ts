import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { AuthState, User } from "@/types";
import { userStorage } from "@/utils/storage";
import { authenticateUser, registerUser } from "@/utils/auth";

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
  logout: () => void;
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

export const useAuthStore = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = userStorage.getCurrentUser();
    setState({
      user: currentUser,
      isAuthenticated: !!currentUser,
      isLoading: false,
    });
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const user = authenticateUser(email, password);

      if (user) {
        userStorage.setCurrentUser(user);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: "Invalid email or password" };
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: "Login failed. Please try again." };
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
      const result = registerUser(email, password, username, fullName);

      if (result.success && result.user) {
        userStorage.setCurrentUser(result.user);
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    userStorage.setCurrentUser(null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (user: User) => {
    userStorage.updateUser(user);
    userStorage.setCurrentUser(user);
    setState((prev) => ({ ...prev, user }));
  };

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };
};
