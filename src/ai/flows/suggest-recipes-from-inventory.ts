// src/ai/flows/suggest-recipes-from-inventory.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting recipes based on the user's ingredient inventory.
 *
 * The flow takes a description of the desired recipe type and the user's current ingredient inventory as input.
 * It then uses the Genkit AI to suggest recipes that can be made with the available ingredients, providing a complete list of ingredients and quantities in a structured format.
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

const SuggestedIngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  quantity: z.number().describe('The numerical quantity for the ingredient.'),
  unit: z.string().describe("The unit of measure (e.g., 'xícaras', 'gramas', 'unidades', 'ml', 'colher de sopa')."),
});

const SuggestedRecipeSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.array(SuggestedIngredientSchema),
});

const SuggestRecipesFromInventoryOutputSchema = z.object({
  suggestedRecipes: z.array(SuggestedRecipeSchema).describe('An array of suggested recipes.'),
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

Return a JSON object with a 'suggestedRecipes' key, containing an array of recipe objects. Each recipe object must have a 'recipeName' (string) and an 'ingredients' array. Each ingredient object in the array must have a 'name' (string), a 'quantity' (number), and a 'unit' (string, e.g., 'gramas', 'xícaras', 'ml', 'unidades'). Ensure the ingredient names match those in the provided inventory. Be as specific as possible.`,
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
