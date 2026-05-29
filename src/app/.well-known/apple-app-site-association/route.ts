/**
 * iOS Universal Links 설정 파일
 * Content-Type: application/json 으로 서빙 (iOS 요구사항)
 *
 * 앱 ID: JBN99YZ7KN.com.gleaum.app
 * Team ID: JBN99YZ7KN
 * Bundle ID: com.gleaum.app
 */
import { NextResponse } from 'next/server';

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'JBN99YZ7KN.com.gleaum.app',
        paths: [
          '/invite/*',
          '/space/*/join',
          '/home',
          '/schedules/*',
          '/auth/callback',
        ],
      },
    ],
  },
  webcredentials: {
    apps: ['JBN99YZ7KN.com.gleaum.app'],
  },
};

export async function GET() {
  return NextResponse.json(aasa, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
