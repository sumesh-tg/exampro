
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Exam } from '@/lib/data';

const examsCollection = collection(db, 'exams');

// Function to add a new exam to Firestore
export async function addExam(examData: Omit<Exam, 'id'>): Promise<Exam> {
  const docRef = await addDoc(examsCollection, examData);
  return { id: docRef.id, ...examData };
}

// Function to get all exams from Firestore
export async function getExams(): Promise<Exam[]> {
  const snapshot = await getDocs(examsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
}

// Function to get a single exam by ID from Firestore
export async function getExam(id: string): Promise<Exam | null> {
    const docRef = doc(db, 'exams', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Exam;
    } else {
        return null;
    }
}
