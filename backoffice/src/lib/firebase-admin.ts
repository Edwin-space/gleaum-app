/**
 * 백오피스 — Firebase Admin 공통 유틸 (서버 전용)
 *
 * FIREBASE_SERVICE_ACCOUNT_BASE64: Firebase 서비스 계정 JSON을 base64 인코딩한 값
 * (FCM에서 이미 사용 중인 환경변수와 동일)
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gleaum-firebase';
const DEFAULT_ANDROID_APP_ID = '1:913127709928:android:c4334b982b98b282febd5d';
const ANDROID_APP_ID = process.env.FIREBASE_ANDROID_APP_ID || DEFAULT_ANDROID_APP_ID;
const PROJECT_NUMBER = process.env.FIREBASE_PROJECT_NUMBER || ANDROID_APP_ID.split(':')[1];

export { PROJECT_ID, PROJECT_NUMBER };

/** Firebase 서비스 계정으로 Google OAuth 액세스 토큰 발급 */
export async function getFirebaseAccessToken(scope: string): Promise<string> {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수 미설정');

  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  const auth = new GoogleAuth({ credentials, scopes: [scope] });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error('액세스 토큰 발급 실패');
  return tokenResponse.token;
}

// ── App Distribution ────────────────────────────────────────────────
export { ANDROID_APP_ID };
export const DIST_BASE = `https://firebaseappdistribution.googleapis.com/v1`;
export const DIST_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

// ── Remote Config ───────────────────────────────────────────────────
export const RC_BASE  = `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_ID}/remoteConfig`;
export const RC_SCOPE = 'https://www.googleapis.com/auth/firebase.remoteconfig';
