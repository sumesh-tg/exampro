
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, User } from 'lucide-react';
import type { CampaignDetail, ExamHistory } from '@/lib/data';
import { getUsersForCampaign } from '@/services/userCampaignsService';
import { getUserProfile, type UserProfile } from '@/services/userService';
import { getExamHistory } from '@/services/examHistoryService';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { format } from 'date-fns';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { updateCampaignDetail } from '@/services/campaignDetailsService';
import { useToast } from '@/hooks/use-toast';

interface CampaignUserReportDialogProps {
  campaign: CampaignDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignUpdated: () => void;
}

interface UserReport extends UserProfile {
  examHistory: ExamHistory[];
}

export function CampaignUserReportDialog({ campaign, open, onOpenChange, onCampaignUpdated }: CampaignUserReportDialogProps) {
  const [reportData, setReportData] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [localCampaign, setLocalCampaign] = useState<CampaignDetail>(campaign);
  const { toast } = useToast();

  useEffect(() => {
    if (campaign) {
      setLocalCampaign(campaign);
    }
  }, [campaign]);

  useEffect(() => {
    if (open) {
      async function fetchReportData() {
        setLoading(true);
        try {
          // 1. Get users who joined the campaign
          const joinedUsers = await getUsersForCampaign(campaign.id);
          const userIds = joinedUsers.map(u => (u as any).userId);

          // 2. Fetch profile and exam history for each user
          const reportPromises = userIds.map(async (userId: string) => {
            const [profile, allHistory] = await Promise.all([
              getUserProfile(userId),
              getExamHistory(userId),
            ]);

            // Filter history for exams within this campaign
            const campaignExamHistory = (allHistory as ExamHistory[]).filter(h => campaign.examIds.includes(h.examId));

            return {
              ...profile,
              uid: userId, // Ensure UID is present
              examHistory: campaignExamHistory,
            } as UserReport;
          });

          const reports = await Promise.all(reportPromises);
          setReportData(reports);

        } catch (error) {
          console.error("Failed to fetch campaign report data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchReportData();
    }
  }, [campaign, open]);

  const handleSwitchChange = async (checked: boolean, userId: string) => {
    const currentDisabledList = localCampaign.freeAttemptsDisabledFor || [];
    let updatedList;
    if (checked) {
      updatedList = [...currentDisabledList, userId];
    } else {
      updatedList = currentDisabledList.filter(id => id !== userId);
    }
    
    // Optimistic UI update
    setLocalCampaign(prev => ({...prev, freeAttemptsDisabledFor: updatedList }));

    try {
        await updateCampaignDetail(campaign.id, { freeAttemptsDisabledFor: updatedList });
        toast({ title: "User Setting Updated", description: `Free attempts for this user have been ${checked ? 'disabled' : 'enabled'}.`});
        onCampaignUpdated();
    } catch (error) {
        // Revert on error
        setLocalCampaign(prev => ({...prev, freeAttemptsDisabledFor: currentDisabledList}));
        toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the user setting."});
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
                <DialogTitle>User Report for: {campaign.name}</DialogTitle>
                <DialogDescription>
                    Details of users who joined this campaign.
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportData.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {reportData.map((userReport) => (
                <AccordionItem value={userReport.uid} key={userReport.uid}>
                    <AccordionTrigger>
                         <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={userReport.photoURL} alt={userReport.displayName} />
                                <AvatarFallback>
                                    {userReport.displayName ? userReport.displayName.substring(0, 2).toUpperCase() : <User size={20} />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">{userReport.displayName || 'Unnamed User'}</span>
                                <span className="text-sm text-muted-foreground font-normal">{userReport.email}</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between rounded-lg border p-4 mb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Disable Free Attempts</Label>
                            <p className="text-sm text-muted-foreground">If enabled, this user must pay for all exam attempts in this campaign.</p>
                        </div>
                        <Switch 
                            checked={(localCampaign.freeAttemptsDisabledFor || []).includes(userReport.uid)}
                            onCheckedChange={(checked) => handleSwitchChange(checked, userReport.uid)}
                        />
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Title</TableHead>
                          <TableHead>Attempt Date</TableHead>
                          <TableHead>Attempt Type</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userReport.examHistory.length > 0 ? (
                           userReport.examHistory.map(history => (
                            <TableRow key={history.id}>
                                <TableCell>{history.examTitle}</TableCell>
                                <TableCell>{format(new Date(history.date), "PPP p")}</TableCell>
                                <TableCell>
                                    <Badge variant={history.attemptType === 'Paid' ? 'secondary' : 'outline'}>
                                        {history.attemptType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge>{`${history.score}/${history.totalQuestions}`}</Badge>
                                </TableCell>
                            </TableRow>
                           ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No exams attempted in this campaign yet.
                                </TableCell>
                            </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No users have joined this campaign yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
