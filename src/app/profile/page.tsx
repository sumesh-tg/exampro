
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequireAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, Camera } from 'lucide-react';
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


const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
});

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
  const { user, loading: authLoading } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
    },
  });

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
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
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
        </main>
      </div>
    </>
  );
}
