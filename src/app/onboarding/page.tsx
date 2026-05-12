'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GleaumLogo, GleaumAppIcon } from '@/components/ui/GleaumLogo';
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

const goals: Array<{ key: OnboardingPrimaryGoal; title: string; desc: string; accent: string; icon: string }> = [
  { key: 'personal_schedule', title: '개인 일정', desc: '나의 하루를 완벽하게', accent: '#0084CC', icon: '📅' },
  { key: 'routine', title: '루틴 관리', desc: '어제보다 나은 습관', accent: '#0CC9B5', icon: '🔋' },
  { key: 'expense', title: '자금 관리', desc: '현명한 지출의 시작', accent: '#F59E0B', icon: '💰' },
  { key: 'couple', title: '연인과 함께', desc: '우리만의 소중한 기록', accent: '#FF6B6B', icon: '❤️' },
  { key: 'friends', title: '친구/모임', desc: '함께 즐거운 약속', accent: '#8B5CF6', icon: '🙌' },
  { key: 'group', title: '공간 케어', desc: '우리만의 공간을 함께', accent: '#0CC9B5', icon: '🏠' },
];

const layouts: Array<{ key: HomeLayoutPreference; title: string; desc: string; preview: string }> = [
  { key: 'balanced', title: '밸런스 대시보드', desc: '모든 기능을 균형 있게 배치합니다.', preview: '🎨' },
  { key: 'calendar_first', title: '캘린더 포커스', desc: '일정 확인이 가장 중요한 분들을 위해.', preview: '🗓️' },
  { key: 'routine_first', title: '루틴 마스터', desc: '습관 형성에 최적화된 구성입니다.', preview: '⚡' },
  { key: 'expense_first', title: '머니 트래커', desc: '자금 흐름을 한눈에 파악합니다.', preview: '💎' },
  { key: 'space_first', title: '소셜 커넥트', desc: '가족/연인의 소식을 우선합니다.', preview: '👥' },
];

const spaceOptions: Array<{ key: SpaceIntent; label: string; desc: string; icon: string }> = [
  { key: 'solo', label: '개인 공간', desc: '나만의 기록으로 시작할게요', icon: '👤' },
  { key: 'group', label: '그룹 공간', desc: '소중한 사람들과 함께해요', icon: '🏠' },
  { key: 'couple', label: '연인 공간', desc: '우리 둘만의 특별한 기록', icon: '✨' },
  { key: 'friends', label: '모임 공간', desc: '친구들과 함께 계획해요', icon: '🤝' },
];

