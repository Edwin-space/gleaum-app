'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { completeOnboarding, createSpace, createPersonalSpace, joinSpaceByCode } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { trackEvent } from '@/lib/analytics';
import type {
  HomeLayoutPreference,
  NameDisplayMode,
  NotificationSettings,
  OnboardingPreferences,
  OnboardingPrimaryGoal,
  SpaceIntent,
} from '@/types';

const goals: Array<{ key: OnboardingPrimaryGoal; title: string; desc: string; color: string; icon: string }> = [
  { key: 'personal_schedule', title: '개인 일정', desc: '나의 하루를 체계적으로', color: '#0084CC', icon: '📅' },
  { key: 'routine', title: '루틴 관리', desc: '꾸준한 습관 만들기', color: '#0CC9B5', icon: '🔋' },
  { key: 'expense', title: '자금 관리', desc: '현명한 지출 관리', color: '#F59E0B', icon: '💰' },
  { key: 'couple', title: '연인과 함께', desc: '둘만의 소중한 기록', color: '#FF6B6B', icon: '❤️' },
  { key: 'friends', title: '친구·모임', desc: '함께하는 약속 관리', color: '#8B5CF6', icon: '🙌' },
  { key: 'group', title: '그룹 공간', desc: '여럿이 함께 공유', color: '#0CC9B5', icon: '🏠' },
];

const layouts: Array<{ key: HomeLayoutPreference; title: string; desc: string; icon: string }> = [
  { key: 'balanced',      title: '밸런스',        desc: '모든 기능을 균형 있게', icon: '🎨' },
  { key: 'calendar_first', title: '캘린더 중심', desc: '일정 확인이 최우선',    icon: '🗓️' },
  { key: 'routine_first',  title: '루틴 중심',   desc: '습관 형성에 최적화',  icon: '⚡' },
  { key: 'expense_first',  title: '지출 중심',   desc: '자금 흐름 한눈에',    icon: '💎' },
  { key: 'space_first',    title: '공간 중심',   desc: '그룹 소식을 우선',    icon: '👥' },
];

const spaceOptions: Array<{ key: SpaceIntent; label: string; desc: string; icon: string }> = [
  { key: 'solo',    label: '혼자 사용',   desc: '나만의 개인 공간으로',      icon: '👤' },
  { key: 'couple',  label: '연인',        desc: '둘이서 함께 기록',          icon: '✨' },
  { key: 'friends', label: '친구·모임',   desc: '여럿이 함께 계획',          icon: '🤝' },
  { key: 'group',   label: '그룹',        desc: '팀 또는 가족과 공유',        icon: '🏠' },
];

const steps = [
  { title: '어떻게 불러드릴까요?',    eyebrow: '01  이름',    desc: '글리움에서 사용할 이름을 알려주세요.' },
  { title: '어떤 목적으로 쓰실 건가요?', eyebrow: '02  목표',  desc: '가장 중요하게 관리하고 싶은 것을 선택하세요.' },
  { title: '화면 구성 선택',          eyebrow: '03  인터페이스', desc: '목표에 맞는 홈 화면 레이아웃을 골라보세요.' },
  { title: '공간의 성격',             eyebrow: '04  공간 성격', desc: '누구와 함께 사용할지 선택하세요.' },
  { title: '공간 설정',               eyebrow: '05  공간 설정', desc: '새 공간을 만들거나 코드로 참여하세요.' },
  { title: '알림 설정',               eyebrow: '06  알림',      desc: '중요한 일정을 놓치지 않도록 도와드릴게요.' },
] as const;

function modulesForGoal(goal: OnboardingPrimaryGoal): OnboardingPreferences['enabledModules'] {
  if (goal === 'routine') return ['calendar', 'routine'];
  if (goal === 'expense') return ['calendar', 'expense'];
  if (goal === 'couple' || goal === 'friends' || goal === 'group') return ['calendar', 'spaces', 'expense'];
  return ['calendar'];
}

function layoutForGoal(goal: OnboardingPrimaryGoal): HomeLayoutPreference {
  if (goal === 'routine') return 'routine_first';
  if (goal === 'expense') return 'expense_first';
  if (goal === 'couple' || goal === 'friends' || goal === 'group') return 'space_first';
  return 'calendar_first';
}

function toggleSpaceIntent(current: SpaceIntent[], key: SpaceIntent): SpaceIntent[] {
  if (key === 'solo') return ['solo'];
  const withoutSolo = current.filter((v) => v !== 'solo');
  return withoutSolo.includes(key) ? withoutSolo.filter((v) => v !== key) : [...withoutSolo, key];
}

