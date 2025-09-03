
'use server';

/**
 * @fileOverview Generates exam questions based on a given topic.
 *
 * - generateExamQuestions - A function that generates multiple-choice questions for an exam.
 * - GenerateExamQuestionsInput - The input type for the generateExamQuestions function.
 * - GenerateExamQuestionsOutput - The return type for the generateExamQuestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateExamQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate exam questions.'),
  numQuestions: z.number().min(1).max(100).describe('The number of questions to generate.'),
});
export type GenerateExamQuestionsInput = z.infer<typeof GenerateExamQuestionsInputSchema>;

const GenerateExamQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string().describe('The text of the question.'),
      options: z.array(z.string()).length(4).describe('An array of 4 possible answers.'),
      correctAnswer: z.string().describe('The correct answer from the options.'),
      tag: z.string().describe('A single-word category tag for the question (e.g., "History", "Algebra", "Biology").'),
    })
  ),
});
export type GenerateExamQuestionsOutput = z.infer<typeof GenerateExamQuestionsOutputSchema>;

export async function generateExamQuestions(input: GenerateExamQuestionsInput): Promise<GenerateExamQuestionsOutput> {
  return generateExamQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamQuestionsPrompt',
  input: { schema: GenerateExamQuestionsInputSchema },
  output: { schema: GenerateExamQuestionsOutputSchema },
  prompt: `You are an expert curriculum developer. Generate {{numQuestions}} multiple-choice questions about the topic: {{topic}}.
  
  For each question, provide the following:
  1. The question text.
  2. Exactly 4 possible answer options.
  3. The correct answer from the options.
  4. A single-word category tag for the question (e.g., "History", "Algebra", "Biology").

  Ensure the questions are clear, concise, and accurately test knowledge on the specified topic. Do not include questions that cannot be answered with one of the provided options.`,
});

const generateExamQuestionsFlow = ai.defineFlow(
  {
    name: 'generateExamQuestionsFlow',
    inputSchema: GenerateExamQuestionsInputSchema,
    outputSchema: GenerateExamQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
