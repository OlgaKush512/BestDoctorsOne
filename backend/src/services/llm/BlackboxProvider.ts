import fetch from 'node-fetch';
import { LLMProvider, ChatMessage, ChatOptions, ChatResponse, Tool, ToolCall } from './types';

export class BlackboxProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl = 'https://api.blackbox.ai'; // Blackbox AI endpoint
  public supportsTools = true;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const requestBody: any = {
      model: options?.model || 'google/gemini-2.0-flash-001',  // Правильное имя модели без префикса blackboxai
      messages: messages.map(msg => {
        // Clean up message format for API
        const cleanMsg: any = { role: msg.role, content: msg.content };
        if (msg.tool_calls) cleanMsg.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;
        return cleanMsg;
      }),
      temperature: options?.temperature || 0.3,
      max_tokens: options?.maxTokens || 1000
    };

    // Add tools if provided
    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools;
      requestBody.tool_choice = options.tool_choice || 'auto';
      requestBody.parallel_tool_calls = options.parallel_tool_calls !== false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Blackbox API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      
      return {
        content: data.choices?.[0]?.message?.content || '',
        tool_calls: data.choices?.[0]?.message?.tool_calls,
        finish_reason: data.choices?.[0]?.finish_reason,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      console.error('BlackboxProvider chat error:', error);
      throw error;
    }
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: Tool[],
    executeFunction: (name: string, args: any) => Promise<any>
  ): Promise<string> {
    // First call with tools
    const initialResponse = await this.chat(messages, { 
      tools, 
      tool_choice: 'auto',
      parallel_tool_calls: true 
    });
    
    // If model wants to call functions
    if (initialResponse.finish_reason === 'tool_calls' && initialResponse.tool_calls) {
      const updatedMessages = [...messages];
      
      // Add assistant message with tool_calls
      updatedMessages.push({
        role: 'assistant',
        content: initialResponse.content || '',
        tool_calls: initialResponse.tool_calls
      });
      
      // Execute each tool call
      for (const toolCall of initialResponse.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs: any;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error(`Failed to parse tool arguments for ${functionName}:`, toolCall.function.arguments);
          functionArgs = {};
        }
        
        try {
          const result = await executeFunction(functionName, functionArgs);
          
          // Add result as tool message
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: typeof result === 'string' ? result : JSON.stringify(result)
          });
        } catch (error: any) {
          console.error(`Tool execution error for ${functionName}:`, error);
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' })
          });
        }
      }
      
      // Final call to get response
      const finalResponse = await this.chat(updatedMessages);
      return finalResponse.content;
    }
    
    // If no tool calls, return direct response
    return initialResponse.content;
  }

  // Helper method to analyze reviews (compatibility with existing code)
  async analyzeReviews(prompt: string): Promise<any> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a medical review analyst specializing in French healthcare. Analyze doctor reviews and provide insights based on user requirements. Respond in French and be objective and helpful.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.chat(messages, {
      temperature: 0.3,
      maxTokens: 1000
    });

    return response.content;
  }

  // Helper method to extract doctors from HTML
  async extractFromHTML(html: string, purpose: string): Promise<any> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert at extracting structured data from HTML. Return valid JSON only.'
      },
      {
        role: 'user',
        content: `${purpose}\n\nHTML:\n${html.substring(0, 10000)}`
      }
    ];

    const response = await this.chat(messages, {
      temperature: 0.1,
      maxTokens: 2000
    });

    try {
      // Try to extract JSON from response
      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON from LLM response:', error);
      return null;
    }
  }
}