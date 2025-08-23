import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { CampaignDetail } from '@/lib/data';

const campaignDetailsCollectionRef = collection(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_CAMPAIGN_DETAILS || 'campaign_details');

// CREATE
export const addCampaignDetail = async (campaignDetail: Omit<CampaignDetail, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> & { startDate: Date; endDate: Date }) => {
    return await addDoc(campaignDetailsCollectionRef, {
        ...campaignDetail,
        startDate: Timestamp.fromDate(campaignDetail.startDate),
        endDate: Timestamp.fromDate(campaignDetail.endDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

// READ (all)
export const getCampaignDetails = async (): Promise<CampaignDetail[]> => {
    const data = await getDocs(campaignDetailsCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as CampaignDetail));
}

// READ (one)
export const getCampaignDetail = async (id: string): Promise<CampaignDetail | null> => {
    const docRef = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_CAMPAIGN_DETAILS || 'campaign_details', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as CampaignDetail;
    } else {
        return null;
    }
}

// UPDATE
export const updateCampaignDetail = async (id: string, updates: Partial<Omit<CampaignDetail, 'id'>>) => {
    const campaignDetailDoc = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_CAMPAIGN_DETAILS || 'campaign_details', id);
    const updateData: any = { ...updates };

    // Convert Date objects to Firestore Timestamps if they exist
    if (updates.startDate && updates.startDate instanceof Date) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate && updates.endDate instanceof Date) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
    }
    
    updateData.updatedAt = serverTimestamp();

    return await updateDoc(campaignDetailDoc, updateData);
}

// DELETE
export const deleteCampaignDetail = async (id: string) => {
    const campaignDetailDoc = doc(db, process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION_CAMPAIGN_DETAILS || 'campaign_details', id);
    return await deleteDoc(campaignDetailDoc);
}
