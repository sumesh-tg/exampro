
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { CampaignDetail } from '@/lib/data';

const campaignDetailsCollectionRef = collection(db, 'campaign_details');

// CREATE
export const addCampaignDetail = async (campaignDetail: Omit<CampaignDetail, 'id'>) => {
    return await addDoc(campaignDetailsCollectionRef, {
        ...campaignDetail,
        createdAt: serverTimestamp(),
    });
}

// READ (all)
export const getCampaignDetails = async (): Promise<CampaignDetail[]> => {
    const data = await getDocs(campaignDetailsCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as CampaignDetail));
}

// READ (one)
export const getCampaignDetail = async (id: string): Promise<CampaignDetail | null> => {
    const docRef = doc(db, 'campaign_details', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as CampaignDetail;
    } else {
        return null;
    }
}

// UPDATE
export const updateCampaignDetail = async (id: string, updates: Partial<Omit<CampaignDetail, 'id'>>) => {
    const campaignDetailDoc = doc(db, 'campaign_details', id);
    return await updateDoc(campaignDetailDoc, updates);
}

// DELETE
export const deleteCampaignDetail = async (id: string) => {
    const campaignDetailDoc = doc(db, 'campaign_details', id);
    return await deleteDoc(campaignDetailDoc);
}
