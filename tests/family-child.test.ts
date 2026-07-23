import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildChildInviteShareText,
  isFamilyChildInviteToken,
  isValidOptionalChildEmail,
  normalizeOptionalChildEmail,
} from '../src/lib/family-child';

test('child registration accepts a missing email and normalizes an optional restriction', () => {
  assert.equal(normalizeOptionalChildEmail(undefined), undefined);
  assert.equal(normalizeOptionalChildEmail('   '), undefined);
  assert.equal(normalizeOptionalChildEmail(' Child@Example.COM '), 'child@example.com');
  assert.equal(isValidOptionalChildEmail(undefined), true);
  assert.equal(isValidOptionalChildEmail('child@example.com'), true);
  assert.equal(isValidOptionalChildEmail('not-an-email'), false);
});

test('child invitation accepts only the 72-hour one-time token format', () => {
  assert.equal(isFamilyChildInviteToken(`gfc_${'a'.repeat(48)}`), true);
  assert.equal(isFamilyChildInviteToken(`gfc_${'A'.repeat(48)}`), false);
  assert.equal(isFamilyChildInviteToken(`gfc_${'a'.repeat(47)}`), false);
  assert.equal(isFamilyChildInviteToken('GLEAUM-ABC123'), false);
});

test('share copy explains account choice, expiry, and final guardian approval', () => {
  const text = buildChildInviteShareText('해솔', 'https://www.gleaum.com/invite/child/example');
  assert.match(text, /본인이 사용할 계정/);
  assert.match(text, /72시간/);
  assert.match(text, /보호자가 최종 승인/);
  assert.match(text, /https:\/\/www\.gleaum\.com\/invite\/child\/example/);
});
