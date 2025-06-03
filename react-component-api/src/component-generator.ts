import type { ComponentGenerationRequest, ComponentGenerationResponse } from './types.js';
import { createOpenAIClient } from './openai-client.js';
import chalk from 'chalk';

/**
 * Generates React components using AI based on the provided prompt
 */
export class ComponentGenerator {
  private client: ReturnType<typeof createOpenAIClient>;
  
  constructor(private config: { provider: string; model: string }) {
    this.client = createOpenAIClient({ provider: config.provider });
  }

  async generateComponent(request: ComponentGenerationRequest): Promise<ComponentGenerationResponse> {
    const startTime = Date.now();
    
    try {
      console.log(chalk.blue(`🤖 Generating React component with ${request.model} via ${request.provider}...`));
      
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);
      
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('No content generated from AI model');
      }

      const parsedComponent = this.parseGeneratedComponent(generatedContent);
      const generationTime = Date.now() - startTime;

      console.log(chalk.green(`✅ Component generated successfully in ${generationTime}ms`));

      return {
        success: true,
        component: parsedComponent,
        metadata: {
          model: request.model,
          provider: request.provider,
          tokensUsed: response.usage?.total_tokens,
          generationTime,
        },
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error(chalk.red('❌ Component generation failed:'), error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          model: request.model,
          provider: request.provider,
          generationTime,
        },
      };
    }
  }

  private buildSystemPrompt(request: ComponentGenerationRequest): string {
    const isTypeScript = request.framework === 'react-typescript';
    
    return `You are an expert React developer. Generate a high-quality, production-ready React component based on the user's requirements.

IMPORTANT GUIDELINES:
1. Generate ONLY the component code, no explanations or markdown formatting
2. Use ${isTypeScript ? 'TypeScript' : 'JavaScript'} with modern React patterns (functional components, hooks)
3. Include proper TypeScript types if using TypeScript
4. Use semantic HTML and accessibility best practices
5. ${request.includeStyles ? 'Include inline styles or CSS-in-JS styling' : 'Do not include any styling'}
6. Make the component reusable and well-structured
7. Include proper prop validation and default values
8. Use descriptive variable and function names
9. Add brief JSDoc comments for complex logic

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "name": "ComponentName",
  "code": "// The complete component code here",
  "dependencies": ["array", "of", "required", "npm", "packages"],
  "props": {
    "propName": "description of what this prop does"
  }${request.includeStyles ? ',\n  "styles": "/* CSS styles if any */"' : ''}
}

The component should be self-contained and ready to use.`;
  }

  private buildUserPrompt(request: ComponentGenerationRequest): string {
    let prompt = `Create a React component: ${request.prompt}`;
    
    if (request.dependencies.length > 0) {
      prompt += `\n\nPreferred dependencies to use: ${request.dependencies.join(', ')}`;
    }
    
    if (!request.includeStyles) {
      prompt += '\n\nDo not include any styling - focus only on functionality and structure.';
    }
    
    return prompt;
  }

  private parseGeneratedComponent(content: string): ComponentGenerationResponse['component'] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.name || !parsed.code) {
        throw new Error('Generated component missing required fields (name, code)');
      }
      
      return {
        name: parsed.name,
        code: parsed.code,
        dependencies: parsed.dependencies || [],
        props: parsed.props || {},
        styles: parsed.styles,
      };
    } catch (error) {
      // Fallback: try to extract component code manually
      console.warn('Failed to parse JSON response, attempting manual extraction:', error);
      
      // Look for React component patterns
      const componentMatch = content.match(/(?:function|const)\s+(\w+)/);
      const componentName = componentMatch?.[1] || 'GeneratedComponent';
      
      return {
        name: componentName,
        code: content,
        dependencies: [],
        props: {},
      };
    }
  }
}