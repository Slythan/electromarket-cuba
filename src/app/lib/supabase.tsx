import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** true si el archivo .env.local tiene los dos datos de Supabase */
export const isSupabaseConfigured = Boolean(url && key);

// Si faltan las variables se usan valores de relleno para que la app
// compile y pueda mostrar la pantalla de "Falta conectar Supabase".
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
);