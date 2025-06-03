import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadConfig() {
  // Default configuration
  const defaultConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      },
      azure: {
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      },
      ollama: {
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      },
      mistral: {
        apiKey: process.env.MISTRAL_API_KEY,
        baseURL: 'https://api.mistral.ai/v1',
      },
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
      },
      xai: {
        apiKey: process.env.XAI_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      },
      arceeai: {
        apiKey: process.env.ARCEEAI_API_KEY,
        baseURL: 'https://api.arcee.ai/v1',
      },
    },
  };

  // Try to load config from various locations
  const configPaths = [
    path.join(process.cwd(), 'codex.yml'),
    path.join(process.cwd(), 'codex.yaml'),
    path.join(process.cwd(), '.codex.yml'),
    path.join(process.cwd(), '.codex.yaml'),
    path.join(__dirname, '..', 'codex.yml'),
    path.join(__dirname, '..', 'codex.yaml'),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const fileConfig = yaml.load(configFile);
        
        // Merge with default config
        return {
          ...defaultConfig,
          ...fileConfig,
          providers: {
            ...defaultConfig.providers,
            ...(fileConfig.providers || {}),
          },
        };
      }
    } catch (error) {
      console.warn(`Warning: Could not load config from ${configPath}:`, error.message);
    }
  }

  return defaultConfig;
}