'use server';
/**
 * @fileOverview A flow for generating PDF content using an AI model.
 *
 * - generatePdfContent - A function that takes a user prompt and returns structured content.
 * - GeneratePdfContentInput - The input type for the generatePdfContent function.
 * - GeneratePdfContentOutput - The return type for the generatePdfContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePdfContentInputSchema = z.object({
  prompt: z.string().describe("The user's detailed request for the PDF content."),
});
export type GeneratePdfContentInput = z.infer<typeof GeneratePdfContentInputSchema>;

// This is the output from the AI model itself
const AIContentSchema = z.object({
  title: z.string().describe('A short, descriptive title for the document, based on the content.'),
  content: z.string().describe('The generated content for the PDF, formatted in Markdown.'),
});

// This is the output of our server action, which can include an error
const GeneratePdfContentOutputSchema = AIContentSchema.extend({
  error: z.string().optional(),
});
export type GeneratePdfContentOutput = z.infer<typeof GeneratePdfContentOutputSchema>;


export async function generatePdfContent(input: GeneratePdfContentInput): Promise<GeneratePdfContentOutput> {
  try {
    const prompt = ai.definePrompt({
      name: 'generatePdfContentPrompt',
      input: { schema: GeneratePdfContentInputSchema },
      output: { schema: AIContentSchema },
      prompt: `You are an expert content creator. Your task is to generate content for a document in Markdown format based on a user's prompt. The goal is to provide a high-quality, useful document that is clear and well-structured.

**Content Depth and Quality:**
- The content should be **well-detailed and clear**, providing substantial value.
- Aim for a word count around **1500-2000 words**. The goal is a solid, valuable document, not an exhaustive encyclopedia.
- Structure the document professionally using Markdown elements like headings (#, ##, ###), lists (* or -), bold (**text**), and tables where appropriate.

**Crucial Instruction:** Your output must BE the document, not a description of it. Do not write meta-commentary about the document, such as 'In this PDF you will find...' or 'Why choose this guide?'. Your response should contain only the raw Markdown content for the document itself.

First, create a short, descriptive title for the document based on the user's prompt.
Then, generate the main body of the content.

**Completeness Instruction:**
- To signify that you have finished the entire document and not been cut off, you **MUST** end your response with the following exact text on a new line:
\`<!-- DOCUMENT_COMPLETE -->\`
- There should be no text after this marker.

Ensure the content is coherent and directly addresses the user's request. Pay close attention to any specific instructions in the user prompt regarding structure, such as the inclusion or exclusion of a conclusion.

User Prompt: {{{prompt}}}
`,
      config: {
        temperature: 0.5,
      },
    });

    const { output } = await prompt(input);

    if (!output || !output.content) {
      return { error: 'The AI model did not return any content. Please try again with a different prompt.', title: '', content: '' };
    }

    // Check for completeness marker
    if (!output.content.includes('<!-- DOCUMENT_COMPLETE -->')) {
      // This indicates the model's output was truncated before it could finish.
      console.error("Generated content was truncated by the model. The 'DOCUMENT_COMPLETE' marker was not found.");
      return { error: 'The AI model was unable to generate the full document because the content was cut short. This can happen with very long or complex requests. Please try again with a more specific prompt.', title: '', content: '' };
    }

    // Clean the content to remove the marker and potential markdown code blocks
    let processedContent = output.content.replace('<!-- DOCUMENT_COMPLETE -->', '').trim();
    const markdownBlockRegex = /```(?:markdown|md)?\s*([\s\S]*?)\s*```/;
    const match = processedContent.match(markdownBlockRegex);

    if (match && match[1]) {
      processedContent = match[1];
    } else {
      processedContent = processedContent.replace(/^```\s*|```\s*$/g, '');
    }
    
    const finalOutput = {
        title: output.title,
        content: processedContent.trim(),
    };

    return finalOutput;

  } catch (error: any) {
    console.error("Error generating PDF content:", error);
    let message = "An unexpected error occurred. Please check the server logs for details.";
    
    if (error.message) {
      const lowerCaseMessage = error.message.toLowerCase();
      if (lowerCaseMessage.includes('api key not valid')) {
        message = 'Your Gemini API key is not valid. Please check your .env file and make sure it is correct.';
      } else if (lowerCaseMessage.includes('leaked') || lowerCaseMessage.includes('compromised')) {
        message = 'Your Gemini API key has been compromised and cannot be used. Please generate a new key.';
      } else if (error.message.includes('503') || lowerCaseMessage.includes('model is overloaded') || lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('quota')) {
        message = 'The AI model is currently busy or you have exceeded your rate limit. Please wait a moment and try again.';
      } else {
        message = error.message;
      }
    }
    
    return { error: message, title: '', content: '' };
  }
}
