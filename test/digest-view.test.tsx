import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { DigestRow } from '../src/digest/types.js';
import { DigestPage } from '../src/views/digest.js';

const row = (job: string, overrides: Partial<DigestRow> = {}): DigestRow => ({
  job,
  owner: 'rook',
  runs: 1,
  retries: 0,
  lastStatus: 'ok',
  lastError: null,
  firstAt: '2026-10-29T01:30:00+01:00',
  lastAt: '2026-10-29T01:30:00+01:00',
  ...overrides,
});

async function renderDigest(rows: DigestRow[], badLines = 0): Promise<Response> {
  const app = new Hono();
  app.get('/', (c) => c.html(<DigestPage night="2026-10-28" digest={{ rows, badLines }} />));
  return await app.request('/');
}

describe('DigestPage', () => {
  it('sorts jobs and marks retries of three or more and failed jobs', async () => {
    const response = await renderDigest([
      row('z-last'),
      row('a-retried', { retries: 3 }),
      row('m-failed', { lastStatus: 'fail' }),
    ]);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html.indexOf('a-retried')).toBeLessThan(html.indexOf('m-failed'));
    expect(html.indexOf('m-failed')).toBeLessThan(html.indexOf('z-last'));
    expect(html).toMatch(/<tr class="warn"><td>a-retried/);
    expect(html).toMatch(/<tr class="warn"><td>m-failed/);
    expect(html).toContain('2026-10-28');
  });

  it('shows missing owner and last error as em dashes and reports malformed lines', async () => {
    const response = await renderDigest([row('digest/render', { owner: null })], 1);
    const html = await response.text();

    expect(html).toContain('digest/render');
    expect(html).toContain('—');
    expect(html).toContain('1 malformed line skipped');
  });

  it('renders “nothing ran” when there are no rows', async () => {
    const response = await renderDigest([]);

    expect(await response.text()).toContain('nothing ran');
  });
});
