
import { auth, db, functions } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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

export const listUsers = async (): Promise<AdminUserRecord[]> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("Authentication required.");
        }

        const idToken = await user.getIdToken();
        const functionName = 'userListApi-listUsersApi';
        
        // Note: The region might need to be changed if your function is deployed elsewhere.
        const region = 'us-central1'; 
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
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
        throw new Error("Failed to list users.");
    }
};
