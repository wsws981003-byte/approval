// Supabase 초기화 및 설정

// Supabase 프로젝트 설정
const SUPABASE_URL = 'https://aemuzqrmzlyaxypmgurf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q6youNlccsFOM5ldWzPviw_LojP9mFp';

// Supabase 클라이언트 초기화
let supabaseClient = null;

// Supabase 초기화 함수
function initSupabase() {
    // URL과 키가 설정되어 있는지 확인
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
        console.warn('⚠️ Supabase 설정이 완료되지 않았습니다. localStorage를 사용합니다.');
        return false;
    }
    
    try {
        // Supabase 클라이언트 생성
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // DataService에 Supabase 설정
        if (typeof dataService !== 'undefined') {
            dataService.setSupabase(supabaseClient);
            console.log('✅ Supabase 연동 완료!');
            return true;
        } else {
            console.error('❌ DataService를 찾을 수 없습니다.');
            return false;
        }
    } catch (error) {
        console.error('❌ Supabase 초기화 오류:', error);
        return false;
    }
}

// Supabase 연결 테스트
async function testSupabaseConnection() {
    if (!supabaseClient) {
        console.error('Supabase가 초기화되지 않았습니다.');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('approved_users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Supabase 연결 테스트 실패:', error);
            return false;
        }
        
        console.log('✅ Supabase 연결 성공!');
        return true;
    } catch (error) {
        console.error('Supabase 연결 테스트 오류:', error);
        return false;
    }
}

