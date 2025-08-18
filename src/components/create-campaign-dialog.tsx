
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Loader2, Layers, Calendar as CalendarIcon } from 'lucide-react';
import type { Exam } from '@/lib/data';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const campaignSchema = z.object({
  name: z.string().min(5, { message: 'Campaign name must be at least 5 characters.' }),
  examIds: z.array(z.string()).min(1, { message: 'Please select at least one exam.' }),
  startDate: z.date({ required_error: 'A start date is required.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }),
});

interface CreateCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCampaignCreated: () => void;
    allExams: Exam[];
}

export function CreateCampaignDialog({ open, onOpenChange, onCampaignCreated, allExams }: CreateCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      examIds: [],
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const onSubmit = async (values: z.infer<typeof campaignSchema>) => {
    setLoading(true);
    console.log('Creating campaign with values:', values);
    // In a real application, you would call a service to save this campaign.
    // For now, we'll just simulate it.
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Campaign Created!", description: "The campaign has been successfully created." });
    setLoading(false);
    onCampaignCreated();
    reset();
  };
  
  const reset = () => {
    form.reset();
    setLoading(false);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Campaign <Layers className="ml-2 h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a New Campaign</DialogTitle>
          <DialogDescription>
            Group exams into a campaign with a specific active window.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label>Select Exams</Label>
              <FormField
                control={form.control}
                name="examIds"
                render={() => (
                  <FormItem className="max-h-40 overflow-y-auto rounded-md border p-4 space-y-2">
                    {allExams.map((exam) => (
                      <FormField
                        key={exam.id}
                        control={form.control}
                        name="examIds"
                        render={({ field }) => (
                          <FormItem key={exam.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(exam.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, exam.id])
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
                  </FormItem>
                )}
              />
              <FormMessage>{form.formState.errors.examIds?.message}</FormMessage>
            </div>
            
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
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
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
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
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
