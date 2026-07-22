import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist-release", "demo-result.json");
await mkdir(resolve(root, "dist-release"), { recursive: true });
await rm(output, { force: true });
const result = {
  mission: "First foothold",
  input: "commit checkpoint",
  output: { head: "c2", objectiveMet: true },
  generatedAt: "deterministic-fixture",
};
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Demo written: ${output}`);
