import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aiylivwvzewrcrdogkio.supabase.co';
const supabaseAnonKey = 'sb_publishable_VCwI8TCDepgnO0uEM_AZzw_8Stl-4Jh';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Credenciais do Supabase não configuradas no .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);