export type Question = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

export const quizzes: Quiz[] = [
  {
    id: '1',
    title: 'General Knowledge',
    description: 'A fun quiz to test your general knowledge.',
    questions: [
      {
        questionText: 'What is the capital of France?',
        options: ['Berlin', 'Madrid', 'Paris', 'Lisbon'],
        correctAnswer: 'Paris',
      },
      {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
      },
      {
        questionText: 'Who wrote "To Kill a Mockingbird"?',
        options: ['Harper Lee', 'J.K. Rowling', 'Ernest Hemingway', 'Mark Twain'],
        correctAnswer: 'Harper Lee',
      },
    ],
  },
  {
    id: '2',
    title: 'Science & Nature',
    description: 'Explore the wonders of science and the natural world.',
    questions: [
        {
            questionText: 'What is the chemical symbol for water?',
            options: ['O2', 'H2O', 'CO2', 'NaCl'],
            correctAnswer: 'H2O',
        },
        {
            questionText: 'Which planet is known as the Red Planet?',
            options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
            correctAnswer: 'Mars',
        },
        {
            questionText: 'What is the powerhouse of the cell?',
            options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Chloroplast'],
            correctAnswer: 'Mitochondrion',
        },
    ],
  },
];

export type QuizHistory = {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
};

export const quizHistory: QuizHistory[] = [
  {
    quizId: '1',
    quizTitle: 'General Knowledge',
    score: 2,
    totalQuestions: 3,
    date: '2023-10-27',
  },
];
