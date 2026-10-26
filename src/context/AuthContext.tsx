import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_USERS } from '../data/mockData';
import { storageService, STORAGE_KEYS } from '../services/storageService';
import { UserProfile } from '../types/transit';

interface AuthContextType {
  currentUser: UserProfile;
  allDemoUsers: UserProfile[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  switchUser: (user: UserProfile) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  login: (email: string, role?: UserProfile['role']) => void;
  signup: (name: string, email: string, role: UserProfile['role'], organization: string) => void;
  logout: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => storageService.getCurrentUser());
  const [allDemoUsers, setAllDemoUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const firebaseConfig = storageService.getFirebaseConfig();
  const isDemoMode = !firebaseConfig.isConfigured;

  useEffect(() => {
    const unsub = storageService.subscribe<UserProfile>(STORAGE_KEYS.CURRENT_USER, (user) => {
      if (user) setCurrentUserState(user);
    });
    return unsub;
  }, []);

  const switchUser = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    setCurrentUserState(user);
  };

  const updateUser = (profile: Partial<UserProfile>) => {
    storageService.updateUserProfile(profile);
    setCurrentUserState(storageService.getCurrentUser());
  };

  const login = (email: string, role: UserProfile['role'] = 'Commuter') => {
    const existing = allDemoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      switchUser(existing);
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        joinedDate: 'Just now',
        points: 50,
        trustScore: 80,
        savedRouteIds: ['route_101'],
        notificationsEnabled: true,
        arrivalAlertThresholdMin: 10,
      };
      const updatedList = [...allDemoUsers, newUser];
      setAllDemoUsers(updatedList);
      switchUser(newUser);
    }
  };

  const signup = (name: string, email: string, role: UserProfile['role'], organization: string) => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      email,
      role,
      organization,
      joinedDate: 'Today',
      points: 75,
      trustScore: 85,
      savedRouteIds: ['route_101', 'route_202'],
      notificationsEnabled: true,
      arrivalAlertThresholdMin: 10,
    };
    const updatedList = [...allDemoUsers, newUser];
    setAllDemoUsers(updatedList);
    switchUser(newUser);
  };

  const logout = () => {
    // Return to default student demo persona
    switchUser(DEMO_USERS[0]);
  };

  const isAdmin = currentUser.role === 'Admin';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allDemoUsers,
        isAuthenticated,
        isAdmin,
        switchUser,
        updateUser,
        login,
        signup,
        logout,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
