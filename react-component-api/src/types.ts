import { z } from 'zod';

// Request schemas
export const ComponentGenerationRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gpt-4o-mini'),
  provider: z.string().optional().default('openai'),
  includeStyles: z.boolean().optional().default(true),
  framework: z.enum(['react', 'react-typescript']).optional().default('react-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
});

export type ComponentGenerationRequest = z.infer<typeof ComponentGenerationRequestSchema>;

// Response types
export interface ComponentGenerationResponse {
  success: boolean;
  component?: {
    code: string;
    name: string;
    dependencies: string[];
    styles?: string;
    props?: Record<string, any>;
  };
  error?: string;
  metadata?: {
    model: string;
    provider: string;
    tokensUsed?: number;
    generationTime: number;
  };
}

// Provider configuration
export interface ProviderConfig {
  name: string;
  baseURL: string;
  envKey?: string;
}

export interface AppConfig {
  model: string;
  provider: string;
  providers?: Record<string, ProviderConfig>;
}