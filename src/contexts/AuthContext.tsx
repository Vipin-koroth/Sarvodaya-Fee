import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'clerk' | 'user';
  class?: string;
  division?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (username: string, newPassword: string) => Promise<boolean>;
  getAllUsers: () => Array<{ username: string; role: 'admin' | 'teacher' | 'clerk' | 'user'; class?: string; division?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect starting...');
    
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        console.log('Found saved user:', savedUser);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error reading saved user from localStorage:', error);
    }

    // Initialize default users if they don't exist
    try {
      let storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      console.log('Current stored users:', Object.keys(storedUsers));
      
      // Always ensure clerk exists
      if (!storedUsers.clerk || Object.keys(storedUsers).length === 0) {
        console.log('Initializing default users including clerk...');
        const defaultUsers: Record<string, { password: string; role: 'admin' | 'teacher' | 'clerk' | 'user'; class?: string; division?: string }> = {
          admin: { password: 'admin', role: 'admin' },
          clerk: { password: 'admin', role: 'clerk' },
          user: { password: 'admin', role: 'user' }
        };

        // Generate class teacher accounts
        for (let classNum = 1; classNum <= 12; classNum++) {
          for (let division of ['a', 'b', 'c', 'd', 'e']) {
            const teacherUsername = `class${classNum}${division}`;
            defaultUsers[teacherUsername] = {
              password: 'admin',
              role: 'teacher',
              class: classNum.toString(),
              division: division.toUpperCase()
            };
          }
        }

        try {
          localStorage.setItem('users', JSON.stringify(defaultUsers));
          storedUsers = defaultUsers;
          console.log('Default users initialized and saved:', Object.keys(defaultUsers));
        } catch (error) {
          console.error('Error saving default users to localStorage:', error);
          // Use in-memory fallback
          storedUsers = defaultUsers;
        }
      }
      
      // Verify clerk exists
      if (storedUsers.clerk) {
        console.log('✅ Clerk user exists:', storedUsers.clerk);
      } else {
        console.log('❌ Clerk user missing! Creating now...');
        storedUsers.clerk = { password: 'admin', role: 'clerk' };
        try {
          localStorage.setItem('users', JSON.stringify(storedUsers));
          console.log('✅ Clerk user created');
        } catch (error) {
          console.error('Error saving clerk user to localStorage:', error);
        }
      }
      
      // Verify user exists
      if (storedUsers.user) {
        console.log('✅ User account exists:', storedUsers.user);
      } else {
        console.log('❌ User account missing! Creating now...');
        storedUsers.user = { password: 'admin', role: 'user' };
        try {
          localStorage.setItem('users', JSON.stringify(storedUsers));
          console.log('✅ User account created');
        } catch (error) {
          console.error('Error saving user account to localStorage:', error);
        }
      }
      
      console.log('Final users available:', Object.keys(storedUsers));
    } catch (error) {
      console.error('Error initializing users:', error);
      // Provide fallback default users in memory
      const fallbackUsers = {
        admin: { password: 'admin', role: 'admin' as const },
        clerk: { password: 'admin', role: 'clerk' as const },
        user: { password: 'admin', role: 'user' as const }
      };
      console.log('Using fallback users due to localStorage error');
    }
    
    setLoading(false);
    
    // Auto logout when window/tab is closed
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem('currentUser');
      } catch (error) {
        console.error('Error removing currentUser from localStorage:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Optional: Also logout when tab becomes hidden (user switches tabs)
        // Uncomment the line below if you want this behavior
        // try {
        //   localStorage.removeItem('currentUser');
        // } catch (error) {
        //   console.error('Error removing currentUser from localStorage:', error);
        // }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Get stored users or use defaults
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username:', username);
      console.log('Password:', password);
      console.log('Available users:', Object.keys(storedUsers));
      
      const userAccount = storedUsers[username];
      console.log('User account found:', !!userAccount);
      if (userAccount) {
        console.log('User role:', userAccount.role);
        console.log('Stored password:', userAccount.password);
        console.log('Password match:', userAccount.password === password);
      }
      
      if (userAccount && userAccount.password === password) {
        const userData: User = {
          id: username,
          username,
          role: userAccount.role,
          class: userAccount.class,
          division: userAccount.division
        };
        
        setUser(userData);
        try {
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } catch (error) {
          console.error('Error saving current user to localStorage:', error);
        }
        console.log('✅ Login successful:', userData);
        return true;
      }
      
      console.log('❌ Login failed for:', username);
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error removing currentUser from localStorage:', error);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const userAccount = storedUsers[user.username];

      if (userAccount && userAccount.password === oldPassword) {
        userAccount.password = newPassword;
        try {
          localStorage.setItem('users', JSON.stringify(storedUsers));
          return true;
        } catch (error) {
          console.error('Error saving password change to localStorage:', error);
          return false;
          };
        }
      }

      return false;
    } catch (error) {
      console.error('Error during password change:', error);
      return false;
    }
  };

  const resetUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const targetUser = storedUsers[username];

      if (targetUser) {
        targetUser.password = newPassword;
        try {
          localStorage.setItem('users', JSON.stringify(storedUsers));
          return true;
        } catch (error) {
          console.error('Error saving password reset to localStorage:', error);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error during password reset:', error);
      return false;
    }
  };

  const getAllUsers = () => {
    if (!user || user.role !== 'admin') return [];

    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      return Object.entries(storedUsers).map(([username, userData]: [string, any]) => ({
        username,
        role: userData.role,
        class: userData.class,
        division: userData.division
      }));
    } catch (error) {
      console.error('Error getting all users from localStorage:', error);
      return [];
    }
  };

  const value = {
    user,
    login,
    logout,
    changePassword,
    resetUserPassword,
    getAllUsers,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};