import OpenAI, { AzureOpenAI } from 'openai';
import type { AppConfig } from './types.js';
import {
  getApiKey,
  getBaseUrl,
  OPENAI_TIMEOUT_MS,
  OPENAI_ORGANIZATION,
  OPENAI_PROJECT,
  AZURE_OPENAI_API_VERSION,
} from './config.js';

type OpenAIClientConfig = {
  provider: string;
};

/**
 * Creates an OpenAI client instance based on the provided configuration.
 * Handles both standard OpenAI and Azure OpenAI configurations.
 */
export function createOpenAIClient(
  config: OpenAIClientConfig | AppConfig,
): OpenAI | AzureOpenAI {
  const headers: Record<string, string> = {};
  
  if (OPENAI_ORGANIZATION) {
    headers['OpenAI-Organization'] = OPENAI_ORGANIZATION;
  }
  if (OPENAI_PROJECT) {
    headers['OpenAI-Project'] = OPENAI_PROJECT;
  }

  if (config.provider?.toLowerCase() === 'azure') {
    return new AzureOpenAI({
      apiKey: getApiKey(config.provider),
      baseURL: getBaseUrl(config.provider),
      apiVersion: AZURE_OPENAI_API_VERSION,
      timeout: OPENAI_TIMEOUT_MS,
      defaultHeaders: headers,
    });
  }

  return new OpenAI({
    apiKey: getApiKey(config.provider),
    baseURL: getBaseUrl(config.provider),
    timeout: OPENAI_TIMEOUT_MS,
    defaultHeaders: headers,
  });
}