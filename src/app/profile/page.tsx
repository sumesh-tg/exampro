
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, Camera, Building } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { updateUserProfile } from '@/services/userService';
import { createAdminRequest, getAdminRequestForUser, type AdminRequest } from '@/services/adminRequestService';
import { getAppConfig, type AppConfig } from '@/services/appConfigService';
import axios from 'axios';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
});

declare const Razorpay: any;

function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg');
    });
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ProfilePage() {
  const { user, isAdmin, loading: authLoading } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [isRequestingAdmin, setIsRequestingAdmin] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
    },
  });

  useEffect(() => {
    async function fetchInitialData() {
        const config = await getAppConfig();
        setAppConfig(config);
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName ?? '',
      });
    }
  }, [user, form]);

  async function onUpdateDisplayName(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName: values.displayName });
      await updateUserProfile(user.uid, { displayName: values.displayName });
      toast({ title: 'Display Name Updated' });
      await auth.currentUser?.reload();
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  }
  
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCropModalOpen(true);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };
  
  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current || !user) return;

    setLoading(true);
    setCropModalOpen(false);

    try {
        const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, `${user.uid}.jpg`);
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, croppedImageFile);
        const photoURL = await getDownloadURL(storageRef);

        await updateProfile(user, { photoURL });
        await updateUserProfile(user.uid, { photoURL });
        await auth.currentUser?.reload();
        router.refresh();

        toast({
            title: 'Profile Picture Updated',
            description: 'Your new profile picture has been saved.',
        });

    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }

  const makeAdminRequest = async (paymentId?: string) => {
    if (!user) return;
    setIsRequestingAdmin(true);
    try {
      await createAdminRequest({
        userId: user.uid,
        displayName: user.displayName || 'Unnamed User',
        email: user.email || 'No email',
        paymentId,
      });
      toast({ title: 'Request Sent', description: 'Your request to become an admin has been sent for review.' });
      // Here you might want to show a "pending" status, but per requirement, we will always show the button for non-admins.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Request Failed', description: error.message });
    } finally {
      setIsRequestingAdmin(false);
    }
  };
  
  const handleRequestAdmin = async () => {
    if (!user || !appConfig) return;
    setIsRequestingAdmin(true);

    if (appConfig.isOrgRequestPaymentEnabled) {
      try {
        const { data } = await axios.post('/api/razorpay/create-order', {
            amount: appConfig.orgRequestFee * 100, // Amount in paise
            currency: 'INR',
        });

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: 'INR',
            name: "ExamsPro.in Organization Request",
            description: "One-time fee for organization account request.",
            order_id: data.id,
            handler: async function (response: any) {
                try {
                    const { data: verifyData } = await axios.post('/api/razorpay/verify-payment', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });

                    if (verifyData.success) {
                        await makeAdminRequest(response.razorpay_payment_id);
                    } else {
                        toast({ variant: 'destructive', title: 'Payment Verification Failed', description: 'Please contact support.' });
                    }
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Payment Verification Error', description: 'Could not verify the payment.' });
                } finally {
                    setIsRequestingAdmin(false);
                }
            },
            prefill: {
                name: user?.displayName || "Anonymous User",
                email: user?.email || "",
                contact: user?.phoneNumber || ""
            },
            theme: { color: "#72A0C1" },
            modal: {
                ondismiss: function() {
                    setIsRequestingAdmin(false);
                }
            }
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
             toast({ variant: 'destructive', title: 'Payment Failed', description: response.error.description });
             setIsRequestingAdmin(false);
        });
        rzp.open();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Order Creation Failed', description: 'Could not create a payment order.' });
          setIsRequestingAdmin(false);
      }
    } else {
        await makeAdminRequest();
    }
  }

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Dialog open={isCropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Crop your new profile picture</DialogTitle>
            </DialogHeader>
            {imgSrc && (
                <div className="flex justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                    >
                       <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
                    </ReactCrop>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCropAndUpload} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Photo
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
        </header>
        <main className="flex-1 items-start justify-center p-4 md:pt-10">
          <div className="mx-auto max-w-2xl grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Update your display name and profile picture.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.photoURL || ''} alt="user avatar" />
                                <AvatarFallback>
                                    <User size={40} />
                                </AvatarFallback>
                            </Avatar>
                            <Button 
                                variant="outline"
                                size="icon"
                                className="absolute bottom-0 right-0 rounded-full group-hover:bg-primary group-hover:text-primary-foreground"
                                onClick={() => fileInputRef.current?.click()}>
                                <Camera className="h-5 w-5"/>
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={onSelectFile} accept="image/*" className="hidden" />
                        </div>
                        <div className="grid gap-2">
                            <h2 className="text-2xl font-bold">{user.displayName || 'Anonymous User'}</h2>
                            <p className="text-muted-foreground">{user.email || 'No email associated'}</p>
                        </div>
                    </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onUpdateDisplayName)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Name
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>

            {!isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Account</CardTitle>
                        <CardDescription>Request to upgrade your account to an organization account to create and manage exams.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleRequestAdmin} disabled={isRequestingAdmin}>
                            {isRequestingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Building className="mr-2 h-4 w-4" />
                            Request Organization Account
                            {appConfig?.isOrgRequestPaymentEnabled && (
                                <span className="ml-2 font-bold">(₹{appConfig.orgRequestFee})</span>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
