
'use client';

import { useEffect, useState } from 'react';
import { exams as initialExams } from '@/lib/data';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams } from 'next/navigation';
import type { Exam } from '@/lib/data';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to find the exam in the statically defined list first.
    let foundExam = initialExams.find((q) => q.id === params.id);

    // If not found, check sessionStorage for a temporary exam (e.g., newly created).
    if (!foundExam) {
      const tempExamData = sessionStorage.getItem('tempExam');
      if (tempExamData) {
        try {
          const tempExam = JSON.parse(tempExamData);
          // Make sure the ID from storage matches the URL parameter.
          if (tempExam.id === params.id) {
            foundExam = tempExam;
          }
        } catch (error) {
          console.error("Failed to parse temporary exam data from sessionStorage", error);
        }
      }
    }
    
    setExamData(foundExam);

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
