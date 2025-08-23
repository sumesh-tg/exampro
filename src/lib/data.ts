
export type Question = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type Exam = {
  id:string;
  title: string;
  description: string;
  questions: Question[];
  isPremium?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  averageRating?: number;
  ratingCount?: number;
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
    freeAttemptsDisabledFor?: string[];
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
};
