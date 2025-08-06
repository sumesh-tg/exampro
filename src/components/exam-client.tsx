
'use client';

import { useState, useEffect } from 'react';
import type { Exam } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ExamClient({ exam }: { exam: Exam }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSubmitted) {
        setTime((prevTime) => prevTime + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);
  
  useEffect(() => {
    setVisited((prev) => new Set(prev).add(currentQuestionIndex));
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };
  
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    let finalScore = 0;
    exam.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Exam Completed!</CardTitle>
            <CardDescription>Here's your result for "{exam.title}".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-full bg-primary/10 p-8 w-48 h-48 mx-auto flex flex-col justify-center items-center border-4 border-primary">
              <p className="text-muted-foreground">You scored</p>
              <p className="text-5xl font-bold text-primary">{score} / {exam.questions.length}</p>
            </div>
            <div className="flex flex-wrap justify-around text-lg gap-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    <span>{score} Correct</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="text-red-500" />
                    <span>{exam.questions.length - score} Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                    <Timer />
                    <span>{formatTime(time)}</span>
                </div>
            </div>
            <Button asChild className="w-full md:w-auto" size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-3 gap-6 p-4 md:p-8">
      <div className="lg:col-span-2">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>{exam.title}</CardTitle>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                    <Timer className="h-4 w-4" />
                    <span>{formatTime(time)}</span>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
              <CardDescription className="pt-4 text-center text-base">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-semibold text-center">{currentQuestion.questionText}</p>
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex]}
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all hover:bg-accent/10 has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex justify-end pt-4">
                {currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button onClick={handleNext} size="lg">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} size="lg">Submit</Button>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="w-full shadow-lg sticky top-8">
            <CardHeader>
            <CardTitle className="text-xl">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {exam.questions.map((_, index) => (
                <Button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    variant="outline"
                    className={cn(
                    'text-white',
                    {
                        'bg-primary hover:bg-primary/90': currentQuestionIndex === index,
                        'bg-yellow-500 hover:bg-yellow-600': currentQuestionIndex !== index && visited.has(index),
                        'bg-green-500 hover:bg-green-600': currentQuestionIndex !== index && !visited.has(index),
                    }
                    )}
                >
                    {index + 1}
                </Button>
                ))}
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
