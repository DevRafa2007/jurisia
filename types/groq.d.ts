declare module 'groq-sdk' {
  export class Groq {
    constructor(options: { apiKey: string });
    
    chat: {
      completions: {
        create: (options: {
          messages: Array<{
            role: string;
            content: string;
          }>;
          model: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          stream?: boolean;
        }) => Promise<{
          choices: Array<{
            message?: {
              content: string;
              role: string;
            };
          }>;
          model: string;
          usage?: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
          };
        }>;
      };
    };
  }
} 