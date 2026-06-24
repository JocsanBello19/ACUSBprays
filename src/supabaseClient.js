import { createClient } from '@supabase/supabase-js';

// Captura segura de las variables de entorno inyectadas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Las llaves de Supabase no están configuradas localmente. Recuerda que se leerán en producción en Vercel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);