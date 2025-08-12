
'use client';

import { useEffect, useState } from 'react';
import type { ExamHistory } from '@/lib/data';
import { getAllExamHistoryBySharer } from '@/services/examHistoryService';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface AllSharedExamsReportDialogProps {
  sharerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllSharedExamsReportDialog({ sharerId, open, onOpenChange }: AllSharedExamsReportDialogProps) {
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      async function fetchHistory() {
        setLoading(true);
        const sharedHistory = await getAllExamHistoryBySharer(sharerId);
        setHistory(sharedHistory as ExamHistory[]);
        setLoading(false);
      }
      fetchHistory();
    }
  }, [sharerId, open]);

  const groupedHistory = history.reduce((acc, entry) => {
    const title = entry.examTitle;
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(entry);
    return acc;
  }, {} as Record<string, ExamHistory[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>All Shared Exams Report</DialogTitle>
          <DialogDescription>
            Here is a list of all users who have completed exams using your shared links.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedHistory).length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedHistory).map(([title, entries]) => (
                <AccordionItem value={title} key={title}>
                  <AccordionTrigger>{title} ({entries.length} takers)</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Date Taken</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No one has completed an exam using your links yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
