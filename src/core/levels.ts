import type { GitState, Level } from "./model";
import { initialState, isAncestor } from "./model";

const seeded = (): GitState => {
  const s = initialState();
  s.commits.c1 = {
    id: "c1",
    message: "baseline",
    parents: ["c0"],
    sequence: 1,
  };
  s.branches.main = "c1";
  s.head.commit = "c1";
  s.nextSequence = 2;
  return s;
};
const withFeature = (): GitState => {
  const s = seeded();
  s.commits.c2 = { id: "c2", message: "feature", parents: ["c1"], sequence: 2 };
  s.branches.feature = "c2";
  s.nextSequence = 3;
  return s;
};
const mission = (
  id: number,
  title: string,
  brief: string,
  starter: GitState,
  allowed: Level["allowed"],
  objective: Level["objective"],
  solution: string[],
): Level => ({
  id: `mission-${id}`,
  title,
  brief,
  starter,
  allowed,
  objective,
  solution,
});

export const levels: Level[] = [
  mission(
    1,
    "First foothold",
    "Create the first tactical checkpoint on main.",
    seeded(),
    ["commit"],
    { type: "headAt", target: "c2" },
    ["commit checkpoint"],
  ),
  mission(
    2,
    "Name the flank",
    "Create a feature branch from the current checkpoint.",
    seeded(),
    ["branch"],
    { type: "branchExists", target: "feature" },
    ["branch feature"],
  ),
  mission(
    3,
    "Switch lanes",
    "Create and then check out the release lane.",
    seeded(),
    ["branch", "checkout"],
    { type: "branchAt", branch: "release", target: "c1" },
    ["branch release", "checkout release"],
  ),
  mission(
    4,
    "Fast-forward",
    "Bring main to the already-prepared feature commit.",
    withFeature(),
    ["merge"],
    { type: "headAt", target: "c2" },
    ["merge feature"],
  ),
  mission(
    5,
    "Merge crossroads",
    "Merge a diverged feature branch into main.",
    (() => {
      const s = withFeature();
      s.commits.c3 = {
        id: "c3",
        message: "main work",
        parents: ["c1"],
        sequence: 3,
      };
      s.branches.main = "c3";
      s.head.commit = "c3";
      s.nextSequence = 4;
      return s;
    })(),
    ["merge"],
    { type: "ancestor", target: "c2" },
    ["merge feature"],
  ),
  mission(
    6,
    "Cherry signal",
    "Apply the feature patch to main without merging its branch.",
    withFeature(),
    ["cherry-pick"],
    { type: "headAt", target: "c3" },
    ["cherry-pick c2"],
  ),
  mission(
    7,
    "Rebase route",
    "Rebase feature onto main.",
    withFeature(),
    ["checkout", "rebase"],
    { type: "branchAt", branch: "feature", target: "c3" },
    ["checkout feature", "rebase main"],
  ),
  mission(
    8,
    "Safe return",
    "Create a hotfix branch and move onto it.",
    seeded(),
    ["branch", "checkout"],
    { type: "branchAt", branch: "hotfix", target: "c1" },
    ["branch hotfix", "checkout hotfix"],
  ),
  mission(
    9,
    "Two-step delivery",
    "Commit a patch on the feature branch.",
    (() => {
      const s = seeded();
      s.branches.feature = "c1";
      return s;
    })(),
    ["checkout", "commit"],
    { type: "branchAt", branch: "feature", target: "c2" },
    ["checkout feature", "commit patch"],
  ),
  mission(
    10,
    "Release merge",
    "Fast-forward release to the prepared candidate.",
    withFeature(),
    ["branch", "checkout", "merge"],
    { type: "headAt", target: "c2" },
    ["branch release", "checkout release", "merge feature"],
  ),
  mission(
    11,
    "Conflict drill",
    "Attempting to merge yourself should fail without changing state.",
    seeded(),
    ["merge"],
    { type: "headAt", target: "c2" },
    ["merge main"],
  ),
  mission(
    12,
    "Final topology",
    "Create a branch and merge its checkpoint back into main.",
    seeded(),
    ["branch", "checkout", "commit", "merge"],
    { type: "ancestor", target: "c2" },
    [
      "branch tactic",
      "checkout tactic",
      "commit move",
      "checkout main",
      "merge tactic",
    ],
  ),
];

export function objectiveMet(level: Level, state: GitState): boolean {
  const { objective } = level;
  if (objective.type === "branchExists")
    return Boolean(state.branches[objective.target]);
  if (objective.type === "headAt")
    return state.head.commit === objective.target;
  if (objective.type === "branchAt")
    return Boolean(
      objective.branch && state.branches[objective.branch] === objective.target,
    );
  return isAncestor(state, objective.target, state.head.commit);
}
