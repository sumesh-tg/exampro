
'use client';

import { exams } from '@/lib/data';
import { ExamClient } from '@/components/exam-client';
import { notFound, useSearchParams } from 'next/navigation';
import type { Exam } from '@/lib/data';

export default function ExamPage({ params }: { params: { id: string } }) {
  const examData = exams.find((q) => q.id === params.id);
  const searchParams = useSearchParams();

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
