import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 읽기 (개발 환경에서는 .env 파일에서 로드)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 개발 환경에서 환경 변수가 없을 때 기본값 사용
const DEFAULT_URL = 'https://aemuzqrmzlyaxypmgurf.supabase.co'
const DEFAULT_KEY = 'sb_publishable_Q6youNlccsFOM5ldWzPviw_LojP9mFp'

const url = supabaseUrl || DEFAULT_URL
const key = supabaseAnonKey || DEFAULT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ 환경 변수에서 Supabase 설정을 읽지 못했습니다. 기본값을 사용합니다.')
  console.warn('VITE_SUPABASE_URL:', supabaseUrl ? '설정됨' : '기본값 사용')
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '기본값 사용')
} else {
  console.log('✅ Supabase 환경 변수가 정상적으로 로드되었습니다.')
}

export const supabase = createClient(url, key)

