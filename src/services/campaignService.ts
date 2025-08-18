
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Campaign } from '@/lib/data';

const campaignsCollectionRef = collection(db, 'campaigns');

export const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
    return await addDoc(campaignsCollectionRef, {
        ...campaign,
        createdAt: serverTimestamp(),
    });
}
