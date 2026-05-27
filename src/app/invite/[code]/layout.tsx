import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '글리움 초대 — 함께 사용해보세요',
  description: '글리움 공간에 초대받으셨습니다. 연인·가족·모임의 일정, 가계부, 할 일을 한 공간에서 함께 관리하세요.',
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
