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
      sarvodaya: { password: 'admin', role: 'sarvodaya' as const },
      lp: { password: 'admin', role: 'sarvodaya' as const },
      up: { password: 'admin', role: 'sarvodaya' as const },
      hs: { password: 'admin', role: 'sarvodaya' as const },
      hss: { password: 'admin', role: 'sarvodaya' as const }
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
    if (!user) {
      console.log('❌ No user logged in for password change');
      return false;
    }

    try {
      console.log('🔄 Starting password change for user:', user.username);
      console.log('Old password provided:', oldPassword);
      console.log('New password provided:', newPassword);

      // Check if Supabase is configured
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Use Supabase for password changes
        const { supabase } = await import('../lib/supabase');
        
        // First verify the old password
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('password')
          .eq('username', user.username)
          .single();

        if (fetchError) {
          console.error('Error fetching user from Supabase:', fetchError);
          // Fallback to localStorage if Supabase fails
          return await changePasswordLocalStorage(oldPassword, newPassword);
        }

        if (!userData || userData.password !== oldPassword) {
          console.log('❌ Old password verification failed in Supabase');
          return false;
        }

        // Update password in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: newPassword, updated_at: new Date().toISOString() })
          .eq('username', user.username);

        if (updateError) {
          console.error('Error updating password in Supabase:', updateError);
          return false;
        }

        console.log('✅ Password updated successfully in Supabase for user:', user.username);
        return true;
      } else {
        // Use localStorage for password changes
        return await changePasswordLocalStorage(oldPassword, newPassword);
      }
      
    } catch (error) {
      console.error('❌ Error changing password:', error);
      return false;
    }
  };

  const changePasswordLocalStorage = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      console.log('Current stored users:', Object.keys(storedUsers));
      
      const userAccount = storedUsers[user.username];
      console.log('User account found:', !!userAccount);
      
      if (userAccount) {
        console.log('Current stored password:', userAccount.password);
        console.log('Password verification:', userAccount.password === oldPassword);
      }

      if (userAccount && userAccount.password === oldPassword) {
        // Update the password
        userAccount.password = newPassword;
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        // Dispatch storage event to notify other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'users',
          newValue: JSON.stringify(storedUsers),
          url: window.location.href
        }));
        
        // Verify the password was saved correctly
        const verifyUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const verifyAccount = verifyUsers[user.username];
        console.log('✅ Password verification after save:', verifyAccount?.password === newPassword);
        
        console.log('✅ Password updated successfully for user:', user.username);
        return true;
      } else {
        console.log('❌ Old password verification failed');
        return false;
      }
      
  };

  const resetUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      // Check if Supabase is configured
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Use Supabase for password reset
        const { supabase } = await import('../lib/supabase');
        
        const { error } = await supabase
          .from('users')
          .update({ password: newPassword, updated_at: new Date().toISOString() })
          .eq('username', username);

        if (error) {
          console.error('Error resetting password in Supabase:', error);
          return false;
        }

        console.log(`✅ Password reset successful in Supabase for user: ${username}`);
        return true;
      } else {
        // Use localStorage for password reset
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const targetUser = storedUsers[username];

      if (targetUser) {
        // Update the password
        targetUser.password = newPassword;
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        console.log(`Password reset successful for user: ${username}`);
        return true;
      } else {
        console.error(`User ${username} not found for password reset`);
        return false;
      }
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  };

  const getAllUsers = () => {
    if (!user || user.role !== 'admin') return [];

    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // For now, fall back to localStorage for user listing
        // Supabase user management would require server-side implementation
        console.log('Using localStorage for user listing (Supabase user management requires server-side implementation)');
      }
      
      // Use localStorage for user listing
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      return Object.entries(storedUsers).map(([username, userData]: [string, any]) => ({
        username,
        role: userData.role,
        class: userData.class,
        division: userData.division
      }));
    } catch (error) {
      console.error('Error getting users:', error);
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