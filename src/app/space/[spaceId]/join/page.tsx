'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { joinSpaceByCode, getSpaceByCode } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface SpaceInfo {
  id: string;
  name: string;
  invite_code: string | null;
  created_by: string;
  memberCount?: number;
}

export default function SpaceJoinPage() {
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const { user, loading: userLoading, refresh } = useCurrentUser();

  const [space, setSpace] = useState<SpaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  // 공간 정보 로드
  useEffect(() => {
    const spaceId = params?.spaceId;
    if (!spaceId) { setLoading(false); setError('잘못된 초대 링크입니다'); return; }

    const supabase = createClient();
    supabase
      .from('family_groups')
      .select('id, name, invite_code, created_by')
      .eq('id', spaceId)
      .single()
      .then(async ({ data, error: err }) => {
        if (err || !data) { setError('존재하지 않는 공간입니다'); setLoading(false); return; }

        // 멤버 수 조회
        const { count } = await supabase
          .from('space_members')
          .select('id', { count: 'exact', head: true })
          .eq('space_id', spaceId);

        setSpace({ ...data, memberCount: count ?? 0 });
        setLoading(false);
      });
  }, [params?.spaceId]);

  // ★ 자동 참여 제거: 사용자가 명시적으로 버튼을 눌러야 참여됨
  // (자동 참여는 사용자 동의 없이 공간에 추가되는 보안 문제 있음)

  const handleJoin = async () => {
    if (!space) return;
    if (!space.invite_code) {
      // invite_code 없이 space_id로 직접 참여
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setJoining(true);
      const { error: insertErr } = await supabase
        .from('space_members')
        .insert({ space_id: space.id, user_id: authUser.id, role: 'editor' });
      if (!insertErr) {
        await supabase.from('profiles').update({ family_group_id: space.id }).eq('id', authUser.id);
        await refresh();
        try { localStorage.setItem('gleaum_lastSpaceId', space.id); } catch {}
        setJoined(true);
        setTimeout(() => router.replace(`/space?sid=${space.id}`), 1500);
      }
      setJoining(false);
      return;
    }

    setJoining(true);
    const result = await joinSpaceByCode(space.invite_code);
    if (result.success || result.alreadyMember) {
      await refresh();
      try { localStorage.setItem('gleaum_lastSpaceId', space.id); } catch {}
      setJoined(true);
      setTimeout(() => router.replace(`/space?sid=${space.id}`), 1500);
    } else {
      setError('공간 참여에 실패했습니다. 다시 시도해주세요.');
    }
    setJoining(false);
  };

  const goToLogin = () => {
    // ★ ?next= 파라미터 사용 (invite/[code]와 동일하게 통일, auth/callback/route.ts가 읽음)
    const returnUrl = encodeURIComponent(`/space/${params?.spaceId}/join`);
    router.push(`/login?next=${returnUrl}`);
  };

  // ── 로딩 ──
  if (loading || userLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0B1E' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── 에러 ──
  if (error && !space) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0B1E', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 8px' }}>초대 링크를 찾을 수 없어요</h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: '0 0 24px' }}>{error}</p>
        <button onClick={() => router.push('/')}
          style={{ padding: '12px 28px', borderRadius: '14px', background: '#0084CC', border: 'none', color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0A0B1E 0%, #1A1B2E 60%, #0D2040 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'calc(env(safe-area-inset-top) + 40px) 24px calc(env(safe-area-inset-bottom) + 40px)',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.5s ease' }}>

        {/* 브랜드 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 20px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0CC9B5, #0084CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✨</div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', letterSpacing: '-0.4px' }}>gleaum</span>
          </div>
        </div>

        {/* 초대 카드 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '28px', padding: '32px 28px',
          textAlign: 'center', marginBottom: '24px',
        }}>
          {/* 공간 아이콘 */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, rgba(0,132,204,0.30), rgba(12,201,181,0.30))',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
          }}>🏠</div>

          <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            공간 초대
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {space?.name}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.50)', margin: '0 0 20px', lineHeight: 1.6 }}>
            이 공간에 초대되었어요.<br />함께 일정을 공유하고 소통해요 🎉
          </p>

          {/* 멤버 수 */}
          {(space?.memberCount ?? 0) > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(12,201,181,0.12)', border: '1px solid rgba(12,201,181,0.20)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0CC9B5' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0CC9B5' }}>
                {space?.memberCount}명 참여 중
              </span>
            </div>
          )}
        </div>

        {/* 글리움 서비스 소개 */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', padding: '20px 24px',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', margin: '0 0 14px', textTransform: 'uppercase' }}>
            글리움이란?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '📅', text: '가족·친구·팀과 일정을 함께 관리' },
              { icon: '🔔', text: '중요한 약속 알림으로 놓치지 않게' },
              { icon: '💬', text: '공간 멤버들과 실시간 소통' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA 버튼 */}
        {joined ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#0CC9B5', margin: 0 }}>공간에 참여했어요!</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>잠시 후 공간으로 이동합니다</p>
          </div>
        ) : user ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              width: '100%', height: '58px', borderRadius: '18px',
              background: joining ? 'rgba(0,132,204,0.5)' : 'linear-gradient(135deg, #0CC9B5, #0084CC)',
              border: 'none', cursor: joining ? 'not-allowed' : 'pointer',
              fontSize: '17px', fontWeight: 900, color: 'white',
              boxShadow: joining ? 'none' : '0 8px 24px rgba(0,132,204,0.35)',
              letterSpacing: '-0.3px',
            }}
          >
            {joining ? '참여 중...' : `${space?.name} 공간 참여하기`}
          </button>
        ) : (
          <>
            <button
              onClick={goToLogin}
              style={{
                width: '100%', height: '58px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                border: 'none', cursor: 'pointer',
                fontSize: '17px', fontWeight: 900, color: 'white',
                boxShadow: '0 8px 24px rgba(0,132,204,0.35)',
                letterSpacing: '-0.3px', marginBottom: '12px',
              }}
            >
              로그인하고 공간 참여하기
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              계정이 없으신가요? 로그인 후 회원가입으로 시작하세요
            </p>
          </>
        )}

        {error && (
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#EF4444', marginTop: '12px' }}>{error}</p>
        )}
      </div>
    </div>
  );
}
