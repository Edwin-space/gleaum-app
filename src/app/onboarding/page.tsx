'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GleaumLogo } from '@/components/ui/GleaumLogo';
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

const goals: Array<{ key: OnboardingPrimaryGoal; title: string; desc: string; accent: string }> = [
  { key: 'personal_schedule', title: '개인 일정', desc: '오늘 할 일과 약속을 먼저 보고 싶어요', accent: 'var(--brand-blue)' },
  { key: 'routine', title: '루틴 관리', desc: '운동, 공부, 반복 습관을 놓치고 싶지 않아요', accent: 'var(--brand-green)' },
  { key: 'expense', title: '자금 관리', desc: '정기결제와 지출 흐름을 챙기고 싶어요', accent: '#F59E0B' },
  { key: 'couple', title: '연인과 함께', desc: '데이트, 기념일, 공동 일정을 관리해요', accent: 'var(--brand-teal)' },
  { key: 'friends', title: '친구/모임', desc: '약속, 여행 준비, 모임비를 함께 관리해요', accent: 'var(--brand-blue)' },
  { key: 'family', title: '가족 케어', desc: '가족 일정, 자녀 일정, 생활비를 함께 챙겨요', accent: 'var(--brand-green)' },
];

const layouts: Array<{ key: HomeLayoutPreference; title: string; desc: string }> = [
  { key: 'balanced', title: '균형형', desc: '일정, 루틴, 자금, 공간을 고르게' },
  { key: 'calendar_first', title: '일정 우선', desc: '오늘 일정과 캘린더를 먼저' },
  { key: 'routine_first', title: '루틴 우선', desc: '완료해야 할 습관과 할 일을 먼저' },
  { key: 'expense_first', title: '자금 우선', desc: '결제일과 지출 흐름을 먼저' },
  { key: 'space_first', title: '공간 우선', desc: '친구, 연인, 가족 Space 소식을 먼저' },
];

const spaceOptions: Array<{ key: SpaceIntent; label: string; desc: string }> = [
  { key: 'solo', label: '혼자 시작', desc: '먼저 내 일정과 자금부터 정리할게요' },
  { key: 'friends', label: '친구/모임', desc: '약속, 여행 준비, 모임비를 함께 관리해요' },
  { key: 'couple', label: '연인', desc: '데이트와 기념일, 공동 일정을 연결해요' },
  { key: 'family', label: '가족', desc: '가족 일정과 생활비, 케어 일정을 챙겨요' },
];

