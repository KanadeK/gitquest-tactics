import { describe, expect, it } from "vitest";
import { executeCommand } from "../../src/core/engine";
import { initialState, isAncestor } from "../../src/core/model";

describe("controlled Git engine", () => {
  it("creates a commit and advances HEAD", () => {
    const result = executeCommand("commit checkpoint", initialState());
    expect(result.ok).toBe(true);
    expect(result.state.head.commit).toBe("c1");
    expect(result.state.commits.c1.message).toBe("checkpoint");
  });
  it("rejects a message-less commit without mutating state", () => {
    const state = initialState();
    const result = executeCommand("commit", state);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(state.head.commit).toBe("c0");
  });
  it("creates and checks out a branch", () => {
    const first = executeCommand("branch feature", initialState());
    const second = executeCommand("checkout feature", first.state);
    expect(second.ok).toBe(true);
    expect(second.state.head.branch).toBe("feature");
  });
  it("rejects duplicate and invalid branch names", () => {
    const state = executeCommand("branch feature", initialState()).state;
    expect(executeCommand("branch feature", state).ok).toBe(false);
    expect(executeCommand("branch 4bad", state).ok).toBe(false);
  });
  it("fast-forwards when HEAD is behind the merged branch", () => {
    const state = executeCommand("branch feature", initialState()).state;
    const onFeature = executeCommand("checkout feature", state).state;
    const committed = executeCommand("commit feature", onFeature).state;
    const onMain = executeCommand("checkout main", committed).state;
    const result = executeCommand("merge feature", onMain);
    expect(result.ok).toBe(true);
    expect(result.state.head.commit).toBe("c1");
  });
  it("creates a two-parent merge commit when histories diverge", () => {
    let state = executeCommand("branch feature", initialState()).state;
    state = executeCommand("checkout feature", state).state;
    state = executeCommand("commit feature", state).state;
    state = executeCommand("checkout main", state).state;
    state = executeCommand("commit main", state).state;
    const result = executeCommand("merge feature", state);
    expect(result.ok).toBe(true);
    expect(result.state.commits.c3.parents).toEqual(["c2", "c1"]);
  });
  it("rejects a self merge with an unchanged graph", () => {
    const state = initialState();
    const result = executeCommand("merge main", state);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
  });
  it("replays work during rebase", () => {
    let state = executeCommand("branch feature", initialState()).state;
    state = executeCommand("checkout feature", state).state;
    state = executeCommand("commit work", state).state;
    state = executeCommand("checkout main", state).state;
    state = executeCommand("commit base", state).state;
    state = executeCommand("checkout feature", state).state;
    const result = executeCommand("rebase main", state);
    expect(result.ok).toBe(true);
    expect(result.state.commits.c3.parents).toEqual(["c2"]);
  });
  it("cherry-pick creates a new commit and rejects a missing source", () => {
    let state = executeCommand("commit one", initialState()).state;
    state = executeCommand("commit two", state).state;
    const picked = executeCommand("cherry-pick c1", state);
    expect(picked.ok).toBe(true);
    expect(picked.state.head.commit).toBe("c3");
    expect(executeCommand("cherry-pick nope", state).ok).toBe(false);
  });
  it("walks commit ancestry through merge parents", () => {
    let state = executeCommand("branch feature", initialState()).state;
    state = executeCommand("checkout feature", state).state;
    state = executeCommand("commit feature", state).state;
    state = executeCommand("checkout main", state).state;
    state = executeCommand("commit main", state).state;
    state = executeCommand("merge feature", state).state;
    expect(isAncestor(state, "c1", "c3")).toBe(true);
    expect(isAncestor(state, "c2", "c3")).toBe(true);
    expect(isAncestor(state, "c3", "c1")).toBe(false);
  });
  it("enforces level command allowlists", () =>
    expect(executeCommand("merge main", initialState(), ["commit"]).ok).toBe(
      false,
    ));
});
