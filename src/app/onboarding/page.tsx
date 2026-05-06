'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GleaumLogo, GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { completeOnboarding } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type {
  HomeLayoutPreference,
  NameDisplayMode,
  NotificationSettings,
  OnboardingPreferences,
  OnboardingPrimaryGoal,
  SpaceIntent,
} from '@/types';

const goals: Array<{ key: OnboardingPrimaryGoal; title: string; desc: string; accent: string; icon: string }> = [
  { key: 'personal_schedule', title: '개인 일정', desc: '오늘 할 일과 약속을 먼저 보고 싶어요', accent: '#0084CC', icon: '📅' },
  { key: 'routine', title: '루틴 관리', desc: '운동, 공부, 반복 습관을 놓치고 싶지 않아요', accent: '#0CC9B5', icon: '🔋' },
  { key: 'expense', title: '자금 관리', desc: '정기결제와 지출 흐름을 챙기고 싶어요', accent: '#F59E0B', icon: '💰' },
  { key: 'couple', title: '연인과 함께', desc: '데이트, 기념일, 공동 일정을 관리해요', accent: '#FF6B6B', icon: '❤️' },
  { key: 'friends', title: '친구/모임', desc: '약속, 여행 준비, 모임비를 함께 관리해요', accent: '#8B5CF6', icon: '🍻' },
  { key: 'family', title: '가족 케어', desc: '가족 일정, 자녀 일정, 생활비를 함께 챙겨요', accent: '#0CC9B5', icon: '🏠' },
];

const layouts: Array<{ key: HomeLayoutPreference; title: string; desc: string }> = [
  { key: 'balanced', title: '균형형', desc: '모든 기능을 골고루' },
  { key: 'calendar_first', title: '일정 우선', desc: '캘린더가 주인공' },
  { key: 'routine_first', title: '루틴 우선', desc: '습관 형성이 우선' },
  { key: 'expense_first', title: '자금 우선', desc: '돈 흐름이 최우선' },
  { key: 'space_first', title: '공간 우선', desc: '연결된 소식이 먼저' },
];

const spaceOptions: Array<{ key: SpaceIntent; label: string; desc: string; icon: string }> = [
  { key: 'solo', label: '혼자 시작하기', desc: '나만의 공간에서 정리할게요', icon: '🙋‍♂️' },
  { key: 'family', label: '가족과 함께', desc: '가족 모두의 일상을 연결해요', icon: '👨‍👩‍👧‍👦' },
  { key: 'couple', label: '연인과 단둘이', desc: '우리만의 소중한 기록을 담아요', icon: '👩‍❤️‍👨' },
  { key: 'friends', label: '친구들과 모임', desc: '즐거운 약속과 여행을 준비해요', icon: '🙌' },
];

const steps = [
  { title: '어떻게 부를까요?', eyebrow: 'NAME', desc: '글리움에서 당신을 부를 소중한 이름입니다.' },
  { title: '어디에 집중할까요?', eyebrow: 'FOCUS', desc: '가장 중요하게 관리하고 싶은 가치를 선택하세요.' },
  { title: '홈 화면 스타일', eyebrow: 'LAYOUT', desc: '선택하신 목적에 딱 맞는 구성을 추천해 드려요.' },
  { title: '누구와 함께할까요?', eyebrow: 'SPACE', desc: '혼자 시작하거나 소중한 사람들을 초대해 보세요.' },
  { title: '잊지 않게 챙겨줄게요', eyebrow: 'REMIND', desc: '중요한 순간을 놓치지 않도록 알림을 설정합니다.' },
] as const;

function modulesForGoal(goal: OnboardingPrimaryGoal): OnboardingPreferences['enabledModules'] {
  if (goal === 'routine') return ['calendar', 'routine'];
  if (goal === 'expense') return ['calendar', 'expense'];
  if (goal === 'couple' || goal === 'friends' || goal === 'family') return ['calendar', 'spaces', 'expense'];
  return ['calendar'];
}

