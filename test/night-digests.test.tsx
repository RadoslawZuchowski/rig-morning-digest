import { describe, expect, it } from 'vitest';
import { renderToString } from 'hono/jsx/dom/server';
import { NightDigests } from '../src/views/night-digests.js';

describe('NightDigests', () => {
  it('links each night and shows job counts by last status', () => {
    const html = renderToString(
      <NightDigests
        nights={['2026-10-28']}
        runsDir="runs"
        readNight={() => ({
          rows: [
            { job: 'alpha', owner: null, runs: 1, retries: 0, lastStatus: 'ok', lastError: null, firstAt: '', lastAt: '' },
            { job: 'beta', owner: null, runs: 2, retries: 1, lastStatus: 'retry', lastError: null, firstAt: '', lastAt: '' },
            { job: 'gamma', owner: null, runs: 1, retries: 0, lastStatus: 'fail', lastError: null, firstAt: '', lastAt: '' },
          ],
          badLines: 0,
        })}
      />,
    );

    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('ok 1 · retry 1 · fail 1');
  });

  it('renders an empty-state message when there are no nights', () => {
    const html = renderToString(<NightDigests nights={[]} runsDir="runs" readNight={() => ({ rows: [], badLines: 0 })} />);

    expect(html).toContain('nothing in runs/');
  });
});
