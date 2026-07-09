import type { Metadata } from 'next';
import { RootPageRouter } from '@/components/landing/RootPageRouter';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';

export const metadata: Metadata = {
  title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
  description: '일정부터 지출까지, 내 삶의 모든 것을 연결하는 스마트 라이프 플랫폼. 개인 일정부터 연인, 가족과의 공유 일정까지 글리움으로 관리하세요.',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '글리움',
  alternateName: 'Gleaum',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Android',
  url: 'https://gleaum.com',
  downloadUrl: PLAY_STORE_URL,
  installUrl: PLAY_STORE_URL,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    url: PLAY_STORE_URL,
  },
  description: '나, 연인, 가족, 모임의 일정과 자금 흐름을 함께 관리하는 일상 네트워크 서비스입니다.',
  inLanguage: 'ko-KR',
  publisher: {
    '@type': 'Organization',
    name: 'Gleaum',
    url: 'https://gleaum.com',
  },
};

export default function RootPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <RootPageRouter />
    </>
  );
}
