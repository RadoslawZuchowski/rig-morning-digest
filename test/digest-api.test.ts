import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDigestApi } from '../src/digest/api.js';
import { readNight } from '../src/digest/read-night.js';

const tempDirs: string[] = [];

function makeRunsDir(night: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-api-'));
  tempDirs.push(dir);
  writeFileSync(join(dir, `${night}.jsonl`), contents);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('GET /:night digest API', () => {
  it('returns the supplied night using the shared reader rows in job order', async () => {
    const response = await createDigestApi('runs').request('/2026-10-28');
    const expected = readNight('runs', '2026-10-28');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ...expected,
      rows: expected.rows.toSorted((left, right) => left.job.localeCompare(right.job)),
    });
  });

  it('returns sorted shared digest rows and the malformed-line count', async () => {
    const dir = makeRunsDir(
      '2026-10-28',
      [
        JSON.stringify({ at: '2026-10-29T05:42:09+01:00', job: 'zeta', status: 'ok', owner: 'rook' }),
        '{not json',
        JSON.stringify({ at: '2026-10-29T05:41:09+01:00', job: 'alpha', status: 'retry', owner: null }),
      ].join('\n'),
    );
    const response = await createDigestApi(dir).request('/2026-10-28');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rows: [{ job: 'alpha' }, { job: 'zeta' }],
      badLines: 1,
    });
  });

  it('returns an empty digest for an empty night file', async () => {
    const dir = makeRunsDir('2026-10-28', '');
    const response = await createDigestApi(dir).request('/2026-10-28');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [], badLines: 0 });
  });

  it('returns 404 when the night file does not exist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-digest-api-'));
    tempDirs.push(dir);
    const response = await createDigestApi(dir).request('/2026-10-28');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'night not found' });
  });

  it('rejects a night value that is not a date path segment', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-digest-api-'));
    tempDirs.push(dir);
    const response = await createDigestApi(dir).request('/..%2Fsecret');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid night' });
  });
});
