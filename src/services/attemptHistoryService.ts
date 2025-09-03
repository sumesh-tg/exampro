
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import type { AttemptHistoryLog } from '@/lib/data';

const attemptHistoryCollectionRef = collection(db, 'attempt_history');

type LogAttemptChangeParams = {
  userId: string;
  changeAmount: number;
  newBalance: number;
  reason: AttemptHistoryLog['reason'];
  context?: AttemptHistoryLog['context'];
};

export const logAttemptChange = async ({ userId, changeAmount, newBalance, reason, context }: LogAttemptChangeParams): Promise<void> => {
    try {
        await addDoc(attemptHistoryCollectionRef, {
            userId,
            changeAmount,
            newBalance,
            reason,
            context: context || {},
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log attempt change:", error);
        // Decide if you want to re-throw the error or handle it silently
    }
};


export const getAttemptHistory = async (): Promise<AttemptHistoryLog[]> => {
    const q = query(attemptHistoryCollectionRef, orderBy('createdAt', 'desc'));
    const data = await getDocs(q);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttemptHistoryLog));
}
