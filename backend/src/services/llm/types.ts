export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  parallel_tool_calls?: boolean;
}

export interface ChatResponse {
  content: string;
  tool_calls?: ToolCall[];
  finish_reason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatWithTools?(
    messages: ChatMessage[],
    tools: Tool[],
    executeFunction: (name: string, args: any) => Promise<any>
  ): Promise<string>;
  supportsTools?: boolean;
}

// Types from existing services
export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyTopics?: string[];
  aiAnalysis?: string;
}

export interface GoogleReviewsData {
  averageRating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  placeId?: string;
  placeUrl?: string;
  sentimentSummary?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface AIAnalysisResult {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  lgbtFriendly: boolean;
  languages: string[];
}