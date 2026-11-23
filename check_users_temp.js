import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdxpjvtxtnaxlqauznql.supabase.co';
// Read the key from the environment instead of hardcoding it in source.
// The anon key is publishable, but a literal in a script is still a
// credential that ends up in every clone.
const supabaseAnonKey = globalThis.process?.env?.VITE_SUPABASE_ANON_KEY || globalThis.process?.env?.SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  console.error('Set VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) before running this script.');
  globalThis.process?.exit?.(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('--- Database Record Columns Check ---');
    console.log(data);
    console.log('---------------------------');
  }
}

checkUsers();
