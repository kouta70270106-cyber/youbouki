class StoryScene extends Phaser.Scene {
  constructor() { super('StoryScene'); }

  create() {
    SE.init();
    SE.playBGM('title');
    const W = this.scale.width;
    const H = this.scale.height;

    // 背景（固定）
    this.add.graphics()
      .fillGradientStyle(0x050210, 0x050210, 0x100a20, 0x100a20, 1)
      .fillRect(0, 0, W, H);

    // ヘッダー（固定）
    this.add.rectangle(W / 2, 30, W, 60, 0x080318, 1).setDepth(10);
    this.add.graphics().setDepth(10).lineStyle(1, 0x2a1040).lineBetween(0, 60, W, 60);
    this.add.text(W / 2, 30, '〜 ストーリー 〜', {
      fontFamily: 'serif', fontSize: '24px', color: '#e8c87a',
    }).setOrigin(0.5).setDepth(10);

    // スクロールコンテナ（チャプターカードを入れる）
    this.scrollContainer = this.add.container(0, 0);

    const cardW  = W - 32;
    const cardH  = 180;
    const startY = 68;
    const gapY   = 10;

    D.chapters.forEach((ch, i) => {
      const cy   = startY + i * (cardH + gapY) + cardH / 2;
      const prog = GameState.player.stageProgress[ch.id] || 0;
      const prevComplete = i === 0
        || (GameState.player.stageProgress[D.chapters[i - 1].id] || 0) >= 5
        || GameState.player.completedChapters.includes(D.chapters[i - 1].id);
      const locked = !prevComplete;
      this._drawChapterCard(ch, cy, cardW, cardH, prog, locked);
    });

    // スクロール量計算
    const totalH  = startY + D.chapters.length * (cardH + gapY) + 20;
    this._maxScroll = Math.max(0, totalH - (H - 60));
    this._scrollY   = 0;

    // マウスホイールでスクロール
    this.input.on('wheel', (_p, _g, _dx, deltaY) => {
      this._scrollY = Phaser.Math.Clamp(this._scrollY + deltaY * 0.6, 0, this._maxScroll);
      this.scrollContainer.y = -this._scrollY;
    });

    // タッチドラッグでスクロール
    let dragStart = null;
    this.input.on('pointerdown', p => { dragStart = { y: p.y, scroll: this._scrollY }; });
    this.input.on('pointermove', p => {
      if (!dragStart || !p.isDown) return;
      this._scrollY = Phaser.Math.Clamp(dragStart.scroll - (p.y - dragStart.y), 0, this._maxScroll);
      this.scrollContainer.y = -this._scrollY;
    });
    this.input.on('pointerup', () => { dragStart = null; });

    // スクロール量インジケーター（右端）
    if (this._maxScroll > 0) {
      this.scrollBar = this.add.graphics().setDepth(10);
      this._drawScrollBar(H);
    }

    // DEVボタン（右上・テスト用）
    const devBtn = this.add.text(W - 8, 8, '[DEV]', {
      fontFamily: 'monospace', fontSize: '11px', color: '#443355',
      backgroundColor: '#110022', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });
    devBtn.on('pointerdown', () => {
      const allCards = ['kappa','tengu','zashiki','tanuki','kitsune','karakasa','noppera','rokurokubi','nurikabe','sunakake','chochin','amefuri','ittan','wanyudo','yuki_onna','oni','nekomata','yamanba','umibouzu','amanojaku','kasha','tsuchigumo','bakekujira','nue','kyubi','dai_tengu','shuten_doji','tamamo','ryujin','susanoo'];
      GameState.player.unlockedCards    = allCards;
      GameState.player.completedChapters = [1,2,3,4,5,6,7,8,9];
      GameState.player.stageProgress    = {1:5,2:5,3:5,4:5,5:5,6:5,7:5,8:5,9:5,10:4};
      GameState.save();
      this.scene.restart();
    });

    // 戻るボタン（固定）
    const back = this.add.text(W / 2, H - 24, '← ホームへ戻る', {
      fontFamily: 'serif', fontSize: '15px', color: '#b89adc',
      backgroundColor: '#1a0a3a', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#e8c87a'));
    back.on('pointerout',  () => back.setColor('#b89adc'));
    back.on('pointerdown', () => { SE.playSE('click'); this.scene.start('HomeScene'); });
  }

  _drawScrollBar(H) {
    const W = this.scale.width;
    const trackH = H - 80;
    const trackX = W - 6;
    const trackY = 65;
    const knobH  = Math.max(30, trackH * ((H - 60) / (H - 60 + this._maxScroll)));
    const knobY  = trackY + (this._scrollY / this._maxScroll) * (trackH - knobH);
    this.scrollBar.clear();
    this.scrollBar.fillStyle(0x2a1040, 0.8);
    this.scrollBar.fillRect(trackX, trackY, 4, trackH);
    this.scrollBar.fillStyle(0x8855cc, 0.9);
    this.scrollBar.fillRect(trackX, knobY, 4, knobH);
  }

  update() {
    if (this.scrollBar && this._maxScroll > 0) {
      this._drawScrollBar(this.scale.height);
    }
  }

  // 日本語テキストを句読点優先で折り返す（Phaserのwordwrapが日本語非対応のため）
  _wrapText(text, maxChars) {
    const BREAK = '。、！？」』）…―';
    const wrap = s => {
      if (s.length <= maxChars) return s;
      const parts = [];
      let rest = s;
      while (rest.length > maxChars) {
        let at = maxChars;
        for (let i = maxChars; i >= maxChars - 5; i--) {
          if (BREAK.includes(rest[i] || '')) { at = i + 1; break; }
        }
        parts.push(rest.slice(0, at));
        rest = rest.slice(at);
      }
      if (rest) parts.push(rest);
      return parts.join('\n');
    };
    return text.split('\n').map(wrap).join('\n');
  }

  _drawChapterCard(ch, cy, cardW, cardH, prog, locked) {
    const W  = this.scale.width;
    const cx = W / 2;
    const bx = (W - cardW) / 2;
    const C  = this.scrollContainer;

    const add = {
      graphics: () => { const g = this.add.graphics(); C.add(g); return g; },
      text: (...args) => { const t = this.add.text(...args); C.add(t); return t; },
      rectangle: (...args) => { const r = this.add.rectangle(...args); C.add(r); return r; },
    };

    // カード背景
    const bgCol = locked ? 0x0c0c0c : 0x140a28;
    const bdCol = locked ? 0x222222 : 0x5533aa;
    const bdA   = locked ? 0.3 : 0.6;

    const cardG = add.graphics();
    cardG.fillStyle(bgCol, 1);
    cardG.fillRoundedRect(bx, cy - cardH / 2, cardW, cardH, 10);
    cardG.lineStyle(1, bdCol, bdA);
    cardG.strokeRoundedRect(bx, cy - cardH / 2, cardW, cardH, 10);

    // チャプターラベル
    add.text(bx + 14, cy - cardH / 2 + 14, `CHAPTER ${ch.id}`, {
      fontFamily: 'monospace', fontSize: '10px',
      color: locked ? '#333333' : '#7744aa',
    }).setOrigin(0, 0.5);

    // クリアバッジ
    if (prog >= 5) {
      add.text(bx + cardW - 14, cy - cardH / 2 + 14, '✅ クリア済み', {
        fontFamily: 'serif', fontSize: '11px', color: '#44cc88',
      }).setOrigin(1, 0.5);
    }

    // タイトル
    add.text(cx, cy - 56, ch.title, {
      fontFamily: 'serif', fontSize: '17px',
      color: locked ? '#444444' : '#e8c87a',
    }).setOrigin(0.5);

    // 説明文（日本語はwordWrap不可のため手動折り返し）
    add.text(cx, cy - 32, this._wrapText(ch.description, 26), {
      fontFamily: 'serif', fontSize: '11px',
      color: locked ? '#333333' : '#9988bb',
      align: 'center', lineSpacing: 3,
    }).setOrigin(0.5);

    // ===== ステージノード =====
    if (locked) {
      add.text(cx, cy + 44, '🔒  前の章をクリアすると解放されます', {
        fontFamily: 'serif', fontSize: '12px', color: '#444444',
      }).setOrigin(0.5);
      return;
    }

    const nodeY  = cy + 52;
    const nodeR  = 21;
    const leftX  = bx + 16 + nodeR;
    const rightX = bx + cardW - 16 - nodeR;
    const step   = (rightX - leftX) / 4;

    // 接続線
    add.graphics().lineStyle(2, 0x3a1a5a, 0.5).lineBetween(leftX, nodeY, rightX, nodeY);

    for (let s = 0; s < 5; s++) {
      const nx        = leftX + s * step;
      const completed = s < prog;
      const current   = s === prog;
      const isLocked  = s > prog;

      // ノード円
      const ng = add.graphics();
      if (completed) {
        ng.fillStyle(0xb89620, 1);
        ng.fillCircle(nx, nodeY, nodeR);
        ng.lineStyle(2, 0xffdd44, 1);
        ng.strokeCircle(nx, nodeY, nodeR);
      } else if (current) {
        ng.fillStyle(0x2a0c50, 1);
        ng.fillCircle(nx, nodeY, nodeR);
        ng.lineStyle(2, 0xcc88ff, 1);
        ng.strokeCircle(nx, nodeY, nodeR);
        ng.lineStyle(5, 0xcc88ff, 0.25);
        ng.strokeCircle(nx, nodeY, nodeR + 6);
      } else {
        ng.fillStyle(0x181818, 1);
        ng.fillCircle(nx, nodeY, nodeR);
        ng.lineStyle(1, 0x2e2e2e, 1);
        ng.strokeCircle(nx, nodeY, nodeR);
      }

      // ノード内テキスト
      add.text(nx, nodeY, completed ? '✓' : `${s + 1}`, {
        fontFamily: 'serif',
        fontSize: completed ? '18px' : '14px',
        color: completed ? '#1a0a00' : current ? '#e8c87a' : '#333333',
      }).setOrigin(0.5);

      // ノード下ラベル
      if (s === 4) {
        add.text(nx, nodeY + nodeR + 8, 'BOSS', {
          fontFamily: 'monospace', fontSize: '8px',
          color: completed ? '#c8a830' : current ? '#cc66aa' : '#333333',
        }).setOrigin(0.5);
      }

      // クリック判定
      if (!isLocked) {
        const hit = add.rectangle(nx, nodeY, (nodeR + 5) * 2, (nodeR + 5) * 2, 0, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => ng.setAlpha(0.75));
        hit.on('pointerout',  () => ng.setAlpha(1));
        hit.on('pointerdown', () => {
          SE.playSE('click');
          this.scene.start('BattleScene', {
            chapterId:   ch.id,
            battleIndex: s,
            story:       true,
          });
        });
      }
    }

    // 進捗テキスト（左下）BOSSラベルと重ならないよう左側に配置
    add.text(bx + 14, cy + cardH / 2 - 12, `${Math.min(prog, 5)} / 5`, {
      fontFamily: 'monospace', fontSize: '11px',
      color: prog >= 5 ? '#44cc88' : '#664488',
    }).setOrigin(0, 0.5);
  }
}
