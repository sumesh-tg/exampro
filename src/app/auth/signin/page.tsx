
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
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [step, setStep] = useState<'options' | 'otp' | 'email_sent'>('options');
  const [isClient, setIsClient] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      sessionStorage.setItem('redirectUrl', redirectUrl);
    }
    
    async function fetchLoginConfig() {
      const config = await getAppConfig();
      setAppConfig(config);
    }
    fetchLoginConfig();
    
    // Check if the page is loaded via email link
    const href = window.location.href;
    if (isSignInWithEmailLink(auth, href)) {
      setLoading(true);
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // This can happen if the user opens the link on a different device.
        // We can prompt the user for their email.
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
        url: window.location.href, // This will redirect back to the current page to complete sign-in
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
    } catch (error: any) {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-accent/20 to-background p-4">
      <div className="absolute bottom-4 right-4 text-lg font-bold text-muted-foreground/50">ExamsPro.in</div>
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm z-10">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            {step === 'options' && 'Choose a sign-in method below.'}
            {step === 'otp' && 'Enter the OTP sent to your phone.'}
            {step === 'email_sent' && 'Check your inbox for a sign-in link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isClient || !appConfig || loading && step !== 'otp' ? (
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
              {appConfig.isGoogleLoginEnabled && (
                  <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
                      <GoogleIcon className="mr-2 h-5 w-5" /> Sign in with Google
                  </Button>
              )}
              
              {(appConfig.isGoogleLoginEnabled && (appConfig.isPhoneLoginEnabled || appConfig.isEmailLinkLoginEnabled)) && renderDivider()}

              {appConfig.isEmailLinkLoginEnabled && (
                <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Sign-In Link
                        </Button>
                    </form>
                </Form>
              )}

              {(appConfig.isEmailLinkLoginEnabled && appConfig.isPhoneLoginEnabled) && renderDivider()}
              
              {appConfig.isPhoneLoginEnabled && (
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
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send OTP
                    </Button>
                  </form>
                </Form>
              )}

              {!appConfig.isGoogleLoginEnabled && !appConfig.isPhoneLoginEnabled && !appConfig.isEmailLinkLoginEnabled && (
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
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormComponent />
    </Suspense>
  )
}
