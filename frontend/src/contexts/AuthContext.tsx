"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/components/api";

interface User {
  id: string;
  userID: string;
  username: string;
  email?: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<User>;
  loginWithGoogle: () => void;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });
      const { token: authToken, user: userData } = response.data;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem("token", authToken);
      return userData;
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      throw new Error(err.response?.data?.error || "Login failed");
    }
  };

  const loginWithGoogle = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "https://paw-be-werld.vercel.app"
    }/auth/google`;
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      });
      // After registration, auto login
      return await login(username, password);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      throw new Error(err.response?.data?.error || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithGoogle,
        register,
        logout,
        loading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
