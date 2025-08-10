
'use client';

import { useEffect, useState } from 'react';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams } from 'next/navigation';
import type { Exam } from '@/lib/data';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchExam() {
      // Try to get from sessionStorage first
      const tempExamData = sessionStorage.getItem('tempExam');
      if (tempExamData) {
        const tempExam = JSON.parse(tempExamData);
        if (tempExam.id === params.id) {
          setExamData(tempExam);
          return;
        }
      }
      
      // If not in temp storage, check full list in sessionStorage
      const allExamsData = sessionStorage.getItem('exams');
      if (allExamsData) {
        const allExams = JSON.parse(allExamsData);
        const examFromList = allExams.find((e: Exam) => e.id === params.id);
        if (examFromList) {
          setExamData(examFromList);
          return;
        }
      }
      
      setExamData(null); // Exam not found
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
