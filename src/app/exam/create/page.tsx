
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Sparkles } from 'lucide-react';
import { generateExamQuestions } from '@/ai/flows/generate-questions';
import type { GenerateExamQuestionsOutput } from '@/ai/flows/generate-questions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  topic: z.string().min(2, { message: 'Topic must be at least 2 characters.' }),
  numQuestions: z.coerce.number().min(3).max(20),
});

type Question = GenerateExamQuestionsOutput['questions'][0];

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      topic: '',
      numQuestions: 5,
    },
  });

  const handleGenerateQuestions = async () => {
    const topic = form.getValues('topic');
    const numQuestions = form.getValues('numQuestions');
    if (!topic || !numQuestions) {
      form.trigger(['topic', 'numQuestions']);
      return;
    }
    setLoading(true);
    setQuestions([]);
    try {
      const result = await generateExamQuestions({ topic, numQuestions });
      setQuestions(result.questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      // You might want to show a toast notification here
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
  
  const handleSaveExam = () => {
    // This is a temporary solution to navigate without causing hydration errors.
    // A proper solution would involve a database or robust state management.
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Exam</CardTitle>
            <CardDescription>Fill in the details below and let AI generate questions for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Introduction to Astrophysics" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Description</FormLabel>
                      <FormControl><Textarea placeholder="A brief description of what this exam covers." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                           <FormField
                              control={form.control}
                              name="topic"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Topic</FormLabel>
                                  <FormControl><Input placeholder="e.g., Black Holes" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        <FormField
                          control={form.control}
                          name="numQuestions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Questions</FormLabel>
                              <FormControl><Input type="number" min="3" max="20" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                     </div>
                  </CardContent>
                   <CardFooter>
                      <Button type="button" onClick={handleGenerateQuestions} disabled={loading} className="w-full md:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {questions.length > 0 ? 'Re-generate Questions' : 'Generate Questions'}
                      </Button>
                   </CardFooter>
                </Card>
              </form>
            </Form>

            {questions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Generated Questions</h3>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {questions.map((q, qIndex) => (
                    <AccordionItem value={`item-${qIndex}`} key={qIndex} className="border rounded-lg">
                      <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                           <span className="font-semibold text-left">Question {qIndex + 1}</span>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(qIndex)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 pt-0">
                         <div className="space-y-4">
                           <Textarea
                              value={q.questionText}
                              onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                              className="text-base"
                              rows={3}
                            />
                            <div className="space-y-2">
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
                 <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" asChild>
                      <Link href="/">Cancel</Link>
                    </Button>
                    <Button onClick={handleSaveExam}>Save Exam</Button>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
