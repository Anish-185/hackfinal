import { EVENT, NAME, REPO_URL, TEAM, TEAM_LINE } from "@/lib/site";

export default function Team() {
  return (
    <footer className="section dark team" id="team">
      <div className="wrap">
        <p className="label">Team</p>
        <ul className="team-list">
          {TEAM.map((m) => (
            <li key={m.name}>
              <span className="display team-name">{m.name}</span>
              {m.role && <span className="small">{m.role}</span>}
            </li>
          ))}
        </ul>
        <div className="team-foot">
          <p>
            {TEAM_LINE}, {EVENT}.
          </p>
          <p>
            <a href={REPO_URL}>Source on GitHub</a>
          </p>
          <p className="display team-mark" aria-hidden>{NAME}</p>
        </div>
      </div>
    </footer>
  );
}
