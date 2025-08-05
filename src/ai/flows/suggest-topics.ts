'use server';

/**
 * @fileOverview Provides quiz topic suggestions based on user interests.
 *
 * - suggestQuizTopics - A function that suggests quiz topics.
 * - SuggestQuizTopicsInput - The input type for the suggestQuizTopics function.
 * - SuggestQuizTopicsOutput - The return type for the suggestQuizTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQuizTopicsInputSchema = z.object({
  interests: z
    .string()
    .describe('A description of the user interests for topic suggestions.'),
});
export type SuggestQuizTopicsInput = z.infer<typeof SuggestQuizTopicsInputSchema>;

const SuggestQuizTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe('An array of suggested quiz topics based on the user interests.'),
});
export type SuggestQuizTopicsOutput = z.infer<typeof SuggestQuizTopicsOutputSchema>;

export async function suggestQuizTopics(input: SuggestQuizTopicsInput): Promise<SuggestQuizTopicsOutput> {
  return suggestQuizTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestQuizTopicsPrompt',
  input: {schema: SuggestQuizTopicsInputSchema},
  output: {schema: SuggestQuizTopicsOutputSchema},
  prompt: `You are a helpful assistant that suggests quiz topics based on user interests.

  Suggest quiz topics based on the following interests:
  {{interests}}

  Return the topics as a JSON array.`,
});

const suggestQuizTopicsFlow = ai.defineFlow(
  {
    name: 'suggestQuizTopicsFlow',
    inputSchema: SuggestQuizTopicsInputSchema,
    outputSchema: SuggestQuizTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
