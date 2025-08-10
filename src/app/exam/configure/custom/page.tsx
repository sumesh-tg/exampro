
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfigureExamComponent } from '@/components/configure-exam-component';

function ConfigureCustomExamPage() {
    const searchParams = useSearchParams();
    const examDataString = searchParams.get('examData');

    if (!examDataString) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Exam data not found.
            </div>
        );
    }
    
    try {
        const exam = JSON.parse(decodeURIComponent(examDataString));
        return <ConfigureExamComponent exam={exam} />;
    } catch (error) {
        console.error("Failed to parse exam data", error);
        return (
            <div className="flex min-h-screen items-center justify-center">
                Failed to load exam configuration. Invalid data provided.
            </div>
        );
    }
}

export default function ConfigureCustomExamPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ConfigureCustomExamPage />
    </Suspense>
  )
}
