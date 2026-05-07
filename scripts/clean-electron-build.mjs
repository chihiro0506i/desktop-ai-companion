import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const target = path.resolve(root, "dist-electron");
const relative = path.relative(root, target);

if (relative !== "dist-electron") {
  throw new Error(`Refusing to remove unexpected path: ${target}`);
}

fs.rmSync(target, {
  recursive: true,
  force: true
});
