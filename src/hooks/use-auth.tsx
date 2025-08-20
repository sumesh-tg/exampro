
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
import { updateUserProfile } from '@/services/userService';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  setSuperAdmin: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  setSuperAdmin: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check session storage on initial load for Super Admin
    if (typeof window !== 'undefined') {
       const superAdminStatus = sessionStorage.getItem('isSuperAdmin') === 'true';
       setSuperAdmin(superAdminStatus);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        updateUserProfile(user.uid, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? ''
        });
        
        const token = await user.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);

      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, setSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useRequireAuth = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
        if (!user && !isSuperAdmin) {
            if (pathname.startsWith('/auth')) {
                return;
            }
            const redirectUrl = `?redirect=${encodeURIComponent(pathname + window.location.search)}`;
            router.push(`/auth/signin${redirectUrl}`);
        }
    }
  }, [user, loading, isSuperAdmin, router, pathname]);

  return { user, loading };
};
