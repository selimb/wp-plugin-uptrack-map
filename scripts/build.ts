#!/usr/bin/env bun
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import * as rollup from "rollup";
import esbuild from "rollup-plugin-esbuild";

const DIST_DIR = "dist";

// eslint-disable-next-line no-console -- Need to log somehow!
const log = console.info;

async function clean(): Promise<void> {
  log("cleaning...");
  // See [keep-dist].
  const children = new Set(await fsp.readdir(DIST_DIR));
  children.delete(".gitkeep");

  await Promise.all(
    [...children].map(async (child) => {
      await fsp.rm(path.join(DIST_DIR, child), {
        recursive: true,
        force: true,
      });
    }),
  );
}

const JS_SRC_DIR = "src";
const JS_DIST_DIR = path.join(DIST_DIR, "js");
const JS_ENTRYPOINTS = {
  "src/admin.ts": "admin",
  "src/uptrack-map/index.ts": "uptrack-map",
};

async function buildJs(): Promise<void> {
  log("building js...");
  for (const [src, dstBasename] of Object.entries(JS_ENTRYPOINTS)) {
    const bundle = await rollup.rollup({
      input: src,
      plugins: esbuild({
        minify: args.values.prod ? true : false,
        sourceMap: args.values.prod ? true : false,
        target: "es2022",
      }),
      external: ["leaflet", "geojson"],
    });

    const dst = path.join(JS_DIST_DIR, `${dstBasename}.js`);
    await bundle.write({
      file: dst,
      format: "iife",
      globals: {
        leaflet: "L",
      },
    });
    await bundle.close();
    // await Bun.build({
    //   entrypoints: [src],
    //   outdir: JS_DIST_DIR,
    //   target: "browser",
    //   format: "iife",
    //   naming: `[dir]/${dst}.[ext]`,
    //   splitting: false,
    //   sourcemap: args.values.prod ? true : false,
    //   minify: args.values.prod ? true : false,
    //   packages: "external",
    // });
  }
}

const CSS_SRC_DIR = "css";
const CSS_DIST_DIR = path.join(DIST_DIR, "css");

async function buildCss(): Promise<void> {
  log("building css...");
  const src = CSS_SRC_DIR;
  const dst = CSS_DIST_DIR;
  await fsp.mkdir(dst, { recursive: true });
  for (const name of await fsp.readdir(src)) {
    await fsp.cp(path.join(src, name), path.join(dst, name));
  }
}

// TODO: Do we need a README?
const WP_SRC_PATHS = ["includes", "index.php", "uptrack-map.php"];

/** PHP + metadata */
async function buildWordpress(): Promise<void> {
  log("building PHP...");
  for (const src of WP_SRC_PATHS) {
    const dst = path.join(DIST_DIR, path.basename(src));
    await fsp.cp(src, dst, { recursive: true });
  }
}

async function build(): Promise<void> {
  log("building...");

  await Promise.all([buildJs(), buildCss(), buildWordpress()]);
}

function watch(): void {
  fs.watch(JS_SRC_DIR, { recursive: true }, () => {
    void buildJs();
  });

  fs.watch(CSS_SRC_DIR, { recursive: true }, () => {
    void buildCss();
  });

  for (const src of WP_SRC_PATHS) {
    fs.watch(src, { recursive: true }, () => {
      void buildWordpress();
    });
  }
}

async function main(): Promise<void> {
  if (args.values.clean) {
    await clean();
    return;
  }

  await build();

  if (args.values.watch) {
    watch();
  }
}

const args = parseArgs({
  options: {
    clean: {
      type: "boolean",
      short: "c",
      default: false,
    },
    watch: {
      type: "boolean",
      short: "w",
      default: false,
    },
    prod: {
      type: "boolean",
      short: "p",
      default: false,
    },
  },
});

void main();
