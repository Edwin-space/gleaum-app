export const FAMILY_CHILD_INVITE_DURATION_HOURS = 72;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const INVITE_TOKEN_PATTERN = /^gfc_[a-f0-9]{48}$/;

export function normalizeOptionalChildEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function isValidOptionalChildEmail(email: string | undefined): boolean {
  return email === undefined || EMAIL_PATTERN.test(email);
}

export function isFamilyChildInviteToken(value: string): boolean {
  return INVITE_TOKEN_PATTERN.test(value);
}

export function buildChildInviteShareText(displayName: string, inviteUrl: string): string {
  return [
    `${displayName.trim()}님, 글리움 가족 공간 초대가 도착했습니다.`,
    '아래 링크를 열고 본인이 사용할 계정으로 로그인해 연결을 요청해 주세요.',
    inviteUrl,
    `링크는 ${FAMILY_CHILD_INVITE_DURATION_HOURS}시간 동안 한 번만 사용할 수 있으며, 보호자가 최종 승인해야 연결됩니다.`,
  ].join('\n\n');
}
