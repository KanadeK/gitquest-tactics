import { useMemo, useState } from "react";
import { scalePoint } from "d3-scale";
import { z } from "zod";
import { executeCommand } from "../core/engine";
import { levels, objectiveMet } from "../core/levels";
import { cloneState } from "../core/model";
import type { GitState, Level } from "../core/model";

const levelSchema = z.object({
  id: z.string(),
  title: z.string(),
  brief: z.string(),
  allowed: z.array(z.string()),
  objective: z.object({
    type: z.string(),
    target: z.string(),
    branch: z.string().optional(),
  }),
});
const Graph = ({ state }: { state: GitState }) => {
  const commits = Object.values(state.commits).sort(
    (a, b) => a.sequence - b.sequence,
  );
  const x = scalePoint(
    commits.map((commit) => commit.id),
    [40, 660],
  ).padding(0.4);
  return (
    <svg
      className="graph"
      viewBox="0 0 700 230"
      role="img"
      aria-label="Commit graph"
    >
      {commits.flatMap((commit) =>
        commit.parents.map((parent) => (
          <line
            key={`${commit.id}-${parent}`}
            x1={x(parent)}
            y1="120"
            x2={x(commit.id)}
            y2="120"
            className="edge"
          />
        )),
      )}
      {commits.map((commit) => (
        <g key={commit.id} transform={`translate(${x(commit.id)},120)`}>
          <circle
            r="21"
            className={commit.id === state.head.commit ? "node head" : "node"}
          />
          <text y="5" textAnchor="middle">
            {commit.id}
          </text>
          <text y="45" textAnchor="middle" className="message">
            {commit.message}
          </text>
        </g>
      ))}
      {Object.entries(state.branches).map(([name, commit], index) => (
        <text
          key={name}
          x={x(commit)}
          y={28 + index * 20}
          textAnchor="middle"
          className={name === state.head.branch ? "branch active" : "branch"}
        >
          {name === state.head.branch ? `HEAD → ${name}` : name}
        </text>
      ))}
    </svg>
  );
};

const sample = (level: Level) =>
  JSON.stringify(
    {
      id: level.id,
      title: level.title,
      brief: level.brief,
      allowed: level.allowed,
      objective: level.objective,
    },
    null,
    2,
  );

export function App() {
  const [selected, setSelected] = useState(0);
  const [state, setState] = useState<GitState>(() =>
    cloneState(levels[0].starter),
  );
  const [command, setCommand] = useState("");
  const [feedback, setFeedback] = useState(
    "Mission ready. Your graph is the source of truth.",
  );
  const [editor, setEditor] = useState(() => sample(levels[0]));
  const level = levels[selected];
  const completed = objectiveMet(level, state);
  const progress = useMemo(
    () =>
      levels.filter((item) => item.id === level.id && objectiveMet(item, state))
        .length,
    [level.id, state],
  );
  const choose = (index: number) => {
    setSelected(index);
    setState(cloneState(levels[index].starter));
    setEditor(sample(levels[index]));
    setCommand("");
    setFeedback("Mission reset with its deterministic starter graph.");
  };
  const run = () => {
    const result = executeCommand(command, state, level.allowed);
    setState(result.state);
    setFeedback(result.message);
    if (result.ok) setCommand("");
  };
  const reset = () => {
    setState(cloneState(level.starter));
    setFeedback("Starter graph restored.");
  };
  const validateEditor = () => {
    try {
      const parsed = levelSchema.safeParse(JSON.parse(editor));
      setFeedback(
        parsed.success
          ? "Level JSON is valid: portable schema accepted."
          : `Invalid level schema: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
      );
    } catch {
      setFeedback("Invalid JSON syntax.");
    }
  };
  const download = () => {
    const blob = new Blob([editor], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${level.id}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    setFeedback("Level JSON exported.");
  };
  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">GitQuest Tactics</p>
          <h1>Learn Git by changing a real commit graph.</h1>
        </div>
        <p className="status">12 offline missions · v0.1.0</p>
      </header>
      <section className="workspace" aria-label="Git learning workspace">
        <nav aria-label="Missions">
          <h2>Missions</h2>
          {levels.map((item, index) => (
            <button
              key={item.id}
              className={index === selected ? "mission current" : "mission"}
              onClick={() => choose(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </nav>
        <section className="board">
          <div className="brief">
            <div>
              <p className="eyebrow">Mission {selected + 1} / 12</p>
              <h2>{level.title}</h2>
              <p>{level.brief}</p>
            </div>
            <div className={completed ? "result complete" : "result"}>
              {completed ? "Objective met" : "Objective open"}
              <small>{progress}/1 current objective</small>
            </div>
          </div>
          <Graph state={state} />
          <p className="feedback" role="status">
            {feedback}
          </p>
          <div className="command-row">
            <label htmlFor="command">Controlled Git command</label>
            <input
              id="command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") run();
              }}
              placeholder="e.g. branch feature"
            />
            <button className="primary" onClick={run}>
              Run command
            </button>
            <button onClick={reset}>Reset</button>
          </div>
          <div className="allowed">
            <strong>Allowed:</strong>{" "}
            {level.allowed.map((action) => (
              <code key={action}>{action}</code>
            ))}
          </div>
        </section>
      </section>
      <section className="editor">
        <div>
          <p className="eyebrow">Level editor</p>
          <h2>Portable JSON, validated before export</h2>
          <p>
            Edit the visible lesson metadata, validate it locally, then export a
            reproducible fixture.
          </p>
        </div>
        <textarea
          aria-label="Level JSON editor"
          value={editor}
          onChange={(event) => setEditor(event.target.value)}
          spellCheck="false"
        />
        <div className="editor-actions">
          <button onClick={validateEditor}>Validate JSON</button>
          <button onClick={download}>Export JSON</button>
        </div>
      </section>
      <footer>
        Sandboxed in your browser. No credentials, repositories, or network
        calls are needed to play.
      </footer>
    </main>
  );
}
