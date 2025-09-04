
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, User, CirclePlus, CircleMinus, ShieldAlert } from 'lucide-react';
import type { AttemptHistoryLog } from '@/lib/data';
import type { AdminUserRecord } from '@/services/userService';
import { getAttemptHistory } from '@/services/attemptHistoryService';
import { listUsers } from '@/services/userService';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const HISTORY_PAGE_SIZE = 10;

const reasonLabels: Record<AttemptHistoryLog['reason'], string> = {
    INITIAL_ALLOCATION: 'Initial Allocation',
    USER_RECHARGE: 'User Recharge',
    EXAM_ATTEMPT: 'Exam Attempt',
    ADMIN_RESET: 'Admin Reset',
    TOPIC_SUGGESTION: 'Topic Suggestion'
};

export default function AttemptHistoryPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<AttemptHistoryLog[]>([]);
  const [users, setUsers] = useState<Record<string, AdminUserRecord>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [historyData, userData] = await Promise.all([
            getAttemptHistory(),
            listUsers()
          ]);
          setHistory(historyData);
          const userMap = userData.reduce((acc, user) => {
            acc[user.uid] = user;
            return acc;
          }, {} as Record<string, AdminUserRecord>);
          setUsers(userMap);
        } catch (error) {
          console.error("Failed to fetch attempt history or users:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isSuperAdmin]);

  const totalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE);
  const paginatedHistory = history.slice(
    (currentPage - 1) * HISTORY_PAGE_SIZE,
    currentPage * HISTORY_PAGE_SIZE
  );
  
  const getUserInfo = (userId: string) => {
      return users[userId] || { displayName: 'Unknown User', email: '', photoURL: '' };
  }

  if (authLoading || loading || !isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Attempt Balance History</h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>A log of all attempt balance changes across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>New Balance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((log) => {
                    const userInfo = getUserInfo(log.userId);
                    return (
                        <TableRow key={log.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={userInfo.photoURL} />
                                        <AvatarFallback>
                                            {userInfo.displayName ? userInfo.displayName.substring(0, 2).toUpperCase() : <User size={16} />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{userInfo.displayName || 'Unknown User'}</span>
                                          <Badge variant={userInfo.customClaims?.admin ? 'secondary' : 'outline'}>
                                            {userInfo.customClaims?.admin ? 'Admin' : 'User'}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{userInfo.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className={cn(
                                    "flex items-center gap-1 font-bold",
                                    log.changeAmount > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {log.changeAmount > 0 ? <CirclePlus size={16}/> : <CircleMinus size={16} />}
                                    {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                                </div>
                            </TableCell>
                             <TableCell>
                                <Badge variant="secondary">{log.newBalance}</Badge>
                            </TableCell>
                            <TableCell>{reasonLabels[log.reason] || log.reason}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {log.reason === 'EXAM_ATTEMPT' && log.context?.examTitle && (
                                    <span>Exam: {log.context.examTitle}</span>
                                )}
                                {log.reason === 'ADMIN_RESET' && log.context?.adminId && (
                                    <div className="flex items-center gap-1">
                                       <ShieldAlert size={14}/> Reset by admin
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{formatDistanceToNow((log.createdAt as any).toDate(), { addSuffix: true })}</TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-end p-4 gap-4">
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
