import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 설정이 완료되지 않았습니다. 환경 변수를 확인하세요.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

