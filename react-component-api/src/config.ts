import { config as loadDotenv } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { homedir } from 'os';
import { join } from 'path';
import type { AppConfig, ProviderConfig } from './types.js';

// Load environment variables
loadDotenv();

// Default providers (extracted from Codex CLI)
export const defaultProviders: Record<string, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
  },
  openrouter: {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
  },
  azure: {
    name: 'Azure OpenAI',
    baseURL: process.env.AZURE_OPENAI_BASE_URL || '',
    envKey: 'AZURE_OPENAI_API_KEY',
  },
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    envKey: 'GEMINI_API_KEY',
  },
  ollama: {
    name: 'Ollama',
    baseURL: 'http://localhost:11434/v1',
    envKey: 'OLLAMA_API_KEY',
  },
  mistral: {
    name: 'Mistral AI',
    baseURL: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
  },
  xai: {
    name: 'xAI',
    baseURL: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
  },
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
  },
  arceeai: {
    name: 'Arcee AI',
    baseURL: 'https://api.arcee.ai/v1',
    envKey: 'ARCEEAI_API_KEY',
  },
};

export const CONFIG_DIR = join(homedir(), '.codex');
export const CONFIG_JSON_FILEPATH = join(CONFIG_DIR, 'config.json');
export const CONFIG_YAML_FILEPATH = join(CONFIG_DIR, 'config.yaml');

export function loadConfig(): Partial<AppConfig> {
  // Try to load from YAML first, then JSON
  for (const configPath of [CONFIG_YAML_FILEPATH, CONFIG_JSON_FILEPATH]) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
          return loadYaml(content) as Partial<AppConfig>;
        } else {
          return JSON.parse(content) as Partial<AppConfig>;
        }
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }
  return {};
}

export function getApiKey(provider: string = 'openai'): string {
  // Check for provider-specific environment variable
  const envKey = `${provider.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envKey];
  
  if (!apiKey) {
    // Fallback to default provider config
    const config = loadConfig();
    const providers = { ...defaultProviders, ...config.providers };
    const providerConfig = providers[provider.toLowerCase()];
    
    if (providerConfig?.envKey) {
      const fallbackKey = process.env[providerConfig.envKey];
      if (fallbackKey) return fallbackKey;
    }
    
    throw new Error(`API key not found for provider: ${provider}. Please set ${envKey} environment variable.`);
  }
  
  return apiKey;
}

export function getBaseUrl(provider: string = 'openai'): string {
  // Check for provider-specific base URL override
  const envKey = `${provider.toUpperCase()}_BASE_URL`;
  const baseUrl = process.env[envKey];
  
  if (baseUrl) return baseUrl;
  
  // Get from config or default providers
  const config = loadConfig();
  const providers = { ...defaultProviders, ...config.providers };
  const providerConfig = providers[provider.toLowerCase()];
  
  if (!providerConfig?.baseURL) {
    throw new Error(`Base URL not found for provider: ${provider}`);
  }
  
  return providerConfig.baseURL;
}

export const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10);
export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';
export const OPENAI_PROJECT = process.env.OPENAI_PROJECT || '';
export const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';