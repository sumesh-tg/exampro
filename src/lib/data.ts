
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
