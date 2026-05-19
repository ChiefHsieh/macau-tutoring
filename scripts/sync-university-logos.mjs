/**
 * Copy university logos from ./university_logos → ./public/university_logos
 * Run: node scripts/sync-university-logos.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const srcDir = join(root, "university_logos");
const dstDir = join(root, "public", "university_logos");

const MAP = [
  ["Imperial_College_London_new_logo.png", "imperial-college-london.png"],
  ["University_of_Hong_Kong_Logo.png", "university-of-hong-kong.png"],
  ["UCL_logo.png", "ucl.png"],
  ["King's_College_London_logo.png", "kings-college-london.png"],
  ["University_of_the_Arts_London_Logo.jpg", "university-of-the-arts-london.jpg"],
  ["University_of_Macau_logo.png", "university-of-macau.png"],
  ["Macau_University_of_Science_Technology_logo.png", "macau-university-of-science-and-technology.png"],
];

const KNOWN_SRC = new Set(MAP.map(([s]) => s));

function main() {
  if (!existsSync(srcDir)) {
    console.error("Missing folder:", srcDir);
    process.exit(1);
  }
  mkdirSync(dstDir, { recursive: true });

  for (const [from, to] of MAP) {
    const fromPath = join(srcDir, from);
    if (!existsSync(fromPath)) {
      console.error("Missing:", from);
      process.exit(1);
    }
    copyFileSync(fromPath, join(dstDir, to));
    console.log("✓", to);
  }

  const nthu = readdirSync(srcDir).find((name) => !KNOWN_SRC.has(name));
  if (!nthu) {
    console.error("Could not find National Tsing Hua logo (unknown filename in university_logos/)");
    process.exit(1);
  }
  copyFileSync(join(srcDir, nthu), join(dstDir, "national-tsing-hua-university.png"));
  console.log("✓ national-tsing-hua-university.png  (from", nthu + ")");

  console.log("\nDone. Bump LOGO_ASSET_VERSION in src/lib/university-logos.ts if browsers still show old images.");
}

main();
