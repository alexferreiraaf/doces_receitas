// src/ai/flows/suggest-recipes-from-inventory.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting recipes based on the user's ingredient inventory.
 *
 * The flow takes a description of the desired recipe type and the user's current ingredient inventory as input.
 * It then uses the Genkit AI to suggest recipes that can be made with the available ingredients, providing a complete list of ingredients and quantities.
 *
 * @exports suggestRecipesFromInventory - The main function to trigger the recipe suggestion flow.
 * @exports SuggestRecipesFromInventoryInput - The input type definition for the suggestRecipesFromInventory function.
 * @exports SuggestRecipesFromInventoryOutput - The output type definition for the suggestRecipesFromInventory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipesFromInventoryInputSchema = z.object({
  recipeTypeDescription: z
    .string()
    .describe(
      'A description of the type of recipe the user wants to make (e.g., cake, cookie, pie).'
    ),
  ingredientInventory: z
    .string()
    .describe(
      'A stringified JSON array of the user ingredient inventory, including each ingredient name, quantity, and unit of measure.'
    ),
});
export type SuggestRecipesFromInventoryInput = z.infer<
  typeof SuggestRecipesFromInventoryInputSchema
>;

const SuggestRecipesFromInventoryOutputSchema = z.object({
  suggestedRecipes: z
    .string()
    .describe(
      'A stringified JSON array of suggested recipes, including each recipe name, ingredients, and quantities.'
    ),
});
export type SuggestRecipesFromInventoryOutput = z.infer<
  typeof SuggestRecipesFromInventoryOutputSchema
>;

export async function suggestRecipesFromInventory(
  input: SuggestRecipesFromInventoryInput
): Promise<SuggestRecipesFromInventoryOutput> {
  return suggestRecipesFromInventoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipesFromInventoryPrompt',
  input: {schema: SuggestRecipesFromInventoryInputSchema},
  output: {schema: SuggestRecipesFromInventoryOutputSchema},
  prompt: `You are a recipe suggestion expert. Given a description of the type of recipe a user wants to make, and their current ingredient inventory, suggest recipes that the user can make.

Recipe Type Description: {{{recipeTypeDescription}}}
Ingredient Inventory: {{{ingredientInventory}}}

Return a JSON array of suggested recipes, including each recipe name, ingredients, and quantities. Be as specific as possible with quantities.`,
});

const suggestRecipesFromInventoryFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFromInventoryFlow',
    inputSchema: SuggestRecipesFromInventoryInputSchema,
    outputSchema: SuggestRecipesFromInventoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
