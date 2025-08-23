
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import type { Exam } from '@/lib/data';

const examsCollectionRef = collection(db, 'exams');

export const getExams = async () => {
    const q = query(examsCollectionRef);
    const data = await getDocs(q);
    const exams = data.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Exam[];

    // Custom sort to handle null or undefined updatedAt
    exams.sort((a, b) => {
        const aDate = (a.updatedAt as any)?.toDate();
        const bDate = (b.updatedAt as any)?.toDate();

        if (aDate && bDate) {
            return bDate.getTime() - aDate.getTime(); // Most recent first
        }
        if (aDate && !bDate) {
            return -1; // a comes first
        }
        if (!aDate && bDate) {
            return 1; // b comes first
        }
        return 0; // both are null/undefined, keep original order
    });

    return exams;
}

export const getExam = async (id: string) => {
    const docRef = doc(db, 'exams', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
    } else {
        return null;
    }
}

export const addExam = async (exam: Omit<Exam, 'id' | 'createdAt'>) => {
    return await addDoc(examsCollectionRef, {
        ...exam,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export const updateExam = async (id: string, exam: Partial<Omit<Exam, 'id'>>) => {
    const examDoc = doc(db, 'exams', id);
    return await updateDoc(examDoc, {
        ...exam,
        updatedAt: serverTimestamp(),
    });
};

export const deleteExam = async (id: string) => {
    const examDoc = doc(db, 'exams', id);
    return await deleteDoc(examDoc);
}
