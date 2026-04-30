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
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, family_group_id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // 프로필 생성
        await supabase.from('profiles').upsert({
          id:     userId,
          name:   data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? '사용자',
          email:  data.user.email ?? '',
          avatar: '👤',
          role:   'parent',
        });
      }

      // 가족 그룹이 없으면 자동 생성
      const profileFamilyGroupId = existingProfile?.family_group_id;
      if (!profileFamilyGroupId) {
        const userName = data.user.user_metadata?.full_name
          ?? data.user.email?.split('@')[0]
          ?? '사용자';
        const inviteCode = `GLEAUM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data: group } = await supabase
          .from('family_groups')
          .insert({
            name:        `${userName.charAt(0)}씨 가족`,
            invite_code: inviteCode,
            created_by:  userId,
          })
          .select()
          .single();

        if (group) {
          await supabase
            .from('profiles')
            .update({ family_group_id: group.id })
            .eq('id', userId);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
