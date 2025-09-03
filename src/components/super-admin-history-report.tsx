
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getAllExamHistory } from '@/services/examHistoryService';
import { listUsers } from '@/services/userService';
import type { ExamHistory } from '@/lib/data';
import type { AdminUserRecord } from '@/services/userService';
import { Loader2, ChevronLeft, ChevronRight, Star, MessageSquare, User as UserIcon, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

const USERS_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 5;

interface GroupedHistory {
    user: AdminUserRecord;
    history: ExamHistory[];
}

const isCustomExam = (examId: string) => {
    return examId.startsWith('custom-');
}

export function SuperAdminHistoryReport() {
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [historyCurrentPages, setHistoryCurrentPages] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [allHistory, allUsers] = await Promise.all([
          getAllExamHistory(),
          listUsers(),
        ]);

        // Sort history by date, most recent first
        allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const userMap = allUsers.reduce((acc, user) => {
            acc[user.uid] = user;
            return acc;
        }, {} as Record<string, AdminUserRecord>);

        const historyByUser: Record<string, { user: AdminUserRecord; history: ExamHistory[] }> = {};

        for (const historyItem of allHistory) {
          const user = userMap[historyItem.userId];
          if (user) {
            if (!historyByUser[user.uid]) {
              historyByUser[user.uid] = { user, history: [] };
            }
            historyByUser[user.uid].history.push(historyItem);
          }
        }
        
        const groupedArray = Object.values(historyByUser);
        
        // Sort users by the date of their most recent exam
        groupedArray.sort((a, b) => {
            const lastExamA = new Date(a.history[0].date).getTime();
            const lastExamB = new Date(b.history[0].date).getTime();
            return lastExamB - lastExamA;
        });
        

        setGroupedHistory(groupedArray);

      } catch (error) {
        console.error("Failed to fetch super admin report data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);
  
  const handleHistoryPageChange = (userId: string, newPage: number) => {
    setHistoryCurrentPages(prev => ({
        ...prev,
        [userId]: newPage
    }));
  };

  const totalPages = Math.ceil(groupedHistory.length / USERS_PAGE_SIZE);
  const paginatedUsers = groupedHistory.slice(
    (currentPage - 1) * USERS_PAGE_SIZE,
    currentPage * USERS_PAGE_SIZE
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Super Admin: All User History</CardTitle>
        </div>
        <CardDescription>
            A complete log of all exam attempts across the platform, grouped by user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedUsers.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {paginatedUsers.map(({ user, history }) => {
              const historyCurrentPage = historyCurrentPages[user.uid] || 1;
              const historyTotalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE);
              const paginatedHistory = history.slice(
                (historyCurrentPage - 1) * HISTORY_PAGE_SIZE,
                historyCurrentPage * HISTORY_PAGE_SIZE
              );
              
              return (
              <AccordionItem value={user.uid} key={user.uid}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4 w-full">
                    <Avatar>
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback>
                           {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : <UserIcon size={20} />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                        <div className="font-semibold flex items-center gap-2">
                            {user.displayName || 'Unnamed User'}
                            {user.customClaims?.admin && <Badge variant="secondary">Admin</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
                    </div>
                    <div className="text-sm text-muted-foreground font-normal pr-4">
                        {history.length} attempt(s)
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedHistory.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{item.examTitle}</span>
                                        {isCustomExam(item.examId) && <Badge variant="outline">Custom</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge>{`${item.score}/${item.totalQuestions}`}</Badge>
                                </TableCell>
                                <TableCell>{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</TableCell>
                                <TableCell>
                                    {item.rating ? (
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">{item.rating}</span>
                                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.feedback ? (
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                            <p className="text-sm text-muted-foreground">{item.feedback}</p>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">None</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {historyTotalPages > 1 && (
                     <div className="flex items-center justify-end gap-2 pt-4">
                        <span className="text-sm text-muted-foreground">
                            Page {historyCurrentPage} of {historyTotalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleHistoryPageChange(user.uid, historyCurrentPage - 1)}
                            disabled={historyCurrentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleHistoryPageChange(user.uid, historyCurrentPage + 1)}
                            disabled={historyCurrentPage === historyTotalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            No exam history found on the platform yet.
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-center p-4 gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
