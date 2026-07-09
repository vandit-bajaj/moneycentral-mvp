import { z } from 'zod';

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required').optional(),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const parsed = EnvSchema.parse({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (typeof window === 'undefined' && !parsed.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required on the server');
}

export const env = {
  GEMINI_API_KEY: parsed.GEMINI_API_KEY!,
  NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
