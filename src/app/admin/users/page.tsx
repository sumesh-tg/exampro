
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateUserClaims, listUsers, type AdminUserRecord } from '@/services/userService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


export default function UserManagementPage() {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const canManageUsers = isAdmin || isSuperAdmin;

  useEffect(() => {
    if (!authLoading && !canManageUsers) {
      router.push('/auth/signin');
    }
  }, [canManageUsers, authLoading, router]);

  const fetchUsers = async () => {
    if (canManageUsers) {
      try {
        setLoading(true);
        const fetchedUsers = await listUsers();
        setUsers(fetchedUsers);
        setError(null);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, authLoading]);
  
  const handleUpdateClaims = async (uid: string, newClaims: { admin?: boolean, disabled?: boolean, deleted?: boolean }) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;

    const currentClaims = {
      admin: user.customClaims?.admin || false,
      deleted: user.customClaims?.deleted || false,
    };
    
    const fullClaims = { ...currentClaims, ...newClaims, disabled: newClaims.disabled ?? user.disabled };

    const result = await updateUserClaims(uid, fullClaims);
    if (result.success) {
      toast({ variant: 'success', title: `User Updated`, description: `The user's properties have been updated.` });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.message });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    await handleUpdateClaims(uid, { deleted: true });
  };
  
  const handleUndoDelete = async (uid: string) => {
    await handleUpdateClaims(uid, { deleted: false });
  }

  if (authLoading || !canManageUsers) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Button variant="outline" size="icon" asChild>
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">User Management</h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all registered users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                   <div className="flex justify-center items-center py-10">
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                   </div>
                 ) : error ? (
                   <Alert variant="destructive">
                     <AlertTitle>Error Fetching Users</AlertTitle>
                     <AlertDescription>{error}</AlertDescription>
                   </Alert>
                 ) : (
                   <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {users.map((user) => (
                          <TableRow key={user.uid} className={user.customClaims?.deleted ? 'opacity-50' : ''}>
                              <TableCell className="font-mono text-sm">{user.uid}</TableCell>
                              <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={user.customClaims?.admin ? 'secondary' : 'outline'}>
                                  {user.customClaims?.admin ? 'Admin' : 'User'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.customClaims?.deleted ? (
                                    <Badge variant="destructive">Deleted</Badge>
                                ) : (
                                    <Badge variant={!user.disabled ? 'default' : 'destructive'}>{!user.disabled ? 'Active' : 'Disabled'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      {user.customClaims?.deleted ? (
                                        <DropdownMenuItem onClick={() => handleUndoDelete(user.uid)}>
                                          Undo Delete
                                        </DropdownMenuItem>
                                      ) : (
                                        <>
                                            {user.customClaims?.admin ? (
                                                <DropdownMenuItem onClick={() => handleUpdateClaims(user.uid, { admin: false })}>
                                                    Remove from Admin
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleUpdateClaims(user.uid, { admin: true })}>
                                                    Make as admin
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => handleUpdateClaims(user.uid, { disabled: !user.disabled })}>
                                                {user.disabled ? 'Enable User' : 'Disable User'}
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently mark the user for deletion.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => handleDeleteUser(user.uid)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                      )}
                                  </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                 )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