// ── 공통 카드 스타일 ──────────────────────────────────────────────────────────
const card = (active: boolean, activeColor = '#0084CC'): React.CSSProperties => ({
  width: '100%',
  borderRadius: '20px',
  border: `1.5px solid ${active ? activeColor : 'rgba(0,0,0,0.07)'}`,
  background: active ? 'white' : 'rgba(255,255,255,0.7)',
  boxShadow: active
    ? `0 4px 20px ${activeColor}22`
    : '0 2px 8px rgba(0,0,0,0.04)',
  padding: '18px 20px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.18s',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

// ── 레이아웃 미리보기 모의 화면 ────────────────────────────────────────────────
function LayoutPreviewMock({ layoutKey }: { layoutKey: HomeLayoutPreference }) {
  const Block = ({ h, bg, label, cols }: { h: number; bg: string; label: string; cols?: number }) => (
    <div style={{
      height: `${h}px`, borderRadius: '6px', background: bg,
      display: cols ? 'grid' : 'flex',
      alignItems: 'center', justifyContent: 'center',
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : undefined,
      gap: cols ? '4px' : undefined,
    } as React.CSSProperties}>
      {cols ? Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '4px', height: '100%' }} />
      )) : (
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.2px' }}>{label}</span>
      )}
    </div>
  );

  const sectionsByLayout: Record<HomeLayoutPreference, React.ReactNode> = {
    balanced: (
      <>
        <Block h={28} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={52} bg="#0084CC" label="캘린더" />
        <Block h={22} bg="rgba(12,201,181,0.18)" label="일정 1" />
        <Block h={22} bg="rgba(12,201,181,0.12)" label="일정 2" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <Block h={28} bg="rgba(0,0,0,0.06)" label="루틴" />
          <Block h={28} bg="rgba(0,0,0,0.06)" label="지출" />
        </div>
      </>
    ),
    calendar_first: (
      <>
        <Block h={76} bg="#0084CC" label="캘린더" />
        <Block h={22} bg="rgba(12,201,181,0.18)" label="오늘 일정 1" />
        <Block h={22} bg="rgba(12,201,181,0.14)" label="오늘 일정 2" />
        <Block h={22} bg="rgba(12,201,181,0.10)" label="오늘 일정 3" />
        <Block h={18} bg="rgba(0,0,0,0.05)" label="빠른 액션" cols={2} />
      </>
    ),
    routine_first: (
      <>
        <Block h={20} bg="rgba(12,201,181,0.20)" label="루틴 1 ✓" />
        <Block h={20} bg="rgba(12,201,181,0.15)" label="루틴 2 ✓" />
        <Block h={20} bg="rgba(12,201,181,0.10)" label="루틴 3" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={42} bg="rgba(0,132,204,0.15)" label="캘린더" />
        <Block h={18} bg="rgba(0,0,0,0.05)" label="일정" />
      </>
    ),
    expense_first: (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <Block h={52} bg="rgba(245,158,11,0.25)" label="이번 달 지출" />
          <Block h={52} bg="rgba(245,158,11,0.15)" label="예산 잔액" />
        </div>
        <Block h={20} bg="rgba(245,158,11,0.12)" label="지출 내역 1" />
        <Block h={20} bg="rgba(245,158,11,0.08)" label="지출 내역 2" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={32} bg="rgba(0,132,204,0.12)" label="캘린더" />
      </>
    ),
    space_first: (
      <>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: `rgba(0,132,204,${0.4 - i*0.08})`, flexShrink: 0 }} />
          ))}
          <div style={{ flex: 1, background: 'rgba(0,132,204,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#0084CC' }}>공간 멤버</span>
          </div>
        </div>
        <Block h={38} bg="rgba(0,132,204,0.14)" label="공간 최신 소식" />
        <Block h={22} bg="rgba(0,132,204,0.10)" label="공간 일정" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={32} bg="rgba(0,132,204,0.10)" label="캘린더" />
      </>
    ),
  };

  return (
    <div style={{
      padding: '10px', background: '#F5F5F7', borderRadius: '14px 14px 0 0',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      {/* 앱 상단 바 */}
      <div style={{
        height: '28px', borderRadius: '8px', background: '#1A1B2E',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px', marginBottom: '2px',
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(0,132,204,0.4)' }} />
      </div>
      {sectionsByLayout[layoutKey]}
    </div>
  );
}

// ── 체크 뱃지 ─────────────────────────────────────────────────────────────────
function Check({ active, color = '#0084CC' }: { active: boolean; color?: string }) {
  return (
    <div style={{
      width: '24px', height: '24px', flexShrink: 0,
      borderRadius: '50%',
      border: `2px solid ${active ? color : 'rgba(0,0,0,0.15)'}`,
      background: active ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.18s',
    }}>
      {active && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refresh } = useCurrentUser();

  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [hasEditedName, setHasEditedName] = useState(false);
  const [realName, setRealName] = useState('');
  const [nameMode, setNameMode] = useState<NameDisplayMode>('nickname');
  const [goal, setGoal] = useState<OnboardingPrimaryGoal>('personal_schedule');
  const [homeLayout, setHomeLayout] = useState<HomeLayoutPreference>('calendar_first');
  const layoutCarouselRef = useRef<HTMLDivElement>(null);
  const [spaceIntent, setSpaceIntent] = useState<SpaceIntent[]>(['solo']);

  type SpaceSetupMode = 'create' | 'join' | 'skip';
  const [spaceSetupMode, setSpaceSetupMode] = useState<SpaceSetupMode>('skip');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [spaceJoinCode, setSpaceJoinCode] = useState('');
  const [spaceSetupError, setSpaceSetupError] = useState('');

  const [defaultReminder, setDefaultReminder] = useState(30);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    scheduleReminders: true,
    routineReminders: true,
    expenseReminders: true,
    spaceUpdates: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if ('onboarding_completed_at' in profile && profile.onboarding_completed_at) {
      router.replace('/home');
      return;
    }
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, [profile, router]);

  const suggestedDisplayName = user?.displayName ?? user?.name ?? user?.email.split('@')[0] ?? '사용자';
  const effectiveDisplayName = hasEditedName ? displayName : suggestedDisplayName;
  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  const canContinue =
    (step !== 0 || effectiveDisplayName.trim().length > 0) &&
    (step !== 4 ||
      spaceSetupMode === 'skip' ||
      (spaceSetupMode === 'create' && newSpaceName.trim().length > 0) ||
      (spaceSetupMode === 'join' && spaceJoinCode.trim().length > 0));

  const handleGoal = (nextGoal: OnboardingPrimaryGoal) => {
    setGoal(nextGoal);
    setHomeLayout(layoutForGoal(nextGoal));
    if (nextGoal === 'couple') setSpaceIntent(['couple']);
    else if (nextGoal === 'friends') setSpaceIntent(['friends']);
    else if (nextGoal === 'group') setSpaceIntent(['group']);
    else setSpaceIntent(['solo']);
  };

  // 레이아웃 캐러셀 스크롤 → 중앙 카드 자동 선택
  const handleCarouselScroll = useCallback(() => {
    const el = layoutCarouselRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    if (layouts[closest]) setHomeLayout(layouts[closest].key);
  }, []);

  const scrollToLayout = useCallback((key: HomeLayoutPreference) => {
    const el = layoutCarouselRef.current;
    if (!el) return;
    const idx = layouts.findIndex(l => l.key === key);
    if (idx === -1) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const offset = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
    el.scrollTo({ left: offset, behavior: 'smooth' });
    setHomeLayout(key);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    if (spaceSetupMode === 'create' && newSpaceName.trim()) {
      const _r = await createSpace(newSpaceName.trim());
      if (!_r.id) {
        console.error('[onboarding] createSpace 실패:', _r.error);
      } else {
        await refresh().catch(() => {});
      }
    } else if (spaceSetupMode === 'join' && spaceJoinCode.trim()) {
      const joinResult = await joinSpaceByCode(spaceJoinCode.trim().toUpperCase());
      if (!joinResult.success && !joinResult.alreadyMember) {
        setSaving(false);
        setSpaceSetupError('유효하지 않은 초대 코드입니다. 다시 확인해 주세요.');
        return;
      }
    } else if (spaceSetupMode === 'skip') {
      await createPersonalSpace(effectiveDisplayName);
    }

    const ok = await completeOnboarding({
      displayName: effectiveDisplayName,
      realName,
      nameDisplayMode: nameMode,
      primaryGoal: goal,
      homeLayout,
      enabledModules: modulesForGoal(goal),
      defaultReminderMinutes: defaultReminder,
      spaceIntent: spaceIntent.length > 0 ? spaceIntent : ['solo'],
      notificationSettings: notifications,
    });
    setSaving(false);

    if (ok) {
      trackEvent('onboarding_complete', {
        goal: goal ?? 'personal_schedule',
        space_intent: (spaceIntent.length > 0 ? spaceIntent[0] : 'solo') as string,
        space_setup: spaceSetupMode,
      });
      await refresh();
      router.replace('/home');
    } else {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else void handleSubmit();
  };

  if (loading) return null;

  // ── 스플래시 ──────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #0F1A2E 0%, #1A1B2E 50%, #0D1F35 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 글로우 */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,132,204,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* 앱 아이콘 */}
          <div style={{
            width: '100px', height: '100px',
            borderRadius: '36px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}>
            <GleaumAppIcon size={48} />
          </div>

          <h1 style={{
            fontSize: '32px', fontWeight: 800, color: 'white',
            letterSpacing: '-0.8px', lineHeight: 1.25,
            margin: '0 0 14px',
          }}>
            반가워요!<br />글리움에 오신 것을<br />환영합니다
          </h1>
          <p style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.55)',
            fontWeight: 500, lineHeight: 1.6,
            margin: '0 0 48px',
          }}>
            몇 가지 질문으로<br />딱 맞는 환경을 만들어드릴게요.
          </p>

          {/* 로딩 바 */}
          <div style={{
            width: '48px', height: '4px',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
            margin: '0 auto',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0084CC, #0CC9B5)',
              borderRadius: '2px',
              animation: 'loadingBar 2.4s ease-in-out infinite',
            }} />
          </div>
        </div>

        <style>{`
          @keyframes loadingBar {
            0%   { width: 0%; margin-left: 0; }
            50%  { width: 100%; margin-left: 0; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ── 메인 온보딩 ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAFAFD',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: 'calc(env(safe-area-inset-top) + 12px) 24px 12px',
        background: 'rgba(250,250,253,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0084CC', letterSpacing: '0.5px' }}>
            {steps[step].eyebrow}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,0,0.35)' }}>
            {step + 1} / {steps.length}
          </span>
        </div>
        <div style={{
          width: '100%', height: '3px',
          borderRadius: '2px', background: 'rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #0084CC, #0CC9B5)',
            borderRadius: '2px',
            width: `${progressPct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </header>

      {/* 컨텐츠 */}
      <main style={{
        flex: 1, overflowY: 'auto',
        padding: '28px 24px',
        paddingBottom: '120px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
      }}>
        {/* 단계 제목 */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontSize: '28px', fontWeight: 800, color: '#1A1B2E',
            letterSpacing: '-0.6px', lineHeight: 1.3,
            margin: '0 0 8px',
          }}>
            {steps[step].title}
          </h2>
          <p style={{
            fontSize: '15px', color: 'rgba(0,0,0,0.45)',
            fontWeight: 500, lineHeight: 1.55,
            margin: 0,
          }}>
            {steps[step].desc}
          </p>
        </div>

        {/* ── Step 0: 이름 ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 이름 입력 */}
            <div style={{
              background: 'white', borderRadius: '20px',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '20px 20px 16px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '0 0 10px', letterSpacing: '0.3px' }}>
                닉네임
              </p>
              <input
                value={effectiveDisplayName}
                onChange={(e) => { setHasEditedName(true); setDisplayName(e.target.value); }}
                placeholder="닉네임을 입력하세요"
                autoFocus
                style={{
                  width: '100%', height: '52px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${effectiveDisplayName ? '#0084CC' : 'rgba(0,0,0,0.1)'}`,
                  outline: 'none',
                  fontSize: '22px', fontWeight: 800, color: '#1A1B2E',
                  padding: '0 0 8px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)', margin: '10px 0 0', fontWeight: 500 }}>
                실제 이름보다 개성 있는 닉네임을 추천해요!
              </p>
            </div>

            {/* 이름 표시 방식 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {([
                { key: 'nickname' as const, label: '닉네임 사용', icon: '🎨' },
                { key: 'real_name' as const, label: '실명 사용', icon: '🆔' },
              ]).map(({ key, label, icon }) => {
                const active = nameMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setNameMode(key)}
                    style={{
                      height: '56px', borderRadius: '16px',
                      border: `1.5px solid ${active ? '#1A1B2E' : 'rgba(0,0,0,0.07)'}`,
                      background: active ? '#1A1B2E' : 'white',
                      color: active ? 'white' : 'rgba(0,0,0,0.45)',
                      fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <span>{icon}</span> {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: 목표 ── */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {goals.map((item) => {
              const active = goal === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleGoal(item.key)}
                  style={{
                    borderRadius: '20px',
                    border: `1.5px solid ${active ? item.color : 'rgba(0,0,0,0.07)'}`,
                    background: active ? 'white' : 'rgba(255,255,255,0.7)',
                    boxShadow: active ? `0 4px 20px ${item.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
                    padding: '20px 16px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.18s',
                  }}
                >
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>{item.icon}</span>
                  <p style={{
                    fontSize: '15px', fontWeight: 800, color: active ? '#1A1B2E' : '#1A1B2E',
                    margin: '0 0 4px',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontSize: '12px', fontWeight: 500,
                    color: active ? item.color : 'rgba(0,0,0,0.4)',
                    margin: 0, lineHeight: 1.4,
                  }}>
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 2: 레이아웃 (스와이프 캐러셀) ── */}
        {step === 2 && (
          <div>
            {/* 캐러셀 */}
            <div
              ref={layoutCarouselRef}
              onScroll={handleCarouselScroll}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                gap: '12px',
                padding: '4px 32px 4px',
                margin: '0 -24px',
              } as React.CSSProperties}
            >
              <style>{`.layout-carousel::-webkit-scrollbar{display:none}`}</style>
              {layouts.map((item) => {
                const active = homeLayout === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => scrollToLayout(item.key)}
                    style={{
                      scrollSnapAlign: 'center',
                      flexShrink: 0,
                      width: 'calc(100% - 64px)',
                      borderRadius: '24px',
                      border: `2px solid ${active ? '#0084CC' : 'rgba(0,0,0,0.07)'}`,
                      background: 'white',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: active ? '0 6px 24px rgba(0,132,204,0.18)' : '0 2px 12px rgba(0,0,0,0.06)',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                    }}
                  >
                    {/* 레이아웃 미리보기 */}
                    <LayoutPreviewMock layoutKey={item.key} />
                    {/* 레이블 */}
                    <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 2px' }}>{item.title}</p>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(0,0,0,0.45)', margin: 0 }}>{item.desc}</p>
                      </div>
                      <Check active={active} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 닷 인디케이터 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
              {layouts.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollToLayout(item.key)}
                  style={{
                    width: homeLayout === item.key ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    background: homeLayout === item.key ? '#0084CC' : '#E5E5EA',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            {/* 선택 항목 확인 텍스트 */}
            <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#0084CC', margin: '12px 0 0' }}>
              {layouts.find(l => l.key === homeLayout)?.icon} {layouts.find(l => l.key === homeLayout)?.title} 선택됨
            </p>
          </div>
        )}

        {/* ── Step 3: 공간 성격 ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {spaceOptions.map((item) => {
              const active = spaceIntent.includes(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => setSpaceIntent(toggleSpaceIntent(spaceIntent, item.key))}
                  style={card(active, '#0CC9B5')}
                >
                  <div style={{
                    width: '52px', height: '52px', flexShrink: 0,
                    borderRadius: '16px',
                    background: active ? 'rgba(12,201,181,0.1)' : 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 3px' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                  <Check active={active} color="#0CC9B5" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 4: 공간 설정 ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([
              { mode: 'create' as const, icon: '✨', label: '새 공간 만들기', desc: '내가 관리자로 공간을 시작합니다' },
              { mode: 'join'   as const, icon: '🗝️', label: '초대 코드로 참여', desc: '공유받은 코드로 기존 공간에 합류합니다' },
              { mode: 'skip'  as const, icon: '👤', label: '혼자 시작하기', desc: '지금은 개인 공간으로 시작합니다' },
            ]).map(({ mode, icon, label, desc }) => {
              const active = spaceSetupMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { setSpaceSetupMode(mode); setSpaceSetupError(''); }}
                  style={card(active, '#0CC9B5')}
                >
                  <div style={{
                    width: '52px', height: '52px', flexShrink: 0,
                    borderRadius: '16px',
                    background: active ? 'rgba(12,201,181,0.1)' : 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 3px' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                      {desc}
                    </p>
                  </div>
                  <Check active={active} color="#0CC9B5" />
                </button>
              );
            })}

            {/* 공간 이름 입력 */}
            {spaceSetupMode === 'create' && (
              <div style={{
                background: 'white', borderRadius: '20px',
                border: '1.5px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '20px',
                marginTop: '4px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '0 0 10px', letterSpacing: '0.3px' }}>공간 이름</p>
                <input
                  value={newSpaceName}
                  onChange={(e) => { setNewSpaceName(e.target.value); setSpaceSetupError(''); }}
                  placeholder="예: 우리 가족, 친구들"
                  autoFocus
                  style={{
                    width: '100%', height: '48px', background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${newSpaceName ? '#0CC9B5' : 'rgba(0,0,0,0.1)'}`,
                    outline: 'none',
                    fontSize: '20px', fontWeight: 800, color: '#1A1B2E',
                    padding: '0 0 8px', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            )}

            {/* 초대 코드 입력 */}
            {spaceSetupMode === 'join' && (
              <div style={{
                background: 'white', borderRadius: '20px',
                border: '1.5px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '20px',
                marginTop: '4px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '0 0 10px', letterSpacing: '0.3px' }}>초대 코드</p>
                <input
                  value={spaceJoinCode}
                  onChange={(e) => { setSpaceJoinCode(e.target.value.toUpperCase()); setSpaceSetupError(''); }}
                  placeholder="GLEAUM-ABCD"
                  autoFocus
                  style={{
                    width: '100%', height: '48px', background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${spaceJoinCode ? '#0CC9B5' : 'rgba(0,0,0,0.1)'}`,
                    outline: 'none',
                    fontSize: '20px', fontWeight: 800, color: '#1A1B2E',
                    padding: '0 0 8px', boxSizing: 'border-box',
                    letterSpacing: '3px',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            )}

            {spaceSetupError && (
              <p style={{
                fontSize: '13px', fontWeight: 600, color: '#EF4444',
                textAlign: 'center', margin: '4px 0 0',
              }}>
                {spaceSetupError}
              </p>
            )}
          </div>
        )}

        {/* ── Step 5: 알림 ── */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 리마인더 */}
            <div style={{
              background: 'white', borderRadius: '20px',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '20px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⏰</span> 기본 리마인더
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[10, 30, 60].map((m) => {
                  const active = defaultReminder === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setDefaultReminder(m)}
                      style={{
                        height: '52px', borderRadius: '14px',
                        border: `1.5px solid ${active ? '#0084CC' : 'rgba(0,0,0,0.07)'}`,
                        background: active ? '#0084CC' : 'rgba(0,0,0,0.03)',
                        color: active ? 'white' : 'rgba(0,0,0,0.5)',
                        fontSize: '15px', fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.18s',
                        boxShadow: active ? '0 4px 14px rgba(0,132,204,0.3)' : 'none',
                      }}
                    >
                      {m}분 전
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 알림 채널 */}
            <div style={{
              background: 'white', borderRadius: '20px',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔔</span> 알림 채널
                </p>
              </div>
              {(Object.entries(notifications) as Array<[keyof NotificationSettings, boolean]>).map(([key, val], idx, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1B2E' }}>
                    {key === 'scheduleReminders' ? '📅 일정 리마인더'
                      : key === 'expenseReminders' ? '💰 지출 알림'
                      : key === 'routineReminders' ? '🔋 루틴 체크'
                      : '🌍 공간 업데이트'}
                  </span>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                    style={{
                      width: '50px', height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      background: val ? '#0CC9B5' : 'rgba(0,0,0,0.12)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: val ? '24px' : '3px',
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#EF4444', textAlign: 'center', margin: '16px 0 0' }}>
            {error}
          </p>
        )}
      </main>

      {/* 하단 버튼 */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 24px calc(env(safe-area-inset-bottom) + 16px)',
        background: 'rgba(250,250,253,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={saving}
              style={{
                height: '56px', paddingInline: '24px',
                borderRadius: '16px',
                border: '1.5px solid rgba(0,0,0,0.1)',
                background: 'white',
                color: '#1A1B2E',
                fontSize: '15px', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving || !canContinue}
            style={{
              flex: 1, height: '56px',
              borderRadius: '16px',
              border: 'none',
              background: canContinue && !saving
                ? 'linear-gradient(135deg, #0084CC, #0CC9B5)'
                : 'rgba(0,0,0,0.1)',
              color: canContinue && !saving ? 'white' : 'rgba(0,0,0,0.3)',
              fontSize: '16px', fontWeight: 800,
              cursor: saving || !canContinue ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: canContinue && !saving ? '0 8px 24px rgba(0,132,204,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  animation: 'spin 0.7s linear infinite',
                }} />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <span>
                  {step === steps.length - 1
                    ? '글리움 시작하기'
                    : step === 4 && spaceSetupMode === 'skip'
                    ? '혼자 시작하기'
                    : '다음'}
                </span>
                {step < steps.length - 1 && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </>
            )}
          </button>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
