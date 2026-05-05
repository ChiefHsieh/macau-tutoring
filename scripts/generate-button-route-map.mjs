import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const SNAPSHOT_PATH = path.join(ROOT, "tests", "snapshots", "button-route-map.json");
const SHOULD_WRITE = process.argv.includes("--write");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function collectMatches(source, regex, kind, file) {
  const results = [];
  for (const match of source.matchAll(regex)) {
    results.push({
      kind,
      value: (match[1] || "").trim(),
      file,
    });
  }
  return results;
}

function buildMap() {
  const files = walk(SRC_DIR);
  const map = [];
  for (const filePath of files) {
    const file = relative(filePath);
    const source = readFileSync(filePath, "utf8");

    map.push(
      ...collectMatches(source, /<ButtonLink[^>]*\bhref=\{([^}]+)\}/g, "ButtonLink.href.expr", file),
      ...collectMatches(source, /<ButtonLink[^>]*\bhref="([^"]+)"/g, "ButtonLink.href.literal", file),
      ...collectMatches(source, /<Link[^>]*\bhref=\{([^}]+)\}/g, "Link.href.expr", file),
      ...collectMatches(source, /<Link[^>]*\bhref="([^"]+)"/g, "Link.href.literal", file),
      ...collectMatches(source, /<form[^>]*\baction=\{([^}]+)\}/g, "form.action.expr", file),
      ...collectMatches(source, /router\.(?:push|replace)\(([^)]+)\)/g, "router.nav.expr", file),
    );
  }

  map.sort((a, b) => {
    if (a.file === b.file) {
      if (a.kind === b.kind) return a.value.localeCompare(b.value);
      return a.kind.localeCompare(b.kind);
    }
    return a.file.localeCompare(b.file);
  });

  return {
    generatedAt: "static-for-snapshot",
    total: map.length,
    items: map,
  };
}

const data = buildMap();
const json = `${JSON.stringify(data, null, 2)}\n`;

if (SHOULD_WRITE) {
  mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, json, "utf8");
  console.log(`Wrote ${data.total} entries to ${relative(SNAPSHOT_PATH)}`);
} else {
  process.stdout.write(json);
}
