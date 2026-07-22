import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const run = (command, args, allowFailure = false) => {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch (error) {
    if (allowFailure) return error.stdout?.toString().trim() ?? "";
    throw error;
  }
};
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const changelog = await readFile(resolve(root, "CHANGELOG.md"), "utf8");
const trackedText = run(
  "git",
  [
    "grep",
    "-nE",
    "TODO|FIXME|NotImplemented|placeholder|coming soon|lorem ipsum",
    "--",
    ":!docs/ROADMAP.md",
  ],
  true,
);
const status = run("git", ["status", "--short"]);
const author = run("git", ["log", "-1", "--format=%an <%ae> | %cn <%ce>"]);
const checks = [
  ["working tree clean", status === ""],
  ["version is v0.1.0", packageJson.version === "0.1.0"],
  ["changelog documents v0.1.0", changelog.includes("## v0.1.0")],
  [
    "release archive exists",
    existsSync(
      resolve(
        root,
        "dist-release",
        `${packageJson.name}-${packageJson.version}-web.zip`,
      ),
    ),
  ],
  [
    "checksum exists",
    existsSync(resolve(root, "dist-release", "SHA256SUMS.txt")),
  ],
  ["no prohibited shell markers", trackedText === ""],
  ["author records KanadeK", author.includes("KanadeK")],
];
for (const [name, passed] of checks)
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
