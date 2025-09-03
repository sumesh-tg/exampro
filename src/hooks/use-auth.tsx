
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
    // Check session storage on initial client-side load for Super Admin
    if (typeof window !== 'undefined') {
       const superAdminStatus = sessionStorage.getItem('isSuperAdmin') === 'true';
       if(superAdminStatus) {
         setSuperAdmin(superAdminStatus);
       }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await updateUserProfile(user.uid, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? ''
        });

        setUser(user);
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
  
  useEffect(() => {
      // This effect runs when isSuperAdmin changes
      if (typeof window !== 'undefined') {
          sessionStorage.setItem('isSuperAdmin', String(isSuperAdmin));
      }
  }, [isSuperAdmin]);


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
    if (loading) return;

    const isAuthPage = pathname.startsWith('/auth');

    // If we're on an auth page, we don't need to do anything.
    if (isAuthPage) return;

    // If not loading, and not a user, and not a super admin, then redirect.
    if (!user && !isSuperAdmin) {
      const redirectUrl = `?redirect=${encodeURIComponent(pathname + window.location.search)}`;
      router.push(`/auth/signin${redirectUrl}`);
    }

  }, [user, loading, isSuperAdmin, router, pathname]);

  return { user, loading, isSuperAdmin };
};
