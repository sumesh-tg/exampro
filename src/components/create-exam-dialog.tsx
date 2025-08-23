
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Sparkles, Trash2, Upload, Download } from 'lucide-react';
import { generateExamQuestions, type GenerateExamQuestionsOutput } from '@/ai/flows/generate-questions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Exam } from '@/lib/data';
import { addExam } from '@/services/examService';
import { Checkbox } from './ui/checkbox';

const step1Schema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  isPremium: z.boolean().default(false),
});

const step2Schema = z.object({
  topic: z.string().min(2, { message: 'Topic must be at least 2 characters.' }),
  numQuestions: z.coerce.number().min(1).max(20),
});

type Question = GenerateExamQuestionsOutput['questions'][0];

interface CreateExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExamCreated: () => void;
}

export function CreateExamDialog({ open, onOpenChange, onExamCreated }: CreateExamDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { title: '', description: '', isPremium: false },
  });

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: { topic: '', numQuestions: 5 },
  });

  const handleNext = () => setStep(s => s + 1);

  const handleGenerateQuestions = async (values: z.infer<typeof step2Schema>) => {
    setLoading(true);
    setQuestions([]);
    try {
      const result = await generateExamQuestions({ topic: values.topic, numQuestions: values.numQuestions });
      setQuestions(result.questions);
      setStep(3);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };
  
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const handleSaveExam = async () => {
    setLoading(true);
    const examDetails = step1Form.getValues();
    const newExamData: Omit<Exam, 'id'> = {
      ...examDetails,
      questions: questions,
    };

    try {
        await addExam(newExamData);
        onExamCreated();
        reset();
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to save exam to Firestore:", error);
    } finally {
        setLoading(false);
    }
  };

  const reset = () => {
    step1Form.reset();
    step2Form.reset();
    setQuestions([]);
    setStep(1);
    setLoading(false);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Exam <PlusCircle className="ml-2 h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Create a New Exam</DialogTitle>
              <DialogDescription>
                {step === 1 && "Start by providing the basic details for your exam."}
                {step === 2 && "Now, let's configure the AI to generate questions for you."}
                {step === 3 && "Review the generated questions and save your exam."}
              </DialogDescription>
            </div>
            {step === 2 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                  <Button variant="outline" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        {step === 1 && (
            <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(handleNext)} className="space-y-4 py-4">
                    <FormField control={step1Form.control} name="title" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Exam Title</FormLabel>
                            <FormControl><Input placeholder="e.g., Introduction to Astrophysics" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={step1Form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Exam Description</FormLabel>
                            <FormControl><Textarea placeholder="A brief description of what this exam covers." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField
                        control={step1Form.control}
                        name="isPremium"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Premium Exam
                                </FormLabel>
                                <FormDescription>
                                  Users have to pay to attend this exam.
                                </FormDescription>
                                <FormMessage />
                            </div>
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit">Next</Button>
                    </DialogFooter>
                </form>
            </Form>
        )}

        {step === 2 && (
             <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(handleGenerateQuestions)} className="space-y-4">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-accent" />
                                <CardTitle>AI Question Generation</CardTitle>
                            </div>
                            <CardDescription>Provide a topic and the number of questions you want.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <FormField control={step2Form.control} name="topic" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Topic</FormLabel>
                                            <FormControl><Input placeholder="e.g., Black Holes" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={step2Form.control} name="numQuestions" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Questions</FormLabel>
                                        <FormControl><Input type="number" min="1" max="20" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Questions
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        )}

        {step === 3 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <h3 className="text-xl font-bold">Generated Questions</h3>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {questions.map((q, qIndex) => (
                    <AccordionItem value={`item-${qIndex}`} key={qIndex} className="border rounded-lg">
                      <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex justify-between items-center w-full gap-2">
                           <span className="font-semibold text-left flex-1 line-clamp-2">{`Q${qIndex + 1}: ${q.questionText}`}</span>
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(qIndex); }} className="text-destructive hover:text-destructive-foreground hover:bg-destructive shrink-0">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 pt-0">
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Textarea
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                className="text-base"
                                rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                              <Label>Options</Label>
                              {q.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <Input
                                value={q.correctAnswer}
                                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                                placeholder="Correct answer"
                              />
                            </div>
                         </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={handleSaveExam} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Exam
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
