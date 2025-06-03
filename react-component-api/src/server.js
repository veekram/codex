import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotenv } from 'dotenv';
import chalk from 'chalk';
import { ComponentGenerator } from './component-generator.js';
import { ComponentGenerationRequestSchema } from './types.js';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
loadDotenv();

const app = express();
const PORT = parseInt(process.env.PORT || '12000', 10);

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(chalk.cyan(`${req.method} ${req.path}`), chalk.gray(new Date().toISOString()));
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'codex-react-component-api'
  });
});

// Main component generation endpoint
app.post('/api/generate-component', async (req, res) => {
  try {
    // Validate request body
    const validationResult = ComponentGenerationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: validationResult.error.errors,
      });
    }

    const request = validationResult.data;
    console.log(chalk.yellow('📝 Component generation request:'), {
      prompt: request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''),
      model: request.model,
      provider: request.provider,
      framework: request.framework,
    });

    // Load config and create generator
    const config = loadConfig();
    const generator = new ComponentGenerator({
      provider: request.provider || config.provider || 'openai',
      model: request.model || config.model || 'gpt-4o-mini',
    });

    // Generate component
    const result = await generator.generateComponent(request);
    
    // Log result
    if (result.success) {
      console.log(chalk.green('✅ Component generated successfully'));
    } else {
      console.log(chalk.red('❌ Component generation failed:'), result.error);
    }

    res.json(result);
  } catch (error) {
    console.error(chalk.red('💥 Server error:'), error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List available models endpoint
app.get('/api/models', (req, res) => {
  const models = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    openrouter: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-8b-instruct'],
    ollama: ['llama3.1', 'codellama', 'mistral'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    groq: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
  };
  
  res.json({ models });
});

// List available providers endpoint
app.get('/api/providers', (req, res) => {
  const config = loadConfig();
  const providers = Object.keys(config.providers || {});
  
  res.json({ 
    providers: providers.length > 0 ? providers : [
      'openai', 'openrouter', 'azure', 'gemini', 'ollama', 
      'mistral', 'deepseek', 'xai', 'groq', 'arceeai'
    ]
  });
});

// Example components endpoint
app.get('/api/examples', (req, res) => {
  const examples = [
    {
      title: 'Button Component',
      prompt: 'Create a reusable button component with different variants (primary, secondary, danger) and sizes (small, medium, large)',
      framework: 'react-typescript',
      includeStyles: true,
    },
    {
      title: 'Todo List',
      prompt: 'Create a todo list component with add, edit, delete, and mark complete functionality',
      framework: 'react-typescript',
      includeStyles: true,
    },
    {
      title: 'Modal Dialog',
      prompt: 'Create a modal dialog component with backdrop, close button, and customizable content',
      framework: 'react-typescript',
      includeStyles: true,
    },
    {
      title: 'Data Table',
      prompt: 'Create a data table component with sorting, filtering, and pagination',
      framework: 'react-typescript',
      includeStyles: true,
      dependencies: ['react-table'],
    },
    {
      title: 'Form with Validation',
      prompt: 'Create a contact form with email, name, message fields and validation',
      framework: 'react-typescript',
      includeStyles: true,
      dependencies: ['react-hook-form', 'zod'],
    },
  ];
  
  res.json({ examples });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(chalk.red('💥 Unhandled error:'), error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/generate-component',
      'GET /api/models',
      'GET /api/providers',
      'GET /api/examples',
    ],
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.green('🚀 Codex React Component API Server started!'));
  console.log(chalk.blue(`📡 Server running on: http://localhost:${PORT}`));
  console.log(chalk.blue(`🌐 External access: http://0.0.0.0:${PORT}`));
  console.log(chalk.yellow('📚 Available endpoints:'));
  console.log(chalk.gray('  GET  /health - Health check'));
  console.log(chalk.gray('  POST /api/generate-component - Generate React component'));
  console.log(chalk.gray('  GET  /api/models - List available models'));
  console.log(chalk.gray('  GET  /api/providers - List available providers'));
  console.log(chalk.gray('  GET  /api/examples - Get example prompts'));
  console.log(chalk.magenta('\n💡 Make sure to set your API keys as environment variables!'));
});