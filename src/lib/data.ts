
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
      },
      {
        questionText: "Which district in Kerala is known as the 'Rice Bowl of Kerala'?",
        options: ["Palakkad", "Alappuzha", "Thrissur", "Kottayam"],
        correctAnswer: "Alappuzha",
      },
      {
        questionText: "What is the name of the famous snake boat race held in Kerala?",
        options: ["Aranmula Boat Race", "Champakulam Moolam Boat Race", "Nehru Trophy Boat Race", "Payippad Jalolsavam"],
        correctAnswer: "Nehru Trophy Boat Race",
      },
      {
        questionText: "Which is the first national park in Kerala?",
        options: ["Silent Valley National Park", "Pambadum Shola National Park", "Anamudi Shola National Park", "Eravikulam National Park"],
        correctAnswer: "Eravikulam National Park",
      },
      {
        questionText: "The famous Sabarimala temple is located in which district?",
        options: ["Kottayam", "Idukki", "Pathanamthitta", "Kollam"],
        correctAnswer: "Pathanamthitta",
      },
      {
        questionText: "Who was the first Chief Minister of Kerala?",
        options: ["Pattom A. Thanu Pillai", "E. M. S. Namboodiripad", "C. Achutha Menon", "K. Karunakaran"],
        correctAnswer: "E. M. S. Namboodiripad",
      },
      {
        questionText: "Which city in Kerala is known as the 'Venice of the East'?",
        options: ["Kochi", "Alappuzha", "Kozhikode", "Thiruvananthapuram"],
        correctAnswer: "Alappuzha",
      },
      {
        questionText: "The Silent Valley National Park is located in which district?",
        options: ["Wayanad", "Idukki", "Malappuram", "Palakkad"],
        correctAnswer: "Palakkad",
      },
      {
        questionText: "What is the state flower of Kerala?",
        options: ["Jasmine", "Lotus", "Hibiscus", "Kanikonna (Cassia fistula)"],
        correctAnswer: "Kanikonna (Cassia fistula)",
      },
      {
        questionText: "Which is the largest railway station in Kerala in terms of platform count?",
        options: ["Thiruvananthapuram Central", "Ernakulam Junction", "Shoranur Junction", "Kozhikode"],
        correctAnswer: "Shoranur Junction",
      },
      {
        questionText: "Which place in Kerala is famous for its backwaters?",
        options: ["Munnar", "Thekkady", "Kovalam", "Kumarakom"],
        correctAnswer: "Kumarakom",
      },
      {
        questionText: "Who wrote the famous Malayalam novel 'Chemmeen'?",
        options: ["M. T. Vasudevan Nair", "Vaikom Muhammad Basheer", "Thakazhi Sivasankara Pillai", "O. V. Vijayan"],
        correctAnswer: "Thakazhi Sivasankara Pillai",
      },
      {
        questionText: "In which district is the Cochin International Airport located?",
        options: ["Thrissur", "Kottayam", "Ernakulam", "Alappuzha"],
        correctAnswer: "Ernakulam",
      },
      {
        questionText: "What is the state bird of Kerala?",
        options: ["Peacock", "Great Hornbill", "Kingfisher", "Parrot"],
        correctAnswer: "Great Hornbill",
      },
      {
        questionText: "The first mosque in India, the Cheraman Juma Masjid, is located in which district?",
        options: ["Malappuram", "Kozhikode", "Kannur", "Thrissur"],
        correctAnswer: "Thrissur",
      },
      {
        questionText: "Who is the first woman from Kerala to win an Olympic medal?",
        options: ["P. T. Usha", "Anju Bobby George", "Shiny Wilson", "K. M. Beenamol"],
        correctAnswer: "Anju Bobby George",
      },
      {
        questionText: "Which dam is the largest hydroelectric project in Kerala?",
        options: ["Banasura Sagar Dam", "Mullaperiyar Dam", "Idukki Dam", "Neyyar Dam"],
        correctAnswer: "Idukki Dam",
      },
      {
        questionText: "The Kerala Kalamandalam, a major center for learning Indian performing arts, was founded by?",
        options: ["Swathi Thirunal Rama Varma", "Raja Ravi Varma", "Vallathol Narayana Menon", "Ulloor S. Parameswara Iyer"],
        correctAnswer: "Vallathol Narayana Menon",
      },
      {
        questionText: "Which beach in Kerala is famous for its cliff-side views?",
        options: ["Kovalam Beach", "Marari Beach", "Varkala Beach", "Bekal Beach"],
        correctAnswer: "Varkala Beach",
      },
      {
        questionText: "The 'God's Own Country' tagline is used to promote tourism in which state?",
        options: ["Goa", "Rajasthan", "Kerala", "Karnataka"],
        correctAnswer: "Kerala",
      },
      {
        questionText: "Which is the southernmost district of Kerala?",
        options: ["Kollam", "Pathanamthitta", "Alappuzha", "Thiruvananthapuram"],
        correctAnswer: "Thiruvananthapuram",
      },
      {
        questionText: "The first printing press in Kerala was established at?",
        options: ["Kochi", "Kottayam", "Thiruvananthapuram", "Kozhikode"],
        correctAnswer: "Kottayam",
      },
      {
        questionText: "Who was the first Keralite to be appointed as the President of India?",
        options: ["V. V. Giri", "K. R. Narayanan", "A. P. J. Abdul Kalam", "Pratibha Patil"],
        correctAnswer: "K. R. Narayanan",
      },
      {
        questionText: "Which district is known as the 'Land of Looms and Lores'?",
        options: ["Thrissur", "Kannur", "Palakkad", "Malappuram"],
        correctAnswer: "Kannur",
      },
      {
        questionText: "The headquarters of the Indian Space Research Organisation (ISRO)'s Vikram Sarabhai Space Centre is located in?",
        options: ["Kochi", "Thumba (Thiruvananthapuram)", "Sriharikota", "Bengaluru"],
        correctAnswer: "Thumba (Thiruvananthapuram)",
      },
      {
        questionText: "What is the state tree of Kerala?",
        options: ["Banyan Tree", "Mango Tree", "Coconut Tree", "Teak Tree"],
        correctAnswer: "Coconut Tree",
      },
      {
        questionText: "Which is the longest river in Kerala?",
        options: ["Bharathapuzha", "Pamba River", "Chaliyar River", "Periyar River"],
        correctAnswer: "Periyar River",
      },
      {
        questionText: "The first fully literate city in India is?",
        options: ["Kochi", "Kottayam", "Kozhikode", "Alappuzha"],
        correctAnswer: "Kottayam",
      },
      {
        questionText: "Which Keralite is known as the 'Metro Man of India'?",
        options: ["G. Madhavan Nair", "E. Sreedharan", "T. K. A. Nair", "Sam Pitroda"],
        correctAnswer: "E. Sreedharan",
      },
      {
        questionText: "The Athirappilly waterfalls are located on which river?",
        options: ["Pamba", "Bharathapuzha", "Chalakudy River", "Periyar"],
        correctAnswer: "Chalakudy River",
      },
      {
        questionText: "Who was the legendary king whose homecoming is celebrated as Onam?",
        options: ["Mahabali", "Vamana", "Parasurama", "Cheraman Perumal"],
        correctAnswer: "Mahabali",
      },
      {
        questionText: "The 'Theyyam' is a popular ritual form of worship in which region of Kerala?",
        options: ["South Kerala", "Central Kerala", "North Kerala (Malabar)", "High-range"],
        correctAnswer: "North Kerala (Malabar)",
      },
      {
        questionText: "The Napier Museum is located in which city?",
        options: ["Kochi", "Thrissur", "Thiruvananthapuram", "Kozhikode"],
        correctAnswer: "Thiruvananthapuram",
      },
      {
        questionText: "Which district in Kerala has the highest population density?",
        options: ["Ernakulam", "Malappuram", "Kozhikode", "Thiruvananthapuram"],
        correctAnswer: "Thiruvananthapuram",
      },
      {
        questionText: "The famous 'Parassinikadavu Snake Park' is in which district?",
        options: ["Kasaragod", "Kannur", "Wayanad", "Kozhikode"],
        correctAnswer: "Kannur",
      },
      {
        questionText: "Which writer from Kerala won the Booker Prize for the novel 'The God of Small Things'?",
        options: ["Kamala Surayya", "Arundhati Roy", "Anita Nair", "K. R. Meera"],
        correctAnswer: "Arundhati Roy",
      },
      {
        questionText: "Which is the northernmost district of Kerala?",
        options: ["Kannur", "Wayanad", "Kozhikode", "Kasaragod"],
        correctAnswer: "Kasaragod",
      },
      {
        questionText: "The 'Edakkal Caves' are located in which district?",
        options: ["Idukki", "Palakkad", "Malappuram", "Wayanad"],
        correctAnswer: "Wayanad",
      },
      {
        questionText: "What is the state fish of Kerala?",
        options: ["Sardine", "Mackerel", "Pearl Spot (Karimeen)", "Tuna"],
        correctAnswer: "Pearl Spot (Karimeen)",
      },
      {
        questionText: "The historic 'Bekal Fort' is located in which district?",
        options: ["Kannur", "Kasaragod", "Kozhikode", "Malappuram"],
        correctAnswer: "Kasaragod",
      },
      {
        questionText: "Which city is known as the 'Cultural Capital of Kerala'?",
        options: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
        correctAnswer: "Thrissur",
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
