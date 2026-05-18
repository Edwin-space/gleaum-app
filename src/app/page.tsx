import type { Metadata } from 'next';
import { RootPageRouter } from '@/components/landing/RootPageRouter';

export const metadata: Metadata = {
  title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
  description: '일정부터 지출까지, 내 삶의 모든 것을 연결하는 스마트 라이프 플랫폼. 개인 일정부터 연인, 가족과의 공유 일정까지 글리움으로 관리하세요.',
};

export default function RootPage() {
  return <RootPageRouter />;
}
