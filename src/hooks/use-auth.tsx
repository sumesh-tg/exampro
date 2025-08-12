
'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  setAdmin?: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        // If firebase auth state changes and there's no user, log out admin too
        sessionStorage.removeItem('isSuperAdmin');
        setAdmin(false);
      }
      setLoading(false);
    });
    
    // Check session storage on initial load
    if (typeof window !== 'undefined' && sessionStorage.getItem('isSuperAdmin') === 'true') {
        setAdmin(true);
    }


    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useRequireAuth = () => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !isAdmin) {
      // Don't redirect if we are already on an auth page
      if (pathname.startsWith('/auth')) {
        return;
      }
      // If there's a path we want to be redirected to (e.g. a shared exam link)
      // append it to the signin url
      const redirectUrl = `?redirect=${encodeURIComponent(pathname)}`;
      router.push(`/auth/signin${redirectUrl}`);
    }
  }, [user, loading, router, isAdmin, pathname]);

  return { user, loading, isAdmin };
};
