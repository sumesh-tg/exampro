
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
import { Loader2, Sparkles, Info, RefreshCcw, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { getUserProfile, UserProfile, incrementAttemptBalance } from "@/services/userService";
import { getAppConfig, AppConfig } from "@/services/appConfigService";
import axios from "axios";

declare const Razorpay: any;

const formSchema = z.object({
  interests: z.string().min(2, {
    message: "Interests must be at least 2 characters.",
  }),
});

export function TopicSuggester() {
  const [loading, setLoading] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();
  
  const fetchUserProfile = async () => {
    if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
        if (!user && !isSuperAdmin) return;
        const config = await getAppConfig();
        setAppConfig(config);
        if (user) {
            fetchUserProfile();
        }
    }
    loadInitialData();
  }, [user, isSuperAdmin]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: "",
    },
  });

  const hasAttempts = (userProfile?.attemptBalance ?? 0) > 0;
  const canUseSuggester = hasAttempts || isSuperAdmin;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setTopics([]);
    try {
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
    if (!user && !isSuperAdmin) return;
    if (!canUseSuggester) {
        toast({
            variant: 'destructive',
            title: 'No Attempts Left',
            description: 'Please recharge to generate this exam.',
        });
        return;
    }
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
      
      // The attempt is now only decremented when the user starts the exam from the next page.
      router.push(`/exam/configure/custom?examData=${encodeURIComponent(JSON.stringify(newExam))}`);

    } catch (error) {
      console.error('Failed to generate exam:', error);
      toast({ variant: 'destructive', title: "Error", description: `Could not generate an exam for ${topic}.` });
      setLoadingTopic(null);
    }
  }
  
  const handleRechargePayment = async () => {
    if (!appConfig || !user) return;
    
    const amount = appConfig.rechargeAmount;
    const currency = 'INR';

    try {
        const { data } = await axios.post('/api/razorpay/create-order', {
            amount: amount * 100, // Amount in paise
            currency,
        });

        const { id: order_id, amount: order_amount } = data;
        
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order_amount,
            currency: currency,
            name: "ExamsPro.in Attempt Recharge",
            description: `Recharge your account with ${appConfig.attemptsPerRecharge} attempts.`,
            order_id: order_id,
            handler: async function (response: any) {
                try {
                    const { data: verifyData } = await axios.post('/api/razorpay/verify-payment', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });

                    if (verifyData.success) {
                        await incrementAttemptBalance(user.uid, appConfig.attemptsPerRecharge);
                        await fetchUserProfile(); // Refresh user profile to get new balance
                        toast({ title: 'Payment Successful', description: `${appConfig.attemptsPerRecharge} attempts have been added to your account.` });
                    } else {
                        toast({ variant: 'destructive', title: 'Payment Verification Failed', description: 'Please contact support.' });
                    }
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Payment Verification Error', description: 'Could not verify the payment.' });
                }
            },
            prefill: {
                name: user?.displayName || "Anonymous User",
                email: user?.email || "",
                contact: user?.phoneNumber || ""
            },
            notes: {
                user_id: user?.uid,
                recharge_for: `${appConfig.attemptsPerRecharge} attempts`
            },
            theme: {
                color: "#72A0C1"
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: response.error.description,
            });
        });
        rzp.open();

    } catch (error) {
        toast({ variant: 'destructive', title: 'Order Creation Failed', description: 'Could not create a payment order.' });
    }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>Stuck for ideas?</CardTitle>
        </div>
        <CardDescription>Let AI suggest some exam topics based on your interests.</CardDescription>
      </CardHeader>
      <CardContent>
        {!canUseSuggester ? (
             <div className="text-center space-y-4 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700">
                <Wallet className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-lg font-semibold">Out of Attempts</h3>
                <p className="mt-1 text-sm text-muted-foreground">Please recharge your account to get topic suggestions.</p>
                <Button onClick={handleRechargePayment} className="mt-4">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Recharge Now
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
                                    <p>Clicking on your desired topic below to generate a new custom exam.</p>
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
