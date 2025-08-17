
import { auth, db, functions } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged, type User } from 'firebase/auth';


export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
};

// This would be the expected shape of the user data returned from your Cloud Function
export type AdminUserRecord = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    creationTime: string;
    lastSignInTime: string;
}

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'users', userId);
    // Using setDoc with merge: true will create the doc if it doesn't exist,
    // and update it if it does.
    await setDoc(userDocRef, data, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
};

const getAuthenticatedUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};


export const listUsers = async (): Promise<AdminUserRecord[]> => {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            throw new Error("Authentication required.");
        }
        
        // Use httpsCallable for a more secure and direct way to call the function
        const listUsersFunction = httpsCallable(functions, 'userListApi-listUsersApi');
        const result = await listUsersFunction();
        
        // The result from a callable function is in the `data` property
        return result.data as AdminUserRecord[];

    } catch (error) {
        console.error("Error calling listUsers function:", error);
        if (error instanceof Error) {
            // Check for specific callable function errors
            if ((error as any).code === 'unauthenticated') {
                 throw new Error("Authentication failed. Please sign in again.");
            }
             if (error.message.includes('CORS')) {
                 throw new Error("A CORS error occurred. Please ensure your Cloud Function is configured to allow requests from this origin.");
            }
            throw error;
        }
        throw new Error("An unknown error occurred while listing users.");
    }
};
