
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
  setAdmin?: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Sync user data to Firestore
        updateUserProfile(user.uid, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? ''
        });
        
        // Check for admin claims
        const token = await user.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);

      } else {
        setUser(null);
        setIsAdmin(false);
        // If firebase auth state changes and there's no user, log out admin too
        sessionStorage.removeItem('isSuperAdmin');
        setAdmin(false);
      }
      setLoading(false);
    });
    
    // Check session storage on initial load for Super Admin
    if (typeof window !== 'undefined' && sessionStorage.getItem('isSuperAdmin') === 'true') {
        setAdmin(true);
    }


    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, setAdmin }}>
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
    if (!loading && !user && !isSuperAdmin) {
      // Don't redirect if we are already on an auth page
      if (pathname.startsWith('/auth')) {
        return;
      }
      // If there's a path we want to be redirected to (e.g. a shared exam link)
      // append it to the signin url
      const redirectUrl = `?redirect=${encodeURIComponent(pathname + window.location.search)}`;
      router.push(`/auth/signin${redirectUrl}`);
    }
  }, [user, loading, router, isSuperAdmin, pathname]);

  return { user, loading, isSuperAdmin };
};
