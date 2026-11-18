// Generate PWA PNG icons (192, 256, 384, 512 + maskable variants) from the SVG sources.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "icons");
const REG_SRC = path.join(process.cwd(), "public", "icon.svg");
const MASK_SRC = path.join(process.cwd(), "public", "icon-maskable.svg");

const SIZES = [192, 256, 384, 512];

async function main() {
  await mkdir(OUT, { recursive: true });
  const regBuf = await sharp(REG_SRC).png().toBuffer();
  const maskBuf = await sharp(MASK_SRC).png().toBuffer();

  for (const s of SIZES) {
    await sharp(regBuf).resize(s, s).toFile(path.join(OUT, `icon-${s}.png`));
    await sharp(maskBuf).resize(s, s).toFile(path.join(OUT, `maskable-${s}.png`));
    console.log(`OK icon-${s}.png + maskable-${s}.png`);
  }

  // Apple touch icon (180x180) — square, no transparency
  await sharp(regBuf).resize(180, 180).flatten({ background: "#0A1228" }).toFile(
    path.join(OUT, "apple-touch-icon.png")
  );
  console.log("OK apple-touch-icon.png (180x180)");

  // Favicon 32x32
  await sharp(regBuf).resize(32, 32).toFile(path.join(OUT, "favicon-32.png"));
  console.log("OK favicon-32.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
