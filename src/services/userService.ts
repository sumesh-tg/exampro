
'use client';

import { auth, db, functions } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAppConfig } from './appConfigService';
import { logAttemptChange } from './attemptHistoryService';


export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  attemptBalance?: number;
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
    customClaims?: { 
        admin?: boolean;
        deleted?: boolean;
        [key: string]: any 
    };
}

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS || 'users', userId);
    
    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(userDocRef);

        if (!docSnap.exists()) {
            const config = await getAppConfig();
            const initialBalance = config.initialFreeAttempts;
            const profileData = { 
                ...data, 
                attemptBalance: initialBalance 
            };
            transaction.set(userDocRef, profileData, { merge: true });
            
            await logAttemptChange({
                userId,
                changeAmount: initialBalance,
                newBalance: initialBalance,
                reason: 'INITIAL_ALLOCATION'
            });
        } else {
            transaction.set(userDocRef, data, { merge: true });
        }
    });
};


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS || 'users', userId);
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

export const decrementAttemptBalance = async (userId: string, reason: 'EXAM_ATTEMPT' | 'TOPIC_SUGGESTION', context?: object) => {
    const userDocRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS || 'users', userId);
    
    const newBalance = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw "User document does not exist!";
        }
        const currentBalance = userDoc.data().attemptBalance ?? 0;
        const updatedBalance = currentBalance - 1;
        transaction.update(userDocRef, { attemptBalance: increment(-1) });
        return updatedBalance;
    });

    await logAttemptChange({ userId, changeAmount: -1, newBalance, reason, context });
};

export const incrementAttemptBalance = async (userId: string, count: number) => {
    const userDocRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS || 'users', userId);
    
    const newBalance = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw "User document does not exist!";
        }
        const currentBalance = userDoc.data().attemptBalance ?? 0;
        const updatedBalance = currentBalance + count;
        transaction.update(userDocRef, { attemptBalance: increment(count) });
        return updatedBalance;
    });

    await logAttemptChange({ userId, changeAmount: count, newBalance, reason: 'USER_RECHARGE' });
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

type FullClaims = {
  admin: boolean;
  disabled: boolean;
  deleted: boolean;
}

export const updateUserClaims = async (uid: string, claims: FullClaims): Promise<{ success: boolean; message?: string }> => {
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

export const resetAttemptBalance = async (userId: string): Promise<{ success: boolean, message?: string }> => {
    try {
        const config = await getAppConfig();
        const initialBalance = config.initialFreeAttempts;
        const userDocRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS || 'users', userId);
        const adminUser = await getAuthenticatedUser();
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User document does not exist!");
            }
            
            const oldBalance = userDoc.data().attemptBalance ?? 0;
            const changeAmount = initialBalance - oldBalance;
            
            transaction.update(userDocRef, { attemptBalance: initialBalance });

            await logAttemptChange({
                userId,
                changeAmount: changeAmount,
                newBalance: initialBalance,
                reason: 'ADMIN_RESET',
                context: { adminId: adminUser?.uid }
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error resetting attempt balance:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
};
