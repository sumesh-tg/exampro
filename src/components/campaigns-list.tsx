
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getCampaignDetails } from '@/services/campaignDetailsService';
import type { CampaignDetail, Exam } from '@/lib/data';
import { getExams } from '@/services/examService';
import { listUsers, type AdminUserRecord } from '@/services/userService';
import { Loader2, Share2, Users, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { getUsersForCampaign } from '@/services/userCampaignsService';
import { CampaignUserReportDialog } from './campaign-user-report-dialog';
import { EditCampaignDialog } from './edit-campaign-dialog';
import { formatDistanceToNow } from 'date-fns';

const CAMPAIGNS_PAGE_SIZE = 5;

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<CampaignDetail[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<Record<string, AdminUserRecord>>({});
  const [campaignUserCounts, setCampaignUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [isReportOpen, setReportOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  
  const totalPages = Math.ceil(campaigns.length / CAMPAIGNS_PAGE_SIZE);
  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * CAMPAIGNS_PAGE_SIZE,
    currentPage * CAMPAIGNS_PAGE_SIZE
  );

  const fetchData = async () => {
    if (!user && !isSuperAdmin) return;

    try {
      setLoading(true);
      const [campaignData, userData, examData] = await Promise.all([
        getCampaignDetails(),
        listUsers(),
        getExams(),
      ]);

      let filteredCampaigns = campaignData as CampaignDetail[];
      if (isAdmin && !isSuperAdmin && user) {
        filteredCampaigns = filteredCampaigns.filter(
          (c) => c.createdBy === user.uid || c.assignee === user.uid
        );
      }

      // Sort campaigns by updatedAt date in descending order
      filteredCampaigns.sort((a, b) => {
        const dateA = (a.updatedAt as any)?.toDate() || 0;
        const dateB = (b.updatedAt as any)?.toDate() || 0;
        return dateB - dateA;
      });

      setCampaigns(filteredCampaigns);
      setAllExams(examData as Exam[]);
      
      const userMap = (userData as AdminUserRecord[]).reduce((acc, user) => {
          acc[user.uid] = user;
          return acc;
      }, {} as Record<string, AdminUserRecord>);
      setUsers(userMap);

      // Fetch user counts for each campaign
      const counts: Record<string, number> = {};
      for (const campaign of filteredCampaigns) {
        const joinedUsers = await getUsersForCampaign(campaign.id);
        counts[campaign.id] = joinedUsers.length;
      }
      setCampaignUserCounts(counts);

    } catch (error) {
      console.error("Failed to fetch campaigns or users:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch campaigns.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast, user, isAdmin, isSuperAdmin]);
  
  const getAssigneeName = (uid: string) => {
    return users[uid]?.displayName || users[uid]?.email || 'N/A';
  }
  
  const getAssigneeAvatar = (uid: string) => {
    return users[uid]?.photoURL;
  }
  
  const getAssigneeFallback = (uid: string) => {
      const name = getAssigneeName(uid);
      return name ? name.substring(0, 2).toUpperCase() : '??';
  }
  
  const handleShareCampaign = (campaignId: string) => {
    const url = `${window.location.origin}/campaign/${campaignId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Campaign link copied to clipboard." });
  };

  const handleOpenReport = (campaign: CampaignDetail) => {
    setSelectedCampaign(campaign);
    setReportOpen(true);
  };
  
  const handleOpenEdit = (campaign: CampaignDetail) => {
    setSelectedCampaign(campaign);
    setEditOpen(true);
  };

  const handleCampaignUpdated = () => {
    fetchData(); // Refetch data to show updated info
    setEditOpen(false);
  };

  const getStatus = (campaign: CampaignDetail) => {
    const now = new Date();
    const startDate = (campaign.startDate as any).toDate();
    const endDate = (campaign.endDate as any).toDate();

    if (now < startDate) return <Badge variant="outline">Upcoming</Badge>;
    if (now > endDate) return <Badge variant="secondary">Completed</Badge>;
    return <Badge variant="default">Active</Badge>;
  }

  return (
    <>
      {selectedCampaign && (
        <>
          <CampaignUserReportDialog
            campaign={selectedCampaign}
            open={isReportOpen}
            onOpenChange={setReportOpen}
            onCampaignUpdated={fetchData}
          />
          <EditCampaignDialog
            campaign={selectedCampaign}
            allExams={allExams}
            allAdmins={Object.values(users).filter(u => u.customClaims?.admin)}
            open={isEditOpen}
            onOpenChange={setEditOpen}
            onCampaignUpdated={handleCampaignUpdated}
          />
        </>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Created Campaigns</CardTitle>
          </div>
          <CardDescription>
            A list of all campaigns that have been created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Users</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCampaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                                <TableCell>
                                    <div className="font-medium">{campaign.name}</div>
                                    <div className="text-sm text-muted-foreground">{campaign.description}</div>
                                     {(campaign.updatedAt as any)?.toDate && (
                                      <p className="text-xs text-muted-foreground pt-1">
                                          Last updated: {formatDistanceToNow((campaign.updatedAt as any).toDate(), { addSuffix: true })}
                                      </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                    {campaign.assignee ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={getAssigneeAvatar(campaign.assignee)} />
                                                <AvatarFallback>{getAssigneeFallback(campaign.assignee)}</AvatarFallback>
                                            </Avatar>
                                            <span>{getAssigneeName(campaign.assignee)}</span>
                                        </div>
                                    ) : 'N/A'}
                                </TableCell>
                                <TableCell>{getStatus(campaign)}</TableCell>
                                <TableCell>
                                  <Button variant="link" className="p-0 h-auto" onClick={() => handleOpenReport(campaign)}>
                                    {campaignUserCounts[campaign.id] ?? 0}
                                  </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(campaign)}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleShareCampaign(campaign.id)}
                                      disabled={new Date() > (campaign.endDate as any).toDate()}
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share
                                    </Button>
                                  </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">No campaigns found for you.</div>
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
    </>
  );
}
