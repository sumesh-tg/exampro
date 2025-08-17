
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

const getAuthenticatedUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error("Authentication required."));
      }
    });
  });
};


export const listUsers = async (): Promise<AdminUserRecord[]> => {
    try {
        const user = await getAuthenticatedUser();
        const idToken = await user.getIdToken();
        
        const url = `https://us-central1-quizwhiz-gs6fd.cloudfunctions.net/userListApi-listUsersApi`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':`Bearer ${idToken}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to list users: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        return result as AdminUserRecord[];

    } catch (error) {
        console.error("Error calling listUsers API:", error);
        if (error instanceof Error) {
            if (error.message.includes('CORS')) {
                 throw new Error("A CORS error occurred. Please ensure your Cloud Function is configured to allow requests from this origin.");
            }
            throw error;
        }
        throw new Error("An unknown error occurred while listing users.");
    }
};
