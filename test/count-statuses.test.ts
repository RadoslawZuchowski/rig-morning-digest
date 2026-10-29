import { describe, expect, it } from 'vitest';
import { countStatuses } from '../src/digest/count-statuses.js';
import type { DigestRow } from '../src/digest/types.js';

function row(lastStatus: DigestRow['lastStatus']): DigestRow {
  return {
    job: 'job',
    owner: null,
    runs: 1,
    retries: 0,
    lastStatus,
    lastError: null,
    firstAt: '2026-10-29T05:41:09+01:00',
    lastAt: '2026-10-29T05:41:09+01:00',
  };
}

describe('countStatuses', () => {
  it('counts each job by its last status and keeps missing statuses at zero', () => {
    expect(countStatuses([row('ok'), row('ok'), row('retry'), row('fail')])).toEqual({
      ok: 2,
      retry: 1,
      fail: 1,
    });
    expect(countStatuses([])).toEqual({ ok: 0, retry: 0, fail: 0 });
  });
});
