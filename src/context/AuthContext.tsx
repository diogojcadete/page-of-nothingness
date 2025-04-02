
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, ProjectRole } from "@/types";
import { supabase, withRetry } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  userRole: ProjectRole | null;
  isDarkMode: boolean;
  setIsOwner: (isOwner: boolean) => void;
  setUserRole: (role: ProjectRole | null) => void;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUsername: (username: string) => Promise<boolean>;
  updateEmail: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOwner: false,
  userRole: null,
  isDarkMode: true,
  setIsOwner: () => {},
  setUserRole: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUsername: async () => false,
  updateEmail: async () => false,
  updatePassword: async () => false,
  toggleTheme: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem("scrumUser");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        // Load theme preference
        const themePreference = localStorage.getItem("scrumTheme");
        if (themePreference === "light") {
          setIsDarkMode(false);
          document.documentElement.classList.remove("dark");
        } else {
          setIsDarkMode(true);
          document.documentElement.classList.add("dark");
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        localStorage.removeItem("scrumUser");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    try {
      const { data: existingEmail } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();
      });

      if (existingEmail) {
        throw new Error('Email already in use');
      }

      const { data: existingUsername } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();
      });

      if (existingUsername) {
        throw new Error('Username already taken');
      }

      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .insert([{ username, email, password }])
          .select()
          .single();
      });

      if (error) throw error;

      if (data) {
        const newUser: User = {
          id: data.id,
          email: data.email,
          username: data.username,
        };
        
        setUser(newUser);
        localStorage.setItem("scrumUser", JSON.stringify(newUser));
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
          .eq('password', password)
          .single();
      });

      if (error || !data) {
        throw new Error('Invalid credentials');
      }

      const loggedInUser: User = {
        id: data.id,
        email: data.email,
        username: data.username,
      };
      
      setUser(loggedInUser);
      localStorage.setItem("scrumUser", JSON.stringify(loggedInUser));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setIsOwner(false);
    setUserRole(null);
    localStorage.removeItem("scrumUser");
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if username already exists
      const { data: existingUser } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', user.id)
          .single();
      });

      if (existingUser) {
        toast.error('Username already taken');
        return false;
      }

      // Update username
      const { error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .update({ username })
          .eq('id', user.id);
      });

      if (error) throw error;

      // Update user in state and localStorage
      const updatedUser = { ...user, username };
      setUser(updatedUser);
      localStorage.setItem("scrumUser", JSON.stringify(updatedUser));
      
      toast.success('Username updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
      return false;
    }
  };

  const updateEmail = async (email: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if email already exists
      const { data: existingUser } = await withRetry(async () => {
        return await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', user.id)
          .single();
      });

      if (existingUser) {
        toast.error('Email already in use');
        return false;
      }

      // Update email
      const { error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .update({ email })
          .eq('id', user.id);
      });

      if (error) throw error;

      // Update user in state and localStorage
      const updatedUser = { ...user, email };
      setUser(updatedUser);
      localStorage.setItem("scrumUser", JSON.stringify(updatedUser));
      
      toast.success('Email updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
      return false;
    }
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Update password
      const { error } = await withRetry(async () => {
        return await supabase
          .from('users')
          .update({ password })
          .eq('id', user.id);
      });

      if (error) throw error;
      
      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
      return false;
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("scrumTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("scrumTheme", "light");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOwner,
        userRole,
        isDarkMode,
        setIsOwner,
        setUserRole,
        login,
        register,
        logout,
        updateUsername,
        updateEmail,
        updatePassword,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
