'use client';

import { generatePdfContent } from '@/ai/flows/generate-pdf-content-flow';
import type { Product } from '@/lib/types';
import { firestore } from '@/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// This function is designed to be called in a "fire-and-forget" manner.
export async function generateAndCacheProductContent(product: Product): Promise<boolean> {
  // 1. Check localStorage first for immediate availability on the client.
  if (typeof window !== 'undefined' && localStorage.getItem(product.id)) {
    return true; // Already cached, consider it a success.
  }

  // Don't generate for AI products created on-the-fly by the user.
  if (product.category === 'AI Services') {
    return true; // Not applicable, but not a failure.
  }

  if (!firestore) {
    console.error("Firestore not available for background generation.");
    return false;
  }

  const contentRef = doc(firestore, 'generated_content', product.id);

  try {
    // 2. Check Firestore for existing centrally cached content.
    const contentSnap = await getDoc(contentRef);

    if (contentSnap.exists()) {
      const existingContent = contentSnap.data();
      if (typeof window !== 'undefined' && existingContent.content) {
        // Cache locally for faster access on the download page.
        localStorage.setItem(product.id, JSON.stringify(existingContent));
      }
      return true; // Content found in Firestore, cached locally, done.
    }

    // 3. If not in Firestore, generate new content via AI.
    
    let lengthInstruction: string;
    if (product.price > 69) {
        lengthInstruction = `The content must be **exceptionally long, very detailed, and comprehensive**, suitable for a premium digital product. Your main goal is to create a long, definitive guide. The length should be substantial, aiming for a minimum of 4000 words. Do not summarize; expand on every possible sub-topic related to the product description with detailed explanations, examples, and sub-sections.`;
    } else {
        lengthInstruction = `The content should be **medium-length, clear, and concise**, providing solid value for its price. It should cover the main points of the topic well, but doesn't need to be an exhaustive deep-dive. Aim for around 1500-2000 words.`;
    }

    let specificFormattingInstructions = "Break down complex topics into smaller, digestible sections with clear headings. Use lists, tables, code blocks (for technical topics), and examples to enhance understanding.";
    if (product.id === '36' || product.name.toLowerCase().includes('shortcuts')) {
        specificFormattingInstructions += `

**Formatting for Shortcuts:** For lists of shortcuts (like keyboard shortcuts), please use a Markdown table with two columns: "Shortcut" and "Description". This will provide a clear and organized layout for the user.`
    }


    const prompt = `
      Generate content for a digital product with the following details:
      - Name: "${product.name}"
      - Description: "${product.description}"
      - Category: "${product.category}"
      - Keywords: "${product.tags.join(', ')}"

      **Content Depth & Length:**
      - ${lengthInstruction}
      - ${specificFormattingInstructions}

      **Crucial Instructions:**
      1.  Your output must BE the document, not a description of it. Do not write meta-commentary. Your response should contain only the raw Markdown content for the document itself.
      2.  For the following categories, **DO NOT include a conclusion or summary section**: 'Coding & Tech', 'Planners & Organizers', 'Personal Growth', 'Code Libraries'. The document should end on its last main point.
    `;

    const result = await generatePdfContent({ prompt });

    if (result.error) {
      // This is the important change. Log the specific error from the AI flow.
      console.error(`AI Generation Error for product ${product.id}: ${result.error}`);
      return false;
    }

    if (result.content && result.title) {
      const pdfData = {
        title: product.name || result.title,
        content: result.content,
        createdAt: serverTimestamp(),
      };

      // 4. Save to Firestore.
      // The security rules only allow 'create', preventing overwrites.
      try {
        await setDoc(contentRef, pdfData);

        // 5. Save to localStorage for immediate use by the current user.
        if (typeof window !== 'undefined') {
          const localPdfData = { title: pdfData.title, content: pdfData.content };
          localStorage.setItem(product.id, JSON.stringify(localPdfData));
        }
        return true; // Generation and saving successful
      } catch (error) {
        console.error(`Firestore Error: Failed to save generated content for ${product.id}.`, error);
        // This is a critical failure for the background generator, so return false.
        return false;
      }

    } else {
        // This is now a fallback for an unexpected success case where content is missing.
        console.error(`AI Generation Error: AI model returned an empty but successful response for ${product.id}`);
        return false;
    }
  } catch (error) {
    // This catches errors from getDoc or other issues *before* generatePdfContent is called.
    console.error(`Failed to generate/cache content for ${product.id}`, error);
    return false;
  }
}
