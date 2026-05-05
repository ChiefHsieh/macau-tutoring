import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const SNAPSHOT_PATH = path.join(ROOT, "tests", "snapshots", "button-route-map.json");

test("button and route map snapshot matches", () => {
  const generated = spawnSync("node", ["scripts/generate-button-route-map.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(generated.status, 0, generated.stderr || "Failed to generate route map snapshot");

  const expected = readFileSync(SNAPSHOT_PATH, "utf8");
  assert.equal(
    generated.stdout,
    expected,
    "Route/button snapshot changed. Run `npm run snapshot:routes:update` and commit updated snapshot.",
  );
});
