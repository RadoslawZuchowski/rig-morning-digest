import { Hono } from 'hono';
import { readNight } from './read-night.js';
import type { DigestRow } from './types.js';

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function compareJobs(left: DigestRow, right: DigestRow): number {
  return left.job.localeCompare(right.job);
}

export function createDigestApi(runsDir: string): Hono {
  const app = new Hono();

  app.get('/:night', (c) => {
    const { night } = c.req.param();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) {
      return c.json({ error: 'invalid night' }, 400);
    }

    try {
      const digest = readNight(runsDir, night);
      return c.json({ ...digest, rows: digest.rows.toSorted(compareJobs) });
    } catch (error) {
      if (isMissingFile(error)) return c.json({ error: 'night not found' }, 404);
      throw error;
    }
  });

  return app;
}
