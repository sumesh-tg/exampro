
export type Question = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

export const exams: Exam[] = [];

export type ExamHistory = {
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
};

export const examHistory: ExamHistory[] = [
  {
    examId: '1',
    examTitle: 'General Knowledge',
    score: 8,
    totalQuestions: 10,
    date: '2023-10-27',
  },
];
