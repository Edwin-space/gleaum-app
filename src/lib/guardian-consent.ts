export const GUARDIAN_POLICY_VERSION = '2026-07-13-email-v1';

export const REQUIRED_GUARDIAN_CONSENTS = [
  'service_registration',
  'personal_data_processing',
  'family_data_sharing',
] as const;

export function getPublicAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production' && configured) return configured;
  return configured === 'https://www.gleaum.com' ? configured : 'https://www.gleaum.com';
}
