# Codex React Component API

A powerful API server that leverages OpenAI Codex to generate React components on demand. Built on top of the Codex CLI codebase, this service provides a REST API for generating high-quality, production-ready React components using AI.

## 🚀 Features

- **AI-Powered Component Generation**: Generate React components using various AI models
- **Live Component Preview**: Real-time preview and testing of generated components
- **Multiple Provider Support**: OpenAI, OpenRouter, Gemini, Mistral, Groq, Ollama, and more
- **TypeScript & JavaScript Support**: Generate components in either language
- **Styling Options**: Include or exclude styling in generated components
- **Dependency Management**: Automatically detect and list required npm packages
- **Interactive Web Interface**: Beautiful frontend with component preview capabilities
- **RESTful API**: Clean, well-documented API endpoints

## 🛠 Installation

1. **Clone and navigate to the project:**
   ```bash
   cd codex/react-component-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Alternative providers
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
MISTRAL_API_KEY=your-mistral-key
GROQ_API_KEY=your-groq-key

# Server configuration
PORT=12000
```

### Codex Configuration

The API also supports Codex CLI configuration files:
- `~/.codex/config.yaml` or `~/.codex/config.json`

Example config:
```yaml
model: gpt-4o-mini
provider: openai
providers:
  custom-provider:
    name: "Custom Provider"
    baseURL: "https://api.example.com/v1"
    envKey: "CUSTOM_API_KEY"
```

## 🚀 Usage

### Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:12000` (or your configured PORT).

### Web Interface

Open `http://localhost:12000` in your browser to access the web interface for testing component generation.

**Preview Interface**: Access `http://localhost:12000/preview` for the dedicated component preview interface where you can:
- Test React components in real-time
- Edit component code with syntax highlighting
- See live rendering with React and Babel
- Load example components
- Interactive component testing

### API Endpoints

#### Generate Component
```http
POST /api/generate-component
Content-Type: application/json

{
  "prompt": "Create a button component with different variants",
  "model": "gpt-4o-mini",
  "provider": "openai",
  "framework": "react-typescript",
  "includeStyles": true,
  "dependencies": []
}
```

**Response:**
```json
{
  "success": true,
  "component": {
    "name": "Button",
    "code": "// Generated React component code",
    "dependencies": ["react"],
    "props": {
      "variant": "Button style variant",
      "size": "Button size"
    },
    "styles": "/* CSS styles */"
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "provider": "openai",
    "tokensUsed": 150,
    "generationTime": 1200
  }
}
```

#### Preview Component
```http
POST /api/preview-component
Content-Type: application/json

{
  "code": "function MyButton() { return <button>Click me</button>; }"
}
```

**Response:**
```json
{
  "success": true,
  "html": "<!-- Complete HTML with React component rendered -->"
}
```

#### Other Endpoints

- `GET /health` - Health check
- `GET /preview` - Component preview interface
- `GET /api/models` - List available models
- `GET /api/providers` - List available providers  
- `GET /api/examples` - Get example prompts

## 📝 API Reference

### Request Schema

```typescript
interface ComponentGenerationRequest {
  prompt: string;                    // Required: Description of component
  model?: string;                    // AI model to use (default: gpt-4o-mini)
  provider?: string;                 // AI provider (default: openai)
  framework?: 'react' | 'react-typescript'; // Framework (default: react-typescript)
  includeStyles?: boolean;           // Include styling (default: true)
  dependencies?: string[];           // Preferred dependencies
}
```

### Response Schema

```typescript
interface ComponentGenerationResponse {
  success: boolean;
  component?: {
    name: string;                    // Component name
    code: string;                    // Component source code
    dependencies: string[];          // Required npm packages
    props?: Record<string, string>;  // Component props documentation
    styles?: string;                 // CSS styles (if included)
  };
  error?: string;                    // Error message (if failed)
  metadata: {
    model: string;                   // Model used
    provider: string;                // Provider used
    tokensUsed?: number;             // Tokens consumed
    generationTime: number;          // Generation time in ms
  };
}
```

## 🎯 Example Prompts

- **Button Component**: "Create a reusable button component with different variants (primary, secondary, danger) and sizes"
- **Todo List**: "Create a todo list component with add, edit, delete, and mark complete functionality"
- **Modal Dialog**: "Create a modal dialog component with backdrop, close button, and customizable content"
- **Data Table**: "Create a data table component with sorting, filtering, and pagination"
- **Form with Validation**: "Create a contact form with email, name, message fields and validation"

## 🔒 Security

- API keys are loaded from environment variables
- No file system access (unlike CLI version)
- Rate limiting recommended for production use
- CORS enabled for development (configure for production)

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 12000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=12000
OPENAI_API_KEY=your-production-key
```

## 🤝 Contributing

This project is built on top of the OpenAI Codex CLI. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project inherits the Apache 2.0 license from the parent Codex CLI project.

## 🙏 Acknowledgments

- Built on top of [OpenAI Codex CLI](https://github.com/openai/codex)
- Uses OpenAI's powerful language models
- Inspired by the need for programmatic component generation

---

**Note**: This is an experimental project. The generated components should be reviewed and tested before use in production applications.