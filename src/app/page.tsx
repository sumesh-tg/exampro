
'use client';

import Link from 'next/link';
import { BookOpen, History, Upload, GraduationCap, LogOut, User as UserIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { exams, examHistory } from '@/lib/data';
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


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/auth/signin');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <nav className="flex-1">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">QuizWhiz</span>
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline">Import Exam <Upload className="ml-2 h-4 w-4" /></Button>
          {loading ? (
            <div/>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt="user avatar" />
                    <AvatarFallback>
                      {user.phoneNumber ? user.phoneNumber.slice(-2) : <UserIcon size={20} />}
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
          ) : (
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
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
                {exams.map((exam) => (
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
                    <Button asChild>
                      <Link href={`/exam/configure/${exam.id}`}>Configure</Link>
                    </Button>
                  </div>
                ))}
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
      </main>
    </div>
  );
}
