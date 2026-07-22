import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  await (
    await import("node:fs/promises")
  ).readFile(resolve(root, "package.json"), "utf8"),
);
const outputDir = resolve(root, "dist-release");
const archiveName = `${manifest.name}-${manifest.version}-web.zip`;
const output = resolve(outputDir, archiveName);
await mkdir(outputDir, { recursive: true });
await rm(output, { force: true });
const stream = createWriteStream(output);
const archive = archiver("zip", { zlib: { level: 9 } });
await new Promise((resolvePromise, reject) => {
  stream.on("close", resolvePromise);
  archive.on("error", reject);
  archive.pipe(stream);
  archive.directory(resolve(root, "dist"), false);
  archive.finalize();
});
const hash = createHash("sha256")
  .update(await (await import("node:fs/promises")).readFile(output))
  .digest("hex");
await writeFile(
  resolve(outputDir, "SHA256SUMS.txt"),
  `${hash}  ${archiveName}\n`,
);
console.log(
  `Packaged ${archiveName} (${(await readdir(outputDir)).length} release files)`,
);
