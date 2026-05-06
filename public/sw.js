// 글리움 — PWA Service Worker
// 앱 셸(App Shell) 오프라인 캐싱 + 네트워크 우선 전략

const CACHE_VERSION = 'gleaum-v1';
const APP_SHELL = [
  '/',
  '/home',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── 설치: 앱 셸 사전 캐싱 ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── 활성화: 이전 캐시 정리 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── 요청 처리: 네트워크 우선, 실패 시 캐시 ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청 / Supabase / Firebase는 캐싱 제외
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공 응답은 캐시에 저장
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 응답, 없으면 홈 페이지 반환
        return caches.match(request).then(
          (cached) => cached ?? caches.match('/home')
        );
      })
  );
});
