import test from 'node:test';
import assert from 'node:assert/strict';
import { isNotificationEnabled } from '../src/lib/notification-settings';

test('legacy or missing notification settings remain enabled', () => {
  assert.equal(isNotificationEnabled(null, 'scheduleReminders'), true);
  assert.equal(isNotificationEnabled({}, 'expenseReminders'), true);
});

test('only an explicit false disables its notification category', () => {
  const settings = { scheduleReminders: false, expenseReminders: true };
  assert.equal(isNotificationEnabled(settings, 'scheduleReminders'), false);
  assert.equal(isNotificationEnabled(settings, 'expenseReminders'), true);
  assert.equal(isNotificationEnabled(settings, 'routineReminders'), true);
});
