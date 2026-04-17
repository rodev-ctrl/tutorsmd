export type Message = {
  question?: string;
  answer?: string;
  language: string;
  files?: Array<{ name: string; type: string; data: number[] }>;
  ts?: number;
};