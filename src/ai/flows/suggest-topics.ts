'use server';

/**
 * @fileOverview Provides exam topic suggestions based on user interests.
 *
 * - suggestExamTopics - A function that suggests exam topics.
 * - SuggestExamTopicsInput - The input type for the suggestExamTopics function.
 * - SuggestExamTopicsOutput - The return type for the suggestExamTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExamTopicsInputSchema = z.object({
  interests: z
    .string()
    .describe('A description of the user interests for topic suggestions.'),
});
export type SuggestExamTopicsInput = z.infer<typeof SuggestExamTopicsInputSchema>;

const SuggestExamTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe('An array of suggested exam topics based on the user interests.'),
});
export type SuggestExamTopicsOutput = z.infer<typeof SuggestExamTopicsOutputSchema>;

export async function suggestExamTopics(input: SuggestExamTopicsInput): Promise<SuggestExamTopicsOutput> {
  return suggestExamTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExamTopicsPrompt',
  input: {schema: SuggestExamTopicsInputSchema},
  output: {schema: SuggestExamTopicsOutputSchema},
  prompt: `You are a helpful assistant that suggests exam topics based on user interests.

  Suggest exam topics based on the following interests:
  {{interests}}

  Return the topics as a JSON array.`,
});

const suggestExamTopicsFlow = ai.defineFlow(
  {
    name: 'suggestExamTopicsFlow',
    inputSchema: SuggestExamTopicsInputSchema,
    outputSchema: SuggestExamTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
