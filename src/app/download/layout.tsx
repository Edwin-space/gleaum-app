import type { Metadata } from 'next';

const SITE_URL = 'https://gleaum.com';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';
const ANDROID_PACKAGE = 'com.gleaum.app';

export const metadata: Metadata = {
  title: '글리움 Android 앱 다운로드 — Google Play',
  description: 'Google Play에서 글리움 Android 앱을 설치하고 일정, 공간, 가계부를 한 곳에서 관리하세요.',
  alternates: {
    canonical: `${SITE_URL}/download`,
  },
  appLinks: {
    android: {
      package: ANDROID_PACKAGE,
      app_name: '글리움',
      url: `${SITE_URL}/download`,
    },
    web: {
      url: `${SITE_URL}/download`,
      should_fallback: true,
    },
  },
  openGraph: {
    title: '글리움 Android 앱 다운로드',
    description: 'Google Play에서 글리움 Android 앱을 설치하세요.',
    url: `${SITE_URL}/download`,
    type: 'website',
  },
  other: {
    'google-play-app': `app-id=${ANDROID_PACKAGE}`,
    'application-url': PLAY_STORE_URL,
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
