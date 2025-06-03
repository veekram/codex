import { OpenAIClient } from './openai-client.js';
import { loadConfig } from './config.js';

export class ComponentGenerator {
  constructor(options = {}) {
    this.config = loadConfig();
    this.provider = options.provider || this.config.provider || 'openai';
    this.model = options.model || this.config.model || 'gpt-4o-mini';
    
    // Initialize the appropriate client
    this.initializeClient();
  }

  initializeClient() {
    const providerConfig = this.config.providers[this.provider];
    
    if (!providerConfig) {
      throw new Error(`Provider '${this.provider}' not configured`);
    }

    // For now, we'll use OpenAI client for all providers that are OpenAI-compatible
    // In a full implementation, you'd have different clients for different providers
    this.client = new OpenAIClient(providerConfig);
  }

  async generateComponent(request) {
    const startTime = Date.now();
    
    try {
      // Build the prompt
      const prompt = this.buildPrompt(request);
      
      // Generate the component
      const result = await this.client.generateCompletion(prompt, this.model);
      
      // Parse the response
      const component = this.parseComponentResponse(result.content, request);
      
      const generationTime = Date.now() - startTime;
      
      return {
        success: true,
        component,
        metadata: {
          model: this.model,
          provider: this.provider,
          tokensUsed: result.tokensUsed,
          generationTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          model: this.model,
          provider: this.provider,
          generationTime: Date.now() - startTime,
        },
      };
    }
  }

  buildPrompt(request) {
    const {
      prompt,
      framework,
      includeStyles,
      includeTests,
      dependencies,
      customInstructions,
    } = request;

    let systemPrompt = `You are an expert ${framework} developer. Generate a complete, production-ready component based on the user's requirements.

Requirements:
- Framework: ${framework}
- Include styles: ${includeStyles ? 'Yes' : 'No'}
- Include tests: ${includeTests ? 'Yes' : 'No'}
- Dependencies: ${dependencies.length > 0 ? dependencies.join(', ') : 'None specified'}

Guidelines:
1. Write clean, modern, and well-documented code
2. Use TypeScript if the framework includes TypeScript
3. Follow best practices and conventions
4. Include proper prop types and interfaces
5. Make the component reusable and configurable
6. Add helpful comments for complex logic
7. Use semantic HTML and accessibility features
8. If styles are requested, use CSS modules or styled-components

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Please provide the response in the following JSON format:
{
  "name": "ComponentName",
  "code": "// Component code here",
  "styles": "/* CSS styles here (if requested) */",
  "tests": "// Test code here (if requested)",
  "dependencies": ["dependency1", "dependency2"],
  "description": "Brief description of the component"
}

User Request: ${prompt}`;

    return systemPrompt;
  }

  parseComponentResponse(response, request) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/```\n([\s\S]*?)\n```/) ||
                       response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        return {
          name: parsed.name || 'GeneratedComponent',
          code: parsed.code || response,
          styles: request.includeStyles ? (parsed.styles || '') : undefined,
          tests: request.includeTests ? (parsed.tests || '') : undefined,
          dependencies: parsed.dependencies || request.dependencies || [],
          framework: request.framework,
          description: parsed.description || '',
        };
      }
      
      // Fallback: treat entire response as code
      return {
        name: 'GeneratedComponent',
        code: response,
        styles: request.includeStyles ? '/* Add your styles here */' : undefined,
        tests: request.includeTests ? '// Add your tests here' : undefined,
        dependencies: request.dependencies || [],
        framework: request.framework,
        description: 'Generated component',
      };
    } catch (error) {
      // If parsing fails, return the raw response as code
      return {
        name: 'GeneratedComponent',
        code: response,
        styles: request.includeStyles ? '/* Add your styles here */' : undefined,
        tests: request.includeTests ? '// Add your tests here' : undefined,
        dependencies: request.dependencies || [],
        framework: request.framework,
        description: 'Generated component (raw response)',
      };
    }
  }
}