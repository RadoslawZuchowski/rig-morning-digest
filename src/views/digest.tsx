import type { DigestNight, DigestRow } from '../digest/types.js';

function rowClass(row: DigestRow): string | undefined {
  return row.lastStatus === 'fail' || row.retries >= 3 ? 'warn' : undefined;
}

export function DigestPage({ night, digest }: { night: string; digest: DigestNight }) {
  const rows = [...digest.rows].sort((left, right) => left.job.localeCompare(right.job));

  return (
    <>
      <h1>digest · {night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first time</th>
              <th>last time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr class={rowClass(row)}>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {digest.badLines > 0 && (
        <p class="mute">{digest.badLines} malformed {digest.badLines === 1 ? 'line' : 'lines'} skipped</p>
      )}
    </>
  );
}
