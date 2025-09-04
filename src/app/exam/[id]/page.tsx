
'use client';

import { useEffect, useState } from 'react';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams, useRouter } from 'next/navigation';
import type { Exam } from '@/lib/data';
import { getExam } from '@/services/examService';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, decrementAttemptBalance } from '@/services/userService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);
  const searchParams = useSearchParams();
  const sharedByParam = searchParams.get('shared_by');
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareExam() {
      if (authLoading) return;
      if (!user && !isSuperAdmin) {
        // This case should be handled by useRequireAuth in ExamClient, but as a fallback:
        router.push('/auth/signin');
        return;
      }

      try {
        let exam: Exam | null | undefined;
        let isCustom = false;
        
        // Check for temp exam in session storage first
        if (params.id === 'custom') {
            const tempExamString = sessionStorage.getItem('tempExam');
            if(tempExamString) {
                exam = JSON.parse(tempExamString) as Exam;
                isCustom = true;
            }
        } else {
            exam = await getExam(params.id) as Exam | null;
        }

        if (!exam) {
            setExamData(null); // Exam not found
            setIsReady(true);
            return;
        }

        // Only decrement if not a super admin, or if it's a super admin taking a non-custom exam
        const shouldDecrement = !isSuperAdmin;

        if (shouldDecrement && user) {
          const profile = await getUserProfile(user.uid);
          if ((profile?.attemptBalance ?? 0) <= 0) {
              toast({
                  variant: 'destructive',
                  title: 'No Attempts Left',
                  description: 'Please recharge your account to start a new exam.',
              });
              router.push('/');
              return;
          }
           // Decrement balance before loading exam
          await decrementAttemptBalance(user.uid, 'EXAM_ATTEMPT', { examId: exam.id, examTitle: exam.title });
        }
        
        setExamData(exam);
        setIsReady(true);

      } catch (error) {
        console.error("Failed to fetch exam or update balance", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare the exam.' });
        setExamData(null);
        setIsReady(true);
      }
    }

    prepareExam();
  }, [params.id, authLoading, user, isSuperAdmin, router, toast]);


  if (!isReady || examData === undefined) {
    // Loading state
    return <div className="flex min-h-screen items-center justify-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Preparing exam...</div>;
  }


  if (!examData) {
    notFound();
  }
  
  const timeLimitInSeconds = examData.timeLimit ? examData.timeLimit * 60 : undefined;


  return <ExamClient exam={examData} timeLimit={timeLimitInSeconds} sharedBy={sharedByParam} />;
}
