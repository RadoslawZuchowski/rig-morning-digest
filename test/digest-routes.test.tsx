import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

const tempDirs: string[] = [];

const config: RigConfig = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: '',
};

function makeRunsDir(contents?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-routes-'));
  tempDirs.push(dir);
  if (contents !== undefined) writeFileSync(join(dir, '2026-10-28.jsonl'), contents);
  return dir;
}

function appForRunsDir(runsDir: string) {
  return createApp({ ...config, runsDir });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('digest routes', () => {
  it('serves the digest page and JSON API for a night with rows', async () => {
    const dir = makeRunsDir(
      JSON.stringify({ at: '2026-10-29T05:41:09+01:00', job: 'digest/render', status: 'ok', owner: 'rook' }),
    );
    const app = appForRunsDir(dir);

    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    const api = await app.request('/api/digest/2026-10-28');

    expect(page.status).toBe(200);
    expect(html).toContain('digest/render');
    expect(api.status).toBe(200);
    expect(await api.json()).toMatchObject({
      rows: [{ job: 'digest/render', owner: 'rook' }],
      badLines: 0,
    });
  });

  it('returns 404 from both routes when the night file is missing', async () => {
    const app = appForRunsDir(makeRunsDir());

    const page = await app.request('/digest/2026-10-28');
    const api = await app.request('/api/digest/2026-10-28');

    expect(page.status).toBe(404);
    expect(api.status).toBe(404);
  });

  it('serves an empty night on both routes', async () => {
    const app = appForRunsDir(makeRunsDir(''));

    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    const api = await app.request('/api/digest/2026-10-28');

    expect(page.status).toBe(200);
    expect(html).toContain('nothing ran');
    expect(api.status).toBe(200);
    expect(await api.json()).toEqual({ rows: [], badLines: 0 });
  });

  it('keeps serving a night with a malformed line and reports its count', async () => {
    const dir = makeRunsDir(
      [
        JSON.stringify({ at: '2026-10-29T05:41:09+01:00', job: 'digest/render', status: 'ok', owner: 'rook' }),
        '{not json',
      ].join('\n'),
    );
    const app = appForRunsDir(dir);

    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    const api = await app.request('/api/digest/2026-10-28');

    expect(page.status).toBe(200);
    expect(html).toContain('digest/render');
    expect(api.status).toBe(200);
    expect(await api.json()).toMatchObject({
      rows: [{ job: 'digest/render' }],
      badLines: 1,
    });
  });
});
