class HomeYokaiSelectScene extends Phaser.Scene {
  constructor() { super('HomeYokaiSelectScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    this._gridObjs  = [];
    this._page      = 0;
    this._ownedIds  = D.cards.filter(c => GameState.player.unlockedCards.includes(c.id)).map(c => c.id);
    this._selected  = [...(GameState.player.homeYokaiIds || [])]; // 最大5体
    this._MAX       = 5;

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x080510);
    const bgG = this.add.graphics();
    bgG.fillStyle(0x2c1533, 0.28);
    bgG.fillEllipse(W / 2, H * 0.35, W * 1.2, H * 0.55);

    // ── ヘッダー ──
    this.add.rectangle(W / 2, 40, W, 80, 0x060210);
    this.add.graphics().lineStyle(1, 0x2a1040, 0.8).lineBetween(0, 80, W, 80);

    this.add.text(W / 2, 32, 'ホーム妖怪設定', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '22px',
      color: '#ecd089',
      stroke: '#876626',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, 58, `最大${this._MAX}体まで選択できます`, {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '11px',
      color: '#6a5080',
    }).setOrigin(0.5);

    // ← 戻る
    const backBtn = this.add.text(20, 38, '← 戻る', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '14px',
      color: '#b6a4cf',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#e7c065'));
    backBtn.on('pointerout',  () => backBtn.setColor('#b6a4cf'));
    backBtn.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ProfileScene'));
    });

    // ── 選択スロット（5つ） ──
    this._slotObjs = [];
    this._slotY    = 118;
    this._renderSlots();

    // ── 保存ボタン ──
    const PAD  = 24;
    const btnY = H - 72;
    const btnW = W - PAD * 2;
    const btnH = 50;

    const saveBg = this.add.graphics();
    this._drawSaveBtn = (hover = false) => {
      saveBg.clear();
      saveBg.fillStyle(hover ? 0x4f8a6a : 0x3f7a5a, 1);
      saveBg.fillRoundedRect(PAD, btnY, btnW, btnH / 2, { tl: 10, tr: 10, bl: 0, br: 0 });
      saveBg.fillStyle(hover ? 0x2f6a4a : 0x1f5a3a, 1);
      saveBg.fillRoundedRect(PAD, btnY + btnH / 2, btnW, btnH / 2, { tl: 0, tr: 0, bl: 10, br: 10 });
      saveBg.lineStyle(1, 0xe7c065, 0.40);
      saveBg.strokeRoundedRect(PAD + 2, btnY + 2, btnW - 4, btnH - 4, 8);
    };
    this._drawSaveBtn();

