
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getCampaignDetails } from '@/services/campaignDetailsService';
import type { CampaignDetail } from '@/lib/data';
import { listUsers, type AdminUserRecord } from '@/services/userService';
import { Loader2, Share2, Users } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { getUsersForCampaign } from '@/services/userCampaignsService';
import { CampaignUserReportDialog } from './campaign-user-report-dialog';

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<CampaignDetail[]>([]);
  const [users, setUsers] = useState<Record<string, AdminUserRecord>>({});
  const [campaignUserCounts, setCampaignUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [isReportOpen, setReportOpen] = useState(false);
  const { toast } = useToast();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!user && !isSuperAdmin) return;

      try {
        setLoading(true);
        const [campaignData, userData] = await Promise.all([
          getCampaignDetails(),
          listUsers(),
        ]);

        let filteredCampaigns = campaignData;
        if (isAdmin && !isSuperAdmin && user) {
          filteredCampaigns = campaignData.filter(
            (c) => c.createdBy === user.uid || c.assignee === user.uid
          );
        }

        setCampaigns(filteredCampaigns);
        
        const userMap = userData.reduce((acc, user) => {
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
    }
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
        <CampaignUserReportDialog
          campaign={selectedCampaign}
          open={isReportOpen}
          onOpenChange={setReportOpen}
        />
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
              <Table>
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
                      {campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                              <TableCell>
                                  <div className="font-medium">{campaign.name}</div>
                                  <div className="text-sm text-muted-foreground">{campaign.description}</div>
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
                                  <Button variant="outline" size="sm" onClick={() => handleShareCampaign(campaign.id)}>
                                      <Share2 className="mr-2 h-4 w-4" />
                                      Share
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          ) : (
            <div className="text-center text-muted-foreground py-10">No campaigns found for you.</div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
