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
      const userId   = data.user.id;
      const meta     = data.user.user_metadata ?? {};

      // SNS 프로필 이미지 URL — Google: avatar_url / picture, Apple: picture
      const socialAvatarUrl: string | null =
        meta.avatar_url ?? meta.picture ?? null;

      // SNS 표시 이름 — Google: full_name / name, Apple: full_name
      const socialName: string =
        meta.full_name ?? meta.name ?? data.user.email?.split('@')[0] ?? '사용자';

      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // 신규 프로필 생성 — SNS 이미지 적용
        await supabase.from('profiles').upsert({
          id:     userId,
          name:   socialName,
          email:  data.user.email ?? '',
          // SNS 이미지가 있으면 URL 저장, 없으면 기본 이모지
          avatar: socialAvatarUrl ?? '👤',
        });

        const { data: created } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        existingProfile = created;
      } else {
        // 기존 프로필 — avatar가 기본 이모지('👤')인 경우에만 SNS 이미지로 업데이트
        const currentAvatar = existingProfile.avatar ?? '👤';
        const isDefaultAvatar = currentAvatar === '👤';

        if (isDefaultAvatar && socialAvatarUrl) {
          await supabase
            .from('profiles')
            .update({ avatar: socialAvatarUrl })
            .eq('id', userId);
        }
      }

      const supportsOnboarding = existingProfile && 'onboarding_completed_at' in existingProfile;
      const needsOnboarding    = supportsOnboarding && !existingProfile.onboarding_completed_at;
      const shouldUseOnboarding = needsOnboarding && next === '/home';

      return NextResponse.redirect(`${origin}${shouldUseOnboarding ? '/onboarding' : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
