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
      prompt: `You are an expert content creator. Your task is to generate the content for a document in Markdown format based on a user's prompt.

**Crucial Instruction:** Your output must BE the document, not a description of it. Do not write meta-commentary about the document, such as 'In this PDF you will find...' or 'Why choose this guide?'. Your response should contain only the raw Markdown content for the document itself. For example, if the prompt is for 'A Guide to Success', you will write the actual guide, starting with its title and content, not an introduction about the guide.

First, create a short, descriptive title for the document based on the user's prompt.
Then, generate the main body of the content.

The content should be professionally structured using Markdown elements like headings (#, ##, ###), lists (* or -), bold (**text**), and tables.

**Content Depth and Length:**
- For academic or educational topics like 'chapter-wise notes', 'study guides', or 'exam preparation', the content must be very thorough and detailed. Aim for a substantial length, equivalent to **10-14 pages** in a standard document.
- Break down complex topics into smaller, digestible sections with clear headings. Use lists, tables, code blocks (for technical topics), and examples to enhance understanding.
- For other topics like planners or simple guides, the length should be appropriate to the subject matter but still comprehensive.

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

    // Clean the content to remove potential markdown code blocks surrounding the actual content
    let processedContent = output.content;
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
