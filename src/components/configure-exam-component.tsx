
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Exam } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';

export function ConfigureExamComponent({ exam }: { exam: Exam }) {
  const router = useRouter();

  const [numQuestions, setNumQuestions] = useState(exam.questions.length);
  const [timeLimit, setTimeLimit] = useState(Math.ceil(exam.questions.length * 0.5)); // Default 30s per question

  const handleStartExam = () => {
    // Give the exam a temporary ID for history tracking if it doesn't have one
    const examToStart = {
        ...exam,
        id: exam.id || `custom-${Date.now()}`
    };
    sessionStorage.setItem('tempExam', JSON.stringify(examToStart));
    router.push(`/exam/custom?questions=${numQuestions}&time=${timeLimit}`);
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
