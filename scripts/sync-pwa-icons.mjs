#!/usr/bin/env node
/** Copy src/app/icon.png → public/pwa/* for manifest + apple-touch-icon */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "app", "icon.png");
const targets = ["apple-touch-icon.png", "icon-192.png", "icon-512.png"];

if (!fs.existsSync(src)) {
  console.error("Missing:", src);
  process.exit(1);
}

const buf = fs.readFileSync(src);
for (const name of targets) {
  const dest = path.join(root, "public", "pwa", name);
  fs.writeFileSync(dest, buf);
  console.log("wrote", dest);
}
