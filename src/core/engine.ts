import type { CommandKind, CommandResult, GitState } from "./model";
import { cloneState, isAncestor } from "./model";

const failure = (state: GitState, message: string): CommandResult => ({
  ok: false,
  state,
  message,
});
const success = (state: GitState, message: string): CommandResult => ({
  ok: true,
  state,
  message,
});
const commitId = (state: GitState) => `c${state.nextSequence}`;
const commandType = (input: string): CommandKind | undefined =>
  input.trim().split(/\s+/)[0]?.replace("git-", "") as CommandKind;

export function executeCommand(
  input: string,
  source: GitState,
  allowed?: CommandKind[],
): CommandResult {
  const state = cloneState(source);
  const [verb, ...args] = input.trim().split(/\s+/);
  const kind = commandType(input);
  if (!verb) return failure(source, "Enter a Git command.");
  if (
    !kind ||
    ![
      "commit",
      "branch",
      "checkout",
      "merge",
      "rebase",
      "cherry-pick",
    ].includes(kind)
  )
    return failure(source, `Unsupported command: ${verb}`);
  if (allowed && !allowed.includes(kind))
    return failure(source, `${kind} is not permitted in this mission.`);
  const append = (message: string) => {
    state.history.push(input);
    return success(state, message);
  };
  if (kind === "commit") {
    const message = args.join(" ").replaceAll(/^['"]|['"]$/g, "");
    if (!message) return failure(source, "A commit requires a message.");
    const id = commitId(state);
    state.commits[id] = {
      id,
      message,
      parents: [state.head.commit],
      sequence: state.nextSequence++,
    };
    state.branches[state.head.branch] = id;
    state.head.commit = id;
    return append(`Created ${id} on ${state.head.branch}.`);
  }
  if (kind === "branch") {
    const [name, at = state.head.commit] = args;
    if (!name || !/^[A-Za-z][A-Za-z0-9/_-]*$/.test(name))
      return failure(
        source,
        "Branch names start with a letter and use letters, digits, /, _ or -.",
      );
    if (state.branches[name])
      return failure(source, `Branch ${name} already exists.`);
    if (!state.commits[at] && !state.branches[at])
      return failure(source, `Unknown start point: ${at}.`);
    state.branches[name] = state.branches[at] ?? at;
    return append(`Created branch ${name} at ${state.branches[name]}.`);
  }
  if (kind === "checkout") {
    const [name] = args;
    if (!name || !state.branches[name])
      return failure(source, `Unknown branch: ${name ?? "(missing)"}.`);
    state.head = { branch: name, commit: state.branches[name] };
    return append(`Checked out ${name}.`);
  }
  if (kind === "merge") {
    const [name] = args;
    const other = name ? state.branches[name] : undefined;
    if (!other)
      return failure(source, `Unknown branch: ${name ?? "(missing)"}.`);
    if (name === state.head.branch)
      return failure(source, "Cannot merge a branch into itself.");
    if (isAncestor(state, state.head.commit, other)) {
      state.branches[state.head.branch] = other;
      state.head.commit = other;
      return append(`Fast-forwarded ${state.head.branch} to ${other}.`);
    }
    if (isAncestor(state, other, state.head.commit))
      return append(`${name} is already merged.`);
    const id = commitId(state);
    state.commits[id] = {
      id,
      message: `merge ${name}`,
      parents: [state.head.commit, other],
      sequence: state.nextSequence++,
    };
    state.branches[state.head.branch] = id;
    state.head.commit = id;
    return append(`Created merge commit ${id}.`);
  }
  if (kind === "rebase") {
    const [onto] = args;
    const base = onto ? state.branches[onto] : undefined;
    if (!base)
      return failure(source, `Unknown branch: ${onto ?? "(missing)"}.`);
    if (onto === state.head.branch)
      return failure(source, "Cannot rebase a branch onto itself.");
    if (isAncestor(state, state.head.commit, base)) {
      state.branches[state.head.branch] = base;
      state.head.commit = base;
      return append(`${state.head.branch} is now based on ${onto}.`);
    }
    const id = commitId(state);
    state.commits[id] = {
      id,
      message: `rebase ${state.head.branch} onto ${onto}`,
      parents: [base],
      sequence: state.nextSequence++,
    };
    state.branches[state.head.branch] = id;
    state.head.commit = id;
    return append(`Replayed current work as ${id} onto ${onto}.`);
  }
  const [picked] = args;
  if (!picked || !state.commits[picked])
    return failure(source, `Unknown commit: ${picked ?? "(missing)"}.`);
  if (picked === state.head.commit)
    return failure(source, "Cherry-picking HEAD adds no change.");
  const id = commitId(state);
  state.commits[id] = {
    id,
    message: `cherry-pick ${picked}`,
    parents: [state.head.commit],
    sequence: state.nextSequence++,
  };
  state.branches[state.head.branch] = id;
  state.head.commit = id;
  return append(`Cherry-picked ${picked} as ${id}.`);
}
