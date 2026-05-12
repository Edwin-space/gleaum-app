import { createClient } from "@supabase/supabase-js";

// 백오피스는 관리자 권한이 필요하므로 Service Role Key를 사용하거나, 
// 일반 Anon Key 사용 후 RLS 정책을 우회할 수 있는 슈퍼어드민 계정으로 로그인해야 합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

export const supabase = createClient(supabaseUrl, supabaseKey);