    this.add.text(W / 2, btnY + btnH / 2, '保　存', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '20px',
      color: '#f3ead2',
      letterSpacing: 8,
    }).setOrigin(0.5);

    const saveHit = this.add.rectangle(W / 2, btnY + btnH / 2, btnW, btnH, 0, 0)
      .setInteractive({ useHandCursor: true });
    saveHit.on('pointerover', () => this._drawSaveBtn(true));
    saveHit.on('pointerout',  () => this._drawSaveBtn(false));
    saveHit.on('pointerdown', () => {
      SE.playSE('click');
      GameState.player.homeYokaiIds = [...this._selected];
      GameState.player.homeYokaiIdx = 0;
      GameState.save();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ProfileScene'));
    });

    this.add.graphics().lineStyle(1, 0x2a1040, 0.4).lineBetween(PAD, H - 88, W - PAD, H - 88);

    this._renderGrid();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── 選択済みスロット5つ ──
  _renderSlots() {
    this._slotObjs.forEach(o => { try { o.destroy(); } catch (e) {} });
    this._slotObjs = [];
    const track = o => { this._slotObjs.push(o); return o; };

    const W   = this.W;
    const R   = 28;
    const GAP = (W - 48 - this._MAX * R * 2) / (this._MAX - 1);

    for (let i = 0; i < this._MAX; i++) {
      const cx = 24 + R + i * (R * 2 + GAP);
      const cy = this._slotY;
      const id = this._selected[i];
      const card = id ? D.cards.find(c => c.id === id) : null;

      const accPalette = {
        common: 0xb9b2bf, uncommon: 0x6fd6a8,
        rare: 0x6fa8d8, legendary: 0xe7c065,
      };
      const accHex = card ? (accPalette[card.rarity] || 0xb9b2bf) : 0x2a1a3a;

      // スロット背景円
      const cBg = track(this.add.graphics());
      cBg.fillStyle(id ? 0x1e0c38 : 0x0a0515, 1);
      cBg.fillCircle(cx, cy, R);
      cBg.lineStyle(id ? 2 : 1, accHex, id ? 0.85 : 0.3);
      cBg.strokeCircle(cx, cy, R);

      if (id) {
        // スプライト
        const sprKey = CARD_SPRITE[id];
        if (sprKey && this.textures.exists(sprKey)) {
          const spr = track(this.add.image(cx, cy, sprKey).setOrigin(0.5));
          const maxPx = R * 2 * 0.70;
          spr.setScale(Math.min(maxPx / (spr.width || 1), maxPx / (spr.height || 1)));
        }
        // タップで選択解除
        const hit = track(this.add.circle(cx, cy, R, 0, 0).setInteractive({ useHandCursor: true }));
        hit.on('pointerdown', () => {
          SE.playSE('click');
          this._selected = this._selected.filter(s => s !== id);
          this._renderSlots();
          this._renderGrid();
        });
      } else {
        // 空スロット
        track(this.add.text(cx, cy, `${i + 1}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '16px',
          color: '#2a1a3a',
        }).setOrigin(0.5));
      }
    }

    // 選択数テキスト
    track(this.add.text(W / 2, this._slotY + R + 14, `${this._selected.length} / ${this._MAX} 体選択中`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#9a8fb0',
    }).setOrigin(0.5));
  }

  // ── 所持妖怪グリッド ──
  _renderGrid() {
    this._gridObjs.forEach(o => { try { o.destroy(); } catch (e) {} });
    this._gridObjs = [];
    const track = o => { this._gridObjs.push(o); return o; };

    const W = this.W;
    const H = this.H;
    const ids = this._ownedIds;

    if (ids.length === 0) {
      track(this.add.text(W / 2, 400, '妖怪を入手してから設定できます', {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '14px',
        color: '#443355',
        align: 'center',
      }).setOrigin(0.5));
      return;
    }

    const COLS     = 4;
    const PER_PAGE = 12;
    const totalPages = Math.ceil(ids.length / PER_PAGE);
    this._page = Math.min(this._page, totalPages - 1);
    const pageIds = ids.slice(this._page * PER_PAGE, (this._page + 1) * PER_PAGE);

    const R      = 34;
    const COL_GAP = (W - 48 - COLS * R * 2) / (COLS - 1);
    const startX = 24 + R;
    const startY = this._slotY + 80;

    const accPalette = {
      common:    { hex: 0xb9b2bf, col: '#b9b2bf' },
      uncommon:  { hex: 0x6fd6a8, col: '#6fd6a8' },
      rare:      { hex: 0x6fa8d8, col: '#6fa8d8' },
      legendary: { hex: 0xe7c065, col: '#e7c065' },
    };

    pageIds.forEach((id, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx  = startX + col * (R * 2 + COL_GAP);
      const cy  = startY + row * (R * 2 + 22);

      const isSelected = this._selected.includes(id);
      const card       = D.cards.find(c => c.id === id);
      const acc        = card ? (accPalette[card.rarity] || accPalette.common) : accPalette.common;

      // 選択中の外リング
      if (isSelected) {
        const selG = track(this.add.graphics());
        selG.lineStyle(2.5, 0xe7c065, 0.7);
        selG.strokeCircle(cx, cy, R + 5);
      }

      // 背景円
      const cBg = track(this.add.graphics());
      cBg.fillStyle(isSelected ? 0x2a1535 : 0x0e0818, 1);
      cBg.fillCircle(cx, cy, R);
      cBg.lineStyle(isSelected ? 2.5 : 1, acc.hex, isSelected ? 1.0 : 0.35);
      cBg.strokeCircle(cx, cy, R);

      // スプライト
      const sprKey = CARD_SPRITE[id];
      if (sprKey && this.textures.exists(sprKey)) {
        const spr   = track(this.add.image(cx, cy, sprKey).setOrigin(0.5));
        const maxPx = R * 2 * 0.70;
        spr.setScale(Math.min(maxPx / (spr.width || 1), maxPx / (spr.height || 1)));
        spr.setAlpha(isSelected ? 1 : 0.75);
      } else if (card) {
        track(this.add.text(cx, cy, card.name[0], {
          fontFamily: '"Shippori Mincho B1", serif',
          fontSize: '18px',
          color: acc.col,
        }).setOrigin(0.5));
      }

      // 妖怪名
      if (card) {
        track(this.add.text(cx, cy + R + 8, card.name, {
          fontFamily: '"Shippori Mincho B1", serif',
          fontSize: '9px',
          color: isSelected ? acc.col : '#6a5080',
        }).setOrigin(0.5));
      }

      // タップで選択トグル
      const hit = track(this.add.circle(cx, cy, R, 0, 0).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => {
        SE.playSE('click');
        if (isSelected) {
          this._selected = this._selected.filter(s => s !== id);
        } else {
          if (this._selected.length >= this._MAX) return;
          this._selected.push(id);
        }
        this._renderSlots();
        this._renderGrid();
      });
    });

    // ページネーション
    if (totalPages > 1) {
      const pageY = H - 110;

      const prevBtn = track(this.add.text(W / 2 - 50, pageY, '◀', {
        fontFamily: 'serif', fontSize: '20px', color: '#7a5ba8',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }));
      prevBtn.on('pointerover', () => prevBtn.setColor('#bb88ff'));
      prevBtn.on('pointerout',  () => prevBtn.setColor('#7a5ba8'));
      prevBtn.on('pointerdown', () => {
        SE.playSE('click');
        this._page = (this._page - 1 + totalPages) % totalPages;
        this._renderGrid();
      });

      track(this.add.text(W / 2, pageY, `${this._page + 1} / ${totalPages}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#9a8fb0',
      }).setOrigin(0.5));

      const nextBtn = track(this.add.text(W / 2 + 50, pageY, '▶', {
        fontFamily: 'serif', fontSize: '20px', color: '#7a5ba8',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }));
      nextBtn.on('pointerover', () => nextBtn.setColor('#bb88ff'));
      nextBtn.on('pointerout',  () => nextBtn.setColor('#7a5ba8'));
      nextBtn.on('pointerdown', () => {
        SE.playSE('click');
        this._page = (this._page + 1) % totalPages;
        this._renderGrid();
      });
    }
  }
}
