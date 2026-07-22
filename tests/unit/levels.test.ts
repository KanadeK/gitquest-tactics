import { describe, expect, it } from "vitest";
import { executeCommand } from "../../src/core/engine";
import { levels, objectiveMet } from "../../src/core/levels";
import { cloneState } from "../../src/core/model";

describe("authored missions", () => {
  it("ships twelve deterministic missions", () =>
    expect(levels).toHaveLength(12));
  it("has auto-solvable paths for at least ten missions", () => {
    const outcomes = levels
      .map((level) =>
        level.solution.reduce(
          (state, command) =>
            executeCommand(command, state, level.allowed).state,
          cloneState(level.starter),
        ),
      )
      .map((state, index) => objectiveMet(levels[index], state));
    expect(outcomes.filter(Boolean)).toHaveLength(11);
  });
  it("keeps the intentional invalid merge demonstration unchanged", () => {
    const level = levels[10];
    const before = cloneState(level.starter);
    const after = executeCommand("merge main", before, level.allowed);
    expect(after.ok).toBe(false);
    expect(after.state).toBe(before);
  });
});
