
'use client';

import { useEffect, useState } from 'react';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams } from 'next/navigation';
import type { Exam } from '@/lib/data';
import { getExam } from '@/services/examService';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchExam() {
      // Try to get from sessionStorage first (for newly created exams not yet in DB)
      const tempExamData = sessionStorage.getItem('tempExam');
      if (tempExamData) {
        const tempExam = JSON.parse(tempExamData);
        if (tempExam.id === params.id) {
          setExamData(tempExam);
          // Optional: clear it after use if it's truly temporary
          // sessionStorage.removeItem('tempExam'); 
          return;
        }
      }
      
      // If not in session storage, fetch from Firestore
      const examFromDb = await getExam(params.id);
      setExamData(examFromDb);
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

  const numQuestions = searchParams.get('questions');
  const timeLimit = searchParams.get('time');

  const selectedQuestions = examData.questions.slice(0, numQuestions ? parseInt(numQuestions) : examData.questions.length);

  const exam: Exam = {
    ...examData,
    questions: selectedQuestions,
  };

  const timeLimitInSeconds = timeLimit ? parseInt(timeLimit) * 60 : undefined;

  return <ExamClient exam={exam} timeLimit={timeLimitInSeconds} />;
}
