
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminRequests, updateAdminRequestStatus, type AdminRequest } from '@/services/adminRequestService';
import { updateUserClaims } from '@/services/userService';
import { formatDistanceToNow } from 'date-fns';

export default function AdminRequestsPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const pendingRequests = await getAdminRequests('pending');
      setRequests(pendingRequests);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch admin requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRequests();
    }
  }, [isSuperAdmin]);

  const handleApproveRequest = async (request: AdminRequest) => {
    try {
      // 1. Update user claims to make them an admin
      await updateUserClaims(request.userId, { admin: true, disabled: false, deleted: false });
      
      // 2. Update the request status to 'approved'
      await updateAdminRequestStatus(request.id, 'approved');

      toast({ title: 'User Promoted', description: `${request.displayName} is now an admin.` });
      fetchRequests(); // Refresh the list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to approve the request.' });
    }
  };

  if (authLoading || !isSuperAdmin) {
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
        <h1 className="text-xl font-semibold">Admin Role Requests</h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Users who have requested to be promoted to an Admin role.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.displayName || 'N/A'}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{formatDistanceToNow((request.createdAt as any).toDate(), { addSuffix: true })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleApproveRequest(request)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                There are no pending admin requests.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
