

export type Question = {
  questionText: string;
  options: string[];
  correctAnswer: string;
  tag?: string;
};

export type Exam = {
  id:string;
  title: string;
  description: string;
  questions: Question[];
  isPremium?: boolean;
  winPercentage?: number;
  timeLimit?: number; // in minutes
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  averageRating?: number;
  ratingCount?: number;
  isGeneratedBySuperAdmin?: boolean;
};

export type ExamHistory = {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
  sharedBy?: string;
  attemptType?: 'Free' | 'Paid';
  attemptNumber?: number;
  rating?: number;
  feedback?: string;
  status?: 'Pass' | 'Fail';
  winPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

export type Campaign = {
  id: string;
  name: string;
  examIds: string[];
  startDate: Date;
  endDate: Date;
  createdBy: string; // User ID of the admin who owns the campaign
};

export type CampaignDetail = {
    id: string;
    name: string;
    description: string;
    examIds: string[];
    startDate: Date;
    endDate: Date;
    createdBy: string;
    assignee?: string;
    freeAttempts: number;
    maxJoinees: number;
    freeAttemptsDisabledFor?: string[];
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
};

export type UserAttempts = {
    userId: string;
    attemptsRemaining: number;
    updatedAt: Date;
}

export type AttemptHistoryLog = {
  id: string;
  userId: string;
  changeAmount: number;
  newBalance: number;
  reason: 'INITIAL_ALLOCATION' | 'USER_RECHARGE' | 'EXAM_ATTEMPT' | 'ADMIN_RESET' | 'TOPIC_SUGGESTION' | 'CAMPAIGN_SPONSORSHIP';
  context?: {
    examId?: string;
    examTitle?: string;
    adminId?: string;
    campaignName?: string;
  };
  createdAt: Date;
};

export type AdminRequest = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  transactionType: 'PAID_EXAM_ATTEMPT';
  campaignId: string;
  examId: string;
  adminOwnerId: string;
  commissionRate: number; // The commission rate at the time of transaction
  razorpayPaymentId: string;
  createdAt: Date;
};

    
