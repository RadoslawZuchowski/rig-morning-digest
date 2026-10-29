import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, ReadNight, RunStatus } from './types.js';

type RunRecord = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

const statuses = new Set<RunStatus>(['ok', 'retry', 'fail']);

function parseRecord(line: string): RunRecord | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.at !== 'string' ||
    Number.isNaN(Date.parse(record.at)) ||
    typeof record.job !== 'string' ||
    record.job.length === 0 ||
    typeof record.status !== 'string' ||
    !statuses.has(record.status as RunStatus) ||
    !(typeof record.owner === 'string' || record.owner === null) ||
    (record.error !== undefined && typeof record.error !== 'string')
  ) {
    return null;
  }

  return {
    at: record.at,
    job: record.job,
    status: record.status as RunStatus,
    owner: record.owner,
    ...(typeof record.error === 'string' ? { error: record.error } : {}),
  };
}

function compareTimes(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right);
}

export const readNight: ReadNight = (runsDir, night) => {
  const contents = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const jobs = new Map<string, DigestRow>();
  let badLines = 0;

  for (const line of contents.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const record = parseRecord(line);
    if (record === null) {
      badLines += 1;
      continue;
    }

    const row = jobs.get(record.job);
    if (row === undefined) {
      jobs.set(record.job, {
        job: record.job,
        owner: record.owner,
        runs: 1,
        retries: record.status === 'retry' ? 1 : 0,
        lastStatus: record.status,
        lastError: record.error ?? null,
        firstAt: record.at,
        lastAt: record.at,
      });
      continue;
    }

    row.runs += 1;
    if (record.status === 'retry') row.retries += 1;
    if (compareTimes(record.at, row.firstAt) < 0) row.firstAt = record.at;
    if (compareTimes(record.at, row.lastAt) >= 0) {
      row.lastAt = record.at;
      row.lastStatus = record.status;
      row.owner = record.owner;
    }
    if (record.error !== undefined) row.lastError = record.error;
  }

  return { rows: [...jobs.values()], badLines };
};
