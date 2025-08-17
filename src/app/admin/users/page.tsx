
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
import { listUsers, setUserRole, updateUserStatus, deleteUser, type AdminUserRecord } from '@/services/userService';
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
  AlertDialogTrigger,
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
  
  const handleSetRole = async (uid: string, role: 'admin' | 'user') => {
    const result = await setUserRole(uid, role);
    if (result.success) {
      const action = role === 'admin' ? "Promoted" : "Demoted";
      toast({ variant: 'success', title: `User ${action}`, description: `The user has been made a${role === 'admin' ? 'n admin' : ' regular user'}.` });
      fetchUsers(); // Refresh the user list
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.message });
    }
  };
  
  const handleToggleUserStatus = async (uid: string, isDisabled: boolean) => {
    const result = await updateUserStatus(uid, !isDisabled);
    if (result.success) {
      toast({ variant: 'success', title: 'User Status Updated', description: `The user has been ${!isDisabled ? 'disabled' : 'enabled'}.` });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    const result = await deleteUser(uid);
    if (result.success) {
      toast({ variant: 'success', title: 'User Deleted', description: 'The user has been permanently deleted.' });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

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
                          <TableRow key={user.uid}>
                              <TableCell className="font-mono text-sm">{user.uid}</TableCell>
                              <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={user.customClaims?.admin ? 'secondary' : 'outline'}>
                                  {user.customClaims?.admin ? 'Admin' : 'User'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                  <Badge variant={!user.disabled ? 'default' : 'destructive'}>{!user.disabled ? 'Active' : 'Disabled'}</Badge>
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
                                        {user.customClaims?.admin ? (
                                            <DropdownMenuItem onClick={() => handleSetRole(user.uid, 'user')}>
                                                Remove from Admin
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleSetRole(user.uid, 'admin')}>
                                                Make as admin
                                            </DropdownMenuItem>
                                        )}
                                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user.uid, user.disabled)}>
                                          {user.disabled ? 'Enable User' : 'Disable User'}
                                      </DropdownMenuItem>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onSelect={(e) => e.preventDefault()} // prevent menu from closing
                                            >
                                                Delete User
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the user account and all associated data.
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
