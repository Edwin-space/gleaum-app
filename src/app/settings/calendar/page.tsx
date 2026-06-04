'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { toast } from 'sonner';
import {
  createDeviceCalendarEvent,
  getCalendarPermissionStatus,
  getSelectedCalendarId,
  isCalendarSyncEnabled,
  isNativeCalendarSupported,
  listDeviceCalendarEvents,
  listDeviceCalendars,
  requestCalendarPermission,
  setCalendarSyncEnabled,
  setSelectedCalendarId,
  type CalendarPermissionState,
  type NativeDeviceCalendar,
} from '@/lib/native-calendar';
import type { Schedule } from '@/types';

const GLEAUM_EVENT_MARKER = 'gleaum:schedule:';

function permissionLabel(state: CalendarPermissionState): string {
  switch (state) {
    case 'granted': return '허용됨';
    case 'denied': return '거부됨';
    case 'prompt': return '요청 필요';
    case 'prompt-with-rationale': return '설명 후 요청 필요';
    default: return '확인 중';
  }
}

function buildEventDescription(schedule: Schedule): string {
  const memo = schedule.memo?.trim();
  return [
    memo || null,
    '',
    '글리움에서 내보낸 일정입니다.',
    `${GLEAUM_EVENT_MARKER}${schedule.id}`,
  ].filter((line) => line !== null).join('\n');
}

