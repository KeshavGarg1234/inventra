
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { usePathname, useRouter } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import type { User } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  dbUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setDbUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const usersRef = ref(db, `users`);
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersList = firebaseObjectToArray<User>(snapshot.val());
          const currentUser = usersList.find(u => u.email === user.email);
          setDbUser(currentUser || null);
        } else {
            setDbUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = ['/', '/register'].includes(pathname);
    const isSecureAccessPage = pathname === '/secure-access';
    
    if (!user) {
      // Not logged in, force to auth pages
      if (!isAuthPage) {
        router.push('/');
      }
    } else {
      // Logged in
      if (dbUser) {
        if (dbUser.role === 'D' || dbUser.role === 'E') {
          // D & E users should only be on secure page
          if (!isSecureAccessPage) router.push('/secure-access');
        } else {
          // Higher level user should not be on auth/secure pages
          if (isAuthPage || isSecureAccessPage) router.push('/dashboard');
        }
      } else if (!isAuthPage) {
        // This case can happen if a user is authenticated but not yet in the DB,
        // or was removed. We should send them to login.
         router.push('/');
      }
    }

  }, [loading, user, dbUser, pathname, router]);
  
  const publicPages = ['/', '/register', '/secure-access'];
  const shouldRenderChildren = !loading || publicPages.includes(pathname);


  return (
    <AuthContext.Provider value={{ user, dbUser, loading }}>
      {shouldRenderChildren ? children : null}
    </AuthContext.Provider>
  );
};
