
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Exam, ExamHistory } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, XCircle, Download, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { addExamHistory } from '@/services/examHistoryService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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

type TagAnalysis = {
  [tag: string]: {
    correct: number;
    total: number;
  }
}

export function ExamClient({ exam, timeLimit, sharedBy }: { exam: Exam, timeLimit?: number, sharedBy?: string | null }) {
  useRequireAuth();
  const { user, isSuperAdmin } = useAuth();
  const [shuffledExam, setShuffledExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis>({});
  const [time, setTime] = useState(timeLimit ?? 0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const resultCardRef = useRef<HTMLDivElement>(null);
  const timeTakenRef = useRef(0);

  useEffect(() => {
    // Randomize questions and options once on mount
    const randomizedQuestions = shuffleArray(exam.questions).map(question => ({
      ...question,
      options: shuffleArray(question.options),
    }));
    setShuffledExam({ ...exam, questions: randomizedQuestions });
  }, [exam]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || !shuffledExam) return;
    
    let finalScore = 0;
    const analysis: TagAnalysis = {};

    shuffledExam.questions.forEach((q, index) => {
      const isCorrect = selectedAnswers[index] === q.correctAnswer;
      if (isCorrect) {
        finalScore++;
      }
      if (q.tag && q.tag.trim() !== '') {
        const tag = q.tag;
        if (!analysis[tag]) {
          analysis[tag] = { correct: 0, total: 0 };
        }
        analysis[tag].total++;
        if (isCorrect) {
          analysis[tag].correct++;
        }
      }
    });

    setScore(finalScore);
    setTagAnalysis(analysis);
    setIsSubmitted(true);

    if (user) {
      const winPercentage = shuffledExam.winPercentage || 50;
      const userPercentage = (finalScore / shuffledExam.questions.length) * 100;
      const hasPassed = userPercentage >= winPercentage;

      const historyEntry: Omit<ExamHistory, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        examId: shuffledExam.id.startsWith('custom-') ? `custom-${Date.now()}` : shuffledExam.id,
        examTitle: shuffledExam.title,
        score: finalScore,
        totalQuestions: shuffledExam.questions.length,
        date: new Date().toISOString(),
        createdBy: user.uid,
        updatedBy: user.uid,
        status: hasPassed ? 'Pass' : 'Fail',
        winPercentage: winPercentage,
        timeTakenInSeconds: timeTakenRef.current,
      };

      if (sharedBy) {
        try {
            historyEntry.sharedBy = atob(sharedBy);
        } catch (e) {
            console.error("Failed to decode sharedBy param:", e);
        }
      }
      if (exam.isGeneratedBySuperAdmin && isSuperAdmin) {
        // Do not add history for super admin generated exams
      } else {
        await addExamHistory(historyEntry);
      }
    }
  }, [isSubmitted, selectedAnswers, shuffledExam, user, sharedBy, isSuperAdmin, exam]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLimit) {
      timer = setInterval(() => {
        if (!isSubmitted) {
          timeTakenRef.current += 1;
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
          timeTakenRef.current += 1;
          setTime((prevTime) => prevTime + 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeLimit, handleSubmit]);
  
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

  const handleDownloadPdf = async () => {
    const input = resultCardRef.current;
    if (input) {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add watermark
      pdf.setFontSize(50);
      pdf.setTextColor(230, 230, 230); // Light grey color
      pdf.setGState(new pdf.GState({opacity: 0.5}));
      pdf.text(
          "ExamsPro.in", 
          pdfWidth / 2, 
          pdfHeight / 2, 
          { angle: -45, align: 'center' }
      );
      
      pdf.save(`exam-result-${exam.id}.pdf`);
    }
  };
  
  if (!shuffledExam) {
     return <div className="flex min-h-screen items-center justify-center">Shuffling questions...</div>;
  }

  if (isSubmitted) {
    const winPercentage = shuffledExam.winPercentage || 50;
    const userPercentage = (score / shuffledExam.questions.length) * 100;
    const hasPassed = userPercentage >= winPercentage;

    const correctCount = score;
    const answeredCount = Object.keys(selectedAnswers).length;
    const incorrectCount = answeredCount - correctCount;
    const unansweredCount = shuffledExam.questions.length - answeredCount;


    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card ref={resultCardRef} className="w-full max-w-2xl text-center shadow-lg relative overflow-hidden">
           <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              <span className="text-8xl font-bold text-gray-200/50 dark:text-gray-700/50 -rotate-45">
                ExamsPro.in
              </span>
            </div>
          <div className="relative z-10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Exam Completed!</CardTitle>
            <CardDescription>Here's your result for "{shuffledExam.title}".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={cn("rounded-full p-6 w-48 h-48 mx-auto flex flex-col justify-center items-center border-4 bg-background/80",
              hasPassed ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"
            )}>
              <p className="text-muted-foreground">You scored</p>
              <p className={cn("text-5xl font-bold", hasPassed ? "text-green-600" : "text-red-600")}>
                {score} / {shuffledExam.questions.length}
              </p>
               <p className="text-lg text-muted-foreground font-semibold">({userPercentage.toFixed(1)}%)</p>
               <Badge variant={hasPassed ? 'default' : 'destructive'} className="mt-2 text-base">
                {hasPassed ? 'Pass' : 'Fail'}
              </Badge>
            </div>
            <div className="flex flex-wrap justify-around text-lg gap-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    <span>{correctCount} Correct</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="text-red-500" />
                    <span>{incorrectCount} Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                    <HelpCircle className="text-yellow-500" />
                    <span>{unansweredCount} Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                    <Timer />
                    <span>{formatTime(timeTakenRef.current)}</span>
                </div>
            </div>

            {Object.keys(tagAnalysis).length > 0 && (
              <div className="text-left pt-4">
                <h3 className="text-xl font-semibold mb-2 text-center">Performance Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(tagAnalysis).map(([tag, data]) => (
                      <TableRow key={tag}>
                        <TableCell className="font-medium">{tag}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={data.correct === data.total ? "default" : "secondary"}>
                            {data.correct} / {data.total}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Review Answers</AccordionTrigger>
                        <AccordionContent>
                           <Accordion type="multiple" className="w-full space-y-2 mt-4">
                            {shuffledExam.questions.map((q, index) => {
                                const userAnswer = selectedAnswers[index];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                    <AccordionItem value={`question-${index}`} key={index} className="border rounded-lg">
                                        <AccordionTrigger className="p-4 hover:no-underline text-left [&[data-state=open]>div>svg.lucide-chevron-down]:rotate-180">
                                             <div className="flex items-center gap-4 w-full">
                                                {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
                                                <span className="font-semibold flex-1">Q{index + 1}: {q.questionText}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 pt-0">
                                            <div className="space-y-2">
                                                {q.options.map((option, oIndex) => {
                                                    const isUserAnswer = userAnswer === option;
                                                    const isTheCorrectAnswer = q.correctAnswer === option;
                                                    
                                                    return (
                                                        <div
                                                            key={oIndex}
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-md p-2 text-sm",
                                                                isTheCorrectAnswer && "bg-green-100 dark:bg-green-900/30",
                                                                isUserAnswer && !isCorrect && "bg-red-100 dark:bg-red-900/30"
                                                            )}
                                                        >
                                                            {isUserAnswer ? (
                                                                isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
                                                            ) : isTheCorrectAnswer ? (
                                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border border-muted-foreground"></div>
                                                            )}
                                                            <span>{option}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {!isCorrect && userAnswer && (
                                                <p className="mt-2 text-sm text-muted-foreground">Your answer was <span className="font-semibold text-red-600">{userAnswer}</span>. The correct answer is <span className="font-semibold text-green-600">{q.correctAnswer}</span>.</p>
                                            )}
                                            {!userAnswer && (
                                                <p className="mt-2 text-sm text-muted-foreground">You did not answer this question. The correct answer is <span className="font-semibold text-green-600">{q.correctAnswer}</span>.</p>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                           </Accordion>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button asChild className="w-full md:w-auto" size="lg">
                <Link href="/">Back to Home</Link>
              </Button>
               <Button onClick={handleDownloadPdf} className="w-full md:w-auto" size="lg" variant="outline">
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
            </div>
          </CardContent>
          </div>
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
      <div>
        <Card className="w-full shadow-lg md:sticky md:top-8">
            <CardHeader>
            <CardTitle className="text-xl">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {shuffledExam.questions.map((_, index) => (
                <Button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    variant="outline"
                    size="icon"
                    className={cn(
                      'font-bold',
                      {
                        'bg-green-400 hover:bg-green-500 text-green-900': currentQuestionIndex === index,
                        'bg-orange-400 hover:bg-orange-500 text-orange-900': markedForReview.has(index) && currentQuestionIndex !== index,
                        'bg-primary text-primary-foreground hover:bg-primary/90': selectedAnswers[index] && !markedForReview.has(index) && currentQuestionIndex !== index,
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
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-400"></span> Current</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-primary"></span> Answered</div>
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

    

    


