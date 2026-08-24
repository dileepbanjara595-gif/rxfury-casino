import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Check your .env file and restart the Next.js server.');
}

// createClient requires valid strings, casting as string bypasses TypeScript issues 
// since we threw an error above if they are missing.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
