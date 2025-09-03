
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { suggestExamTopics } from "@/ai/flows/suggest-topics";
import { generateExamQuestions } from "@/ai/flows/generate-questions";
import type { Exam } from "@/lib/data";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Info, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { getAppConfig, type AppConfig } from "@/services/appConfigService";
import { getTopicSuggestionUsage, incrementTopicSuggestionUsage } from "@/services/topicSuggestionService";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  interests: z.string().min(2, {
    message: "Interests must be at least 2 characters.",
  }),
});

export function TopicSuggester() {
  const [loading, setLoading] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    async function loadInitialData() {
        if (!user) return;
        
        const [fetchedConfig, fetchedUsage] = await Promise.all([
            getAppConfig(),
            getTopicSuggestionUsage(user.uid)
        ]);

        setConfig(fetchedConfig);
        setUsageCount(fetchedUsage);
    }
    loadInitialData();
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: "",
    },
  });

  const checkUsageLimit = () => {
    if (!user || !config || isSuperAdmin) return false; // No limit for super admin

    const limit = isAdmin ? config.topicSuggesterDailyLimitAdmin : config.topicSuggesterDailyLimitUser;
    return usageCount >= limit;
  }
  
  const isLimitReached = checkUsageLimit();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || isLimitReached) {
        if (isLimitReached) {
            toast({
                variant: 'destructive',
                title: 'Daily Limit Reached',
                description: 'Please try again tomorrow or pay to continue.',
            });
        }
        return;
    }

    setLoading(true);
    setTopics([]);
    try {
      await incrementTopicSuggestionUsage(user.uid);
      setUsageCount(prev => prev + 1);
      const result = await suggestExamTopics({ interests: values.interests });
      setTopics(result.topics);
    } catch (error) {
      console.error("Failed to suggest topics:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not suggest topics." });
    } finally {
      setLoading(false);
    }
  }

  const handleTopicClick = async (topic: string) => {
    setLoadingTopic(topic);
    try {
      const result = await generateExamQuestions({ topic: topic, numQuestions: 10 });
      const newExam: Exam = {
        id: 'custom',
        title: `${topic} Exam`,
        description: `An AI-generated exam about ${topic}.`,
        questions: result.questions,
        timeLimit: 10,
        winPercentage: 50,
      };
      
      sessionStorage.setItem('tempExam', JSON.stringify(newExam));
      router.push('/exam/custom');

    } catch (error) {
      console.error('Failed to generate exam:', error);
      toast({ variant: 'destructive', title: "Error", description: `Could not generate an exam for ${topic}.` });
      setLoadingTopic(null);
    }
  }
  
  const handlePayToContinue = () => {
      // Dummy payment function
      toast({
          title: "Payment Gateway",
          description: "This is where the payment flow would be initiated.",
      });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <CardTitle>Stuck for ideas?</CardTitle>
        </div>
        <CardDescription>Let AI suggest some exam topics based on your interests.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLimitReached ? (
             <div className="text-center space-y-4 p-4 rounded-lg bg-muted">
                <p className="font-semibold text-destructive">You have reached your daily limit for topic suggestions.</p>
                <p className="text-muted-foreground">Please try again tomorrow, or pay to get more suggestions now.</p>
                <Button onClick={handlePayToContinue}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay to Continue
                </Button>
            </div>
        ) : (
            <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Interests</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Space exploration, 90s rock music" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading || !!loadingTopic} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Suggest Topics
                    </Button>
                  </form>
                </Form>
                {topics.length > 0 && (
                  <div className="mt-6">
                     <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Suggested Exams:</h4>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Clicking on your desired topic below to start exam</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topics.map((topic, index) => (
                        <Button 
                          key={index} 
                          variant="secondary" 
                          onClick={() => handleTopicClick(topic)}
                          disabled={!!loadingTopic}
                          className="h-auto"
                        >
                          {loadingTopic === topic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
            </>
        )}
      </CardContent>
    </Card>
  );
}
