import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../assets/candy-character-medieval-sheet.png', import.meta.url));
const characters = [
  ['knight', 0, 0, 418, 627],
  ['fighter', 418, 0, 418, 627],
  ['captain', 836, 0, 417, 627],
  ['mage', 0, 627, 418, 626],
  ['adventurer', 418, 627, 418, 626],
  ['inventor', 836, 627, 417, 626],
];

for (const [name, left, top, width, height] of characters) {
  const crop = await sharp(source)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
  await sharp(crop)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 560, height: 560, fit: 'inside', withoutEnlargement: false })
    .png()
    .toFile(fileURLToPath(new URL(`../assets/candy-character-${name}.png`, import.meta.url)));
}
