
'use client';

import { useEffect, useState } from 'react';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams } from 'next/navigation';
import type { Exam } from '@/lib/data';
import { getExam } from '@/services/examService';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);
  const searchParams = useSearchParams();
  const sharedByParam = searchParams.get('shared_by');

  useEffect(() => {
    async function fetchExam() {
      try {
        // Check for temp exam in session storage first
        if (params.id === 'custom') {
            const tempExamString = sessionStorage.getItem('tempExam');
            if(tempExamString) {
                const tempExam = JSON.parse(tempExamString);
                setExamData(tempExam as Exam);
                return;
            }
        }

        const exam = await getExam(params.id);
        if (exam) {
          setExamData(exam as Exam);
        } else {
          setExamData(null); // Exam not found
        }
      } catch (error) {
        console.error("Failed to fetch exam", error);
        setExamData(null);
      }
    }

    fetchExam();
  }, [params.id]);


  if (examData === undefined) {
    // Loading state
    return <div className="flex min-h-screen items-center justify-center">Loading exam...</div>;
  }


  if (!examData) {
    notFound();
  }
  
  const timeLimitInSeconds = examData.timeLimit ? examData.timeLimit * 60 : undefined;


  return <ExamClient exam={examData} timeLimit={timeLimitInSeconds} sharedBy={sharedByParam} />;
}
