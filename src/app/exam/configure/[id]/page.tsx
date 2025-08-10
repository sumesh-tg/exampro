
'use client';

import { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { exams as initialExams } from '@/lib/data';
import type { Exam } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';

export default function ConfigureExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    let foundExam = initialExams.find((e) => e.id === params.id);
    if (!foundExam) {
      const tempExamData = sessionStorage.getItem('tempExam');
      if (tempExamData) {
        const tempExam = JSON.parse(tempExamData);
        if (tempExam.id === params.id) {
          foundExam = tempExam;
        }
      }
    }
    setExam(foundExam || null);
  }, [params.id]);
  
  const [numQuestions, setNumQuestions] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);

  useEffect(() => {
    if (exam) {
      setNumQuestions(exam.questions.length);
      setTimeLimit(Math.ceil(exam.questions.length * 0.5));
    }
  }, [exam]);

  if (!exam) {
    // You can return a notFound() or a loading state.
    // A loading state is better if the exam is expected to be found.
    return <div className="flex min-h-screen items-center justify-center">Loading configuration...</div>;
  }

  const handleStartExam = () => {
    router.push(`/exam/${exam.id}?questions=${numQuestions}&time=${timeLimit}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Configure Exam: {exam.title}</CardTitle>
          <CardDescription>Adjust the settings for your exam session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions: {numQuestions}</Label>
            <Slider
              id="num-questions"
              min={1}
              max={exam.questions.length}
              step={1}
              value={[numQuestions]}
              onValueChange={(value) => setNumQuestions(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time Limit (minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              min="1"
            />
          </div>
          <div className="flex justify-between">
             <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
            <Button onClick={handleStartExam}>Start Exam</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
