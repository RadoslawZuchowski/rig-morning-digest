import type { ReadNight } from '../digest/types.js';
import { countStatuses } from '../digest/count-statuses.js';

export function NightDigests(props: { nights: string[]; runsDir: string; readNight: ReadNight }) {
  if (props.nights.length === 0) return <p class="mute">nothing in runs/</p>;

  return (
    <ul>
      {props.nights.map((night) => {
        const { rows } = props.readNight(props.runsDir, night);
        const counts = countStatuses(rows);

        return (
          <li>
            <a href={`/digest/${encodeURIComponent(night)}`}>{night}</a>
            {' · '}
            <span>ok {counts.ok} · retry {counts.retry} · fail {counts.fail}</span>
          </li>
        );
      })}
    </ul>
  );
}
