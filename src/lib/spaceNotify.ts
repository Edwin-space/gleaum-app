export async function sendSpaceNotification(params: {
  spaceId: string;
  spaceName: string;
  message: string;
  url?: string;
  excludeUserId?: string;
}) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId: params.spaceId,
        title: params.spaceName,
        body: params.message,
        url: params.url ?? '/space',
        excludeUserId: params.excludeUserId,
      }),
    });
  } catch { /* 알림 실패는 무시 */ }
}
