
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
  limit,
} from 'firebase/firestore';
import type { AdminRequest } from '@/lib/data';

const adminRequestsCollectionRef = collection(db, 'adminRequests');

type CreateAdminRequestPayload = {
  userId: string;
  displayName: string;
  email: string;
  paymentId?: string;
};

export const createAdminRequest = async (payload: CreateAdminRequestPayload): Promise<void> => {
  // Check if a request already exists for this user
  const existingRequest = await getAdminRequestForUser(payload.userId);
  if (existingRequest) {
    throw new Error('You already have a pending or approved request.');
  }

  await addDoc(adminRequestsCollectionRef, {
    ...payload,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getAdminRequests = async (status: 'pending' | 'approved' | 'rejected'): Promise<AdminRequest[]> => {
  const q = query(adminRequestsCollectionRef, where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminRequest));
};

export const getAdminRequestForUser = async (userId: string): Promise<AdminRequest | null> => {
    const q = query(adminRequestsCollectionRef, where('userId', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AdminRequest;
}

export const updateAdminRequestStatus = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
  const requestDocRef = doc(db, 'adminRequests', requestId);
  await updateDoc(requestDocRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};
