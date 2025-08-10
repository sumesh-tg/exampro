
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

export const exams: Exam[] = [
  {
    id: '1',
    title: 'Kerala General Knowledge',
    description: 'A fun exam to test your knowledge about Kerala.',
    questions: [
      {
        questionText: 'What is the capital of Kerala?',
        options: ['Kochi', 'Kozhikode', 'Thiruvananthapuram', 'Thrissur'],
        correctAnswer: 'Thiruvananthapuram',
      },
      {
        questionText: 'Which is the official language of Kerala?',
        options: ['Tamil', 'Kannada', 'Telugu', 'Malayalam'],
        correctAnswer: 'Malayalam',
      },
      {
        questionText: 'What is the state animal of Kerala?',
        options: ['Lion', 'Tiger', 'Indian elephant', 'Leopard'],
        correctAnswer: 'Indian elephant',
      },
      {
        questionText: "Which is the largest lake in Kerala?",
        options: ["Vembanad Lake", "Ashtamudi Lake", "Sasthamcotta Lake", "Periyar Lake"],
        correctAnswer: "Vembanad Lake",
      },
      {
        questionText: "In which year was the state of Kerala formed?",
        options: ["1947", "1950", "1956", "1960"],
        correctAnswer: "1956",
      },
      {
        questionText: "Who is known as the father of Malayalam language?",
        options: ["Kunchan Nambiar", "Thunchaththu Ezhuthachan", "Cherusseri Namboothiri", "Vallathol Narayana Menon"],
        correctAnswer: "Thunchaththu Ezhuthachan",
      },
      {
        questionText: "Which is the state festival of Kerala?",
        options: ["Vishu", "Thrissur Pooram", "Onam", "Christmas"],
        correctAnswer: "Onam",
      },
      {
        questionText: "Which is the highest peak in Kerala?",
        options: ["Agasthyakoodam", "Meesapulimala", "Chembra Peak", "Anamudi"],
        correctAnswer: "Anamudi",
      },
      {
        questionText: "What is the traditional dance form of Kerala?",
        options: ["Kathakali", "Bharatanatyam", "Kuchipudi", "Mohiniyattam"],
        correctAnswer: "Kathakali",
      },
      {
        questionText: "Which river is known as the 'lifeline of Kerala'?",
        options: ["Bharathapuzha", "Pamba", "Chaliyar", "Periyar"],
        correctAnswer: "Periyar",
      }
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
        {
          questionText: "What force pulls objects toward the center of the Earth?",
          options: ["Magnetism", "Gravity", "Friction", "Inertia"],
          correctAnswer: "Gravity",
        },
        {
          questionText: "Which gas do plants absorb from the atmosphere?",
          options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
          correctAnswer: "Carbon Dioxide",
        },
        {
          questionText: "What is the process by which water evaporates from plants?",
          options: ["Photosynthesis", "Respiration", "Transpiration", "Condensation"],
          correctAnswer: "Transpiration",
        },
        {
          questionText: "How many bones are in the adult human body?",
          options: ["206", "216", "196", "226"],
          correctAnswer: "206",
        },
        {
          questionText: "What is the largest animal on Earth?",
          options: ["Elephant", "Blue Whale", "Giraffe", "Great White Shark"],
          correctAnswer: "Blue Whale",
        },
        {
          questionText: "What is the study of fossils called?",
          options: ["Geology", "Biology", "Paleontology", "Archaeology"],
          correctAnswer: "Paleontology",
        },
        {
          questionText: "Which of these is a renewable source of energy?",
          options: ["Coal", "Natural Gas", "Solar Power", "Petroleum"],
          correctAnswer: "Solar Power",
        },
    ],
  },
];

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
