
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
};

export type Campaign = {
  id: string;
  name: string;
  examIds: string[];
  startTime: string;
  endTime: string;
  createdBy: string;
};
