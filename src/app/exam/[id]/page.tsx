
'use client';

import { useEffect, useState } from 'react';
import { ExamClient } from '@/components/exam-client';
import { notFound } from 'next/navigation';
import type { Exam } from '@/lib/data';
import { getExam } from '@/services/examService';

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<Exam | null | undefined>(undefined);

  useEffect(() => {
    async function fetchExam() {
      try {
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

  return <ExamClient exam={examData} />;
}
