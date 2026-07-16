'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import {
  createDeviceCalendarEvent,
  deleteDeviceCalendarEvent,
  getCalendarPermissionStatus,
  getCalendarSyncMode,
  getSelectedCalendarId,
  isCalendarSyncEnabled,
  isNativeCalendarSupported,
  listDeviceCalendarEvents,
  listDeviceCalendars,
  requestCalendarPermission,
  setCalendarSyncEnabled,
  setCalendarSyncMode,
  setSelectedCalendarId,
  updateDeviceCalendarEvent,
  type CalendarPermissionState,
  type CalendarSyncMode,
  type NativeCalendarEvent,
  type NativeDeviceCalendar,
} from '@/lib/native-calendar';
import type { Schedule } from '@/types';

const GLEAUM_EVENT_MARKER = 'gleaum:schedule:';

type ImportCandidate = NativeCalendarEvent & {
  importId: string;
  duplicate: boolean;
};

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

function isExportableSchedule(schedule: Schedule, referenceTime: number): boolean {
  if (schedule.type === 'expense') return false;
  return schedule.startTime.getTime() >= referenceTime - 24 * 60 * 60 * 1000;
}

export default function CalendarSyncPage() {
  const supported = isNativeCalendarSupported();
  const { familyGroupId, personalSpaceId } = useCurrentUser();
  const { schedules, loading } = useSchedules(familyGroupId);
  const {
    schedules: personalSchedules,
    loading: personalSchedulesLoading,
    create: createPersonalSchedule,
  } = useSchedules(personalSpaceId);

  const [permission, setPermission] = useState<CalendarPermissionState>('unknown');
  const [calendars, setCalendars] = useState<NativeDeviceCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendar] = useState<string>('');
  const [enabled, setEnabled] = useState(false);
  const [syncMode, setSyncMode] = useState<CalendarSyncMode>('manual');
  const [busy, setBusy] = useState(false);
  const [syncReferenceTime, setSyncReferenceTime] = useState<number | null>(null);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());

  const upcomingSchedules = useMemo(() => {
    if (syncReferenceTime === null) return [];
    const end = syncReferenceTime + 30 * 24 * 60 * 60 * 1000;
    return schedules
      .filter((schedule) => isExportableSchedule(schedule, syncReferenceTime))
      .filter((schedule) => schedule.startTime.getTime() <= end)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [schedules, syncReferenceTime]);

  const selectedCalendar = calendars.find((calendar) => calendar.id === selectedCalendarId);

  useEffect(() => {
    const timer = window.setTimeout(() => setSyncReferenceTime(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [permissionStatus, savedEnabled, savedCalendarId, savedSyncMode] = await Promise.all([
        getCalendarPermissionStatus(),
        isCalendarSyncEnabled(),
        getSelectedCalendarId(),
        getCalendarSyncMode(),
      ]);
      if (!mounted) return;
      setPermission(permissionStatus.calendar);
      setEnabled(savedEnabled);
      setSyncMode(savedSyncMode);
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

  const handleSyncModeChange = async (mode: CalendarSyncMode) => {
    setSyncMode(mode);
    await setCalendarSyncMode(mode);
    toast.success(mode === 'automatic' ? '일정 변경 시 자동 반영합니다' : '수동 동기화로 전환했습니다');
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
      const eventByScheduleId = new Map<string, (typeof existingEvents)[number]>();
      for (const event of existingEvents) {
        if (event.calendarId !== selectedCalendarId || !event.description.includes(GLEAUM_EVENT_MARKER)) continue;
        const scheduleId = event.description.match(/gleaum:schedule:([^\s]+)/)?.[1];
        if (scheduleId) eventByScheduleId.set(scheduleId, event);
      }

      let created = 0;
      let updated = 0;
      let deleted = 0;
      const activeScheduleIds = new Set(upcomingSchedules.map((schedule) => schedule.id));
      for (const schedule of upcomingSchedules) {
        const eventInput = {
          calendarId: selectedCalendarId,
          title: schedule.title,
          startTime: schedule.startTime.getTime(),
          endTime: (schedule.endTime ?? new Date(schedule.startTime.getTime() + 60 * 60 * 1000)).getTime(),
          allDay: schedule.allDay ?? false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location: schedule.location?.address,
          description: buildEventDescription(schedule),
        };
        const existing = eventByScheduleId.get(schedule.id);
        if (existing) {
          await updateDeviceCalendarEvent({ ...eventInput, eventId: existing.eventId });
          updated += 1;
        } else {
          await createDeviceCalendarEvent(eventInput);
          created += 1;
        }
      }

      for (const [scheduleId, event] of eventByScheduleId) {
        if (!activeScheduleIds.has(scheduleId) && await deleteDeviceCalendarEvent(event.eventId)) deleted += 1;
      }

      void trackEvent('device_calendar_sync', { created, updated, deleted });
      toast.success(`동기화 완료: ${created}개 추가, ${updated}개 업데이트, ${deleted}개 삭제`);
    } catch (error) {
      console.error(error);
      toast.error('기기 캘린더 동기화에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  const isDuplicatePersonalSchedule = (event: NativeCalendarEvent): boolean => {
    const eventTitle = event.title.trim().toLocaleLowerCase('ko-KR');
    const eventStart = new Date(event.startTime).getTime();
    return personalSchedules.some((schedule) => {
      const sameTitle = schedule.title.trim().toLocaleLowerCase('ko-KR') === eventTitle;
      const sameTime = Math.abs(schedule.startTime.getTime() - eventStart) < 60_000;
      return sameTitle && sameTime;
    });
  };

  const handleFindImportCandidates = async () => {
    if (!selectedCalendarId) {
      toast.error('가져올 기기 캘린더를 선택해주세요');
      return;
    }
    if (!personalSpaceId) {
      toast.error('개인 공간을 준비한 뒤 다시 시도해주세요');
      return;
    }

    setBusy(true);
    try {
      const rangeStart = Date.now() - 24 * 60 * 60 * 1000;
      const rangeEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const events = await listDeviceCalendarEvents(rangeStart, rangeEnd);
      const candidates = events
        .filter((event) => event.calendarId === selectedCalendarId)
        .filter((event) => event.title.trim().length > 0)
        // 글리움이 내보낸 이벤트를 다시 개인 일정으로 복제하지 않습니다.
        .filter((event) => !event.description.includes(GLEAUM_EVENT_MARKER))
        // 반복 일정은 동일 eventId를 공유할 수 있으므로 발생 시각까지 합쳐 UI 식별자를 만듭니다.
        .map((event) => ({ ...event, importId: `${event.eventId}:${event.startTime}`, duplicate: isDuplicatePersonalSchedule(event) }));

      setImportCandidates(candidates);
      setSelectedImportIds(new Set(candidates.filter((event) => !event.duplicate).map((event) => event.importId)));
      if (candidates.length === 0) {
        toast.message('가져올 새 기기 일정이 없습니다');
      } else {
        toast.success(`${candidates.length}개 기기 일정을 확인했습니다`);
      }
    } catch (error) {
      console.error(error);
      toast.error('기기 일정을 확인하지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  const handleImportSelected = async () => {
    if (!personalSpaceId) {
      toast.error('개인 공간을 준비한 뒤 다시 시도해주세요');
      return;
    }
    const selected = importCandidates.filter((event) => selectedImportIds.has(event.importId) && !event.duplicate);
    if (selected.length === 0) {
      toast.message('가져올 일정을 선택해주세요');
      return;
    }

    setBusy(true);
    try {
      let imported = 0;
      let skippedDuplicates = importCandidates.filter((event) => event.duplicate).length;
      for (const event of selected) {
        // 가져오기 직전에 다시 검사해, 미리보기 이후 생성된 일정과도 겹치지 않게 합니다.
        if (isDuplicatePersonalSchedule(event)) {
          skippedDuplicates += 1;
          continue;
        }
        const startTime = new Date(event.startTime);
        const endTime = event.endTime ? new Date(event.endTime) : undefined;
        const created = await createPersonalSchedule({
          title: event.title.trim(),
          type: 'personal',
          visibility: 'private',
          startTime,
          endTime: endTime && !Number.isNaN(endTime.getTime()) ? endTime : undefined,
          allDay: event.allDay,
          reminder: 0,
          repeat: 'none',
          locationAddress: event.location.trim() || undefined,
          memo: event.description.trim() || '기기 캘린더에서 가져온 일정',
        });
        if (created) imported += 1;
      }
      void trackEvent('device_calendar_import', { imported, skipped_duplicates: skippedDuplicates });
      setImportCandidates([]);
      setSelectedImportIds(new Set());
      toast.success(`${imported}개 일정을 개인 일정으로 가져왔습니다`);
    } catch (error) {
      console.error(error);
      toast.error('일부 기기 일정을 가져오지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  const toggleImportCandidate = (eventId: string) => {
    setSelectedImportIds((previous) => {
      const next = new Set(previous);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
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
              '앞으로 30일의 글리움 일정을 선택한 기기 캘린더와 동기화',
              '글리움이 만든 일정만 생성·수정·삭제하며 다른 일정은 건드리지 않음',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>일정 변경 반영 방식</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {([
                        ['manual', '수동 동기화', '설정 화면에서 실행할 때만 반영'],
                        ['automatic', '자동 반영', '일정 등록·수정·삭제 시 바로 반영'],
                      ] as const).map(([mode, label, description]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => void handleSyncModeChange(mode)}
                          style={{ minHeight: 76, padding: '10px 12px', borderRadius: 16, border: syncMode === mode ? '1.5px solid #0084CC' : '1px solid var(--theme-border, rgba(26,27,46,0.08))', background: syncMode === mode ? 'rgba(0,132,204,0.08)' : 'var(--theme-surface-muted, #F7F8FB)', color: 'var(--theme-text, #1A1B2E)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <strong style={{ display: 'block', fontSize: 13 }}>{label}</strong>
                          <span style={{ display: 'block', marginTop: 4, fontSize: 11, lineHeight: 1.35, color: 'var(--theme-text-muted, #6E6E66)' }}>{description}</span>
                        </button>
                      ))}
                    </div>
                    {syncMode === 'automatic' && (
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--theme-text-muted, #6E6E66)' }}>
                        글리움이 만든 일정만 변경합니다. 기기 캘린더에서 직접 만든 일정은 건드리지 않습니다.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>글리움 일정 동기화</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.6 }}>
                현재 공간의 앞으로 30일 일정 중 지출을 제외한 일정을 기기 캘린더와 맞춥니다. 글리움이 만든 일정만 생성·수정·삭제합니다.
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
                {busy ? '동기화 중...' : '앞으로 30일 일정 동기화'}
              </button>
            </section>

            <section style={cardStyle}>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)' }}>기기 일정 가져오기</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--theme-text-muted, #8E8E93)', lineHeight: 1.6 }}>
                선택한 기기 캘린더의 앞으로 30일 일정을 내 개인 일정으로만 가져옵니다. 공간 일정에는 추가하지 않으며, 글리움이 내보낸 일정과 제목·시간이 같은 일정은 중복으로 제외합니다.
              </p>
              <button
                onClick={handleFindImportCandidates}
                disabled={busy || permission !== 'granted' || !selectedCalendarId || !personalSpaceId || personalSchedulesLoading}
                style={{ ...buttonStyle, opacity: busy || permission !== 'granted' || !selectedCalendarId || !personalSpaceId || personalSchedulesLoading ? 0.55 : 1 }}
              >
                {busy ? '기기 일정 확인 중...' : '가져올 기기 일정 확인'}
              </button>

              {importCandidates.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {importCandidates.map((event) => {
                    const selected = selectedImportIds.has(event.importId);
                    const start = new Date(event.startTime);
                    return (
                      <label key={event.importId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--theme-border, rgba(26,27,46,0.08))', background: event.duplicate ? 'var(--theme-surface-muted, #F7F8FB)' : 'var(--theme-surface, #FFFFFF)', opacity: event.duplicate ? 0.6 : 1, cursor: event.duplicate ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" checked={selected} disabled={event.duplicate} onChange={() => toggleImportCandidate(event.importId)} style={{ marginTop: 3, accentColor: '#0084CC' }} />
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', color: 'var(--theme-text, #1A1B2E)', fontSize: 14 }}>{event.title}</strong>
                          <span style={{ display: 'block', marginTop: 4, color: 'var(--theme-text-muted, #8E8E93)', fontSize: 12 }}>{start.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: event.allDay ? undefined : 'short' })}</span>
                          {event.duplicate && <span style={{ display: 'block', marginTop: 4, color: '#D97706', fontSize: 11, fontWeight: 800 }}>글리움 개인 일정에 이미 같은 제목·시간의 항목이 있어 제외됨</span>}
                        </span>
                      </label>
                    );
                  })}
                  <button onClick={handleImportSelected} disabled={busy || selectedImportIds.size === 0} style={{ ...buttonStyle, opacity: busy || selectedImportIds.size === 0 ? 0.55 : 1 }}>
                    선택한 {selectedImportIds.size}개를 개인 일정으로 가져오기
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
