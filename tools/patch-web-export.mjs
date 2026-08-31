import {
  copyFile,
  readdir,
  readFile,
  writeFile,
  mkdir,
} from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { WEB_DIRECTION_CONTRACT_COMMENT } from "./web-export-contract.mjs";

const outputDir = resolve(process.cwd(), process.argv[2] ?? "dist");
const projectDir = resolve(process.cwd());
const faviconSource = join(projectDir, "public", "favicon.svg");
const designMarker = WEB_DIRECTION_CONTRACT_COMMENT;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (extname(entry.name).toLowerCase() === ".html") files.push(path);
  }
  return files;
}

const htmlFiles = await walk(outputDir);
for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  const withoutOldContract = source.replace(
    /<!--\s*THESIS: Living Growth Mark[\s\S]*?FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN\.md, and every shipping raster carrying its provenance\s*-->/i,
    "",
  );
  const withMarker = withoutOldContract.replace(
    /<body(\s[^>]*)?>/i,
    (tag) => `${tag}${designMarker}`,
  );
  const withFavicon = withMarker.includes('rel="icon"')
    ? withMarker
    : withMarker.replace(
        /<\/head>/i,
        '  <link rel="icon" href="/favicon.svg" />\n</head>',
      );
  const bodyTag = withFavicon.match(/<body(\s[^>]*)?>/i)?.[0];
  if (!bodyTag || !withFavicon.includes(`${bodyTag}${designMarker}`)) {
    throw new Error(
      `web export contract could not be placed as the first body child: ${file}`,
    );
  }
  await writeFile(file, withFavicon, "utf8");
}

try {
  await mkdir(outputDir, { recursive: true });
  await copyFile(faviconSource, join(outputDir, "favicon.svg"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(
  `Patched ${htmlFiles.length} HTML files with ${designMarker} and favicon metadata.`,
);
