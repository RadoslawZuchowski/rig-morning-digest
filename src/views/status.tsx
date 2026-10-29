import type { Status } from '../status.js';
import { readNight } from '../digest/read-night.js';
import type { ReadNight } from '../digest/types.js';
import { NightDigests } from './night-digests.js';

export function StatusBoard({
  status,
  runsDir = 'runs',
  readNight: readNightFn = readNight,
}: {
  status: Status;
  runsDir?: string;
  readNight?: ReadNight;
}) {
  return (
    <>
      <h1>status</h1>
      <table>
        <tbody>
          <tr><th>adapter</th><td>{status.adapter}</td></tr>
          <tr><th>installed</th><td>{status.installed}</td></tr>
          <tr>
            <th>last beat</th>
            <td>{status.lastBeat ? `${status.lastBeat.at} · pid ${status.lastBeat.pid}` : <span class="warn">none</span>}</td>
          </tr>
        </tbody>
      </table>
      <h2>nights on disk</h2>
      <NightDigests nights={status.nights} runsDir={runsDir} readNight={readNightFn} />
    </>
  );
}
