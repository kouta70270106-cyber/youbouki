class AvatarSelectScene extends Phaser.Scene {
  constructor() { super('AvatarSelectScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    this._gridObjs       = [];
    this._page           = 0;
    this._ownedIds       = [...new Set(GameState.player.unlockedCards || [])];
    this._tempSelected   = GameState.player.profileYokaiId; // 仮選択（まだ保存しない）
    this._hasNewSelection = false; // このセッションで新たに選択したか

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x080510);
    const bgG = this.add.graphics();
    bgG.fillStyle(0x2c1533, 0.28);
    bgG.fillEllipse(W / 2, H * 0.35, W * 1.2, H * 0.55);

    // ── ヘッダー ──
    this.add.rectangle(W / 2, 40, W, 80, 0x060210);
    this.add.graphics().lineStyle(1, 0x2a1040, 0.8).lineBetween(0, 80, W, 80);

    this.add.text(W / 2, 38, 'アバター設定', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '22px',
      color: '#ecd089',
      stroke: '#876626',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ← 戻る（キャンセル・保存しない）
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

    // ヒントテキスト
    this.add.text(W / 2, 94, 'アバターにする妖怪を選んでください', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '12px',
      color: '#6a5080',
    }).setOrigin(0.5);

    // ── 保存ボタン（固定・画面下部） ──
    const PAD   = 24;
    const btnY  = H - 72;
    const btnW  = W - PAD * 2;
    const btnH  = 50;
    const btnX  = PAD;

    const saveBg = this.add.graphics();
    // enabled=false のときは薄いグレー、true のときはアクティブグリーン
    this._drawSaveBtn = (hover = false, enabled = this._hasNewSelection) => {
      saveBg.clear();
      if (enabled) {
        saveBg.fillStyle(hover ? 0x4f8a6a : 0x3f7a5a, 1);
        saveBg.fillRoundedRect(btnX, btnY, btnW, btnH / 2, { tl: 10, tr: 10, bl: 0, br: 0 });
        saveBg.fillStyle(hover ? 0x2f6a4a : 0x1f5a3a, 1);
        saveBg.fillRoundedRect(btnX, btnY + btnH / 2, btnW, btnH / 2, { tl: 0, tr: 0, bl: 10, br: 10 });
        saveBg.lineStyle(1, 0xe7c065, 0.40);
        saveBg.strokeRoundedRect(btnX + 2, btnY + 2, btnW - 4, btnH - 4, 8);
      } else {
        // 未選択：薄いグレー
        saveBg.fillStyle(0x1e1e2a, 1);
        saveBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
        saveBg.lineStyle(1, 0x3a3a50, 0.6);
        saveBg.strokeRoundedRect(btnX + 2, btnY + 2, btnW - 4, btnH - 4, 8);
      }
    };
    this._drawSaveBtn();

    const saveTxt = this.add.text(W / 2, btnY + btnH / 2, '保　存', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '20px',
      color: '#f3ead2',
      letterSpacing: 8,
    }).setOrigin(0.5);
    // 未選択時はテキストも薄く
    saveTxt.setAlpha(this._hasNewSelection ? 1 : 0.3);
    this._saveTxt = saveTxt;

    const saveHit = this.add.rectangle(W / 2, btnY + btnH / 2, btnW, btnH, 0, 0)
      .setInteractive({ useHandCursor: true });
    saveHit.on('pointerover', () => { if (this._hasNewSelection) this._drawSaveBtn(true); });
    saveHit.on('pointerout',  () => { if (this._hasNewSelection) this._drawSaveBtn(false); });
    saveHit.on('pointerdown', () => {
      if (!this._hasNewSelection) return; // 未選択なら何もしない
      SE.playSE('click');
      GameState.player.profileYokaiId = this._tempSelected;
      GameState.save();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ProfileScene'));
    });

    // 仕切り線（グリッドと保存ボタンの間）
    this.add.graphics().lineStyle(1, 0x2a1040, 0.4).lineBetween(PAD, H - 88, W - PAD, H - 88);

    this._renderGrid();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _renderGrid() {
    this._gridObjs.forEach(o => { try { o.destroy(); } catch (e) {} });
    this._gridObjs = [];
    const track = o => { this._gridObjs.push(o); return o; };

    const W   = this.W;
    const H   = this.H;
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

    const COLS      = 4;
    const PER_PAGE  = 12;
    const totalPages = Math.ceil(ids.length / PER_PAGE);
    this._page = Math.min(this._page, totalPages - 1);
    const pageIds = ids.slice(this._page * PER_PAGE, (this._page + 1) * PER_PAGE);

    const R       = 38;
    const COL_GAP = (W - 48 - COLS * R * 2) / (COLS - 1);
    const ROW_GAP = 14;
    const startX  = 24 + R;
    const startY  = 118 + R;

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
      const cy  = startY + row * (R * 2 + 20 + ROW_GAP);

      // _tempSelected を基準にハイライト（保存前の仮選択）
      const isSelected = (id === this._tempSelected);
      const card       = D.cards.find(c => c.id === id);
      const acc        = card ? (accPalette[card.rarity] || accPalette.common) : accPalette.common;

      // 選択中の外リング
      if (isSelected) {
        const selG = track(this.add.graphics());
        selG.lineStyle(2, 0xe7c065, 0.55);
        selG.strokeCircle(cx, cy, R + 5);
      }

      // 背景円
      const cBg = track(this.add.graphics());
      cBg.fillStyle(isSelected ? 0x2a1535 : 0x0e0818, 1);
      cBg.fillCircle(cx, cy, R);
      cBg.lineStyle(isSelected ? 2.5 : 1, acc.hex, isSelected ? 1.0 : 0.35);
      cBg.strokeCircle(cx, cy, R);

      // スプライト or イニシャル
      const sprKey = CARD_SPRITE[id];
      if (sprKey && this.textures.exists(sprKey)) {
        const spr   = track(this.add.image(cx, cy, sprKey).setOrigin(0.5));
        const maxPx = R * 2 * 0.72;
        const sw    = spr.width  || 1;
        const sh    = spr.height || 1;
        spr.setScale(Math.min(maxPx / sw, maxPx / sh));
      } else if (card) {
        track(this.add.text(cx, cy, card.name[0], {
          fontFamily: '"Shippori Mincho B1", serif',
          fontSize: '20px',
          color: acc.col,
        }).setOrigin(0.5));
      }

      // 妖怪名ラベル
      if (card) {
        track(this.add.text(cx, cy + R + 8, card.name, {
          fontFamily: '"Shippori Mincho B1", serif',
          fontSize: '10px',
          color: isSelected ? acc.col : '#6a5080',
        }).setOrigin(0.5));
      }

      // ヒットエリア（タップで仮選択 → グリッドを再描画するだけ）
      const hit = track(
        this.add.circle(cx, cy, R, 0, 0).setInteractive({ useHandCursor: true })
      );
      hit.on('pointerdown', () => {
        SE.playSE('click');
        this._tempSelected    = id;
        this._hasNewSelection = true;
        // 保存ボタンをアクティブ化
        this._drawSaveBtn(false, true);
        this._saveTxt.setAlpha(1);
        this._renderGrid();
      });
    });

    // ── ページネーション ──
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
