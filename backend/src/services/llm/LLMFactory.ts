import { LLMProvider } from './types';
import { OpenAIProvider } from './OpenAIProvider';
import { BlackboxProvider } from './BlackboxProvider';

export class LLMFactory {
  private static instance: LLMProvider | null = null;

  static create(): LLMProvider {
    // Return cached instance if exists (singleton pattern)
    if (this.instance) {
      return this.instance;
    }

    const provider = process.env.LLM_PROVIDER?.toLowerCase() || 'openai';
    
    // console.log(`🤖 Initializing LLM Provider: ${provider}`);
    
    switch (provider) {
      case 'blackbox':
        if (!process.env.BLACKBOX_API_KEY) {
          console.error('❌ BLACKBOX_API_KEY is not set');
          throw new Error('BLACKBOX_API_KEY is required for Blackbox provider');
        }
        console.log('✅ Using Blackbox AI provider (via OpenRouter)');
        this.instance = new BlackboxProvider(process.env.BLACKBOX_API_KEY);
        break;
      
      case 'openai':
      default:
        if (!process.env.OPENAI_API_KEY) {
          console.warn('⚠️ OPENAI_API_KEY is not set, using mock mode');
          // Return a mock provider for development
          return this.createMockProvider();
        }
        console.log('✅ Using OpenAI provider');
        this.instance = new OpenAIProvider(process.env.OPENAI_API_KEY);
        break;
    }
    
    return this.instance;
  }

  // Reset instance (useful for testing)
  static reset(): void {
    this.instance = null;
  }

  // Create a mock provider for development/testing
  private static createMockProvider(): LLMProvider {
    console.log('🔧 Using mock LLM provider (no API key set)');
    
    return {
      supportsTools: true,
      async chat(messages, options) {
        console.log('Mock LLM chat called with:', { messages: messages.length, options });
        return {
          content: 'Mock response: Analysis would be performed here',
          usage: {
            promptTokens: 100,
            completionTokens: 50
          }
        };
      },
      async chatWithTools(messages, tools, executeFunction) {
        console.log('Mock LLM chatWithTools called');
        // Simulate tool calling for testing
        if (tools.length > 0 && messages.some(m => m.content.includes('extract'))) {
          const mockResult = await executeFunction(tools[0].function.name, {
            doctors: [
              {
                name: 'Dr. Mock',
                specialty: 'Mock Specialty',
                address: 'Mock Address'
              }
            ]
          });
          return JSON.stringify(mockResult);
        }
        return 'Mock tool response';
      }
    };
  }

  // Get current provider info
  static getProviderInfo(): { provider: string; hasApiKey: boolean; supportsTools: boolean } {
    const provider = process.env.LLM_PROVIDER?.toLowerCase() || 'openai';
    const hasApiKey = provider === 'blackbox' 
      ? !!process.env.BLACKBOX_API_KEY 
      : !!process.env.OPENAI_API_KEY;
    
    const instance = this.create();
    
    return {
      provider,
      hasApiKey,
      supportsTools: instance.supportsTools || false
    };
  }
}