
'use client';

import { useEffect, useState } from 'react';
import type { Exam, ExamHistory } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAllExamHistoryBySharer } from '@/services/examHistoryService';

interface SharedExamReportDialogProps {
  exam: Exam;
  sharerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharedExamReportDialog({ exam, sharerId, open, onOpenChange }: SharedExamReportDialogProps) {
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      async function fetchHistory() {
        setLoading(true);
        const sharedHistory = (await getAllExamHistoryBySharer(sharerId)) as ExamHistory[];
        const filteredHistory = sharedHistory.filter(h => h.examId === exam.id);
        setHistory(filteredHistory);
        setLoading(false);
      }
      fetchHistory();
    }
  }, [exam.id, sharerId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Share Report for: {exam.title}</DialogTitle>
          <DialogDescription>
            Here is a list of users who have completed this exam using your shared link.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Date Taken</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.userId}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">{`${entry.score}/${entry.totalQuestions}`}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No one has completed this exam using your link yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
