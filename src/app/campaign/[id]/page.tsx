
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-auth';
import { addUserToCampaign, getUsersForCampaign, hasUserJoinedCampaign } from '@/services/userCampaignsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { CampaignDetail } from '@/lib/data';
import { getCampaignDetail } from '@/services/campaignDetailsService';

export default function JoinCampaignPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'already_joined' | 'error' | 'full'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && campaignId) {
      const joinCampaign = async () => {
        try {
          const alreadyJoined = await hasUserJoinedCampaign(user.uid, campaignId);
          if (alreadyJoined) {
            setStatus('already_joined');
            setTimeout(() => router.push('/'), 2000);
            return;
          }

          // Check if campaign is full
          const campaignDetails = await getCampaignDetail(campaignId) as CampaignDetail | null;
          if (!campaignDetails) {
            throw new Error("Campaign not found.");
          }
          const joinedUsers = await getUsersForCampaign(campaignId);
          if (joinedUsers.length >= campaignDetails.maxJoinees) {
            setStatus('full');
            return;
          }

          await addUserToCampaign(user.uid, campaignId);
          setStatus('success');
          setTimeout(() => router.push('/'), 2000);

        } catch (err: any) {
          console.error("Failed to join campaign:", err);
          setError(err.message || "An unknown error occurred.");
          setStatus('error');
        }
      };
      joinCampaign();
    }
  }, [authLoading, user, campaignId, router]);

  if (authLoading || status === 'loading') {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Joining campaign...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="text-2xl">
                    {status === 'success' && 'Successfully Joined!'}
                    {status === 'already_joined' && 'Already a Member!'}
                    {status === 'full' && 'Campaign Full'}
                    {status === 'error' && 'Something Went Wrong'}
                </CardTitle>
                <CardDescription>
                    {status === 'success' && 'You have been added to the campaign.'}
                    {status === 'already_joined' && 'You are already a member of this campaign.'}
                    {status === 'full' && 'Sorry, this campaign has reached its maximum number of participants.'}
                    {status === 'error' && 'We could not add you to the campaign.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {status === 'success' && (
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                )}
                {status === 'already_joined' && (
                    <CheckCircle className="mx-auto h-16 w-16 text-blue-500" />
                )}
                 {status === 'full' && (
                    <XCircle className="mx-auto h-16 w-16 text-destructive" />
                )}
                 {status === 'error' && (
                    <>
                        <XCircle className="mx-auto h-16 w-16 text-destructive" />
                        <p className="text-destructive-foreground bg-destructive/20 p-2 rounded-md">{error}</p>
                    </>
                )}
                <p className="text-muted-foreground">You will be redirected to the homepage shortly.</p>
                <Button asChild variant="outline">
                    <Link href="/">Go to Home Now</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
