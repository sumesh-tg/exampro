import { exams } from '@/lib/data';
import { ExamClient } from '@/components/exam-client';
import { notFound } from 'next/navigation';

export default function ExamPage({ params }: { params: { id: string } }) {
  const exam = exams.find((q) => q.id === params.id);

  if (!exam) {
    notFound();
  }

  return <ExamClient exam={exam} />;
}
