
'use client';

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
    phoneNumber?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    creationTime: string;
    lastSignInTime: string;
    customClaims?: { [key: string]: any };
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
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};


export const listUsers = async (): Promise<AdminUserRecord[]> => {
    try {
        const response = await fetch('https://us-central1-quizwhiz-gs6fd.cloudfunctions.net/userListApi-listUsersApi', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `API error: ${response.status}`);
            } catch (e) {
                throw new Error(errorText || `API error: ${response.status}`);
            }
        }

        const result = await response.json();
        return result.users as AdminUserRecord[];

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

export const updateUserClaims = async (uid: string, claims: { [key: string]: any }): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch('https://us-central1-quizwhiz-gs6fd.cloudfunctions.net/setCustomUserClaims-customUserClaims', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, claims }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `API error: ${response.status}`);
            } catch (e) {
                 const friendlyError = e instanceof Error ? e.message : String(e);
                 throw new Error(errorText || `API error: ${response.status} - ${friendlyError}`);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error setting user role:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
};
