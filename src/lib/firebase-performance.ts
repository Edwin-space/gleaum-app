/**
 * 글리움 — Firebase Performance Monitoring 유틸리티
 *
 * 네이티브: @capacitor-firebase/performance
 * 웹: firebase/performance (JS SDK — 자동으로 네트워크 요청 + 페이지 로드 추적)
 *
 * 사용법:
 *   const trace = await startTrace('budget_load');
 *   // ... 작업 ...
 *   await stopTrace(trace);
 *
 * Firebase 콘솔 → Performance → Custom Traces 에서 결과 확인
 */

import { isNativeApp } from '@/lib/native';

// 웹 Performance 인스턴스 싱글턴
let _webPerf: import('firebase/performance').FirebasePerformance | null = null;

/** 웹 Performance 인스턴스 초기화 */
async function getWebPerf() {
  if (_webPerf) return _webPerf;
  if (typeof window === 'undefined') return null;

  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getPerformance } = await import('firebase/performance');

    const firebaseConfig = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    _webPerf = getPerformance(app);
    return _webPerf;
  } catch (e) {
    console.warn('[Performance] 웹 초기화 실패:', e);
    return null;
  }
}

export type TraceHandle =
  | { type: 'native'; name: string }
  | { type: 'web'; trace: import('firebase/performance').PerformanceTrace };

/**
 * 커스텀 트레이스 시작
 * @param name  트레이스 이름 (Firebase 콘솔에서 이 이름으로 조회)
 */
export async function startTrace(name: string): Promise<TraceHandle | null> {
  try {
    if (isNativeApp()) {
      const { FirebasePerformance } = await import('@capacitor-firebase/performance');
      await FirebasePerformance.startTrace({ traceName: name });
      return { type: 'native', name };
    } else {
      const perf = await getWebPerf();
      if (!perf) return null;
      const { trace } = await import('firebase/performance');
      const t = trace(perf, name);
      t.start();
      return { type: 'web', trace: t };
    }
  } catch (e) {
    console.warn('[Performance] startTrace 실패:', e);
    return null;
  }
}

/**
 * 트레이스 종료
 */
export async function stopTrace(handle: TraceHandle | null): Promise<void> {
  if (!handle) return;
  try {
    if (handle.type === 'native') {
      const { FirebasePerformance } = await import('@capacitor-firebase/performance');
      await FirebasePerformance.stopTrace({ traceName: handle.name });
    } else {
      handle.trace.stop();
    }
  } catch (e) {
    console.warn('[Performance] stopTrace 실패:', e);
  }
}

/**
 * 트레이스에 커스텀 메트릭 값 추가
 */
export async function putMetric(handle: TraceHandle | null, metricName: string, value: number): Promise<void> {
  if (!handle) return;
  try {
    if (handle.type === 'native') {
      const { FirebasePerformance } = await import('@capacitor-firebase/performance');
      await FirebasePerformance.putMetric({ traceName: handle.name, metricName, num: value });
    } else {
      handle.trace.putMetric(metricName, value);
    }
  } catch {
    // silent
  }
}

/**
 * 간편 래퍼 — async 함수 실행 시간을 자동으로 트레이스
 * @example
 *   const expenses = await withTrace('fetch_expenses', () => getSchedules(spaceId));
 */
export async function withTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const handle = await startTrace(name);
  try {
    const result = await fn();
    return result;
  } finally {
    await stopTrace(handle);
  }
}

/** Performance Monitoring 활성/비활성 */
export async function setPerformanceEnabled(enabled: boolean): Promise<void> {
  try {
    if (isNativeApp()) {
      const { FirebasePerformance } = await import('@capacitor-firebase/performance');
      await FirebasePerformance.setEnabled({ enabled });
    } else {
      const perf = await getWebPerf();
      if (perf) {
        const { initializeApp } = await import('firebase/app');
        void initializeApp; // suppress unused warning
        // 웹 SDK는 instrumentationEnabled / dataCollectionEnabled 속성으로 제어
        (perf as { instrumentationEnabled: boolean; dataCollectionEnabled: boolean }).instrumentationEnabled = enabled;
        (perf as { instrumentationEnabled: boolean; dataCollectionEnabled: boolean }).dataCollectionEnabled = enabled;
      }
    }
  } catch (e) {
    console.warn('[Performance] setEnabled 실패:', e);
  }
}
