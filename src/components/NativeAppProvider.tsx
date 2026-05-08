'use client';

/**
 * NativeAppProvider
 *
 * 앱 마운트 시 네이티브 초기화 작업을 수행합니다:
 * 1. 스플래시 스크린 숨기기
 * 2. 상태바 스타일 설정
 * 3. Android 뒤로가기 버튼 처리
 * 4. 앱 리쥬머(포그라운드 복귀) 리스너 등록
 *
 * 웹 환경에서는 모든 로직을 조용히 무시합니다.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  hideSplash,
  setStatusBarDark,
  onAndroidBackButton,
  isNativeApp,
} from '@/lib/native';

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    // 1. 스플래시 숨기기 (약간의 딜레이로 첫 렌더 완료 후 제거)
    const splashTimer = setTimeout(async () => {
      await hideSplash();
    }, 300);

    // 2. 상태바 다크 스타일 적용
    setStatusBarDark();

    // 3. Android 뒤로가기 버튼: 히스토리 기반 이동
    let removeBackButton: (() => void) | undefined;
    onAndroidBackButton(() => {
      // 히스토리가 있으면 뒤로, 없으면 앱 홈으로
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/home');
      }
    }).then((remove) => {
      removeBackButton = remove;
    });

    return () => {
      clearTimeout(splashTimer);
      removeBackButton?.();
    };
  }, [router]);

  return <>{children}</>;
}
