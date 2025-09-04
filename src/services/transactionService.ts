
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';

const transactionsCollectionRef = collection(db, 'transactions');

type LogTransactionPayload = Omit<Transaction, 'id' | 'createdAt'>;

export const logTransaction = async (payload: LogTransactionPayload): Promise<void> => {
    try {
        await addDoc(transactionsCollectionRef, {
            ...payload,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log transaction:", error);
    }
};
