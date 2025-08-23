
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const userCampaignsCollectionRef = collection(db, 'user_campaigns');

export const addUserToCampaign = async (userId: string, campaignId: string) => {
    return await addDoc(userCampaignsCollectionRef, {
        userId,
        campaignId,
        joinedAt: serverTimestamp(),
    });
}

export const getUserCampaigns = async (userId: string) => {
    const q = query(userCampaignsCollectionRef, where("userId", "==", userId));
    const data = await getDocs(q);
    return data.docs.map(doc => doc.data());
}

export const getUsersForCampaign = async (campaignId: string) => {
    const q = query(userCampaignsCollectionRef, where("campaignId", "==", campaignId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
}

export const hasUserJoinedCampaign = async (userId: string, campaignId: string): Promise<boolean> => {
    const q = query(userCampaignsCollectionRef, where("userId", "==", userId), where("campaignId", "==", campaignId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};