const steps = [
  { title: '당신을 어떻게 부를까요?', eyebrow: 'IDENTIFICATION', desc: '글리움에서 당신을 부르는 소중한 이름입니다.' },
  { title: '어떤 가치에 집중할까요?', eyebrow: 'PRIORITY', desc: '가장 중요하게 관리하고 싶은 목표를 선택하세요.' },
  { title: '최적의 화면 구성', eyebrow: 'INTERFACE', desc: '선택하신 목표에 딱 맞는 화면 구성을 제안해 드려요.' },
  { title: '공간의 성격 선택', eyebrow: 'ENVIRONMENT', desc: '혼자 시작하거나 소중한 사람들과 함께 할 수 있습니다.' },
  { title: '공간 설정', eyebrow: 'SPACE SETUP', desc: '새 공간을 만들거나, 초대 코드로 참여하거나, 혼자 시작할 수 있습니다.' },
  { title: '중요한 순간의 리마인더', eyebrow: 'ASSISTANCE', desc: '글리움이 당신의 소중한 일정을 꼼꼼히 챙겨드릴게요.' },
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
  const [spaceIntent, setSpaceIntent] = useState<SpaceIntent[]>(['solo']);

  // Step 4: 공간 설정
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
    }
    
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [profile, router]);

  const selectedGoal = useMemo(() => goals.find((item) => item.key === goal) ?? goals[0], [goal]);
  const suggestedDisplayName = user?.displayName ?? user?.name ?? user?.email.split('@')[0] ?? '사용자';
  const effectiveDisplayName = hasEditedName ? displayName : suggestedDisplayName;
  const progressPct = Math.round(((step + 1) / steps.length) * 100);
  const canContinue =
    (step !== 0 || (effectiveDisplayName && effectiveDisplayName.trim().length > 0)) &&
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

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    // 공간 설정 처리 (step 4에서 선택한 모드)
    if (spaceSetupMode === 'create' && newSpaceName.trim()) {
      await createSpace(newSpaceName.trim());
    } else if (spaceSetupMode === 'join' && spaceJoinCode.trim()) {
      const joinResult = await joinSpaceByCode(spaceJoinCode.trim().toUpperCase());
      if (!joinResult.success && !joinResult.alreadyMember) {
        setSaving(false);
        setSpaceSetupError('유효하지 않은 초대 코드입니다. 코드를 다시 확인해 주세요.');
        return;
      }
    } else if (spaceSetupMode === 'skip') {
      // 혼자 시작 → 개인 공간 자동 생성 (사용자에게는 보이지 않음)
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
      setError('저장 중 오류가 발생했습니다.');
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      void handleSubmit();
    }
  };

  if (loading) return null;

  if (showSplash) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#1A1B2E] text-white overflow-hidden p-6 text-center">
        <div className="mesh-bg opacity-40">
          <div className="mesh-blob mesh-blob-1" style={{ width: '800px', height: '800px' }} />
          <div className="mesh-blob mesh-blob-2" style={{ width: '600px', height: '600px' }} />
        </div>
        <div className="relative z-10 animate-fade-in-up flex flex-col items-center">
          <div className="w-28 h-28 rounded-[48px] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center mb-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-float">
            <GleaumAppIcon size={56} />
          </div>
          <h1 className="text-[36px] font-black mb-4 tracking-tighter leading-tight drop-shadow-lg">반가워요,<br/>여기는 글리움입니다</h1>
          <p className="text-[18px] text-white/60 font-medium max-w-[280px] leading-relaxed">나와 소중한 사람들의 일상을<br/>연결하는 여행을 시작해볼까요?</p>
          <div className="mt-16 w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-brand-teal animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative bg-[#FAFAFD] text-[#1A1B2E] pb-32 overflow-hidden flex flex-col font-sans">
      {/* 프리미엄 배경 시스템 */}
      <div className="mesh-bg opacity-40">
        <div className="mesh-blob mesh-blob-1" style={{ top: '-10%', left: '-10%', background: 'rgba(0,132,204,0.15)' }} />
        <div className="mesh-blob mesh-blob-2" style={{ bottom: '-10%', right: '-10%', background: 'rgba(12,201,181,0.1)' }} />
        <div className="mesh-blob mesh-blob-3" style={{ top: '30%', right: '-20%', background: 'rgba(139,92,246,0.1)' }} />
      </div>

      <main className="relative z-10 w-full max-w-[480px] mx-auto px-7 pt-16 flex flex-col flex-1">
        {/* 상단 진행 바 */}
        <header className="flex flex-col gap-4 mb-14 animate-fade-in">
          <div className="flex items-center justify-between">
            <GleaumLogo variant="dark" size="sm" showTagline={false} />
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-black text-brand-blue tracking-tighter">{step + 1} / {steps.length}</span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
             <div className="h-full bg-brand-gradient transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </header>

        {/* 단계 텍스트 섹션 */}
        <section key={step} className="mb-12 animate-fade-in-up">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-black tracking-widest uppercase mb-4">
            {steps[step].eyebrow}
          </div>
          <h2 className="text-[34px] font-black leading-tight mb-4 tracking-tighter text-[#1A1B2E]">
            {steps[step].title}
          </h2>
          <p className="text-[17px] text-[#8E8E93] font-bold leading-relaxed max-w-[320px]">
            {steps[step].desc}
          </p>
        </section>

        {/* 단계별 콘텐츠 영역 */}
        <div key={`content-${step}`} className="flex-1 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {step === 0 && (
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-[40px] border border-white shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
                <input
                  value={effectiveDisplayName}
                  onChange={(e) => { setHasEditedName(true); setDisplayName(e.target.value); }}
                  placeholder="닉네임을 입력하세요"
                  className="w-full h-16 bg-transparent text-[24px] font-black text-[#1A1B2E] border-b-2 outline-none transition-all placeholder:text-gray-300"
                  style={{ borderColor: effectiveDisplayName ? 'var(--brand-blue)' : '#F0F0F0' }}
                  autoFocus
                />
                <p className="mt-4 text-[13px] text-[#8E8E93] font-bold italic">실제 이름보다는 개성 있는 닉네임을 추천해요!</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setNameMode('nickname')} 
                  className={`h-16 rounded-[28px] text-[15px] font-black transition-all shadow-sm flex items-center justify-center gap-2 ${nameMode === 'nickname' ? 'bg-[#1A1B2E] text-white' : 'bg-white text-[#8E8E93] hover:bg-gray-50'}`}>
                  <span>🎨</span> 닉네임 사용
                </button>
                <button onClick={() => setNameMode('real_name')} 
                  className={`h-16 rounded-[28px] text-[15px] font-black transition-all shadow-sm flex items-center justify-center gap-2 ${nameMode === 'real_name' ? 'bg-[#1A1B2E] text-white' : 'bg-white text-[#8E8E93] hover:bg-gray-50'}`}>
                  <span>🆔</span> 실명 사용
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {goals.map((item) => (
                <button key={item.key} onClick={() => handleGoal(item.key)} 
                  className="glass-card p-6 rounded-[36px] text-left transition-all active:scale-[0.94] border-2 shadow-sm relative overflow-hidden group"
                  style={{ 
                    borderColor: goal === item.key ? item.accent : 'white', 
                    background: goal === item.key ? 'white' : 'rgba(255,255,255,0.6)' 
                  }}>
                  {goal === item.key && <div className="absolute top-0 right-0 w-12 h-12 bg-current opacity-10 rounded-bl-full" style={{ color: item.accent }} />}
                  <span className="text-[36px] mb-4 block filter drop-shadow-sm">{item.icon}</span>
                  <p className="text-[16px] font-black text-[#1A1B2E] mb-1">{item.title}</p>
                  <p className="text-[12px] text-[#8E8E93] font-bold leading-tight opacity-80">{item.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {layouts.map((item) => (
                <button key={item.key} onClick={() => setHomeLayout(item.key)} 
                  className="glass-card w-full p-6 rounded-[32px] text-left transition-all active:scale-[0.98] border-2 shadow-sm flex items-center gap-5"
                  style={{ 
                    borderColor: homeLayout === item.key ? 'var(--brand-blue)' : 'white', 
                    background: homeLayout === item.key ? 'white' : 'rgba(255,255,255,0.6)' 
                  }}>
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[28px] shadow-inner">
                    {item.preview}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[17px] font-black mb-1 ${homeLayout === item.key ? 'text-brand-blue' : 'text-[#1A1B2E]'}`}>{item.title}</p>
                    <p className="text-[13px] font-bold text-[#8E8E93]">{item.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${homeLayout === item.key ? 'bg-brand-blue border-brand-blue' : 'border-gray-200'}`}>
                    {homeLayout === item.key && <span className="text-white text-[10px] font-black">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-4">
              {spaceOptions.map((item) => {
                const active = spaceIntent.includes(item.key);
                return (
                  <button key={item.key} onClick={() => setSpaceIntent((current) => toggleSpaceIntent(current, item.key))} 
                    className="glass-card p-6 rounded-[40px] text-left transition-all active:scale-[0.97] border-2 shadow-sm flex items-center gap-5"
                    style={{ 
                      borderColor: active ? 'var(--brand-teal)' : 'white', 
                      background: active ? 'white' : 'rgba(255,255,255,0.6)' 
                    }}>
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-[32px] shadow-sm">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[18px] font-black mb-1 ${active ? 'text-brand-teal' : 'text-[#1A1B2E]'}`}>{item.label}</p>
                      <p className="text-[13px] text-[#8E8E93] font-bold leading-snug">{item.desc}</p>
                    </div>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-brand-teal border-brand-teal' : 'border-gray-200'}`}>
                      {active && <span className="text-white text-[11px] font-black">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {/* 세 가지 공간 설정 모드 */}
              {(
                [
                  { mode: 'create' as const, icon: '✨', label: '새 공간 만들기', desc: '내가 관리자로 공간을 시작합니다' },
                  { mode: 'join'   as const, icon: '🗝️', label: '초대 코드로 참여', desc: '공유받은 코드로 기존 공간에 합류합니다' },
                  { mode: 'skip'  as const, icon: '👤', label: '혼자 사용하기', desc: '지금은 개인 공간으로 시작합니다' },
                ] as const
              ).map(({ mode, icon, label, desc }) => {
                const active = spaceSetupMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { setSpaceSetupMode(mode); setSpaceSetupError(''); }}
                    className="glass-card w-full p-6 rounded-[40px] text-left transition-all active:scale-[0.97] border-2 shadow-sm flex items-center gap-5"
                    style={{
                      borderColor: active ? 'var(--brand-teal)' : 'white',
                      background: active ? 'white' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-[32px] shadow-sm">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[18px] font-black mb-1 ${active ? 'text-brand-teal' : 'text-[#1A1B2E]'}`}>{label}</p>
                      <p className="text-[13px] text-[#8E8E93] font-bold leading-snug">{desc}</p>
                    </div>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-brand-teal border-brand-teal' : 'border-gray-200'}`}>
                      {active && <span className="text-white text-[11px] font-black">✓</span>}
                    </div>
                  </button>
                );
              })}

              {/* 공간 이름 입력 (create 모드) */}
              {spaceSetupMode === 'create' && (
                <div className="glass-card p-6 rounded-[32px] border border-white shadow-sm animate-fade-in-up">
                  <p className="text-[13px] font-black text-[#8E8E93] mb-3">공간 이름</p>
                  <input
                    value={newSpaceName}
                    onChange={(e) => { setNewSpaceName(e.target.value); setSpaceSetupError(''); }}
                    placeholder="예: 우리 가족 공간, 친구들"
                    className="w-full h-14 bg-transparent text-[20px] font-black text-[#1A1B2E] border-b-2 outline-none transition-all placeholder:text-gray-300"
                    style={{ borderColor: newSpaceName ? 'var(--brand-teal)' : '#F0F0F0' }}
                    autoFocus
                  />
                </div>
              )}

              {/* 초대 코드 입력 (join 모드) */}
              {spaceSetupMode === 'join' && (
                <div className="glass-card p-6 rounded-[32px] border border-white shadow-sm animate-fade-in-up">
                  <p className="text-[13px] font-black text-[#8E8E93] mb-3">초대 코드</p>
                  <input
                    value={spaceJoinCode}
                    onChange={(e) => { setSpaceJoinCode(e.target.value.toUpperCase()); setSpaceSetupError(''); }}
                    placeholder="예: GLEAUM-ABCD"
                    className="w-full h-14 bg-transparent text-[20px] font-black text-[#1A1B2E] border-b-2 outline-none transition-all placeholder:text-gray-300 font-mono tracking-widest"
                    style={{ borderColor: spaceJoinCode ? 'var(--brand-teal)' : '#F0F0F0' }}
                    autoFocus
                  />
                </div>
              )}

              {spaceSetupError && (
                <p className="text-[13px] font-bold text-red-500 text-center">{spaceSetupError}</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-[40px] border border-white shadow-sm">
                 <p className="text-[14px] font-black text-[#1A1B2E] mb-6 flex items-center gap-2">
                    <span className="text-xl">⏰</span> 기본 리마인더 설정
                 </p>
                 <div className="grid grid-cols-3 gap-3">
                    {[10, 30, 60].map((m) => (
                      <button key={m} onClick={() => setDefaultReminder(m)} 
                        className={`h-16 rounded-[24px] text-[16px] font-black transition-all ${defaultReminder === m ? 'bg-brand-blue text-white shadow-[0_8px_24px_rgba(0,132,204,0.3)] scale-105' : 'bg-gray-100 text-[#8E8E93]'}`}>
                        {m}분 전
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="space-y-3">
                 <p className="px-2 text-[14px] font-black text-[#1A1B2E] flex items-center gap-2">
                    <span className="text-xl">🔔</span> 알림 채널 선택
                 </p>
                 <div className="glass-card rounded-[40px] overflow-hidden border border-white shadow-sm divide-y divide-gray-100">
                    {(Object.entries(notifications) as Array<[keyof NotificationSettings, boolean]>).map(([key, val]) => (
                      <div key={key} className="px-7 py-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                         <span className="text-[16px] font-bold text-[#1A1B2E]">
                            {key === 'scheduleReminders' ? '📅 일정 리마인더' : 
                             key === 'expenseReminders' ? '💰 지출/결제 알림' : 
                             key === 'routineReminders' ? '🔋 루틴 완료 체크' : '🌍 공간 소식 업데이트'}
                         </span>
                         <button onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))} 
                           className={`w-14 h-8 rounded-full relative transition-all duration-400 ${val ? 'bg-brand-teal' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-400 ${val ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-6 text-[14px] font-bold text-red-500 text-center animate-shake">{error}</p>}
      </main>

      {/* 하단 고정 액션 바 */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 z-50 pointer-events-none">
        <div className="max-w-[480px] mx-auto flex gap-4 pointer-events-auto">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} disabled={saving} 
              className="h-18 px-10 rounded-[32px] bg-white border border-gray-100 shadow-[0_16px_32px_rgba(0,0,0,0.06)] text-[16px] font-black text-[#1A1B2E] active:scale-95 transition-all">
              이전
            </button>
          )}
          <button onClick={handleNext} disabled={saving || !canContinue} 
            className="flex-1 h-18 rounded-[32px] bg-brand-gradient shadow-[0_16px_32px_rgba(0,132,204,0.25)] text-white text-[18px] font-black active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-3">
            {saving ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>꾸미는 중...</span>
              </>
            ) : (
              <>
                <span>{step === steps.length - 1 ? '글리움 시작하기' : step === 4 && spaceSetupMode === 'skip' ? '혼자 시작하기' : '다음 단계로'}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
