// 글리움 — Firebase Cloud Messaging Service Worker
// 앱이 백그라운드 or 닫혀있을 때 푸시 알림 수신 처리

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyAWCSlTzNnXAGXRyu0kEulMuJwlovvOXhU',
  authDomain:        'gleaum-app-e8edf.firebaseapp.com',
  projectId:         'gleaum-app-e8edf',
  storageBucket:     'gleaum-app-e8edf.firebasestorage.app',
  messagingSenderId: '892011944168',
  appId:             '1:892011944168:web:88451fac143fa68bbf515d',
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 → 알림 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? '글리움';
  const body  = payload.notification?.body  ?? '';
  const url   = payload.data?.url ?? '/home';

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data:  { url },
    vibrate: [200, 100, 200],
  });
});

// 알림 클릭 → 해당 URL로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
