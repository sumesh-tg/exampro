
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Exam, ExamHistory } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, XCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { addExamHistory } from '@/services/examHistoryService';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ExamClient({ exam, timeLimit, sharedBy }: { exam: Exam, timeLimit?: number, sharedBy?: string | null }) {
  useRequireAuth();
  const { user } = useAuth();
  const [shuffledExam, setShuffledExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit ?? 0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const resultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Randomize questions and options once on mount
    const randomizedQuestions = shuffleArray(exam.questions).map(question => ({
      ...question,
      options: shuffleArray(question.options),
    }));
    setShuffledExam({ ...exam, questions: randomizedQuestions });
  }, [exam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLimit) {
      timer = setInterval(() => {
        if (!isSubmitted) {
          setTime((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(timer);
              handleSubmit();
              return 0;
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    } else {
      timer = setInterval(() => {
        if (!isSubmitted) {
          setTime((prevTime) => prevTime + 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeLimit]);
  
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
    if (index >= 0 && shuffledExam && index < shuffledExam.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleNext = () => {
    if (shuffledExam && currentQuestionIndex < shuffledExam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitted || !shuffledExam) return;
    let finalScore = 0;
    shuffledExam.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);

    if (user) {
      const historyEntry: Omit<ExamHistory, 'id'> = {
        userId: user.uid,
        examId: shuffledExam.id,
        examTitle: shuffledExam.title,
        score: finalScore,
        totalQuestions: shuffledExam.questions.length,
        date: new Date().toISOString(),
      };
      if (sharedBy) {
        try {
            // In a real app, you might want to fetch the user's name from their UID
            historyEntry.sharedBy = atob(sharedBy);
        } catch (e) {
            console.error("Failed to decode sharedBy param:", e);
        }
      }
      await addExamHistory(historyEntry);
    }
  };

  const handleDownloadPdf = async () => {
    const input = resultCardRef.current;
    if (input) {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`exam-result-${exam.id}.pdf`);
    }
  };
  
  if (!shuffledExam) {
     return <div className="flex min-h-screen items-center justify-center">Shuffling questions...</div>;
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card ref={resultCardRef} className="w-full max-w-2xl text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Exam Completed!</CardTitle>
            <CardDescription>Here's your result for "{shuffledExam.title}".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-full bg-primary/10 p-8 w-48 h-48 mx-auto flex flex-col justify-center items-center border-4 border-primary">
              <p className="text-muted-foreground">You scored</p>
              <p className="text-5xl font-bold text-primary">{score} / {shuffledExam.questions.length}</p>
            </div>
            <div className="flex flex-wrap justify-around text-lg gap-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    <span>{score} Correct</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="text-red-500" />
                    <span>{shuffledExam.questions.length - score} Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                    <Timer />
                    <span>{formatTime(timeLimit ? timeLimit - time : time)}</span>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="w-full md:w-auto" size="lg">
                <Link href="/">Back to Home</Link>
              </Button>
               <Button onClick={handleDownloadPdf} className="w-full md:w-auto" size="lg" variant="outline">
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = shuffledExam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / shuffledExam.questions.length) * 100;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-6">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <CardTitle>{shuffledExam.title}</CardTitle>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                    <Timer className="h-4 w-4" />
                    <span>{formatTime(time)}</span>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
              <CardDescription className="pt-2 text-center text-base">
                Question {currentQuestionIndex + 1} of {shuffledExam.questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-lg font-semibold text-center">{currentQuestion.questionText}</p>
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex]}
                onValueChange={handleAnswerSelect}
                className="space-y-2"
              >
                {currentQuestion.options.map((option, index) => (
                  <Label key={index} className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer transition-all hover:bg-accent/10 has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex justify-end pt-2 gap-2">
                <Button onClick={handleMarkForReview} variant={markedForReview.has(currentQuestionIndex) ? 'default' : 'outline'} size="lg">
                  {markedForReview.has(currentQuestionIndex) ? 'Unmark' : 'Mark for Review'}
                </Button>
                {currentQuestionIndex < shuffledExam.questions.length - 1 ? (
                  <Button onClick={handleNext} size="lg">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} size="lg">Submit</Button>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
      <div className="hidden md:block">
        <Card className="w-full shadow-lg sticky top-8">
            <CardHeader>
            <CardTitle className="text-xl">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                {shuffledExam.questions.map((_, index) => (
                <Button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    variant="outline"
                    size="icon"
                    className={cn(
                      'font-bold',
                      {
                        'bg-primary text-primary-foreground hover:bg-primary/90': currentQuestionIndex === index,
                        'bg-orange-400 hover:bg-orange-500 text-orange-900': markedForReview.has(index) && currentQuestionIndex !== index,
                        'bg-green-400 hover:bg-green-500 text-green-900': selectedAnswers[index] && !markedForReview.has(index) && currentQuestionIndex !== index,
                        'bg-red-400 hover:bg-red-500 text-red-900': !selectedAnswers[index] && visited.has(index) && !markedForReview.has(index) && currentQuestionIndex !== index,
                        'bg-gray-300 hover:bg-gray-400 text-gray-800': !visited.has(index) && !markedForReview.has(index) && currentQuestionIndex !== index,
                      }
                    )}
                >
                    {index + 1}
                </Button>
                ))}
            </div>
             <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-primary"></span> Current</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-400"></span> Answered</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-400"></span> Unanswered</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-orange-400"></span> Marked for Review</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-gray-300"></span> Not Visited</div>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    