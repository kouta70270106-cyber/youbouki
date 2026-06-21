# Gemini 画像生成 指示書 — ストーリー背景 ch15〜ch20

保存先: `public/images/chapters/{ファイル名}`  
サイズ: **横長（1024×640 推奨）** または 16:9 相当  
用途: StoryScene のチャプターカード背景 + ステージマップ背景（setDisplaySize でリサイズされる）

---

## 共通スタイル指示（全画像に共通）

以下を全プロンプトの末尾に追加して使う：

```
Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch15 — 首無しライダーの国道 → `ch15.png`

**世界観:** 深夜の国道。ヘッドライトのないバイクが爆速で走る。首無しライダーの怨念が漂う夜の道路。

```
A deserted nighttime highway stretching into the darkness, wet asphalt reflecting dim orange streetlights, a single lane with faded white markings, tire skid marks scorched into the road, thin wisps of fog drifting low above the ground, distant city lights barely visible on the horizon, an unsettling emptiness suggesting something has just passed through at tremendous speed, utility poles lining both sides receding into the dark, no vehicles visible, oppressive silence, Japanese urban outskirts at night. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch16 — 見てはいけない → `ch16.png`

**世界観:** 農村の田んぼ。夕暮れに遠くでくねくねと揺れる白い何か。見続けると発狂する。

```
A wide expanse of Japanese rice paddy fields at dusk, the sky fading from amber to deep violet, rows of rice stalks extending to the horizon, a distant indistinct white shape barely visible far across the fields seemingly swaying in an unnatural rhythm, heat haze distorting the air around it, an unsettling stillness with no wind yet the shape keeps moving, a narrow dirt path between paddies, old wooden telephone poles in the distance, the atmosphere thick with unspoken dread, rural Japan in late summer. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch17 — ぽー → `ch17.png`

**世界観:** 廃工場・廃墟地帯。2.4mを超える白い巨影が廃墟の奥に潜む。「ぽー……」という声が響く。

```
Interior of a vast abandoned industrial factory at night, crumbling concrete pillars casting long shadows, broken windows with moonlight filtering through in pale beams, rusted metal scaffolding towering overhead, debris and broken glass on the floor, at the far end of the cavernous space a faint elongated white silhouette barely distinguishable from the shadows, impossibly tall reaching near the ceiling, the air thick with dust and dread, water dripping somewhere in the darkness, an overwhelming sense of being watched from above, desolate and haunting industrial wasteland. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch18 — 人面魚の池 → `ch18.png`

**世界観:** 東京郊外の古い神社。暗い池に人の顔を持つ魚が浮かぶ。月夜の不気味な水鏡。

```
An ancient Japanese shrine at night surrounded by old cedar trees, stone lanterns glowing with a faint orange light lining the stone path, a dark still pond in the foreground reflecting a full moon overhead, the water surface perfectly smooth with only one unsettling ripple breaking the center, the reflection of the torii gate distorted in the water, moss-covered stone torii gate silhouetted against a cloudy night sky, stone steps descending to the water's edge, an atmosphere of deep supernatural unease, the kind of sacred place that hides something dark beneath its surface, rural shrine outside Tokyo. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch19 — 電柱の番人 → `ch19.png`

**世界観:** 東京呪術院本部周辺。電柱が異常密集した都市。青白い光が不気味に灯る深夜の街。

```
A narrow Tokyo backstreet at midnight overwhelmed by an impossible density of concrete utility poles, power lines crossing overhead in a chaotic tangled web blotting out the sky, some poles leaning at wrong angles, an eerie blue-white glow emanating from the wiring above with no clear source, empty street wet from recent rain reflecting the pale light, shadows so deep between poles that nothing is visible within them, the oppressive feeling of being monitored from every direction, an urban environment pushed to a nightmarish extreme, modern Japan urban horror. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## ch20 — 現代の夜明け → `ch20.png`

**世界観:** 東京呪術院の最奥。恐怖エネルギーが渦巻く最終決戦の間。時代の扉が開く瞬間。

```
A vast dark ceremonial chamber deep underground, the ceiling lost in absolute darkness far above, the cracked stone floor covered in glowing red and black ritual patterns, a massive swirling vortex of dark supernatural energy at the center of the room radiating crimson light, the energy spiraling upward toward the invisible ceiling, the edges of the chamber barely visible in deep shadow, an enormous black door standing at the far end emanating a crack of blinding light from beyond, the air itself distorted by the concentration of spiritual power, the final arena of an apocalyptic confrontation. Japanese horror yokai game background art, dark atmospheric scene, no main characters in foreground, cinematic wide landscape composition, dramatic moody lighting, dark and eerie ambiance, highly detailed environment, no text, no UI elements, no borders, widescreen format
```

---

## 生成チェックリスト

| 章 | タイトル | ファイル名 | 完了 |
|---|---------|-----------|------|
| 15 | 首無しライダーの国道 | ch15.png | [ ] |
| 16 | 見てはいけない | ch16.png | [ ] |
| 17 | ぽー | ch17.png | [ ] |
| 18 | 人面魚の池 | ch18.png | [ ] |
| 19 | 電柱の番人 | ch19.png | [ ] |
| 20 | 現代の夜明け | ch20.png | [ ] |

---

## 配置手順

1. Gemini で各プロンプトの画像を生成
2. `public/images/chapters/` フォルダに保存（例: `ch15.png`）
3. ゲームを起動（`npm run dev`）して StoryScene で確認
4. StoryScene はファイルが存在する分だけ自動で読み込む（コード変更不要）
