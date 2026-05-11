// Supabase client — only initialized when not in mock mode (Phase 2+).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

export const supabase = !USE_MOCK && url && anon ? createClient(url, anon) : null
