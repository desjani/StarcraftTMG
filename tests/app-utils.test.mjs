import assert from 'assert/strict';
import {
  isDebugEnabled,
  classifyError,
  getUserFacingError,
  createDebugLogger,
} from '../web/public/appUtils.js';

function fakeStorage(value) {
  return {
    getItem(key) {
      if (key !== 'sctmg.debug') return null;
      return value;
    },
  };
}

export async function run({ test }) {
  test('[utils] isDebugEnabled returns true for query flag', () => {
    assert.equal(isDebugEnabled('?debug=1', null), true);
    assert.equal(isDebugEnabled('?debug=true', null), true);
  });

  test('[utils] isDebugEnabled returns true for storage flag', () => {
    assert.equal(isDebugEnabled('', fakeStorage('yes')), true);
  });

  test('[utils] isDebugEnabled returns false by default', () => {
    assert.equal(isDebugEnabled('', null), false);
  });

  test('[utils] classifyError marks retryable HTTP statuses', () => {
    assert.equal(classifyError({ status: 429 }).retryable, true);
    assert.equal(classifyError({ status: 503 }).retryable, true);
    assert.equal(classifyError({ status: 404 }).retryable, false);
  });

  test('[utils] getUserFacingError includes retry hint when retryable', () => {
    const message = getUserFacingError('Load roster', { status: 503, message: 'Service unavailable' });
    assert.ok(message.includes('Try again in a moment'));
  });

  test('[utils] createDebugLogger no-ops when disabled', () => {
    const calls = [];
    const sink = {
      log: (...args) => calls.push(['log', ...args]),
      error: (...args) => calls.push(['error', ...args]),
    };
    const logger = createDebugLogger({ search: '', storage: null, sink, now: () => 'now' });
    logger.log('x', { a: 1 });
    logger.error('y', new Error('boom'));
    assert.equal(logger.enabled, false);
    assert.equal(calls.length, 0);
  });

  test('[utils] createDebugLogger emits structured payload when enabled', () => {
    const calls = [];
    const sink = {
      log: (...args) => calls.push(['log', ...args]),
      error: (...args) => calls.push(['error', ...args]),
    };
    const logger = createDebugLogger({ search: '?debug=1', storage: null, sink, now: () => 'now' });
    logger.log('load.start', { seed: 'ABC123' });
    logger.error('load.error', { message: 'x', status: 500 }, { seed: 'ABC123' });
    assert.equal(logger.enabled, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0][1], '[sctmg-debug]');
    assert.equal(calls[1][1], '[sctmg-debug]');
  });
}
