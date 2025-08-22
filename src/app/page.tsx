
'use client';

import Link from 'next/link';
import { BookOpen, History, Upload, GraduationCap, LogOut, User as UserIcon, MoreHorizontal, ShieldCheck, Users, ChevronLeft, ChevronRight, Share2, FileText, Lock, RefreshCcw, Layers } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicSuggester } from '@/components/topic-suggester';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import type { Exam, ExamHistory } from '@/lib/data';
import { CreateExamDialog } from '@/components/create-exam-dialog';
import { getExams, deleteExam } from '@/services/examService';
import { getExamHistory } from '@/services/examHistoryService';
import { useToast } from '@/hooks/use-toast';
import { AllSharedExamsReportDialog } from '@/components/all-shared-exams-report-dialog';
import { SharedExamReportDialog } from '@/components/shared-exam-report-dialog';
import { CreateCampaignDialog } from '@/components/create-campaign-dialog';
import { listUsers, type AdminUserRecord } from '@/services/userService';
import { CampaignsList } from '@/components/campaigns-list';
import { JoinedCampaigns } from '@/components/joined-campaigns';


const EXAMS_PAGE_SIZE = 3;
const EXAM_HISTORY_PAGE_SIZE = 3;

export default function Home() {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
  const [isCreateExamOpen, setCreateExamOpen] = useState(false);
  const [isCreateCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [isShareReportOpen, setShareReportOpen] = useState(false);
  const [isIndividualReportOpen, setIndividualReportOpen] = useState(false);
  const [selectedExamForReport, setSelectedExamForReport] = useState<Exam | null>(null);
  const [allAdmins, setAllAdmins] = useState<AdminUserRecord[]>([]);
  const { toast } = useToast();

  const filteredExams = (isAdmin || isSuperAdmin) ? exams : exams.filter(exam => !exam.isPremium);
  
  const totalPages = Math.ceil(filteredExams.length / EXAMS_PAGE_SIZE);
  const paginatedExams = filteredExams.slice((currentPage - 1) * EXAMS_PAGE_SIZE, currentPage * EXAMS_PAGE_SIZE);

  const historyTotalPages = Math.ceil(examHistory.length / EXAM_HISTORY_PAGE_SIZE);
  const paginatedExamHistory = examHistory.slice((historyCurrentPage - 1) * EXAM_HISTORY_PAGE_SIZE, historyCurrentPage * EXAM_HISTORY_PAGE_SIZE);

  async function fetchExams() {
    const fetchedExams = await getExams();
    setExams(fetchedExams as Exam[]);
  }

  async function fetchExamHistory() {
    if (user) {
      const history = await getExamHistory(user.uid);
      setExamHistory(history as ExamHistory[]);
    }
  }

  async function fetchAdmins() {
    if (isSuperAdmin) {
        try {
            const allUsers = await listUsers();
            const adminUsers = allUsers.filter(u => u.customClaims?.admin && !u.customClaims?.deleted);
            setAllAdmins(adminUsers);
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch list of admins.' });
        }
    }
  }

  useEffect(() => {
    fetchExams();
    if (user) {
      fetchExamHistory();
    }
    if (isSuperAdmin) {
        fetchAdmins();
    }
  }, [user, isSuperAdmin]);

  const handleSignOut = async () => {
    if (isSuperAdmin) {
      // No need to call Firebase signOut for super admin
    } else {
      await signOut(auth);
    }
    router.push('/auth/signin');
  };

  const handleDeleteExam = async (id: string) => {
    await deleteExam(id);
    fetchExams();
  }
  
  const handleExamCreated = () => {
    fetchExams();
    setCreateExamOpen(false);
  }
  
  const handleCampaignCreated = () => {
    toast({ title: "Campaign Created!", description: "The new campaign has been successfully created." });
    setCreateCampaignOpen(false);
  }

  const handleShareExam = (examId: string) => {
    if (!user) return;
    const encodedUserId = btoa(user.uid);
    const url = `${window.location.origin}/exam/${examId}?shared_by=${encodedUserId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Exam link copied to clipboard." });
  };

  const handleOpenIndividualReport = (exam: Exam) => {
    setSelectedExamForReport(exam);
    setIndividualReportOpen(true);
  };
  
  const hasAttemptedExam = (examId: string) => {
    return examHistory.some(h => h.examId === examId);
  }
  
  useRequireAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {user && (
        <>
            <AllSharedExamsReportDialog
                sharerId={user.uid}
                open={isShareReportOpen}
                onOpenChange={setShareReportOpen}
            />
            {selectedExamForReport && (
                <SharedExamReportDialog
                    exam={selectedExamForReport}
                    sharerId={user.uid}
                    open={isIndividualReportOpen}
                    onOpenChange={setIndividualReportOpen}
                />
            )}
        </>
      )}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <nav className="flex-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">QuizWhiz</span>
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {(isAdmin || isSuperAdmin) && (
            <>
               <CreateExamDialog 
                open={isCreateExamOpen}
                onOpenChange={setCreateExamOpen}
                onExamCreated={handleExamCreated}
              />
              <Button variant="outline" disabled>Import Exam <Upload className="ml-2 h-4 w-4" /></Button>

                <CreateCampaignDialog
                  open={isCreateCampaignOpen}
                  onOpenChange={setCreateCampaignOpen}
                  onCampaignCreated={handleCampaignCreated}
                  allExams={exams}
                  allAdmins={allAdmins}
                />
                 <Button variant="outline" onClick={() => setShareReportOpen(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Share Report
                  </Button>
            </>
          )}

          {loading ? (
            <div/>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt="user avatar" />
                    <AvatarFallback>
                      {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : <UserIcon size={20} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                {(isAdmin || isSuperAdmin) && (
                  <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      <span>User Management</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isSuperAdmin ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      <ShieldCheck size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle admin menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        {(user || isSuperAdmin) ? (
            <div className="mx-auto grid max-w-6xl gap-8">
                {user && (
                    <JoinedCampaigns allExams={exams} />
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <CardTitle>Available Exams</CardTitle>
                            </div>
                            <CardDescription>
                            Choose an exam to test your knowledge.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 flex-1">
                            {filteredExams.length > 0 ? (
                            paginatedExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent/10"
                            >
                                <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    {exam.isPremium && <Lock className="h-4 w-4 text-amber-500" />}
                                    <p className="font-semibold">{exam.title}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {exam.description}
                                </p>
                                </div>
                                <div className="flex items-center gap-2">
                                {user && hasAttemptedExam(exam.id) ? (
                                    <Button variant="secondary" disabled>
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Pay to Re-attempt
                                    </Button>
                                ) : (
                                    <Button variant="default" size="sm" asChild>
                                    <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleShareExam(exam.id)}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Share</span>
                                        </DropdownMenuItem>
                                        {user && (
                                            <DropdownMenuItem onClick={() => handleOpenIndividualReport(exam)}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                <span>View Share Report</span>
                                            </DropdownMenuItem>
                                        )}
                                        {(isAdmin || isSuperAdmin) && (
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            ))
                            ) : (
                            <div className="text-center text-muted-foreground h-full flex items-center justify-center">No exams available. Create one to get started.</div>
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
                    </div>

                    <div className="row-span-2 flex flex-col gap-8">
                        <TopicSuggester />
                        { user && (
                            <Card className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                <History className="h-6 w-6 text-primary" />
                                <CardTitle>Exam History</CardTitle>
                                </div>
                                <CardDescription>
                                Review your past performances.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Exam</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedExamHistory.length > 0 ? (
                                    paginatedExamHistory.map((item) => (
                                        <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                        <div>{item.examTitle}</div>
                                        {item.sharedBy && <div className="text-xs text-muted-foreground">Shared by a friend</div>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="default">{`${item.score}/${item.totalQuestions}`}</Badge>
                                        </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">No exam history yet.</TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                                </Table>
                            </CardContent>
                            {historyTotalPages > 1 && (
                                <CardFooter className="flex items-center justify-center p-4 gap-4">
                                <Button variant="outline" size="icon" onClick={() => setHistoryCurrentPage(p => p - 1)} disabled={historyCurrentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">Page {historyCurrentPage} of {historyTotalPages}</span>
                                <Button variant="outline" size="icon" onClick={() => setHistoryCurrentPage(p => p + 1)} disabled={historyCurrentPage === historyTotalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                </CardFooter>
                            )}
                            </Card>
                        )}
                    </div>
                </div>
                {(isAdmin || isSuperAdmin) && (
                    <CampaignsList />
                )}
            </div>
        ) : (
           <div className="flex min-h-screen items-center justify-center">
             <h2 className="text-2xl font-bold">Welcome to QuizWhiz</h2>
           </div>
        )}
      </main>
    </div>
  );
}

    