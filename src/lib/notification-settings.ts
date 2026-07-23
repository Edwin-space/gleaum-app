import type { NotificationSettings } from '@/types';

export type NotificationSettingKey = keyof NotificationSettings;

/** 기존 사용자 호환을 위해 키가 없을 때는 활성으로 간주하고 명시적 false만 차단한다. */
export function isNotificationEnabled(settings: unknown, key: NotificationSettingKey): boolean {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return true;
  return (settings as Partial<NotificationSettings>)[key] !== false;
}
