/**
 * NativeCalendar — Android/iOS 기기 캘린더 연동 브리지.
 *
 * Web에서는 지원 상태를 false로 반환합니다.
 */
import { registerPlugin } from '@capacitor/core';
import { getNativePlatform, isNativeApp, secureStorage } from '@/lib/native';

const CALENDAR_ENABLED_KEY = 'gleaum:calendar-sync-enabled';
const SELECTED_CALENDAR_KEY = 'gleaum:calendar-sync-calendar-id';

export type CalendarPermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'unknown';

export interface NativeCalendarPermissionStatus {
  calendar: CalendarPermissionState;
}

export interface NativeDeviceCalendar {
  id: string;
  name: string;
  accountName: string;
  ownerAccount: string;
  color: number;
  visible: boolean;
  canWrite: boolean;
}

export interface NativeCalendarEventInput {
  calendarId: string;
  title: string;
  startTime: number;
  endTime?: number;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  description?: string;
}

export interface NativeCalendarEvent {
  eventId: string;
  calendarId: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
}

export interface NativeCalendarPlugin {
  checkPermissions(): Promise<NativeCalendarPermissionStatus>;
  requestPermissions(): Promise<NativeCalendarPermissionStatus>;
  listCalendars(): Promise<{ calendars: NativeDeviceCalendar[] }>;
  createEvent(options: NativeCalendarEventInput): Promise<{ eventId: string }>;
  listEvents(options: { startMillis: number; endMillis: number }): Promise<{ events: NativeCalendarEvent[] }>;
}

export const NativeCalendar = registerPlugin<NativeCalendarPlugin>('NativeCalendar', {
  web: () => ({
    async checkPermissions() { return { calendar: 'denied' as const }; },
    async requestPermissions() { return { calendar: 'denied' as const }; },
    async listCalendars() { return { calendars: [] }; },
    async createEvent() { throw new Error('native_calendar_unavailable'); },
    async listEvents() { return { events: [] }; },
  }),
});

export function isNativeCalendarSupported(): boolean {
  return isNativeApp() && ['android', 'ios'].includes(getNativePlatform());
}

export async function getCalendarPermissionStatus(): Promise<NativeCalendarPermissionStatus> {
  if (!isNativeCalendarSupported()) return { calendar: 'denied' };
  try {
    return await NativeCalendar.checkPermissions();
  } catch {
    return { calendar: 'unknown' };
  }
}

export async function requestCalendarPermission(): Promise<NativeCalendarPermissionStatus> {
  if (!isNativeCalendarSupported()) return { calendar: 'denied' };
  try {
    return await NativeCalendar.requestPermissions();
  } catch {
    return { calendar: 'unknown' };
  }
}

export async function listDeviceCalendars(): Promise<NativeDeviceCalendar[]> {
  if (!isNativeCalendarSupported()) return [];
  const { calendars } = await NativeCalendar.listCalendars();
  return calendars;
}

export async function createDeviceCalendarEvent(input: NativeCalendarEventInput): Promise<string | null> {
  if (!isNativeCalendarSupported()) return null;
  const { eventId } = await NativeCalendar.createEvent(input);
  return eventId;
}

export async function listDeviceCalendarEvents(startMillis: number, endMillis: number): Promise<NativeCalendarEvent[]> {
  if (!isNativeCalendarSupported()) return [];
  const { events } = await NativeCalendar.listEvents({ startMillis, endMillis });
  return events;
}

export async function isCalendarSyncEnabled(): Promise<boolean> {
  return (await secureStorage.get(CALENDAR_ENABLED_KEY)) === 'true';
}

export async function setCalendarSyncEnabled(enabled: boolean): Promise<void> {
  await secureStorage.set(CALENDAR_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getSelectedCalendarId(): Promise<string | null> {
  return secureStorage.get(SELECTED_CALENDAR_KEY);
}

export async function setSelectedCalendarId(calendarId: string): Promise<void> {
  await secureStorage.set(SELECTED_CALENDAR_KEY, calendarId);
}
