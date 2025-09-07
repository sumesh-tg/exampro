
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import PhoneInput from 'react-phone-number-input/react-hook-form-input';
import 'react-phone-number-input/style.css';
import { getAppConfig, type AppConfig } from '@/services/appConfigService';
import { FeaturesSection } from '@/components/features-section';
import { Footer } from '@/components/footer';
import { useUnrequireAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Invalid phone number." }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits." }),
});

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


function SignInFormComponent() {
  useUnrequireAuth();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [step, setStep] = useState<'options' | 'otp' | 'email_sent'>('options');
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      sessionStorage.setItem('redirectUrl', redirectUrl);
    }
    
    async function fetchLoginConfig() {
      setConfigLoading(true);
      const config = await getAppConfig();
      setAppConfig(config);
      setConfigLoading(false);
    }
    fetchLoginConfig();
    
    const href = window.location.href;
    if (isSignInWithEmailLink(auth, href)) {
      setLoading(true);
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        signInWithEmailLink(auth, email, href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            handleSuccessfulSignIn();
          })
          .catch((error) => {
            toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'The sign-in link is invalid or has expired.' });
            setLoading(false);
          });
      } else {
         toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'Email is required to complete sign-in.' });
         setLoading(false);
      }
    }
  }, [searchParams, toast]);

  const handleSuccessfulSignIn = () => {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    sessionStorage.removeItem('redirectUrl');
    router.push(redirectUrl || '/auth/setup');
  };

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });
  
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });


  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {},
      });
    }
  };
  
  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setLoading(true);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;
    try {
      const result = await signInWithPhoneNumber(auth, values.phone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: 'OTP sent successfully!' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Sign in failed', description: 'Failed to send OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    setLoading(true);
    try {
      await confirmationResult.confirm(values.otp);
      handleSuccessfulSignIn();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: 'Invalid OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setLoading(true);
    const actionCodeSettings = {
        url: window.location.href, 
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', values.email);
        setStep('email_sent');
        toast({ title: 'Sign-in Link Sent', description: 'Check your email for the sign-in link.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      handleSuccessfulSignIn();
    } catch (error: any)
{
      toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  }
  
  const renderDivider = () => (
    <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
  );
  
  const isAuthReady = !configLoading;

  const backgroundStyle = {
    backgroundImage: `
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='hsl(220 15% 90%)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-book-open'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='hsl(220 15% 90%)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-graduation-cap'%3E%3Cpath d='M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'/%3E%3Cpath d='M22 10v6'/%3E%3Cpath d='M6 12.5V16a6 3 0 0 0 12 0v-3.5'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='hsl(220 15% 90%)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-atom'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Cpath d='M20.2 20.2c2.04-2.03.02-5.72-2.3-8.04-2.3-2.32-5.99-4.34-8.04-2.3'/%3E%3Cpath d='M3.8 3.8c-2.04 2.03-.02 5.72 2.3 8.04 2.3 2.32 5.99 4.34 8.04 2.3'/%3E%3Cpath d='M20.2 3.8c-2.03 2.04-5.72.02-8.04-2.3-2.32-2.3-4.34-5.99-2.3-8.04'/%3E%3Cpath d='M3.8 20.2c2.03-2.04 5.72-.02 8.04 2.3 2.32 2.3 4.34 5.99 2.3 8.04'/%3E%3C/svg%3E")
    `,
    backgroundPosition: '0 0, 25px 25px, 50px 50px, 75px 75px',
    backgroundSize: '100px 100px',
    backgroundColor: 'hsl(var(--background))',
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col">
        <div 
          className="flex-grow flex items-center justify-center p-4 py-12"
          style={backgroundStyle}
        >
          <div id="recaptcha-container"></div>
          <Card className="w-full max-w-sm shadow-lg shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                {step === 'options' && 'Choose a sign-in method below.'}
                {step === 'otp' && 'Enter the OTP sent to your phone.'}
                {step === 'email_sent' && 'Check your inbox for a sign-in link.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && step !== 'otp' ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : step === 'email_sent' ? (
                 <div className="flex flex-col items-center justify-center text-center space-y-4 h-40">
                    <MailCheck className="h-16 w-16 text-primary" />
                    <p className="text-muted-foreground">A sign-in link has been sent to your email address. Please check your inbox and promotions folder.</p>
                    <Button variant="link" onClick={() => setStep('options')}>Back to sign-in options</Button>
                </div>
              ) : step === 'options' ? (
                <div className="space-y-4">
                  {(!isAuthReady || appConfig?.isGoogleLoginEnabled) && (
                      <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={!isAuthReady || loading}>
                         {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {!isAuthReady ? 'Loading...' : <> <GoogleIcon className="mr-2 h-5 w-5" /> Sign in with Google </>}
                      </Button>
                  )}
                  
                  {appConfig && appConfig.isGoogleLoginEnabled && (appConfig.isPhoneLoginEnabled || appConfig.isEmailLinkLoginEnabled) && renderDivider()}

                  {(!isAuthReady || appConfig?.isEmailLinkLoginEnabled) && (
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input type="email" placeholder="you@example.com" {...field} disabled={!isAuthReady} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={!isAuthReady || loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isAuthReady ? 'Loading...' : 'Send Sign-In Link'}
                            </Button>
                        </form>
                    </Form>
                  )}

                  {appConfig && appConfig.isEmailLinkLoginEnabled && appConfig.isPhoneLoginEnabled && renderDivider()}
                  
                  {(!isAuthReady || appConfig?.isPhoneLoginEnabled) && (
                    <Form {...phoneForm}>
                      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                        <FormField
                          control={phoneForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <PhoneInput 
                                  {...field}
                                  international
                                  withCountryCallingCode
                                  country="IN"
                                  disabled={!isAuthReady}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={!isAuthReady || loading} className="w-full">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {!isAuthReady ? 'Loading...' : 'Send OTP'}
                        </Button>
                      </form>
                    </Form>
                  )}

                  {isAuthReady && !appConfig?.isGoogleLoginEnabled && !appConfig?.isPhoneLoginEnabled && !appConfig?.isEmailLinkLoginEnabled && (
                    <div className="text-center text-muted-foreground">
                      Sign in is currently disabled. Please contact an administrator.
                    </div>
                  )}
                </div>
              ) : step === 'otp' ? (
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                     <Button variant="link" onClick={() => setStep('options')}>Back to sign-in options</Button>
                  </form>
                </Form>
              ) : null}
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mx-auto max-w-6xl w-full p-4 md:p-8">
            <FeaturesSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignInFormComponent />
    </Suspense>
  )
}

    
    
