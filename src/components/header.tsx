
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Exam, AdminUserRecord } from '@/lib/data';

import { 
    LogOut, User as UserIcon, ShieldCheck, Users, Settings, Send, 
    HistoryIcon, HelpCircle, Wallet, RefreshCcw, FileText 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CreateExamDialog } from '@/components/create-exam-dialog';
import { CreateCampaignDialog } from '@/components/create-campaign-dialog';
import { getAppConfig } from '@/services/appConfigService';
import { useState, useEffect } from 'react';

interface HeaderProps {
    userProfile?: { attemptBalance?: number } | null;
    handleRechargePayment?: () => void;
    isCreateExamOpen?: boolean;
    setCreateExamOpen?: (open: boolean) => void;
    setExamToEdit?: (exam: Exam | null) => void;
    handleExamCreated?: () => void;
    examToEdit?: Exam | null;
    isCreateCampaignOpen?: boolean;
    setCreateCampaignOpen?: (open: boolean) => void;
    handleCampaignCreated?: () => void;
    exams?: Exam[];
    allAdmins?: AdminUserRecord[];
    setShareReportOpen?: (open: boolean) => void;
}


export function Header({
    userProfile,
    handleRechargePayment,
    isCreateExamOpen,
    setCreateExamOpen,
    setExamToEdit,
    handleExamCreated,
    examToEdit,
    isCreateCampaignOpen,
    setCreateCampaignOpen,
    handleCampaignCreated,
    exams,
    allAdmins,
    setShareReportOpen,
}: HeaderProps) {
  const { user, loading, isAdmin, isSuperAdmin, setSuperAdmin } = useAuth();
  const router = useRouter();
  const [appConfig, setAppConfig] = useState<{ isExamCreationEnabled?: boolean, isCampaignCreationEnabled?: boolean } | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const config = await getAppConfig();
      setAppConfig(config);
    }
    fetchConfig();
  }, []);

  const handleSignOut = async () => {
    if (isSuperAdmin) {
      setSuperAdmin(false);
      sessionStorage.removeItem('isSuperAdmin');
      router.push('/auth/admin/signin');
    } else {
      await signOut(auth);
      router.push('/auth/signin');
    }
  };

  const canCreateExam = (isAdmin || isSuperAdmin) && appConfig?.isExamCreationEnabled;
  const canCreateCampaign = (isAdmin || isSuperAdmin) && appConfig?.isCampaignCreationEnabled;

  return (
    <header className="sticky top-0 z-10 flex h-auto flex-col items-start gap-4 border-b bg-background/80 p-4 backdrop-blur-sm md:h-16 md:flex-row md:items-center md:px-6">
        <nav className="flex w-full flex-1 items-center justify-between">
            <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
            >
                <Image src="/images/logo_black.png" alt="ExamsPro.in logo" width={92} height={92} data-ai-hint="logo" />
                <div>
                    <span className="text-xl font-bold">ExamsPro.in</span>
                    <p className="hidden text-xs text-muted-foreground sm:block">Perform Like a Pro</p>
                </div>
            </Link>
            <div className="md:hidden">
            {!loading && (user || isSuperAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                       <Avatar>
                        {isSuperAdmin ? (
                           <AvatarFallback>
                             <ShieldCheck size={20} />
                           </AvatarFallback>
                        ) : (
                           <>
                            <AvatarImage src={user?.photoURL ?? ''} alt="user avatar" />
                            <AvatarFallback>
                                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : <UserIcon size={20} />}
                            </AvatarFallback>
                           </>
                        )}
                        </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isSuperAdmin ? (
                        <>
                            <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/admin/users"><Users className="mr-2 h-4 w-4" /><span>User Management</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/config"><Settings className="mr-2 h-4 w-4" /><span>App Configuration</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/requests"><Send className="mr-2 h-4 w-4" /><span>Admin Requests</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/attempts"><HistoryIcon className="mr-2 h-4 w-4" /><span>Attempt History</span></Link></DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /><span>Profile</span></Link></DropdownMenuItem>
                        </>
                    )}
                     <DropdownMenuItem asChild><Link href="/help"><HelpCircle className="mr-2 h-4 w-4" /><span>Help & FAQ</span></Link></DropdownMenuItem>
                     {user && !isSuperAdmin && (
                        <>
                            <DropdownMenuItem>
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2"><Wallet className="h-4 w-4" /><span>Attempts Left:</span></div>
                                    <Badge>{userProfile?.attemptBalance ?? 0}</Badge>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleRechargePayment}><RefreshCcw className="mr-2 h-4 w-4" /><span>Recharge Attempts</span></DropdownMenuItem>
                        </>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            )}
            </div>
        </nav>
        <div className="flex w-full items-center justify-end gap-2 md:w-auto md:flex-nowrap flex-wrap">
            {(isAdmin || isSuperAdmin) && (
                <>
                {canCreateExam && setCreateExamOpen && handleExamCreated && (
                    <CreateExamDialog 
                    open={isCreateExamOpen || false}
                    onOpenChange={(isOpen) => {
                        setCreateExamOpen(isOpen);
                        if (!isOpen && setExamToEdit) setExamToEdit(null);
                    }}
                    onExamCreated={handleExamCreated}
                    examToEdit={examToEdit}
                    />
                )}
                {canCreateCampaign && setCreateCampaignOpen && handleCampaignCreated && exams && allAdmins && (
                    <CreateCampaignDialog
                        open={isCreateCampaignOpen || false}
                        onOpenChange={setCreateCampaignOpen}
                        onCampaignCreated={handleCampaignCreated}
                        allExams={exams}
                        allAdmins={allAdmins}
                    />
                )}
                {setShareReportOpen && (
                  <Button variant="outline" onClick={() => setShareReportOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">View Share Report</span>
                  </Button>
                )}
                </>
            )}

            <div className="hidden md:flex">
                {!loading && (user || isSuperAdmin) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                       <Avatar>
                        {isSuperAdmin ? (
                           <AvatarFallback>
                             <ShieldCheck size={20} />
                           </AvatarFallback>
                        ) : (
                           <>
                            <AvatarImage src={user?.photoURL ?? ''} alt="user avatar" />
                            <AvatarFallback>
                                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : <UserIcon size={20} />}
                            </AvatarFallback>
                           </>
                        )}
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    {isSuperAdmin ? (
                        <>
                            <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/admin/users"><Users className="mr-2 h-4 w-4" /><span>User Management</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/config"><Settings className="mr-2 h-4 w-4" /><span>App Configuration</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/requests"><Send className="mr-2 h-4 w-4" /><span>Admin Requests</span></Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/admin/attempts"><HistoryIcon className="mr-2 h-4 w-4" /><span>Attempt History</span></Link></DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /><span>Profile</span></Link></DropdownMenuItem>
                        </>
                    )}
                     <DropdownMenuItem asChild><Link href="/help"><HelpCircle className="mr-2 h-4 w-4" /><span>Help & FAQ</span></Link></DropdownMenuItem>
                     {user && !isSuperAdmin && (
                        <>
                            <DropdownMenuItem>
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2"><Wallet className="h-4 w-4" /><span>Attempts Left:</span></div>
                                    <Badge>{userProfile?.attemptBalance ?? 0}</Badge>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleRechargePayment}><RefreshCcw className="mr-2 h-4 w-4" /><span>Recharge Attempts</span></DropdownMenuItem>
                        </>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
        </div>
    </header>
  );
}
