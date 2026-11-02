import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const production = process.env.VERCEL_ENV === "production";
const args = [path.join(ROOT, "scripts", "build.mjs")];
if (production) args.push("--production");
args.push("--out=dist/vercel-output");

const result = spawnSync(process.execPath, args, {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
