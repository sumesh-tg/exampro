
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { ExamHistory } from '@/lib/data';

const examHistoryCollectionRef = collection(db, 'exam_history');

export const getExamHistory = async (userId: string) => {
    const q = query(examHistoryCollectionRef, where("userId", "==", userId));
    const data = await getDocs(q);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}

export const addExamHistory = async (examHistory: Omit<ExamHistory, 'id'>) => {
    return await addDoc(examHistoryCollectionRef, examHistory);
}
