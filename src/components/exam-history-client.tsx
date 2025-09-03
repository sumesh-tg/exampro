
'use client';

import { useEffect, useState } from 'react';
import type { ExamHistory } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Loader2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { RatingDialog } from './rating-dialog';

interface ExamHistoryClientProps {
  initialHistory: ExamHistory[];
  onRatingSubmitted: () => void;
}

const isCustomExam = (examId: string) => {
    return examId.startsWith('custom-');
}

export function ExamHistoryClient({ initialHistory, onRatingSubmitted }: ExamHistoryClientProps) {
  const [history, setHistory] = useState(initialHistory);
  const [selectedHistoryForRating, setSelectedHistoryForRating] = useState<ExamHistory | null>(null);
  const [isRatingDialogOpen, setRatingDialogOpen] = useState(false);

  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  const handleOpenRatingDialog = (historyItem: ExamHistory) => {
    setSelectedHistoryForRating(historyItem);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmittedInternal = () => {
    setRatingDialogOpen(false);
    onRatingSubmitted();
  }

  return (
    <>
      {selectedHistoryForRating && (
        <RatingDialog 
          open={isRatingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          historyItem={selectedHistoryForRating}
          onRatingSubmitted={handleRatingSubmittedInternal}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exam</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                   <div className="flex items-center gap-2">
                        <span>{item.examTitle}</span>
                        {isCustomExam(item.examId) && <Badge variant="outline">Custom</Badge>}
                    </div>
                    {item.sharedBy && <div className="text-xs text-muted-foreground">Shared by a friend</div>}
                </TableCell>
                <TableCell>
                  <Badge variant="default">{`${item.score}/${item.totalQuestions}`}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!isCustomExam(item.examId) && (
                    item.rating ? (
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-sm font-bold">{item.rating}</span>
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => handleOpenRatingDialog(item)}>
                            Rate
                        </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No exam history yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