const steps = [
  { title: '이름 설정', eyebrow: 'STEP 01 · NAME', desc: '글리움에서 당신을 어떻게 부르면 좋을까요?' },
  { title: '시작 목적', eyebrow: 'STEP 02 · FOCUS', desc: '처음 홈에서 가장 중요하게 볼 것을 정합니다.' },
  { title: '홈 구성', eyebrow: 'STEP 03 · HOME', desc: '선택한 목적에 맞게 첫 화면의 우선순위를 조정합니다.' },
  { title: 'Space 확장', eyebrow: 'STEP 04 · SPACE', desc: '혼자 시작하거나 친구, 연인, 가족 공간으로 확장할 수 있어요.' },
  { title: '알림 기본값', eyebrow: 'STEP 05 · REMIND', desc: '일정과 루틴, 자금 흐름을 놓치지 않게 기본 알림을 설정합니다.' },
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
    if (nextGoal === 'friends') setSpaceIntent(['friends']);
    if (nextGoal === 'family') setSpaceIntent(['family']);
    if (nextGoal === 'personal_schedule' || nextGoal === 'routine' || nextGoal === 'expense') setSpaceIntent(['solo']);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!effectiveDisplayName.trim()) {
      setStep(0);
      setError('글리움에서 사용할 이름을 입력해주세요.');
      return;
    }

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

    if (!ok) {
      setError('온보딩 정보를 저장하지 못했어요. DB 마이그레이션이 적용됐는지 확인해주세요.');
      return;
    }

    await refresh();
    router.replace('/home');
  };

  const handleNext = () => {
    setError(null);
    if (!canContinue) {
      setError('글리움에서 사용할 이름을 입력해주세요.');
      return;
    }
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    void handleSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative overflow-hidden pb-8">
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <main className="relative z-10 max-w-[560px] mx-auto px-5 pt-12 min-h-dvh flex flex-col">
        <header className="flex items-center justify-between mb-7">
          <GleaumLogo variant="light" size="sm" showTagline={false} />
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(12,201,181,0.12)', color: 'var(--brand-teal)' }}>
            {step + 1}/{steps.length}
          </span>
        </header>

        <section className="glass-card rounded-[28px] p-6 mb-5">
          <div className="h-1.5 rounded-full overflow-hidden mb-6" style={{ background: 'rgba(0,132,204,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'var(--brand-gradient)' }} />
          </div>
          <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--brand-teal)', letterSpacing: '0.08em' }}>
            {currentStep.eyebrow}
          </p>
          <h1 className="text-[28px] font-bold leading-tight mb-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            {currentStep.title}
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>
            {currentStep.desc}
          </p>
        </section>

        <section className="glass-card rounded-[24px] p-5 mb-5 flex-1">
          {step === 0 && (
            <div>
              <label className="block text-[13px] font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                앱에서 불려질 이름
              </label>
              <input
                value={effectiveDisplayName}
                onChange={(event) => {
                  setHasEditedName(true);
                  setDisplayName(event.target.value);
                }}
                placeholder="예: 에드윈, 수연, 하루"
                className="w-full h-[56px] rounded-[16px] px-4 text-[17px] outline-none transition-all"
                style={{ background: 'var(--gray-100, #F5F5F3)', border: '2px solid rgba(12,201,181,0.18)', color: 'var(--color-ink)' }}
              />
              <p className="text-[12px] mt-2 mb-5" style={{ color: 'var(--color-ink-muted-48)' }}>
                기본은 닉네임입니다. Space마다 표시 이름을 다르게 쓰는 기능은 이후 확장됩니다.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['nickname', 'real_name'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setNameMode(mode)}
                    className="h-12 rounded-full text-[13px] font-bold transition-all"
                    style={{
                      background: nameMode === mode ? 'var(--color-ink)' : 'rgba(255,255,255,0.62)',
                      color: nameMode === mode ? 'white' : 'var(--color-ink-muted-80)',
                    }}
                  >
                    {mode === 'nickname' ? '닉네임으로 표시' : '실명으로 표시'}
                  </button>
                ))}
              </div>
              {nameMode === 'real_name' && (
                <input
                  value={realName}
                  onChange={(event) => setRealName(event.target.value)}
                  placeholder="실명을 입력해주세요"
                  className="w-full h-[50px] rounded-[16px] px-4 text-[15px] outline-none mt-3"
                  style={{ background: 'rgba(255,255,255,0.72)', border: '1.5px solid rgba(0,132,204,0.14)', color: 'var(--color-ink)' }}
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {goals.map((item) => {
                const active = goal === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleGoal(item.key)}
                    className="text-left rounded-[20px] p-4 transition-all active:scale-[0.98]"
                    style={{
                      background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.48)',
                      border: active ? `2px solid ${item.accent}` : '1px solid rgba(255,255,255,0.55)',
                      boxShadow: active ? 'var(--shadow-card)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ background: item.accent }} />
                      <div>
                        <p className="text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>{item.title}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-ink-muted-48)' }}>{item.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-[13px] mb-4" style={{ color: 'var(--color-ink-muted-48)' }}>
                현재 추천: <b style={{ color: selectedGoal.accent }}>{selectedGoal.title}</b> 기준
              </p>
              <div className="grid grid-cols-1 gap-2">
                {layouts.map((item) => {
                  const active = homeLayout === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setHomeLayout(item.key)}
                      className="flex items-center justify-between rounded-[18px] px-4 py-3 text-left transition-all"
                      style={{ background: active ? 'var(--color-ink)' : 'rgba(255,255,255,0.54)', color: active ? 'white' : 'var(--color-ink)' }}
                    >
                      <span>
                        <span className="block text-[14px] font-bold">{item.title}</span>
                        <span className="block text-[12px] opacity-70">{item.desc}</span>
                      </span>
                      {active && <span className="text-[13px] font-bold">선택됨</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {spaceOptions.map((item) => {
                const active = spaceIntent.includes(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => setSpaceIntent((current) => toggleSpaceIntent(current, item.key))}
                    className="w-full rounded-[20px] p-4 text-left transition-all active:scale-[0.98]"
                    style={{
                      background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.48)',
                      border: active ? '2px solid var(--brand-teal)' : '1px solid rgba(255,255,255,0.55)',
                    }}
                  >
                    <p className="text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>{item.label}</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--color-ink-muted-48)' }}>{item.desc}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[10, 30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setDefaultReminder(minutes)}
                    className="h-10 rounded-full text-[13px] font-bold"
                    style={{ background: defaultReminder === minutes ? 'var(--color-ink)' : 'rgba(255,255,255,0.62)', color: defaultReminder === minutes ? 'white' : 'var(--color-ink-muted-80)' }}
                  >
                    {minutes}분 전
                  </button>
                ))}
              </div>
              {([
                ['scheduleReminders', '일정 리마인더'],
                ['routineReminders', '루틴/할 일 미완료 알림'],
                ['expenseReminders', '정기지출 알림'],
                ['spaceUpdates', 'Space 업데이트 알림'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="w-full flex items-center justify-between py-3 border-t"
                  style={{ borderColor: 'rgba(0,132,204,0.08)' }}
                >
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)' }}>{label}</span>
                  <span className="w-12 h-7 rounded-full p-1 transition-all" style={{ background: notifications[key] ? 'var(--brand-teal)' : 'var(--gray-200, #E8E8E4)' }}>
                    <span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: notifications[key] ? 'translateX(20px)' : 'translateX(0)' }} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-[18px] px-4 py-3 text-[13px] font-semibold mb-4" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <footer className="grid grid-cols-[auto_1fr] gap-3 pb-4">
          <button
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || saving}
            className="h-[54px] px-5 rounded-full text-[14px] font-bold transition-all disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.72)', color: 'var(--color-ink)' }}
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={saving || !canContinue}
            className="h-[54px] rounded-full text-[16px] font-bold text-white transition-all active:scale-[0.96] disabled:opacity-60"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-fab)' }}
          >
            {saving ? '개인 홈 구성 중...' : step === steps.length - 1 ? '내 홈으로 시작하기' : '다음'}
          </button>
        </footer>
      </main>
    </div>
  );
}
