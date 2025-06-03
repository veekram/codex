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

// Preview endpoint - serves a live preview interface
app.get('/preview', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'preview.html'));
});

// API endpoint to render component preview
app.post('/api/preview-component', async (req, res) => {
  try {
    const { componentCode, componentName = 'GeneratedComponent' } = req.body;
    
    if (!componentCode) {
      return res.status(400).json({ 
        error: 'Component code is required',
        details: 'Please provide componentCode in the request body'
      });
    }

    // Create a safe preview HTML with the component code
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview - ${componentName}</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .preview-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .preview-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .preview-title {
            margin: 0;
            color: #333;
            font-size: 18px;
        }
        .error-container {
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 4px;
            padding: 15px;
            color: #c33;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .component-wrapper {
            min-height: 100px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1 class="preview-title">Preview: ${componentName}</h1>
        </div>
        <div id="component-root" class="component-wrapper"></div>
    </div>

    <script type="text/babel">
        try {
            // Component code
            ${componentCode}
            
            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('component-root'));
            root.render(React.createElement(${componentName}));
        } catch (error) {
            console.error('Preview error:', error);
            document.getElementById('component-root').innerHTML = 
                '<div class="error-container">Error rendering component:\\n' + error.message + '</div>';
        }
    </script>
</body>
</html>`;

    res.json({
      success: true,
      previewHtml,
      componentName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      details: error.message 
    });
  }
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
      'GET /preview',
      'POST /api/generate-component',
      'POST /api/preview-component',
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
  console.log(chalk.gray('  GET  /preview - Component preview interface'));
  console.log(chalk.gray('  POST /api/generate-component - Generate React component'));
  console.log(chalk.gray('  POST /api/preview-component - Generate component preview'));
  console.log(chalk.gray('  GET  /api/models - List available models'));
  console.log(chalk.gray('  GET  /api/providers - List available providers'));
  console.log(chalk.gray('  GET  /api/examples - Get example prompts'));
  console.log(chalk.magenta('\n💡 Make sure to set your API keys as environment variables!'));
});