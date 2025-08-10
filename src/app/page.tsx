
'use client';

import Link from 'next/link';
import { BookOpen, History, Upload, GraduationCap, LogOut, User as UserIcon, MoreHorizontal, ShieldCheck, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { examHistory } from '@/lib/data';
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
import { useAuth } from '@/hooks/use-auth';
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
import type { Exam } from '@/lib/data';
import { CreateExamDialog } from '@/components/create-exam-dialog';
import { getExams, deleteExam } from '@/services/examService';

export default function Home() {
  const { user, loading, isAdmin, setAdmin } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isCreateExamOpen, setCreateExamOpen] = useState(false);

  async function fetchExams() {
    const fetchedExams = await getExams();
    setExams(fetchedExams as Exam[]);
  }

  useEffect(() => {
    if (user || isAdmin) {
      fetchExams();
    }
  }, [user, isAdmin]);

  const handleSignOut = async () => {
    if (isAdmin && setAdmin) {
        sessionStorage.removeItem('isSuperAdmin');
        setAdmin(false);
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
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
          {(user || isAdmin) && (
            <>
              <CreateExamDialog 
                open={isCreateExamOpen}
                onOpenChange={setCreateExamOpen}
                onExamCreated={handleExamCreated}
              />
              <Button variant="outline">Import Exam <Upload className="ml-2 h-4 w-4" /></Button>
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
                <DropdownMenuItem onClick={() => {}}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAdmin ? (
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
        {(user || isAdmin) ? (
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <CardTitle>Available Exams</CardTitle>
                    </div>
                    <CardDescription>
                      Choose an exam to test your knowledge.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {exams.length > 0 ? (
                      exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent/10"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold">{exam.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {exam.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                          </Button>
                          {isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)}>
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))
                    ) : (
                      <div className="text-center text-muted-foreground">No exams available. Create one to get started.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="row-span-2 flex flex-col gap-8">
                <TopicSuggester />
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <History className="h-6 w-6 text-primary" />
                      <CardTitle>Exam History</CardTitle>
                    </div>
                    <CardDescription>
                      Review your past performances.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examHistory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.examTitle}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="default">{`${item.score}/${item.totalQuestions}`}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Welcome to QuizWhiz</h2>
            <p className="text-muted-foreground">Please sign in to continue.</p>
          </div>
        )}
      </main>
    </div>
  );
}
