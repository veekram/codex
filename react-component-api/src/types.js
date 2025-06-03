import { z } from 'zod';

// Zod schemas for validation
export const ComponentGenerationRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  framework: z.enum(['react', 'react-typescript', 'vue', 'svelte', 'angular']).default('react-typescript'),
  provider: z.string().optional(),
  model: z.string().optional(),
  includeStyles: z.boolean().default(true),
  includeTests: z.boolean().default(false),
  dependencies: z.array(z.string()).default([]),
  customInstructions: z.string().optional(),
});

export const ComponentGenerationResponseSchema = z.object({
  success: z.boolean(),
  component: z.object({
    name: z.string(),
    code: z.string(),
    styles: z.string().optional(),
    tests: z.string().optional(),
    dependencies: z.array(z.string()),
    framework: z.string(),
  }).optional(),
  error: z.string().optional(),
  metadata: z.object({
    model: z.string(),
    provider: z.string(),
    tokensUsed: z.number().optional(),
    generationTime: z.number(),
  }).optional(),
});