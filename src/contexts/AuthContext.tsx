import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'clerk';
  name: string;
  assignedClasses?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default users for local storage
  const defaultUsers = {
    admin: { id: '1', username: 'admin', password: 'admin123', role: 'admin' as const, name: 'Administrator' },
    teacher1: { id: '2', username: 'teacher1', password: 'teacher123', role: 'teacher' as const, name: 'Teacher One', assignedClasses: ['1A', '1B'] },
    teacher2: { id: '3', username: 'teacher2', password: 'teacher456', role: 'teacher' as const, name: 'Teacher Two', assignedClasses: ['2A', '2B'] },
    clerk: { id: '4', username: 'clerk', password: 'clerk123', role: 'clerk' as const, name: 'Clerk User' }
  };

  useEffect(() => {
    // Initialize users in localStorage if not exists
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const foundUser = Object.values(users).find((u: any) => 
        u.username === username && u.password === password
      );

      if (foundUser) {
        const userWithoutPassword = {
          id: (foundUser as any).id,
          username: (foundUser as any).username,
          role: (foundUser as any).role,
          name: (foundUser as any).name,
          assignedClasses: (foundUser as any).assignedClasses
        };
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      console.log('🔄 Starting password change process...');
      console.log('User:', user.username);

      // Get current users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      console.log('Current users in storage:', Object.keys(users));

      // Find the current user in storage
      const userKey = Object.keys(users).find(key => users[key].username === user.username);
      
      if (!userKey) {
        console.error('❌ User not found in storage');
        return false;
      }

      const currentUser = users[userKey];
      console.log('Found user in storage:', currentUser.username);

      // Verify old password
      if (currentUser.password !== oldPassword) {
        console.error('❌ Old password verification failed');
        console.log('Expected:', currentUser.password);
        console.log('Provided:', oldPassword);
        return false;
      }

      console.log('✅ Old password verified');

      // Update password
      users[userKey].password = newPassword;
      console.log('🔄 Updating password in storage...');

      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      console.log('✅ Password updated in localStorage');

      // Verify the password was saved correctly
      const updatedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const verifyUser = updatedUsers[userKey];
      
      if (verifyUser && verifyUser.password === newPassword) {
        console.log('✅ Password change verified successfully');
        
        // Dispatch storage event to notify other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'users',
          newValue: JSON.stringify(users),
          storageArea: localStorage
        }));
        
        return true;
      } else {
        console.error('❌ Password verification failed after save');
        return false;
      }
    } catch (error) {
      console.error('❌ Password change error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    changePassword,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};