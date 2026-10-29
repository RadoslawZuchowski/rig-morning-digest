import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

const tempDirs: string[] = [];

function makeRunsDir(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  tempDirs.push(dir);
  writeFileSync(join(dir, '2026-10-28.jsonl'), contents);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('readNight', () => {
  it('aggregates the supplied night into five jobs and counts its malformed line', () => {
    const result = readNight('runs', '2026-10-28');

    expect(result.rows).toHaveLength(5);
    expect(result.badLines).toBe(1);
    expect(result.rows.find(({ job }) => job === 'fixtures/refresh')).toMatchObject({
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      owner: 'rook',
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
    expect(result.rows.find(({ job }) => job === 'digest/render')?.owner).toBeNull();
  });

  it('retains a null owner and counts invalid JSON and invalid records without throwing', () => {
    const dir = makeRunsDir(
      [
        JSON.stringify({ at: '2026-10-29T05:41:09+01:00', job: 'digest/render', status: 'ok', owner: null }),
        '{not json',
        JSON.stringify({ at: '2026-10-29T05:42:09+01:00', job: 'unknown', status: 'success', owner: 'rook' }),
      ].join('\n'),
    );

    expect(readNight(dir, '2026-10-28')).toEqual({
      rows: [
        {
          job: 'digest/render',
          owner: null,
          runs: 1,
          retries: 0,
          lastStatus: 'ok',
          lastError: null,
          firstAt: '2026-10-29T05:41:09+01:00',
          lastAt: '2026-10-29T05:41:09+01:00',
        },
      ],
      badLines: 2,
    });
  });
});
