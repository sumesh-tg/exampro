
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getCampaignDetail } from '@/services/campaignDetailsService';
import type { CampaignDetail, Exam, ExamHistory } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { getUserCampaigns } from '@/services/userCampaignsService';
import { getExamHistory } from '@/services/examHistoryService';
import { Loader2, Layers, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

declare const Razorpay: any;

interface JoinedCampaignsProps {
    allExams: Exam[];
}

export function JoinedCampaigns({ allExams }: JoinedCampaignsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [joinedCampaigns, setJoinedCampaigns] = useState<CampaignDetail[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [userCampaigns, history] = await Promise.all([
            getUserCampaigns(user.uid),
            getExamHistory(user.uid)
        ]);

        const campaignIds = userCampaigns.map(uc => (uc as any).campaignId);
        
        const campaignDetails = await Promise.all(
          campaignIds.map(id => getCampaignDetail(id))
        );

        setJoinedCampaigns(campaignDetails.filter(Boolean) as CampaignDetail[]);
        setExamHistory(history as ExamHistory[]);

      } catch (error) {
        console.error("Failed to fetch joined campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handlePayment = (exam: Exam) => {
    if (!user) return;
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: "1000", 
      currency: "INR",
      name: "QuizWhiz Re-attempt",
      description: `Payment for re-attempting ${exam.title}`,
      handler: function (response: any) {
        router.push(`/exam/${exam.id}`);
      },
      prefill: {
        name: user.displayName || "Anonymous User",
        email: user.email || "",
        contact: user.phoneNumber || ""
      },
      notes: {
        exam_id: exam.id,
        user_id: user.uid
      },
      theme: {
        color: "#72A0C1"
      }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response: any){
            toast({
              variant: 'destructive',
              title: 'Payment Failed',
              description: response.error.description,
            });
    });
    rzp.open();
  }
  
  const getExamById = (id: string) => {
    return allExams.find(exam => exam.id === id);
  }
  
  const getAttemptsForExam = (examId: string) => {
      return examHistory.filter(h => h.examId === examId).length;
  }

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
    return null;
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
                        
                        const attempts = getAttemptsForExam(exam.id);
                        const freeAttemptsDisabled = (campaign.freeAttemptsDisabledFor || []).includes(user?.uid || '');
                        const hasExceededFreeAttempts = attempts >= campaign.freeAttempts;
                        
                        const shouldPay = freeAttemptsDisabled || hasExceededFreeAttempts || exam.isPremium;

                        return (
                             <div key={exam.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-1">
                                    <p className="font-semibold">{exam.title}</p>
                                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                                </div>
                                {shouldPay && attempts > 0 ? (
                                    <Button variant="secondary" onClick={() => handlePayment(exam)}>
                                      <RefreshCcw className="mr-2 h-4 w-4" />
                                      Pay to Re-attempt
                                    </Button>
                                ) : shouldPay && attempts === 0 ? (
                                     <Button variant="secondary" onClick={() => handlePayment(exam)}>
                                      <RefreshCcw className="mr-2 h-4 w-4" />
                                      Pay to Attempt
                                    </Button>
                                ) : (
                                    <Button variant="default" size="sm" asChild>
                                        <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                                    </Button>
                                )}
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
