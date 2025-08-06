
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
    title: 'General Knowledge',
    description: 'A fun exam to test your general knowledge.',
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
      {
        questionText: "Which country is known as the Land of the Rising Sun?",
        options: ["China", "Japan", "Thailand", "South Korea"],
        correctAnswer: "Japan",
      },
      {
        questionText: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: "Pacific Ocean",
      },
      {
        questionText: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
        correctAnswer: "Leonardo da Vinci",
      },
      {
        questionText: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Iron", "Diamond", "Quartz"],
        correctAnswer: "Diamond",
      },
      {
        questionText: "Which is the longest river in the world?",
        options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
        correctAnswer: "Nile River",
      },
      {
        questionText: "In which year did the Titanic sink?",
        options: ["1905", "1912", "1918", "1923"],
        correctAnswer: "1912",
      },
      {
        questionText: "What is the currency of Switzerland?",
        options: ["Euro", "Dollar", "Yen", "Swiss Franc"],
        correctAnswer: "Swiss Franc",
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
