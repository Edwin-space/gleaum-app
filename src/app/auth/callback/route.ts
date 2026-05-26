/**
 * OAuth 콜백 처리
 *
 * 프로필 생성은 SQL 트리거(handle_new_user)가 담당 — 단일 책임 원칙.
 * 이 라우트는 트리거가 SNS 이미지를 못 가져온 예외 상황만 보완.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const userId = data.user.id;
      const meta   = data.user.user_metadata ?? {};

      // SNS 프로필 이미지 — 트리거가 이미 저장했지만,
      // 간헐적 타이밍 이슈(트리거 실행 전 OAuth metadata 미첨부)를 보완
      const socialAvatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null;

      // 프로필 조회 (트리거가 이미 생성했어야 함)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, avatar, onboarding_completed_at')
        .eq('id', userId)
        .single();

      // avatar가 기본 이모지인 경우에만 SNS 이미지로 보완
      if (existingProfile?.avatar === '👤' && socialAvatarUrl) {
        await supabase
          .from('profiles')
          .update({ avatar: socialAvatarUrl })
          .eq('id', userId);
      }

      const needsOnboarding = existingProfile && !existingProfile.onboarding_completed_at;
      const shouldUseOnboarding = needsOnboarding && next === '/home';

      return NextResponse.redirect(`${origin}${shouldUseOnboarding ? '/onboarding' : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
