import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * generateEmbeddings
 * 
 * Generates a 1536-dimensional vector for a given text using OpenAI.
 * Optimized for text-embedding-3-small (MVP standard).
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    console.warn('[AI Helpers] OPENAI_API_KEY is missing or placeholder. Returning zero-vector.');
    return new Array(1536).fill(0);
  }

  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '), // Normalize text
    });

    return response.data[0].embedding;
  } catch (err) {
    console.error('[AI Helpers] Error generating embeddings:', err);
    throw err;
  }
}
