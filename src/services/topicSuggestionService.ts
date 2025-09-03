
'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

const getUsageDocId = (userId: string) => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    return `${userId}_${dateString}`;
}

const usageCollectionRef = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_TOPIC_SUGGESTION_USAGE || 'topicSuggestionUsage';

/**
 * Gets the number of times a user has used the topic suggestion feature today.
 * @param userId - The ID of the user.
 * @returns The number of times the feature was used today.
 */
export const getTopicSuggestionUsage = async (userId: string): Promise<number> => {
    const docId = getUsageDocId(userId);
    const docRef = doc(db, usageCollectionRef, docId);
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().count || 0;
        }
        return 0;
    } catch (error) {
        console.error("Error getting topic suggestion usage:", error);
        return 0; // Fail open, but log error
    }
};

/**
 * Increments the usage count for a user for the current day.
 * @param userId - The ID of the user.
 */
export const incrementTopicSuggestionUsage = async (userId: string): Promise<void> => {
    const docId = getUsageDocId(userId);
    const docRef = doc(db, usageCollectionRef, docId);

    try {
        await setDoc(docRef, {
            count: increment(1),
            userId: userId,
            date: new Date().toISOString().split('T')[0],
            lastUsed: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error incrementing topic suggestion usage:", error);
        // Depending on requirements, you might want to throw the error
        // to prevent the feature from being used if logging fails.
    }
};
