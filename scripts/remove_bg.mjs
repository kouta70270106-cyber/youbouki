// 妖怪カード画像の背景を一括除去して nobg/ フォルダに保存するスクリプト
// 使い方: node scripts/remove_bg.mjs
// 元画像は上書きしない。nobg/{id}.png として別保存

import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.join(__dirname, '../public/images/cards');
const NOBG_DIR  = path.join(CARDS_DIR, 'nobg');

if (!fs.existsSync(NOBG_DIR)) fs.mkdirSync(NOBG_DIR, { recursive: true });

const ALL_IDS = [
  'kappa','tengu','zashiki','tanuki','kitsune','karakasa',
  'noppera','rokurokubi','nurikabe','sunakake','chochin','amefuri',
  'ittan','wanyudo','yuki_onna','oni','nekomata','yamanba',
  'umibouzu','amanojaku','kasha','tsuchigumo','bakekujira',
  'nue','kyubi','dai_tengu','shuten_doji','tamamo','ryujin','susanoo'
];

const targets = ALL_IDS.filter(id => {
  const src  = path.join(CARDS_DIR, `${id}.png`);
  const dest = path.join(NOBG_DIR,  `${id}.png`);
  if (!fs.existsSync(src))  { console.log(`⬜ スキップ（元画像なし）: ${id}`); return false; }
  if (fs.existsSync(dest))  { console.log(`✅ 処理済みスキップ: ${id}`); return false; }
  return true;
});

console.log(`\n処理対象: ${targets.length}枚\n`);

for (const id of targets) {
  const src = path.join(CARDS_DIR, `${id}.png`);
  try {
    process.stdout.write(`🔄 処理中: ${id} ... `);
    const fileBuffer = fs.readFileSync(src);
    const inputBlob  = new Blob([fileBuffer], { type: 'image/png' });
    const resultBlob = await removeBackground(inputBlob);
    const buf        = Buffer.from(await resultBlob.arrayBuffer());
    fs.writeFileSync(path.join(NOBG_DIR, `${id}.png`), buf);
    console.log('✅ 完了');
  } catch (e) {
    console.log(`❌ エラー: ${e.message}`);
  }
}

console.log('\n🎉 全処理完了');
