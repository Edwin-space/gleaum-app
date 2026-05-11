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

      // 프로필이 없으면 생성 (DB 트리거가 이미 처리하지만 안전망으로)
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // 프로필 생성 (DB 트리거가 이미 처리하지만 안전망으로)
        await supabase.from('profiles').upsert({
          id:     userId,
          name:   data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? '사용자',
          email:  data.user.email ?? '',
          avatar: '👤',
        });

        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        existingProfile = createdProfile;
      }

      // 공간 자동 생성 제거 — 온보딩에서 사용자가 직접 선택

      const supportsOnboarding = existingProfile && 'onboarding_completed_at' in existingProfile;
      const needsOnboarding = supportsOnboarding && !existingProfile.onboarding_completed_at;
      const shouldUseOnboarding = needsOnboarding && next === '/home';

      return NextResponse.redirect(`${origin}${shouldUseOnboarding ? '/onboarding' : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
