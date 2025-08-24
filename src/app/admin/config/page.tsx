
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getLoginConfig, updateLoginConfig, type LoginConfig } from '@/services/appConfigService';
import { useToast } from '@/hooks/use-toast';

export default function AdminConfigPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<LoginConfig | null>(null);
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
        const fetchedConfig = await getLoginConfig();
        setConfig(fetchedConfig);
        setLoadingConfig(false);
      };
      fetchConfig();
    }
  }, [isSuperAdmin]);

  const handleConfigChange = async (key: keyof LoginConfig, value: boolean) => {
    if (!config) return;

    const newConfig = { ...config, [key]: value };
    setConfig(newConfig); // Optimistic update

    try {
      await updateLoginConfig(newConfig);
      toast({ title: 'Setting Updated', description: 'Login configuration has been successfully updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save the setting.' });
      // Revert on failure
      const oldConfig = await getLoginConfig();
      setConfig(oldConfig);
    }
  };

  if (authLoading || loadingConfig || !isSuperAdmin) {
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
        <Card className="max-w-2xl mx-auto">
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
                checked={config?.isGoogleLoginEnabled}
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
                checked={config?.isPhoneLoginEnabled}
                onCheckedChange={(checked) => handleConfigChange('isPhoneLoginEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