function isExportableSchedule(schedule: Schedule): boolean {
  if (schedule.type === 'expense') return false;
  return schedule.startTime >= new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default function CalendarSyncPage() {
  const supported = isNativeCalendarSupported();
  const { familyGroupId } = useCurrentUser();
  const { schedules, loading } = useSchedules(familyGroupId);

  const [permission, setPermission] = useState<CalendarPermissionState>('unknown');
  const [calendars, setCalendars] = useState<NativeDeviceCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendar] = useState<string>('');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const upcomingSchedules = useMemo(() => {
    const end = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return schedules
      .filter(isExportableSchedule)
      .filter((schedule) => schedule.startTime.getTime() <= end)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [schedules]);

  const selectedCalendar = calendars.find((calendar) => calendar.id === selectedCalendarId);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [permissionStatus, savedEnabled, savedCalendarId] = await Promise.all([
        getCalendarPermissionStatus(),
        isCalendarSyncEnabled(),
        getSelectedCalendarId(),
      ]);
      if (!mounted) return;
      setPermission(permissionStatus.calendar);
      setEnabled(savedEnabled);
      if (savedCalendarId) setSelectedCalendar(savedCalendarId);

      if (permissionStatus.calendar === 'granted') {
        const list = await listDeviceCalendars();
        if (!mounted) return;
        setCalendars(list);
        if (!savedCalendarId) {
          const firstWritable = list.find((calendar) => calendar.canWrite && calendar.visible) ?? list.find((calendar) => calendar.canWrite);
          if (firstWritable) {
            setSelectedCalendar(firstWritable.id);
            await setSelectedCalendarId(firstWritable.id);
          }
        }
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const refreshCalendars = async () => {
    const list = await listDeviceCalendars();
    setCalendars(list);
    return list;
  };

  const handleRequestPermission = async () => {
    setBusy(true);
    try {
      const result = await requestCalendarPermission();
      setPermission(result.calendar);
      if (result.calendar !== 'granted') {
        toast.error('캘린더 권한이 필요합니다');
        return;
      }
      const list = await refreshCalendars();
      const firstWritable = list.find((calendar) => calendar.canWrite && calendar.visible) ?? list.find((calendar) => calendar.canWrite);
      if (firstWritable) {
        setSelectedCalendar(firstWritable.id);
        await setSelectedCalendarId(firstWritable.id);
      }
      await setCalendarSyncEnabled(true);
      setEnabled(true);
      toast.success('기기 캘린더 권한이 연결되었습니다');
    } catch {
      toast.error('캘린더 권한 요청에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  const handleCalendarChange = async (calendarId: string) => {
    setSelectedCalendar(calendarId);
    await setSelectedCalendarId(calendarId);
  };

  const handleToggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    await setCalendarSyncEnabled(next);
    toast.success(next ? '캘린더 연동을 켰습니다' : '캘린더 연동을 껐습니다');
  };

  const handleExportUpcoming = async () => {
    if (!selectedCalendarId) {
      toast.error('내보낼 캘린더를 선택해주세요');
      return;
    }
    setBusy(true);
    try {
      const rangeStart = Date.now() - 24 * 60 * 60 * 1000;
      const rangeEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const existingEvents = await listDeviceCalendarEvents(rangeStart, rangeEnd);
      const existingMarkers = new Set(
        existingEvents
          .filter((event) => event.calendarId === selectedCalendarId)
          .map((event) => event.description)
          .filter((description) => description.includes(GLEAUM_EVENT_MARKER))
      );

      let created = 0;
      let skipped = 0;
      for (const schedule of upcomingSchedules) {
        const marker = `${GLEAUM_EVENT_MARKER}${schedule.id}`;
        const exists = Array.from(existingMarkers).some((description) => description.includes(marker));
        if (exists) {
          skipped += 1;
          continue;
        }

        await createDeviceCalendarEvent({
          calendarId: selectedCalendarId,
          title: schedule.title,
          startTime: schedule.startTime.getTime(),
          endTime: (schedule.endTime ?? new Date(schedule.startTime.getTime() + 60 * 60 * 1000)).getTime(),
          allDay: schedule.allDay ?? false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location: schedule.location?.address,
          description: buildEventDescription(schedule),
        });
        created += 1;
      }

      toast.success(`내보내기 완료: ${created}개 추가, ${skipped}개 건너뜀`);
    } catch (error) {
      console.error(error);
      toast.error('캘린더 내보내기에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--theme-surface, #FFFFFF)',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 8px 28px rgba(0,132,204,0.08)',
    border: '1px solid var(--theme-border, rgba(0,132,204,0.08))',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: 52,
    border: 'none',
    borderRadius: 999,
    background: busy ? '#AEAEA8' : 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 800,
    cursor: busy ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--theme-bg, #FAFAFD)' }}>
      <AppHeader title="기기 캘린더 연동" showLogo={false} showBack showNotification={false} />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)', fontSize: 28 }}>
              📅
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)', letterSpacing: '-0.03em' }}>기기 캘린더 연동</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.5 }}>
                글리움 일정을 스마트폰 기본 캘린더에 저장합니다.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '외부 서버 전송 없이 기기 캘린더 앱에 직접 저장',
              '앞으로 30일의 글리움 일정을 수동으로 내보내기',
              '중복 내보내기 방지를 위해 글리움 일정 표식을 함께 저장',
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: 'var(--theme-text, #1A1B2E)' }}>
                <span style={{ color: '#0CC9B5', fontWeight: 900 }}>✓</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {!supported ? (
          <section style={{ ...cardStyle, background: 'rgba(0,132,204,0.07)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#0084CC' }}>네이티브 앱에서 지원합니다</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.6 }}>
              기기 캘린더 연동은 Android/iOS 앱의 캘린더 권한과 연결됩니다. 웹 브라우저에서는 스마트폰 기본 캘린더에 직접 저장할 수 없습니다.
            </p>
          </section>
        ) : (
          <>
            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>권한 상태</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: permission === 'granted' ? '#0CC9B5' : '#F59E0B' }}>{permissionLabel(permission)}</p>
                </div>
                {permission === 'granted' && (
                  <button
                    onClick={handleToggleEnabled}
                    disabled={busy}
                    style={{ minWidth: 86, height: 40, borderRadius: 999, border: 'none', background: enabled ? '#0CC9B5' : '#E8E8E4', color: enabled ? '#FFFFFF' : '#6E6E66', fontSize: 13, fontWeight: 900, cursor: busy ? 'not-allowed' : 'pointer' }}
                  >
                    {enabled ? '켜짐' : '꺼짐'}
                  </button>
                )}
              </div>

              {permission !== 'granted' ? (
                <button onClick={handleRequestPermission} disabled={busy} style={buttonStyle}>
                  {busy ? '권한 요청 중...' : '캘린더 권한 허용하기'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>저장할 기기 캘린더</span>
                    <select
                      value={selectedCalendarId}
                      onChange={(event) => void handleCalendarChange(event.target.value)}
                      style={{ width: '100%', height: 48, borderRadius: 16, border: '1.5px solid rgba(0,132,204,0.14)', padding: '0 14px', fontSize: 14, fontWeight: 700, color: 'var(--theme-text, #1A1B2E)', background: 'var(--theme-bg, #FAFAFD)' }}
                    >
                      <option value="">캘린더 선택</option>
                      {calendars.filter((calendar) => calendar.canWrite).map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>{calendar.name} · {calendar.accountName}</option>
                      ))}
                    </select>
                  </label>
                  {selectedCalendar && (
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.5 }}>
                      선택됨: {selectedCalendar.name} / {selectedCalendar.accountName}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>글리움 일정 내보내기</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.6 }}>
                현재 공간의 앞으로 30일 일정 중 지출을 제외한 일정을 기기 캘린더에 저장합니다. 이미 내보낸 글리움 일정은 건너뜁니다.
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: 14, borderRadius: 18, background: 'var(--theme-bg, #FAFAFD)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0084CC' }}>{loading ? '-' : upcomingSchedules.length}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted, #8E8E93)' }}>내보낼 일정</p>
                </div>
                <div style={{ flex: 1, padding: 14, borderRadius: 18, background: 'var(--theme-bg, #FAFAFD)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0CC9B5' }}>{calendars.filter((calendar) => calendar.canWrite).length}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted, #8E8E93)' }}>쓰기 가능 캘린더</p>
                </div>
              </div>
              <button
                onClick={handleExportUpcoming}
                disabled={busy || permission !== 'granted' || !enabled || !selectedCalendarId || upcomingSchedules.length === 0}
                style={{ ...buttonStyle, opacity: busy || permission !== 'granted' || !enabled || !selectedCalendarId || upcomingSchedules.length === 0 ? 0.55 : 1 }}
              >
                {busy ? '처리 중...' : '앞으로 30일 일정 내보내기'}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
