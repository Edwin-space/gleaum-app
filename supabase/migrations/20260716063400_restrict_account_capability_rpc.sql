-- Supabase의 함수 생성 훅이 anon 실행 권한을 다시 부여할 수 있으므로
-- FAM-001 capability helper의 공개 RPC 표면을 명시적으로 닫는다.
REVOKE EXECUTE ON FUNCTION public.has_account_capability(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_account_capability(text) TO authenticated, service_role;
