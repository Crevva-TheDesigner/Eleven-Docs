'use client';

import { allProducts } from './data';
import { generateAndCacheProductContent } from './ai-content-generator';
import type { Product } from './types';

const LAST_GENERATION_KEY = 'elevendocs_last_generation_time';
const GENERATED_IDS_KEY = 'elevendocs_generated_product_ids';
const GENERATION_INTERVAL = 20 * 60 * 1000; // 20 minutes

export async function scheduleNextGeneration() {
  if (typeof window === 'undefined') {
    return;
  }

  const now = new Date().getTime();
  const lastGenerationTime = parseInt(localStorage.getItem(LAST_GENERATION_KEY) || '0');

  if (now - lastGenerationTime < GENERATION_INTERVAL) {
    // It's not time yet.
    return;
  }
  
  // It's time, let's find a product to generate.
  console.log('Background generation interval met. Checking for products to generate...');

  const generatedIds: string[] = JSON.parse(localStorage.getItem(GENERATED_IDS_KEY) || '[]');
  
  const productToGenerate = allProducts.find(
    (p) => p.hasStaticContent && !generatedIds.includes(p.id)
  );

  if (productToGenerate) {
    console.log(`Starting background content generation for: ${productToGenerate.name}`);
    
    // Set the time *before* starting, to prevent another tab from starting the same job.
    localStorage.setItem(LAST_GENERATION_KEY, now.toString());

    const wasGenerated = await generateAndCacheProductContent(productToGenerate);
    
    if (wasGenerated) {
        const updatedGeneratedIds = [...generatedIds, productToGenerate.id];
        localStorage.setItem(GENERATED_IDS_KEY, JSON.stringify(updatedGeneratedIds));
        console.log(`Finished background content generation for: ${productToGenerate.name}`);
    } else {
        console.log(`Background generation for ${productToGenerate.name} failed. It will be retried after the next interval.`);
        // By not adding the ID to generatedIds, it remains eligible for the next attempt.
        // We already updated LAST_GENERATION_KEY, so it won't retry immediately, which is correct.
    }

  } else {
    console.log('All product content has been generated. No more jobs to schedule.');
    // To prevent this from running every minute forever once complete, we can keep updating the timestamp.
    localStorage.setItem(LAST_GENERATION_KEY, now.toString());
  }
}
