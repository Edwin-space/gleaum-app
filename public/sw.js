const CACHE_NAME = 'gleaum-pwa-cache-v1';

// 설치 이벤트 (Install): 앱 설치 시 캐시할 파일 지정 (필요 시)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 활성화 이벤트 (Activate): 구버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// 패치 이벤트 (Fetch): 오프라인 상태에서도 PWA 조건 충족을 위한 기본 패치 핸들러
self.addEventListener('fetch', (event) => {
  // 기본적으로 네트워크 요청을 우선하되, 실패 시 처리 (옵션)
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
