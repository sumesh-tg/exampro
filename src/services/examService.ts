
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Exam } from '@/lib/data';

const examsCollectionRef = collection(db, 'exams');

export const getExams = async () => {
    const q = query(examsCollectionRef, orderBy('createdAt', 'desc'));
    const data = await getDocs(q);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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
        createdAt: serverTimestamp()
    });
}

export const deleteExam = async (id: string) => {
    const examDoc = doc(db, 'exams', id);
    return await deleteDoc(examDoc);
}

