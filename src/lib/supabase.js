import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Init - URL:', supabaseUrl);
console.log('Supabase Init - Key Length:', supabaseKey?.length);

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
