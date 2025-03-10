// Declaração global para o objeto process
declare namespace NodeJS {
  interface ProcessEnv {
    GROQ_API_KEY?: string;
    [key: string]: string | undefined;
  }
} 