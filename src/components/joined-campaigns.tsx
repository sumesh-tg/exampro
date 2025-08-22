
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getCampaignDetail } from '@/services/campaignDetailsService';
import type { CampaignDetail, Exam } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { getUserCampaigns } from '@/services/userCampaignsService';
import { Loader2, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface JoinedCampaignsProps {
    allExams: Exam[];
}

export function JoinedCampaigns({ allExams }: JoinedCampaignsProps) {
  const { user } = useAuth();
  const [joinedCampaigns, setJoinedCampaigns] = useState<CampaignDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJoinedCampaigns() {
      if (!user) return;
      setLoading(true);
      try {
        const userCampaigns = await getUserCampaigns(user.uid);
        const campaignIds = userCampaigns.map(uc => (uc as any).campaignId);
        
        const campaignDetails = await Promise.all(
          campaignIds.map(id => getCampaignDetail(id))
        );

        setJoinedCampaigns(campaignDetails.filter(Boolean) as CampaignDetail[]);
      } catch (error) {
        console.error("Failed to fetch joined campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJoinedCampaigns();
  }, [user]);
  
  if (loading) {
    return (
        <Card>
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Layers className="h-6 w-6 text-primary" />
                    <CardTitle>My Campaigns</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  if (joinedCampaigns.length === 0) {
    return null; // Don't show the card if there are no joined campaigns
  }
  
  const getExamById = (id: string) => {
    return allExams.find(exam => exam.id === id);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <CardTitle>My Joined Campaigns</CardTitle>
        </div>
        <CardDescription>
          Here are the campaigns you have joined.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {joinedCampaigns.map(campaign => (
            <AccordionItem value={campaign.id} key={campaign.id}>
              <AccordionTrigger>
                <div className="flex flex-col items-start">
                    <span className="font-semibold">{campaign.name}</span>
                    <span className="text-sm text-muted-foreground font-normal">
                        Active from {format((campaign.startDate as any).toDate(), "PPP")} to {format((campaign.endDate as any).toDate(), "PPP")}
                    </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-muted-foreground">{campaign.description}</p>
                <h4 className="font-semibold">Exams in this campaign:</h4>
                <div className="grid gap-4">
                    {campaign.examIds.map(examId => {
                        const exam = getExamById(examId);
                        if (!exam) return null;
                        return (
                             <div key={exam.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-1">
                                    <p className="font-semibold">{exam.title}</p>
                                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                                </div>
                                <Button variant="default" size="sm" asChild>
                                    <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                                </Button>
                            </div>
                        )
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

