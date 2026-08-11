import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = resolve(root, "node_modules/lucide-static/icons");
const outputRoot = resolve(root, "src/static/icons");

const icons = [
  "map",
  "map-pin",
  "search",
  "sliders-horizontal",
  "star",
  "flame",
  "store",
  "image",
  "send",
  "users",
  "message-circle",
  "user",
  "chevron-down",
  "chevron-right",
  "chevron-left",
  "list",
  "calendar-days",
  "thumbs-up",
  "heart",
  "share-2",
  "x",
  "palette",
  "plus",
  "bell",
  "badge-check",
  "gift",
];

const tones = {
  green: "#267F6B",
  muted: "#789089",
  white: "#FFFFFF",
  amber: "#DA934B",
  dark: "#24463D",
  river: "#367FA3",
  sunset: "#C97848",
};

await mkdir(outputRoot, { recursive: true });

for (const icon of icons) {
  const source = await readFile(resolve(sourceRoot, `${icon}.svg`), "utf8");
  for (const [tone, color] of Object.entries(tones)) {
    const svg = source
      .replaceAll("currentColor", color)
      .replace("<svg ", '<svg width="96" height="96" ');
    await sharp(Buffer.from(svg))
      .resize(96, 96)
      .png()
      .toFile(resolve(outputRoot, `${icon}-${tone}.png`));
  }
}

console.log(
  `Generated ${icons.length * Object.keys(tones).length} local Lucide icon assets.`,
);
