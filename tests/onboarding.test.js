import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetupDraft, getSetupProgress, validateSetupDraft } from '../js/domain/onboarding.js';
import { createProfileDraft, defaultProfile } from '../js/domain/profile.js';

const profile = () => createProfileDraft({ sex: 'male', age: 35, height: 180, weight: 80, activity: 'moderate', goal: 'maintain' });
const signedIn = overrides => getSetupProgress({ authenticated: true, ...overrides });

test('without an authenticated account cached profile and plan flags cannot bypass access', () => {
  const progress = getSetupProgress({ authenticated: false, profile: profile(), profileConfirmed: true, hasConfirmedPlan: true });
  assert.equal(progress.stage, 'account_required');
  assert.equal(progress.destination, 'auth');
  assert.equal(progress.canGenerateMenu, false);
});

test('new accounts distinguish no profile, partial data and unconfirmed complete data', () => {
  assert.equal(signedIn().stage, 'profile_missing');
  assert.equal(signedIn().step, 'about');
  const draft = createSetupDraft();
  draft.profile = createProfileDraft({ sex: 'male', age: 35, height: 180, weight: 80 });
  const partial = signedIn({ draft });
  assert.equal(partial.stage, 'profile_incomplete');
  assert.equal(partial.step, 'goal');
  draft.profile = profile();
  const complete = signedIn({ draft });
  assert.equal(complete.stage, 'profile_incomplete');
  assert.equal(complete.profileReady, false);
  assert.equal(complete.canGenerateMenu, false);
});

test('sync initialization, an example profile and a saved date are not explicit profile confirmation', () => {
  const draft = createSetupDraft();
  draft.startDate = '2026-10-22';
  draft.preferencesReviewed = true;
  const progress = signedIn({ profile: defaultProfile(), profileConfirmed: false, draft,
    hasConfirmedPlan: true, stateInitialized: true });
  assert.equal(progress.stage, 'profile_incomplete');
  assert.equal(progress.step, 'about');
  assert.equal(progress.canGenerateMenu, false);
});

test('a confirmation flag on an invalid profile cannot authorize menu generation', () => {
  const progress = signedIn({ profile: { ...profile(), weight: 0 }, profileConfirmed: true, hasConfirmedPlan: true });
  assert.equal(progress.stage, 'profile_incomplete');
  assert.equal(progress.needsProfileReview, true);
  assert.equal(progress.canGenerateMenu, false);
});

test('confirmed profile resumes optional preferences or menu review without inventing a confirmed plan', () => {
  const input = { profile: profile(), profileConfirmed: true };
  const progress = signedIn(input);
  assert.equal(progress.stage, 'plan_pending');
  assert.equal(progress.step, 'preferences');
  assert.equal(progress.canGenerateMenu, true);
  const draft = createSetupDraft();
  draft.preferencesReviewed = true;
  draft.startDate = '2026-10-22';
  assert.equal(signedIn({ ...input, draft }).step, 'menu');
  assert.equal(signedIn({ ...input, draft }).stage, 'plan_pending');
  assert.equal(signedIn({ ...input, draft, hasConfirmedPlan: true }).stage, 'ready');
});

test('a previously confirmed plan establishes setup even after its start date has passed', () => {
  const draft = createSetupDraft();
  draft.preferencesReviewed = true;
  draft.startDate = '2020-01-01';
  const progress = signedIn({ profile: profile(), profileConfirmed: true, hasConfirmedPlan: true, draft });
  assert.equal(progress.destination, 'app');
  assert.equal(progress.step, null);
  // Cycle expiry belongs to cycle-shopping, not to the first-use state machine.
  assert.equal(progress.stage, 'ready');
});

test('legacy users keep app access and plans while an unreviewed profile blocks only new generation', () => {
  const input = { mode: 'legacy', profile: profile(), hasLegacyPlan: true };
  const before = structuredClone(input);
  const unreviewed = signedIn(input);
  assert.equal(unreviewed.destination, 'app');
  assert.equal(unreviewed.needsProfileReview, true);
  assert.equal(unreviewed.canGenerateMenu, false);
  assert.deepEqual(input, before);
  assert.equal(signedIn({ ...input, profileConfirmed: true }).stage, 'ready');
  assert.equal(signedIn({ ...input, mode: 'guided', profileConfirmed: true }).stage, 'plan_pending');
});

test('partial setup survives serialization and invalid drafts are rejected instead of silently reset', () => {
  const draft = createSetupDraft();
  draft.profile = createProfileDraft({ age: 35, weight: 80 });
  const roundTrip = JSON.parse(JSON.stringify(draft));
  assert.equal(validateSetupDraft(roundTrip).valid, true);
  assert.deepEqual(signedIn({ draft: roundTrip }), signedIn({ draft }));
  for (const invalid of [{ ...draft, v: 2 }, { ...draft, startDate: '2026-02-30' },
    { ...draft, preferencesReviewed: 'true' }, { ...draft, profile: { ...draft.profile, age: 150 } },
    { ...draft, profile: {} }, { ...draft, completed: true }]) {
    assert.equal(validateSetupDraft(invalid).valid, false);
    assert.throws(() => signedIn({ draft: invalid }), TypeError);
  }
  assert.throws(() => signedIn({ mode: 'unknown' }), TypeError);
});
