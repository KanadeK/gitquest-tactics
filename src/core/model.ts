export type CommandKind =
  "commit" | "branch" | "checkout" | "merge" | "rebase" | "cherry-pick";

export interface Commit {
  id: string;
  message: string;
  parents: string[];
  sequence: number;
}

export interface GitState {
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head: { branch: string; commit: string };
  nextSequence: number;
  history: string[];
}

export interface LevelObjective {
  type: "headAt" | "branchAt" | "ancestor" | "branchExists";
  branch?: string;
  target: string;
}

export interface Level {
  id: string;
  title: string;
  brief: string;
  starter: GitState;
  allowed: CommandKind[];
  objective: LevelObjective;
  solution: string[];
}

export type CommandResult =
  | { ok: true; state: GitState; message: string }
  | { ok: false; state: GitState; message: string };

const clone = <T>(value: T): T => structuredClone(value);

export const initialState = (): GitState => ({
  commits: { c0: { id: "c0", message: "root", parents: [], sequence: 0 } },
  branches: { main: "c0" },
  head: { branch: "main", commit: "c0" },
  nextSequence: 1,
  history: [],
});

export const cloneState = (state: GitState): GitState => clone(state);

export const isAncestor = (
  state: GitState,
  ancestor: string,
  descendant: string,
): boolean => {
  const visited = new Set<string>();
  const walk = (id: string): boolean => {
    if (id === ancestor) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return state.commits[id]?.parents.some(walk) ?? false;
  };
  return walk(descendant);
};
