'use client';
import { useEffect } from 'react';

export function useNativePush() {
  useEffect(() => {
    const register = async () => {
      // Capacitor 환경 감지
      const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
      if (!isCapacitor) return;
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') return;
        await PushNotifications.register();
        PushNotifications.addListener('registration', async ({ value: token }) => {
          await fetch('/api/push/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform: getCapacitorPlatform() }),
          });
        });
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[FCM] received:', notification);
        });
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const url = action.notification.data?.url as string | undefined;
          if (url) window.location.href = url;
        });
      } catch (e) { console.warn('[push] native register error', e); }
    };
    void register();
  }, []);
}

function getCapacitorPlatform(): string {
  const cap = (window as any).Capacitor;
  return cap?.getPlatform?.() ?? 'native';
}
