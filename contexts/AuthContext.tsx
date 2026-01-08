'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { validateUserCredentials } from '@/lib/supabase-storage';
import { getSupabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  department?: string;
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password'];

// Admin-only routes (requires authentication + admin role)
const adminRoutes = ['/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect logic based on auth state
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      const isAdminRoute = adminRoutes.includes(pathname);
      
      if (!user && !isPublicRoute && !isAdminRoute) {
        // Not authenticated and trying to access protected route
        router.push('/login');
      } else if (!user && isAdminRoute) {
        // Not authenticated and trying to access admin route
        router.push('/login');
      } else if (user && isAdminRoute && user.role !== 'admin') {
        // Authenticated but not admin trying to access admin route
        router.push('/');
      } else if (user && isPublicRoute) {
        // Authenticated but on login page
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // Optional: Check if session is still valid (e.g., not expired)
        const loginTime = new Date(parsedUser.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursSinceLogin < 24) {
          setUser(parsedUser);
        } else {
          // Session expired
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; redirectTo?: string }> => {
    try {
      const supabase = getSupabase();
      
      // If Supabase is not configured, use localStorage fallback
      if (!supabase) {
        const userData = await validateUserCredentials(email, password);
        
        if (userData) {
          const sessionUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as User['role'],
            department: userData.department,
            loginTime: new Date().toISOString(),
          };

          localStorage.setItem('currentUser', JSON.stringify(sessionUser));
          setUser(sessionUser);
          return { success: true, redirectTo: '/' };
        } else {
          return { success: false, error: 'Invalid email or password' };
        }
      }

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // 2. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, role, department, is_active')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Account profile not found' };
      }

      // 3. Check if user is active
      if (!profile.is_active) {
        await supabase.auth.signOut();
        return { success: false, error: 'Account is disabled. Contact administrator.' };
      }

      // 4. Create session user
      const sessionUser: User = {
        id: profile.id,
        email: profile.email || authData.user.email || email,
        name: profile.name || 'User',
        role: (profile.role as User['role']) || 'staff',
        department: profile.department,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      setUser(sessionUser);

      // 5. Determine redirect based on role
      let redirectTo = '/';
      if (email === 'admin@autocarpets.com' || profile.role === 'admin') {
        redirectTo = '/'; // Admin goes to dashboard
      }

      return { success: true, redirectTo };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    // Sign out from Supabase Auth
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: User['role'][]
) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }

      if (!isLoading && isAuthenticated && allowedRoles && user) {
        if (!allowedRoles.includes(user.role)) {
          router.push('/unauthorized');
        }
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
