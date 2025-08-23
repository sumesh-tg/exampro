
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { ExamHistory } from '@/lib/data';

const examHistoryCollectionRef = collection(db, 'exam_history');

export const getExamHistory = async (userId: string) => {
    const q = query(examHistoryCollectionRef, where("userId", "==", userId));
    const data = await getDocs(q);
    const history = data.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamHistory));

    // Sort by updatedAt descending, then createdAt descending
    history.sort((a, b) => {
        const aUpdatedAt = (a.updatedAt as any)?.toDate() || new Date(0);
        const bUpdatedAt = (b.updatedAt as any)?.toDate() || new Date(0);
        if (bUpdatedAt.getTime() !== aUpdatedAt.getTime()) {
            return bUpdatedAt.getTime() - aUpdatedAt.getTime();
        }
        
        const aCreatedAt = (a.createdAt as any)?.toDate() || new Date(0);
        const bCreatedAt = (b.createdAt as any)?.toDate() || new Date(0);
        return bCreatedAt.getTime() - aCreatedAt.getTime();
    });
    
    // Reverse for chronological attempt calculation
    const reversedHistory = [...history].reverse();
    const attemptCounts: Record<string, number> = {};
    const historyWithAttempts = reversedHistory.map(h => {
        const examId = h.examId;
        if (!attemptCounts[examId]) {
            attemptCounts[examId] = 0;
        }
        attemptCounts[examId]++;
        
        return { 
            ...h, 
            attemptNumber: attemptCounts[examId],
            attemptType: attemptCounts[examId] === 1 ? 'Free' : 'Paid'
        };
    }).reverse(); // Reverse back to original sort order

    return historyWithAttempts;
}


export const getAllExamHistoryBySharer = async (sharerId: string) => {
    const q = query(
        examHistoryCollectionRef,
        where("sharedBy", "==", sharerId)
    );
    const data = await getDocs(q);
    return data.docs.map(doc => ({...doc.data(), id: doc.id}));
}

export const getAllExamHistory = async (): Promise<ExamHistory[]> => {
    const data = await getDocs(examHistoryCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamHistory));
}

export const addExamHistory = async (examHistory: Omit<ExamHistory, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await addDoc(examHistoryCollectionRef, {
        ...examHistory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export const updateExamHistory = async (id: string, updates: Partial<Pick<ExamHistory, 'rating' | 'feedback' | 'updatedBy'>>) => {
    const historyDoc = doc(db, 'exam_history', id);
    return await updateDoc(historyDoc, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};
