import fs from "node:fs/promises";
import path from "node:path";

const [, , vaultArg] = process.argv;
const vaultPath = vaultArg || process.env.OBSIDIAN_VAULT_PATH;
const targetRoot = path.resolve("src/content/notes");

if (!vaultPath) {
  console.error("Usage: npm run sync:obsidian -- /path/to/your/vault");
  process.exit(1);
}

const sourceRoot = path.resolve(vaultPath);
await fs.mkdir(targetRoot, { recursive: true });
await copyMarkdownFiles(sourceRoot);

console.log(`Synced Obsidian notes from ${sourceRoot} to ${targetRoot}`);

async function copyMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === ".obsidian") {
        continue;
      }

      await copyMarkdownFiles(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".md")) {
      continue;
    }

    const raw = await fs.readFile(fullPath, "utf8");
    const relativeName = path.relative(sourceRoot, fullPath).replaceAll(path.sep, "-");
    const outputName = slugify(relativeName.replace(/\.md$/, "")) + ".md";
    const outputPath = path.join(targetRoot, outputName);
    const content = raw.startsWith("---")
      ? raw
      : withFrontmatter(relativeName.replace(/\.md$/, ""), raw);

    await fs.writeFile(outputPath, content, "utf8");
  }
}

function withFrontmatter(title, content) {
  const today = new Date().toISOString().slice(0, 10);
  return `---
title: "${escapeQuotes(title)}"
description: "Synced from Obsidian."
date: ${today}
tags: ["obsidian", "synced"]
source: "obsidian"
---

${content}
`;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeQuotes(value) {
  return value.replaceAll('"', '\\"');
}
