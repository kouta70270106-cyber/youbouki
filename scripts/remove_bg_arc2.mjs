import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ARC2_IDS = [
  'turbo_baba', 'tonkaraton', 'aka_manto', 'jinmenken', 'kubi_nashi',
  'denchu_otoko', 'kunekune', 'hasshaku', 'jinmen_sakana', 'sarasara', 'ushi_no_kubi'
];

const SRC_DIR  = path.join(__dirname, '../public/images/cards');
const DEST_DIR = path.join(__dirname, '../public/images/cards/nobg');

if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

for (const id of ARC2_IDS) {
  const srcPath  = path.join(SRC_DIR, `${id}.png`);
  const destPath = path.join(DEST_DIR, `${id}.png`);

  if (!fs.existsSync(srcPath)) {
    console.log(`[SKIP] ${id}.png が見つかりません`);
    continue;
  }

  console.log(`[処理中] ${id} ...`);
  try {
    const imageData = fs.readFileSync(srcPath);
    const blob = new Blob([imageData], { type: 'image/png' });
    const resultBlob = await removeBackground(blob);
    const arrayBuffer = await resultBlob.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    console.log(`[完了] ${id}.png → nobg/${id}.png`);
  } catch (e) {
    console.error(`[エラー] ${id}: ${e.message}`);
  }
}

console.log('\n全処理完了！');
