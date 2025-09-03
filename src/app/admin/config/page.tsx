
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, Wand2, Banknote } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getAppConfig, updateAppConfig, type AppConfig } from '@/services/appConfigService';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function AdminConfigPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchConfig = async () => {
        setLoadingConfig(true);
        const fetchedConfig = await getAppConfig();
        setConfig(fetchedConfig);
        setLoadingConfig(false);
      };
      fetchConfig();
    }
  }, [isSuperAdmin]);

  const handleConfigChange = async (key: keyof AppConfig, value: boolean | number) => {
    if (!config) return;

    const newConfig = { ...config, [key]: value };
    setConfig(newConfig); // Optimistic update

    try {
      await updateAppConfig(newConfig);
      toast({ title: 'Setting Updated', description: 'App configuration has been successfully updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save the setting.' });
      // Revert on failure
      const oldConfig = await getAppConfig();
      setConfig(oldConfig);
    }
  };
  
  const handleInputChange = (key: keyof AppConfig, value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
          handleConfigChange(key, numValue);
      }
  };


  if (authLoading || loadingConfig || !isSuperAdmin || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">App Configuration</h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>Control the login methods available to users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="google-login" className="text-base">Google Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to sign in and sign up using their Google account.
                  </p>
                </div>
                <Switch
                  id="google-login"
                  checked={config.isGoogleLoginEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isGoogleLoginEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="phone-login" className="text-base">Phone Number Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to sign in and sign up using their phone number (OTP).
                  </p>
                </div>
                <Switch
                  id="phone-login"
                  checked={config.isPhoneLoginEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isPhoneLoginEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Creation</CardTitle>
              <CardDescription>Control whether admins can create new exams and campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="exam-creation" className="text-base">Allow Exam Creation</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow admin users to create new exams.
                  </p>
                </div>
                <Switch
                  id="exam-creation"
                  checked={config.isExamCreationEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isExamCreationEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="campaign-creation" className="text-base">Allow Campaign Creation</Label>
                   <p className="text-sm text-muted-foreground">
                    Allow admin users to create new campaigns.
                  </p>
                </div>
                <Switch
                  id="campaign-creation"
                  checked={config.isCampaignCreationEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isCampaignCreationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-accent" />
                    <CardTitle>AI Features</CardTitle>
                </div>
              <CardDescription>Manage AI-powered features in the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="topic-suggester" className="text-base">Enable Topic Suggester</Label>
                  <p className="text-sm text-muted-foreground">
                    Show the AI topic suggestion card on the dashboard.
                  </p>
                </div>
                <Switch
                  id="topic-suggester"
                  checked={config.isTopicSuggesterEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isTopicSuggesterEnabled', checked)}
                />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-question-generation" className="text-base">Enable AI Question Generation</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow admins to generate exam questions using AI.
                  </p>
                </div>
                <Switch
                  id="ai-question-generation"
                  checked={config.isAiQuestionGenerationEnabled}
                  onCheckedChange={(checked) => handleConfigChange('isAiQuestionGenerationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-accent" />
                        <CardTitle>Global Attempt & Payment Settings</CardTitle>
                    </div>
                  <CardDescription>Configure the global attempt system for all users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4 rounded-lg border p-4">
                        <div className="space-y-2">
                          <Label htmlFor="initial-attempts" className="text-base">Initial Free Attempts</Label>
                          <p className="text-sm text-muted-foreground">
                            Number of free attempts for new users.
                          </p>
                        </div>
                         <Input
                            id="initial-attempts"
                            type="number"
                            value={config.initialFreeAttempts}
                            onChange={(e) => handleInputChange('initialFreeAttempts', e.target.value)}
                            className="w-full md:w-24"
                        />
                    </div>
                     <div className="grid md:grid-cols-2 gap-4 rounded-lg border p-4">
                        <div className="space-y-2">
                          <Label htmlFor="recharge-amount" className="text-base">Recharge Amount (INR)</Label>
                          <p className="text-sm text-muted-foreground">
                            Cost for a single recharge transaction.
                          </p>
                        </div>
                        <Input
                            id="recharge-amount"
                            type="number"
                            value={config.rechargeAmount}
                            onChange={(e) => handleInputChange('rechargeAmount', e.target.value)}
                            className="w-full md:w-24"
                        />
                    </div>
                     <div className="grid md:grid-cols-2 gap-4 rounded-lg border p-4">
                        <div className="space-y-2">
                          <Label htmlFor="attempts-per-recharge" className="text-base">Attempts per Recharge</Label>
                          <p className="text-sm text-muted-foreground">
                            Number of attempts a user gets after one recharge.
                          </p>
                        </div>
                        <Input
                            id="attempts-per-recharge"
                            type="number"
                            value={config.attemptsPerRecharge}
                            onChange={(e) => handleInputChange('attemptsPerRecharge', e.target.value)}
                            className="w-full md:w-24"
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}
