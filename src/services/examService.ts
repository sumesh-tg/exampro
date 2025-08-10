
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import type { Exam } from '@/lib/data';

const examsCollectionRef = collection(db, 'exams');

export const getExams = async () => {
    const data = await getDocs(examsCollectionRef);
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

export const addExam = async (exam: Omit<Exam, 'id'>) => {
    return await addDoc(examsCollectionRef, exam);
}

export const deleteExam = async (id: string) => {
    const examDoc = doc(db, 'exams', id);
    return await deleteDoc(examDoc);
}
