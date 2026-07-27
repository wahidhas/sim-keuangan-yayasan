"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/firebase/config";
import { authService } from "@/services/authService";
import { UserProfile } from "@/types/user";

interface AuthContextType {
  user: FirebaseUser | UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

const DEMO_USER_KEY = "sim_demo_user_profile";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkDemoUser = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as UserProfile;
          setUser(parsed);
          setProfile(parsed);
          setLoading(false);
          return true;
        } catch (e) {
          // ignore
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const hasDemo = checkDemoUser();

    const handleDemoChange = () => {
      const demoActive = checkDemoUser();
      if (!demoActive) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("demo-auth-changed", handleDemoChange);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (localStorage.getItem(DEMO_USER_KEY)) {
        return; // Prioritize local demo session if active
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        const userProfile = await authService.getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("demo-auth-changed", handleDemoChange);
      }
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (profile?.uid) {
      const updated = await authService.getUserProfile(profile.uid);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
