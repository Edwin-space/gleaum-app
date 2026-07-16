const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function getConfiguredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export function isAdminPolicyConfigured(): boolean {
  return getConfiguredAdminEmails().size > 0;
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getConfiguredAdminEmails().has(normalizeEmail(email));
}
