
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Loader2, PlusCircle, Sparkles, Trash2, Upload, Download, Edit } from 'lucide-react';
import { generateExamQuestions, type GenerateExamQuestionsOutput } from '@/ai/flows/generate-questions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Exam } from '@/lib/data';
import { addExam, updateExam } from '@/services/examService';
import { Checkbox } from './ui/checkbox';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Slider } from './ui/slider';

const step1Schema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  isPremium: z.boolean().default(false),
  winPercentage: z.number().min(1).max(100).default(50),
  timeLimit: z.coerce.number().min(0).optional(),
});

const step2Schema = z.object({
  topic: z.string().min(2, { message: 'Topic must be at least 2 characters.' }),
  numQuestions: z.coerce.number().min(1).max(100),
});

type Question = GenerateExamQuestionsOutput['questions'][0];

interface CreateExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExamCreated: () => void;
    examToEdit?: Exam | null;
}

export function CreateExamDialog({ open, onOpenChange, onExamCreated, examToEdit }: CreateExamDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const newQuestionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();
  const isEditMode = !!examToEdit;
  
  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { title: '', description: '', isPremium: false, winPercentage: 50, timeLimit: undefined },
  });
  
  const winPercentage = step1Form.watch('winPercentage');

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: { topic: '', numQuestions: 5 },
  });
  
  useEffect(() => {
    if (isEditMode && examToEdit) {
        step1Form.reset({
            title: examToEdit.title,
            description: examToEdit.description,
            isPremium: examToEdit.isPremium || false,
            winPercentage: examToEdit.winPercentage || 50,
            timeLimit: examToEdit.timeLimit,
        });
        setQuestions(examToEdit.questions);
        setStep(3); // Start at the review step in edit mode
    } else {
        reset();
    }
  }, [examToEdit, isEditMode, open, step1Form]);

  useEffect(() => {
    if (activeAccordionItem && questionsContainerRef.current) {
        const lastItemIndex = questions.length - 1;
        if (`item-${lastItemIndex}` === activeAccordionItem) {
            setTimeout(() => {
                questionsContainerRef.current!.scrollTop = questionsContainerRef.current!.scrollHeight;
                newQuestionTextareaRef.current?.focus();
            }, 100);
        }
    }
  }, [activeAccordionItem, questions.length]);

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
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate questions.' });
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
  
  const validateQuestions = (questionList: Question[], options: { checkAll: boolean } = { checkAll: true }): boolean => {
    const listToValidate = options.checkAll ? questionList : questionList.slice(0, -1);

    for (let i = 0; i < listToValidate.length; i++) {
        const q = listToValidate[i];
        if (!q.questionText || q.questionText.trim() === '') {
            toast({
                variant: 'destructive',
                title: `Validation Error for Q${i + 1}`,
                description: 'Question text cannot be empty.',
            });
            setActiveAccordionItem(`item-${i}`);
            return false;
        }
        for (let j = 0; j < q.options.length; j++) {
            const option = q.options[j];
            if (!option || option.trim() === '') {
                toast({
                    variant: 'destructive',
                    title: `Validation Error for Q${i + 1}`,
                    description: `Option ${j + 1} cannot be empty.`,
                });
                setActiveAccordionItem(`item-${i}`);
                return false;
            }
        }
        if (!q.correctAnswer || q.correctAnswer.trim() === '') {
            toast({
                variant: 'destructive',
                title: `Validation Error for Q${i + 1}`,
                description: 'Please select a correct answer.',
            });
            setActiveAccordionItem(`item-${i}`);
            return false;
        }
        if (!q.options.map(o => o.trim()).includes(q.correctAnswer.trim())) {
            toast({
                variant: 'destructive',
                title: `Invalid Answer for Q${i + 1}`,
                description: `The correct answer must be one of the provided options.`,
            });
            setActiveAccordionItem(`item-${i}`);
            return false;
        }
    }
    return true;
  }
  
  const handleAddQuestion = () => {
    if (!validateQuestions(questions, { checkAll: true })) {
      return;
    }
    
    const newQuestion: Question = {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        tag: ''
    };
    const newQuestionIndex = questions.length;
    setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
    setActiveAccordionItem(`item-${newQuestionIndex}`);
  };

  const handleSaveExam = async () => {
    const loggedInUser = user || isSuperAdmin;
    if (!loggedInUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save an exam.' });
        return;
    }
    
    if (!validateQuestions(questions)) {
      return;
    }

    setLoading(true);
    const examDetails = step1Form.getValues();
    
    const updaterId = isSuperAdmin ? 'System' : user?.uid;
    if (!updaterId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine updater information.' });
        setLoading(false);
        return;
    }

    try {
        if(isEditMode && examToEdit) {
            const updatedExamData: Partial<Exam> = {
                ...examDetails,
                questions: questions,
                updatedBy: updaterId,
            };
            await updateExam(examToEdit.id, updatedExamData);
            toast({ title: 'Success', description: 'Exam updated successfully.' });
        } else {
             const newExamData: Omit<Exam, 'id'> = {
                ...examDetails,
                questions: questions,
                createdBy: updaterId,
                updatedBy: updaterId,
            };
            await addExam(newExamData);
            toast({ title: 'Success', description: 'Exam created successfully.' });
        }
        onExamCreated();
        reset();
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to save exam to Firestore:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save the exam.' });
    } finally {
        setLoading(false);
    }
  };

  const reset = () => {
    step1Form.reset({ title: '', description: '', isPremium: false, winPercentage: 50, timeLimit: undefined });
    step2Form.reset({ topic: '', numQuestions: 5 });
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
  
  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
        { questionText: "What is the capital of France?", option1: "Berlin", option2: "Madrid", option3: "Paris", option4: "Rome", correctAnswer: "Paris", tag: "Geography" }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "exam_template.xlsx");
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet) as any[];

            if (json.length > 100) {
              throw new Error("You can only import up to 100 questions at a time.");
            }

            const importedQuestions: Question[] = json.map(row => {
                const options = [row.option1, row.option2, row.option3, row.option4].filter(val => val !== undefined && val !== null).map(String);
                if (options.length !== 4 || !row.questionText || !row.correctAnswer) {
                    throw new Error("Invalid file format. Each row must have a questionText, option1, option2, option3, option4, and a correctAnswer.");
                }
                if (!options.includes(String(row.correctAnswer))) {
                     throw new Error(`For question "${row.questionText}", the correct answer "${row.correctAnswer}" is not in the options.`);
                }
                return {
                    questionText: String(row.questionText),
                    options: options,
                    correctAnswer: String(row.correctAnswer),
                    tag: row.tag ? String(row.tag) : '',
                };
            });
            setQuestions(importedQuestions);
            setStep(3);
            toast({ title: 'Success', description: `Successfully imported ${importedQuestions.length} questions.` });
        } catch (error: any) {
            console.error("Failed to import file:", error);
            toast({ variant: 'destructive', title: 'Import Error', description: error.message || "An unknown error occurred during import." });
        } finally {
            setLoading(false);
            // Reset file input
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.readAsArrayBuffer(file);
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button onClick={() => onOpenChange(true)}>Create Exam <PlusCircle className="ml-2 h-4 w-4" /></Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileImport}
        />
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{isEditMode ? "Edit Exam" : "Create a New Exam"}</DialogTitle>
              <DialogDescription>
                {step === 1 && "Start by providing the basic details for your exam."}
                {step === 2 && "Generate questions with AI, import a file, or add them manually."}
                {step === 3 && "Review the questions and save your exam."}
              </DialogDescription>
            </div>
            {step === 2 && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  Template
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
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={step1Form.control}
                            name="winPercentage"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Win Percentage: {field.value}%</FormLabel>
                                <FormControl>
                                    <Slider
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={[field.value]}
                                        onValueChange={(value) => field.onChange(value[0])}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={step1Form.control} name="timeLimit" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time Limit (minutes)</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="Leave blank for no limit" {...field} onChange={event => field.onChange(+event.target.value)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
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
                       {isEditMode && <Button type="button" variant="secondary" onClick={() => setStep(3)}>Skip to Questions</Button>}
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
                                        <FormControl><Input type="number" min="1" max="100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                         <Button type="button" variant="secondary" onClick={() => { setQuestions([]); setStep(3); }}>
                            Add Manually
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        )}

        {step === 3 && (
            <div ref={questionsContainerRef} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Questions ({questions.length})</h3>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </div>
                {questions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                    {questions.map((q, qIndex) => (
                        <AccordionItem value={`item-${qIndex}`} key={qIndex} className="border rounded-lg">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex justify-between items-center w-full gap-2">
                            <span className="font-semibold text-left flex-1 line-clamp-2">{`Q${qIndex + 1}: ${q.questionText || 'New Question'}`}</span>
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
                                    ref={qIndex === questions.length - 1 ? newQuestionTextareaRef : null}
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                    className="text-base"
                                    rows={3}
                                    placeholder="Enter the question text here"
                                    />
                                </div>
                                <div className="space-y-2">
                                <Label>Options</Label>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                    />
                                    </div>
                                ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                  <Label>Correct Answer</Label>
                                      <Select
                                          value={q.correctAnswer}
                                          onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', value)}
                                      >
                                          <SelectTrigger>
                                              <SelectValue placeholder="Select the correct answer" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {q.options.filter(opt => opt.trim() !== '').map((option, oIndex) => (
                                                  <SelectItem key={oIndex} value={option}>
                                                      {option}
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Tag</Label>
                                    <Input 
                                      value={q.tag || ''}
                                      onChange={(e) => handleQuestionChange(qIndex, 'tag', e.target.value)}
                                      placeholder="e.g. History"
                                    />
                                  </div>
                                </div>
                            </div>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        No questions yet. Add your first question to get started.
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setStep(isEditMode ? 1 : 2)}>Back</Button>
                    <Button onClick={handleSaveExam} disabled={loading || questions.length === 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Save Changes" : "Save Exam"}
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