function layoutForGoal(goal: OnboardingPrimaryGoal): HomeLayoutPreference {
  if (goal === 'routine') return 'routine_first';
  if (goal === 'expense') return 'expense_first';
  if (goal === 'couple' || goal === 'friends' || goal === 'family') return 'space_first';
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
    
    // 2.5초 후 스플래시 종료
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, [profile, router]);

  const selectedGoal = useMemo(() => goals.find((item) => item.key === goal) ?? goals[0], [goal]);
  const suggestedDisplayName = user?.displayName ?? user?.name ?? user?.email.split('@')[0] ?? '사용자';
  const effectiveDisplayName = hasEditedName ? displayName : suggestedDisplayName;
  const currentStep = steps[step];
  const progressPct = Math.round(((step + 1) / steps.length) * 100);
  const canContinue = step !== 0 || effectiveDisplayName.trim().length > 0;

  const handleGoal = (nextGoal: OnboardingPrimaryGoal) => {
    setGoal(nextGoal);
    setHomeLayout(layoutForGoal(nextGoal));
    if (nextGoal === 'couple') setSpaceIntent(['couple']);
    else if (nextGoal === 'friends') setSpaceIntent(['friends']);
    else if (nextGoal === 'family') setSpaceIntent(['family']);
    else setSpaceIntent(['solo']);
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
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
        <div className="mesh-bg opacity-30">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
        </div>
        <div className="animate-fade-in-up flex flex-col items-center">
          <div className="w-24 h-24 rounded-[40px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-8 shadow-2xl animate-pulse">
            <GleaumAppIcon size={48} />
          </div>
          <h1 className="text-[32px] font-black mb-4 tracking-tight leading-tight">반가워요,<br/>여기는 글리움입니다</h1>
          <p className="text-[16px] text-white/60 font-bold max-w-[240px] leading-relaxed">나와 소중한 사람들의 일상을<br/>연결하는 여행을 시작해볼까요?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative bg-[#FAFAFD] text-[#1A1B2E] pb-32 overflow-hidden flex flex-col">
      <div className="mesh-bg opacity-50">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <main className="relative z-10 w-full max-w-[500px] mx-auto px-6 pt-12 flex flex-col flex-1">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <GleaumLogo variant="dark" size="sm" showTagline={false} />
          <div className="flex items-center gap-2">
             <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${progressPct}%` }} />
             </div>
             <span className="text-[12px] font-black text-brand-blue">{step + 1}/{steps.length}</span>
          </div>
        </header>

        <section className="mb-10 animate-fade-in-up">
          <p className="text-[11px] font-black tracking-[0.3em] uppercase text-brand-teal mb-2">{currentStep.eyebrow}</p>
          <h2 className="text-[30px] font-black leading-tight mb-3 tracking-tight">{currentStep.title}</h2>
          <p className="text-[16px] text-[#8E8E93] font-bold leading-relaxed">{currentStep.desc}</p>
        </section>

        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {step === 0 && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-[32px] border border-white shadow-sm">
                <label className="text-[12px] font-black text-[#8E8E93] uppercase mb-3 block">닉네임</label>
                <input
                  value={effectiveDisplayName}
                  onChange={(e) => { setHasEditedName(true); setDisplayName(e.target.value); }}
                  placeholder="당신을 어떻게 부를까요?"
                  className="w-full h-14 px-6 rounded-[24px] text-[18px] font-black bg-gray-50 border-2 outline-none transition-all"
                  style={{ borderColor: effectiveDisplayName ? 'var(--brand-blue)' : 'transparent' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setNameMode('nickname')} className={`h-14 rounded-[24px] text-[14px] font-black transition-all shadow-sm ${nameMode === 'nickname' ? 'bg-[#1A1B2E] text-white' : 'bg-white text-[#8E8E93]'}`}>닉네임 모드</button>
                <button onClick={() => setNameMode('real_name')} className={`h-14 rounded-[24px] text-[14px] font-black transition-all shadow-sm ${nameMode === 'real_name' ? 'bg-[#1A1B2E] text-white' : 'bg-white text-[#8E8E93]'}`}>실명 모드</button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {goals.map((item) => (
                <button key={item.key} onClick={() => handleGoal(item.key)} className="glass-card p-5 rounded-[32px] text-left transition-all active:scale-[0.95] border-2 shadow-sm"
                  style={{ borderColor: goal === item.key ? item.accent : 'white', background: goal === item.key ? `${item.accent}05` : 'white' }}>
                  <span className="text-[32px] mb-3 block">{item.icon}</span>
                  <p className="text-[16px] font-black text-[#1A1B2E] mb-1">{item.title}</p>
                  <p className="text-[12px] text-[#8E8E93] font-bold leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {layouts.map((item) => (
                <button key={item.key} onClick={() => setHomeLayout(item.key)} className="glass-card w-full p-5 rounded-[28px] text-left transition-all active:scale-[0.98] border-2 shadow-sm flex items-center justify-between"
                  style={{ borderColor: homeLayout === item.key ? '#1A1B2E' : 'white', background: homeLayout === item.key ? '#1A1B2E' : 'white' }}>
                  <div>
                    <p className={`text-[16px] font-black mb-0.5 ${homeLayout === item.key ? 'text-white' : 'text-[#1A1B2E]'}`}>{item.title}</p>
                    <p className={`text-[12px] font-bold ${homeLayout === item.key ? 'text-white/60' : 'text-[#8E8E93]'}`}>{item.desc}</p>
                  </div>
                  {homeLayout === item.key && <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white text-[12px]">✓</div>}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-3">
              {spaceOptions.map((item) => {
                const active = spaceIntent.includes(item.key);
                return (
                  <button key={item.key} onClick={() => setSpaceIntent((current) => toggleSpaceIntent(current, item.key))} className="glass-card p-5 rounded-[32px] text-left transition-all active:scale-[0.98] border-2 shadow-sm flex items-center gap-4"
                    style={{ borderColor: active ? 'var(--brand-teal)' : 'white', background: active ? 'rgba(12,201,181,0.05)' : 'white' }}>
                    <span className="text-[28px]">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-[16px] font-black text-[#1A1B2E] mb-0.5">{item.label}</p>
                      <p className="text-[12px] text-[#8E8E93] font-bold">{item.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-brand-teal border-brand-teal' : 'border-gray-200'}`}>
                      {active && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-[32px] border border-white shadow-sm">
                 <p className="text-[12px] font-black text-[#8E8E93] uppercase mb-4">기본 리마인더</p>
                 <div className="grid grid-cols-3 gap-2">
                    {[10, 30, 60].map((m) => (
                      <button key={m} onClick={() => setDefaultReminder(m)} className={`h-12 rounded-2xl text-[14px] font-black transition-all ${defaultReminder === m ? 'bg-brand-blue text-white shadow-lg' : 'bg-gray-100 text-[#8E8E93]'}`}>{m}분 전</button>
                    ))}
                 </div>
              </div>
              <div className="glass-card rounded-[32px] overflow-hidden border border-white shadow-sm divide-y divide-gray-50">
                 {(Object.entries(notifications) as Array<[keyof NotificationSettings, boolean]>).map(([key, val]) => (
                   <div key={key} className="p-5 flex items-center justify-between">
                      <span className="text-[15px] font-black text-[#1A1B2E]">{key === 'scheduleReminders' ? '일정 알림' : key === 'expenseReminders' ? '지출 알림' : key === 'routineReminders' ? '루틴 알림' : '소식 업데이트'}</span>
                      <button onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${val ? 'bg-brand-teal' : 'bg-gray-200'}`}>
                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${val ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-[13px] font-bold text-red-500 text-center">{error}</p>}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-[500px] mx-auto flex gap-3 pointer-events-auto">
          <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0 || saving} className="h-16 px-8 rounded-[28px] bg-white shadow-xl text-[15px] font-black text-[#1A1B2E] disabled:opacity-30 active:scale-95 transition-all">이전</button>
          <button onClick={handleNext} disabled={saving || !canContinue} className="flex-1 h-16 rounded-[28px] bg-brand-gradient shadow-xl text-white text-[16px] font-black active:scale-95 transition-all disabled:opacity-60">
            {saving ? '나만의 홈을 꾸미는 중...' : step === steps.length - 1 ? '시작하기' : '다음 단계'}
          </button>
        </div>
      </footer>
    </div>
  );
}
