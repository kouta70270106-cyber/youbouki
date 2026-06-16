import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const CARDS_DIR = new URL('../public/images/cards/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const files = readdirSync(CARDS_DIR).filter(f => f.endsWith('.png'));
console.log(`処理対象: ${files.length}枚`);

for (const file of files) {
  const filePath = join(CARDS_DIR, file);
  try {
    const blob = new Blob([readFileSync(filePath)], { type: 'image/png' });
    const result = await removeBackground(blob, {
      model: 'small',
      output: { format: 'image/png', quality: 1 },
    });
    const buf = Buffer.from(await result.arrayBuffer());
    writeFileSync(filePath, buf);
    console.log(`✅ ${file}`);
  } catch (e) {
    console.error(`❌ ${file}: ${e.message}`);
  }
}
console.log('完了');
