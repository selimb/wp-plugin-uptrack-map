#!/usr/bin/env bun
import fs from "node:fs/promises";
import { parseArgs } from "node:util";

import { $ } from "bun";

// eslint-disable-next-line no-console -- Need to log somehow!
const log = console.info;

async function bumpPackageJson(version: string): Promise<void> {
  const packageJsonPath = "package.json";
  const packageJsonText = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonText) as { version: string };
  packageJson.version = version;
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson), "utf8");
  await $`npm run prettier:fix`;
}

async function bumpPhp(version: string): Promise<void> {
  const phpPath = "uptrack-map.php";
  let phpText = await fs.readFile(phpPath, "utf8");
  phpText = phpText.replace(/Version:.*$/m, `Version: ${version}`);
  phpText = phpText.replace(
    /UPTRACK_MAP__PLUGIN_VERSION", ".*"/,
    `UPTRACK_MAP__PLUGIN_VERSION", "${version}"`,
  );
  await fs.writeFile(phpPath, phpText, "utf8");
}

async function main(): Promise<void> {
  const args = parseArgs({
    allowPositionals: true,
  });
  if (args.positionals.length !== 1) {
    throw new Error("Need one positional argument");
  }
  const version = args.positionals[0];

  log("Bumping package.json");
  await bumpPackageJson(version);

  log("Bumping .php");
  await bumpPhp(version);
}

void main();
