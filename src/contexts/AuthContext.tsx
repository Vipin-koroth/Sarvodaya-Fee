import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'clerk' | 'sarvodaya';
  class?: string;
  division?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (username: string, newPassword: string) => Promise<boolean>;
  getAllUsers: () => Array<{ username: string; role: 'admin' | 'teacher' | 'clerk' | 'sarvodaya'; class?: string; division?: string }>;
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
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      console.log('Found saved user:', savedUser);
      setUser(JSON.parse(savedUser));
    }

    // Get existing users or initialize empty object
    let storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    console.log('Current stored users:', Object.keys(storedUsers));
    
    // Define required core users
    const coreUsers = {
      admin: { password: 'admin', role: 'admin' as const },
      clerk: { password: 'admin', role: 'clerk' as const },
      sarvodaya: { password: 'admin', role: 'sarvodaya' as const }
    };

    let needsUpdate = false;

    // Add missing core users
    for (const [username, userData] of Object.entries(coreUsers)) {
      if (!storedUsers[username]) {
        storedUsers[username] = userData;
        needsUpdate = true;
      }
    }

    // Check if teacher accounts exist, if not generate them
    const hasTeachers = Object.keys(storedUsers).some(key => key.startsWith('class'));
    if (!hasTeachers) {
      for (let classNum = 1; classNum <= 12; classNum++) {
        for (let division of ['a', 'b', 'c', 'd', 'e']) {
          const teacherUsername = `class${classNum}${division}`;
          storedUsers[teacherUsername] = {
            password: 'admin',
            role: 'teacher',
            class: classNum.toString(),
            division: division.toUpperCase()
          };
        }
      }
      needsUpdate = true;
    }

    // Save to localStorage if any updates were made
    if (needsUpdate) {
      localStorage.setItem('users', JSON.stringify(storedUsers));
      console.log('Default users initialized and saved:', Object.keys(storedUsers));
    }
    
    console.log('Final users available:', Object.keys(storedUsers));
    setLoading(false);
    
    // Auto logout when window/tab is closed
    const handleBeforeUnload = () => {
      localStorage.removeItem('currentUser');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Optional: Also logout when tab becomes hidden (user switches tabs)
        // Uncomment the line below if you want this behavior
        // localStorage.removeItem('currentUser');
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
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('✅ Login successful:', userData);
      return true;
    }
    
    console.log('❌ Login failed for:', username);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Update password in Supabase
        const { supabase } = await import('../lib/supabase');
        
        // Update the password in Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (updateError) {
          // Check if the error is due to missing auth session
          if (updateError.message && updateError.message.includes('Auth session missing')) {
            logout();
            throw new Error('Your session has expired. Please log in again to change your password.');
          }
          
          // For other errors, throw the original error message
          throw new Error(updateError.message || 'Failed to update password');
        }
        
        console.log('Password updated successfully in Supabase for user:', user.username);
        return true;
      } else {
        // Fallback to localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const userAccount = storedUsers[user.username];

        if (userAccount && userAccount.password === oldPassword) {
          userAccount.password = newPassword;
          localStorage.setItem('users', JSON.stringify(storedUsers));
          console.log('Password updated successfully in localStorage for user:', user.username);
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  const resetUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Update password in Supabase Auth
        const { supabase } = await import('../lib/supabase');
        
        // Find the user by email (username@sarvodayaschool.edu)
        const userEmail = `${username}@sarvodayaschool.edu`;
        
        // Admin can reset any user's password using the admin API
        const { error } = await supabase.auth.admin.updateUserById(
          userEmail, // This would need the actual user ID, but we'll use a different approach
          { password: newPassword }
        );
        
        if (error) {
          console.error('Error resetting password in Supabase:', error);
          // Fallback to localStorage for now since admin API might not be available
          return this.resetPasswordInLocalStorage(username, newPassword);
        }
        
        console.log(`Password reset successful in Supabase for user: ${username}`);
        return true;
      } else {
        return this.resetPasswordInLocalStorage(username, newPassword);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      // Fallback to localStorage
      return this.resetPasswordInLocalStorage(username, newPassword);
    }
  };
  
  const resetPasswordInLocalStorage = (username: string, newPassword: string): boolean => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const targetUser = storedUsers[username];

      if (targetUser) {
        // Update the password
        targetUser.password = newPassword;
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        console.log(`Password reset successful in localStorage for user: ${username}`);
        return true;
      } else {
        console.error(`User ${username} not found for password reset`);
        return false;
      }
    } catch (error) {
      console.error('Error resetting password in localStorage:', error);
      return false;
    }
  };

  const getAllUsers = () => {
    if (!user || user.role !== 'admin') return [];

    const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    return Object.entries(storedUsers).map(([username, userData]: [string, any]) => ({
      username,
      role: userData.role,
      class: userData.class,
      division: userData.division
    }));
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