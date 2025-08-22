
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { ExamHistory } from '@/lib/data';

export const getExamHistory = async (userId: string) => {
    const q = query(examHistoryCollectionRef, where("userId", "==", userId));
    const data = await getDocs(q);
    const history = data.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamHistory));

    // Sort history by date to identify first attempt
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const firstAttempts = new Set<string>();

    return history.map(h => {
        if (!firstAttempts.has(h.examId)) {
            firstAttempts.add(h.examId);
            return { ...h, attemptType: 'Free' };
        }
        return { ...h, attemptType: 'Paid' };
    });
}

const examHistoryCollectionRef = collection(db, 'exam_history');

export const getAllExamHistoryBySharer = async (sharerId: string) => {
    const q = query(
        examHistoryCollectionRef,
        where("sharedBy", "==", sharerId)
    );
    const data = await getDocs(q);
    return data.docs.map(doc => ({...doc.data(), id: doc.id}));
}

export const addExamHistory = async (examHistory: Omit<ExamHistory, 'id'>) => {
    return await addDoc(examHistoryCollectionRef, examHistory);
}
