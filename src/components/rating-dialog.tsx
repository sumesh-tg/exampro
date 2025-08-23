
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateExamHistory } from '@/services/examHistoryService';
import type { ExamHistory } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyItem: ExamHistory;
  onRatingSubmitted: () => void;
}

export function RatingDialog({ open, onOpenChange, historyItem, onRatingSubmitted }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const showFeedback = rating > 0 && rating <= 2;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a rating.' });
      return;
    }
    if (showFeedback && feedback.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide at least 10 characters of feedback.' });
      return;
    }

    setLoading(true);
    try {
        await updateExamHistory(historyItem.id, {
            rating,
            feedback: showFeedback ? feedback : '',
            updatedBy: user?.uid
        });
        toast({ title: 'Thank you!', description: 'Your feedback has been submitted.' });
        onRatingSubmitted();
        reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit feedback.' });
    } finally {
        setLoading(false);
    }
  };
  
  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setFeedback('');
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>
            How would you rate the exam: "{historyItem.examTitle}"?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            'h-10 w-10 cursor-pointer transition-colors',
                            (hoverRating || rating) >= star 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-300'
                        )}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                    />
                ))}
            </div>
            {showFeedback && (
                <div className="space-y-2">
                    <label htmlFor="feedback" className="text-sm font-medium">
                        We're sorry to hear that. What can we improve?
                    </label>
                    <Textarea 
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Please provide your valuable feedback..."
                    />
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
