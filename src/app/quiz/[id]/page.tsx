import { quizzes } from '@/lib/data';
import { QuizClient } from '@/components/quiz-client';
import { notFound } from 'next/navigation';

export default function QuizPage({ params }: { params: { id: string } }) {
  const quiz = quizzes.find((q) => q.id === params.id);

  if (!quiz) {
    notFound();
  }

  return <QuizClient quiz={quiz} />;
}
