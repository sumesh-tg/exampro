
'use client';

import { useState, useEffect } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Layers, Calendar as CalendarIcon, User } from 'lucide-react';
import type { Exam, UserProfile } from '@/lib/data';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addCampaignDetail } from '@/services/campaignDetailsService';
import { useAuth } from '@/hooks/use-auth';
import { AdminUserRecord, deductAttemptBalance, getUserProfile } from '@/services/userService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const campaignSchema = z.object({
  name: z.string().min(5, { message: 'Campaign name must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  examIds: z.array(z.string()).min(1, { message: 'Please select at least one exam.' }),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  assignee: z.string().optional(),
  freeAttempts: z.coerce.number().min(1).max(100, { message: 'Cannot exceed 100 free attempts.' }).default(1),
  maxJoinees: z.coerce.number().min(1, { message: 'There must be at least one joinee.' }).max(1000, { message: 'Cannot exceed 1000 joinees.' }).default(10),
});

interface CreateCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCampaignCreated: () => void;
    allExams: Exam[];
    allAdmins: AdminUserRecord[];
}

export function CreateCampaignDialog({ open, onOpenChange, onCampaignCreated, allExams, allAdmins }: CreateCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      examIds: [],
      freeAttempts: 1,
      maxJoinees: 10,
      startDate: new Date(),
    },
  });

  const freeAttempts = form.watch('freeAttempts');
  const maxJoinees = form.watch('maxJoinees');
  const sponsorshipCost = freeAttempts > 1 ? (freeAttempts - 1) * maxJoinees : 0;
  const hasEnoughCredits = (adminProfile?.attemptBalance ?? 0) >= sponsorshipCost;

  useEffect(() => {
    async function fetchAdminProfile() {
      if (user && !isSuperAdmin) {
        const profile = await getUserProfile(user.uid);
        setAdminProfile(profile);
      }
    }
    if (open) {
      fetchAdminProfile();
    }
  }, [open, user, isSuperAdmin]);


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset({
        name: '',
        description: '',
        examIds: [],
        freeAttempts: 1,
        maxJoinees: 10,
        startDate: new Date(),
      });
    }
    onOpenChange(isOpen);
  };
  
  const onSubmit = async (values: z.infer<typeof campaignSchema>) => {
    if (!user && !isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a campaign.' });
      return;
    }

    if (!isSuperAdmin && !hasEnoughCredits) {
      toast({ variant: 'destructive', title: 'Insufficient Credits', description: 'You do not have enough attempt credits to sponsor this campaign.' });
      return;
    }

    if (isSuperAdmin && !values.assignee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Super Admins must assign the campaign to an admin.' });
        return;
    }
    
    setLoading(true);

    try {
        const creatorId = user?.uid || 'super-admin';
        await addCampaignDetail({
            ...values,
            createdBy: creatorId,
            updatedBy: creatorId,
            assignee: isSuperAdmin ? values.assignee : user?.uid,
            freeAttemptsDisabledFor: [],
        });

        // Deduct credits if necessary
        if (!isSuperAdmin && sponsorshipCost > 0 && user) {
          await deductAttemptBalance(user.uid, sponsorshipCost, 'CAMPAIGN_SPONSORSHIP', { campaignName: values.name });
        }

        toast({ title: 'Campaign Created!', description: 'The new campaign has been successfully created.' });
        onCampaignCreated();
        handleOpenChange(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Creating Campaign', description: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>Create Campaign <Layers className="ml-2 h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a New Campaign</DialogTitle>
          <DialogDescription>
            Group exams into a campaign with a specific active window.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Q1 Engineering Onboarding" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the purpose of this campaign." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSuperAdmin && (
                <FormField
                    control={form.control}
                    name="assignee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign to Admin</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an admin to assign this campaign" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {allAdmins.map(admin => (
                                        <SelectItem key={admin.uid} value={admin.uid}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{admin.displayName || admin.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="freeAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Attempts per User</FormLabel>
                    <FormControl><Input type="number" min="1" max="100" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxJoinees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Joinees</FormLabel>
                    <FormControl><Input type="number" min="1" max="1000" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!isSuperAdmin && sponsorshipCost > 0 && (
              <Alert variant={hasEnoughCredits ? 'default' : 'destructive'}>
                <AlertTitle>Sponsorship Cost</AlertTitle>
                <AlertDescription>
                  This campaign will cost <strong>{sponsorshipCost}</strong> attempt credits to sponsor. Your current balance is <strong>{adminProfile?.attemptBalance ?? 0}</strong>.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="examIds"
              render={() => (
                <FormItem>
                  <FormLabel>Select Exams</FormLabel>
                    <div className="max-h-40 overflow-y-auto rounded-md border p-4 space-y-2">
                      {allExams.map((exam) => (
                      <FormField
                          key={exam.id}
                          control={form.control}
                          name="examIds"
                          render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                              <Checkbox
                                  checked={field.value?.includes(exam.id)}
                                  onCheckedChange={(checked) => {
                                  return checked
                                      ? field.onChange([...(field.value || []), exam.id])
                                      : field.onChange(field.value?.filter((value) => value !== exam.id));
                                  }}
                              />
                              </FormControl>
                              <FormLabel className="font-normal w-full">
                                  <div className="flex justify-between">
                                      <span>{exam.title}</span>
                                      {exam.isPremium && <Badge variant="secondary">Premium</Badge>}
                                  </div>
                              </FormLabel>
                          </FormItem>
                          )}
                      />
                      ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            disabled={(date) => date < (form.getValues("startDate") || new Date())}
                            initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || (!isSuperAdmin && !hasEnoughCredits)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Campaign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
