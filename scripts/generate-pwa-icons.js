#!/usr/bin/env node
/**
 * generate-pwa-icons.js
 *
 * Generates maskable PWA icons with a safe-zone background padding.
 * Requires: `sharp` (installed as a dev dependency or via npx).
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

const path = require("path");
const fs = require("fs");

const SOURCE = path.join(__dirname, "../public/logo.png");
const OUT_DIR = path.join(__dirname, "../public");

async function run() {
  // Dynamically import sharp so we don't need it as a hard dependency
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("❌ 'sharp' is not installed. Run: npm install --save-dev sharp");
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source file not found: ${SOURCE}`);
    process.exit(1);
  }

  const sizes = [192, 512];

  for (const size of sizes) {
    // ── Standard icon (any) ─────────────────────────────────────────────────
    const anyOut = path.join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE).resize(size, size, { fit: "contain", background: { r: 13, g: 17, b: 15, alpha: 1 } }).png().toFile(anyOut);
    console.log(`✅ Generated ${anyOut}`);

    // ── Maskable icon (10% safe-zone padding) ────────────────────────────────
    // Safe zone = 80% of the canvas; icon padded to 80% of target size
    const innerSize = Math.round(size * 0.8);
    const maskableOut = path.join(OUT_DIR, `manifest-icon-${size}.maskable.png`);

    await sharp(SOURCE)
      .resize(innerSize, innerSize, { fit: "contain", background: { r: 15, g: 118, b: 110, alpha: 1 } })
      .extend({
        top: Math.floor((size - innerSize) / 2),
        bottom: Math.ceil((size - innerSize) / 2),
        left: Math.floor((size - innerSize) / 2),
        right: Math.ceil((size - innerSize) / 2),
        background: { r: 15, g: 118, b: 110, alpha: 1 }, // brand teal
      })
      .png()
      .toFile(maskableOut);
    console.log(`✅ Generated ${maskableOut}`);
  }

  console.log("\n🎉 All PWA icons generated successfully.");
  console.log("ℹ️  Commit the new files in /public/ and redeploy.");
}

run().catch((err) => {
  console.error("❌ Error generating icons:", err);
  process.exit(1);
});
