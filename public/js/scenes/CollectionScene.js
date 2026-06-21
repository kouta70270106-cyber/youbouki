class CollectionScene extends Phaser.Scene {
  constructor() { super('CollectionScene'); }

  create() {
    SE.init();
    SE.playBGM('title');

    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;
    this.modal = null;
    this._devMode = false;

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050210, 0x050210, 0x100820, 0x100820, 1);
    bg.fillRect(0, 0, W, H);

    // タイトル（画面固定）
    this.add.text(W / 2, 28, '妖怪図鑑', {
      fontFamily: 'serif', fontSize: '26px', color: '#e8c87a',
      stroke: '#4a1a6a', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0);

    // 所持数表示（画面固定）
    const owned = GameState.player.unlockedCards.length;
    const total = D.cards.length;
    this._ownedText = this.add.text(W / 2, 56, `所持 ${owned} / 全 ${total} 種`, {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
    }).setOrigin(0.5).setScrollFactor(0);

    // カードグリッド（3列）
    this._cols  = 3;
    this._cardW = 130; this._cardH = 160;
    this._padX  = 10;  this._padY  = 12;
    this._startX = (W - (this._cols * this._cardW + (this._cols - 1) * this._padX)) / 2 + this._cardW / 2;
    this._startY = 90;
    this._gridObjects = [];

    this._renderGrid();

    // 戻るボタン（画面固定）
    const backBtn = this.add.text(W / 2, H - 24, '← タイトルへ', {
      fontFamily: 'serif', fontSize: '16px', color: '#b89adc',
      backgroundColor: '#1a0a40cc', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#e8c87a'));
    backBtn.on('pointerout',  () => backBtn.setColor('#b89adc'));
    backBtn.on('pointerdown', () => {
      if (this.modal) return;
      SE.playSE('click');
      this.scene.start('HomeScene');
    });

    // 開発者ボタン（localhost のみ表示）
    if (location.hostname.includes('localhost')) {
      const devBtn = this.add.text(W - 8, 8, '[DEV]', {
        fontFamily: 'monospace', fontSize: '11px', color: '#443355',
        backgroundColor: '#1a1a2a', padding: { x: 4, y: 2 },
      }).setOrigin(1, 0).setScrollFactor(0).setInteractive({ useHandCursor: true });
      devBtn.on('pointerdown', () => {
        this._devMode = !this._devMode;
        devBtn.setColor(this._devMode ? '#ff88ff' : '#443355');
        this._ownedText.setText(
          this._devMode
            ? `全 ${D.cards.length} 種 ［DEV: 全表示中］`
            : `所持 ${GameState.player.unlockedCards.length} / 全 ${D.cards.length} 種`
        );
        this._renderGrid();
      });
    }

    // スクロール（30種 × 10行に対応）
    const rows = Math.ceil(D.cards.length / this._cols);
    const contentH = this._startY + rows * (this._cardH + this._padY);
    const maxScroll = Math.max(0, contentH - H + 40);
    this.input.on('wheel', (_, __, ___, deltaY) => {
      if (this.modal) return;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.5, 0, maxScroll
      );
    });
  }

  _renderGrid() {
    // 前回の描画オブジェクトを全削除
    this._gridObjects.forEach(o => o.destroy());
    this._gridObjects = [];

    D.cards.forEach((card, idx) => {
      const col = idx % this._cols;
      const row = Math.floor(idx / this._cols);
      const x   = this._startX + col * (this._cardW + this._padX);
      const y   = this._startY + row * (this._cardH + this._padY);
      const isOwned = this._devMode || GameState.player.unlockedCards.includes(card.id);
      this.drawCard(x, y, card, isOwned);
    });
  }

  _track(obj) {
    this._gridObjects.push(obj);
    return obj;
  }

  drawCard(x, y, card, isOwned) {
    const t = obj => this._track(obj);
    const cardW = 130, cardH = 160;
    const rarity = D.rarity[card.rarity];
    const rarityColor = Phaser.Display.Color.HexStringToColor(rarity.color).color;

    // 背景
    const bgCol = isOwned ? 0x1e0c38 : 0x0d0818;
    const rect = t(this.add.rectangle(x, y, cardW, cardH, bgCol, 1)
      .setStrokeStyle(1.5, isOwned ? rarityColor : 0x2a1a3a));

    // レアリティバー
    t(this.add.rectangle(x, y - cardH / 2 + 5, cardW, 10, rarityColor, isOwned ? 0.65 : 0.2));

    // スプライト
    const sprKey = CARD_SPRITE[card.id];
    if (sprKey && this.textures.exists(sprKey)) {
      const spr = t(this.add.image(x, y - 28, sprKey).setOrigin(0.5));
      const scale = Math.min((cardW - 20) / spr.width, 70 / spr.height);
      spr.setScale(scale).setAlpha(isOwned ? 1 : 0.3);
    }

    // 妖怪名（長い名前は自動縮小）
    const nameFontSize = card.name.length <= 6 ? '13px' : card.name.length <= 9 ? '11px' : '9px';
    t(this.add.text(x, y + 22, card.name, {
      fontFamily: 'serif', fontSize: nameFontSize,
      color: isOwned ? '#e8c87a' : '#665544',
    }).setOrigin(0.5));

    // ステータス行
    const statsY = y + 38;
    t(this.add.text(x - 38, statsY, `⚡${card.cost}`, {
      fontFamily: 'serif', fontSize: '12px', color: isOwned ? '#ffdd44' : '#554422',
    }).setOrigin(0.5));
    t(this.add.text(x, statsY, `⚔${card.atk}`, {
      fontFamily: 'serif', fontSize: '12px', color: isOwned ? '#ff8844' : '#553322',
    }).setOrigin(0.5));
    t(this.add.text(x + 38, statsY, `♥${card.hp}`, {
      fontFamily: 'serif', fontSize: '12px', color: isOwned ? '#44ff88' : '#224433',
    }).setOrigin(0.5));

    // レアリティラベル
    t(this.add.text(x, y + 56, rarity.label, {
      fontFamily: 'serif', fontSize: '10px',
      color: isOwned ? rarity.color : '#443333',
    }).setOrigin(0.5));

    // 所持 or 未入手
    t(this.add.text(x, y + 70, isOwned ? 'タップで詳細' : '未入手', {
      fontFamily: 'serif', fontSize: '9px',
      color: isOwned ? '#554466' : '#442233',
    }).setOrigin(0.5));

    // 全カードタップで詳細（DEVモード時は未入手も見れる）
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setStrokeStyle(2, isOwned ? 0xffdd44 : 0x886655));
    rect.on('pointerout',  () => rect.setStrokeStyle(1.5, isOwned ? rarityColor : 0x2a1a3a));
    rect.on('pointerdown', () => {
      if (!isOwned) return;
      SE.playSE('click');
      this.showDetail(card);
    });
  }

  // 日本語テキストを指定文字数で強制改行
  wrapJP(text, maxChars) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += text[i];
      if ((i + 1) % maxChars === 0 && i + 1 < text.length) result += '\n';
    }
    return result;
  }

  // ===== 詳細モーダル =====
  showDetail(card) {
    if (this.modal) return;

    const W = this.W, H = this.H;
    const scrollY = this.cameras.main.scrollY;
    const rarity = D.rarity[card.rarity];
    const rarityColor = Phaser.Display.Color.HexStringToColor(rarity.color).color;
    const CHARS = 20; // 1行あたりの文字数（12px換算）
    const CHARS_S = 22; // 小フォント用

    const container = this.add.container(0, scrollY);
    this.modal = container;

    // 暗いオーバーレイ
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeDetail());
    container.add(overlay);

    const panelW = 300, panelH = 490;
    const panelX = W / 2;
    const panelY = H / 2;
    const top = panelY - panelH / 2; // パネル上端（絶対Y）

    // パネル本体
    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a30, 1);
    panel.fillRoundedRect(panelX - panelW / 2, top, panelW, panelH, 12);
    panel.lineStyle(2, rarityColor, 0.9);
    panel.strokeRoundedRect(panelX - panelW / 2, top, panelW, panelH, 12);
    container.add(panel);

    // レアリティ上部バー
    const topBar = this.add.graphics();
    topBar.fillStyle(rarityColor, 0.7);
    topBar.fillRoundedRect(panelX - panelW / 2, top, panelW, 14, { tl: 12, tr: 12, bl: 0, br: 0 });
    container.add(topBar);

    // ===== 以下すべてY座標をtopからの相対で管理 =====
    let curY = top + 20; // 現在の描画Y位置

    // スプライト発光
    const glow = this.add.graphics();
    glow.fillStyle(rarityColor, 0.13);
    glow.fillCircle(panelX, curY + 48, 52);
    container.add(glow);

    // 妖怪スプライト
    const sprKey = CARD_SPRITE[card.id];
    if (sprKey && this.textures.exists(sprKey)) {
      const spr = this.add.image(panelX, curY + 48, sprKey).setOrigin(0.5);
      const scale = Math.min(88 / spr.width, 88 / spr.height);
      spr.setScale(scale);
      container.add(spr);
    }
    curY += 104; // スプライト領域分進める

    // 妖怪名
    const nameT = this.add.text(panelX, curY, card.name, {
      fontFamily: 'serif', fontSize: '24px', color: '#e8c87a',
      stroke: '#2a0840', strokeThickness: 4,
    }).setOrigin(0.5, 0);
    container.add(nameT);
    curY += 30;

    // レアリティ
    const rarityT = this.add.text(panelX, curY, `— ${rarity.label} —`, {
      fontFamily: 'serif', fontSize: '11px', color: rarity.color,
    }).setOrigin(0.5, 0);
    container.add(rarityT);
    curY += 22;

    // 区切り線
    const line1 = this.add.graphics();
    line1.lineStyle(1, 0x6633aa, 0.45);
    line1.lineBetween(panelX - panelW / 2 + 20, curY, panelX + panelW / 2 - 20, curY);
    container.add(line1);
    curY += 10;

    // ステータス3ボックス
    const statH = 38;
    const stats = [
      { label: '⚡コスト', value: card.cost, color: '#ffdd44' },
      { label: '⚔ 攻撃',  value: card.atk,  color: '#ff8844' },
      { label: '♥ 体力',  value: card.hp,   color: '#44ff88' },
    ];
    stats.forEach((s, i) => {
      const sx = panelX - 82 + i * 82;
      const sy = curY + statH / 2;
      container.add(this.add.rectangle(sx, sy, 72, statH, 0x0a0520, 1).setStrokeStyle(1, 0x443366));
      container.add(this.add.text(sx, sy - 9, s.label, { fontFamily: 'serif', fontSize: '9px', color: '#888899' }).setOrigin(0.5));
      container.add(this.add.text(sx, sy + 8, `${s.value}`, { fontFamily: 'serif', fontSize: '17px', color: s.color }).setOrigin(0.5));
    });
    curY += statH + 12;

    // 【能力】
    container.add(this.add.text(panelX, curY, '【能力】', { fontFamily: 'serif', fontSize: '11px', color: '#8866cc' }).setOrigin(0.5, 0));
    curY += 16;
    const descT = this.add.text(panelX, curY, this.wrapJP(card.desc, CHARS), {
      fontFamily: 'serif', fontSize: '12px', color: '#c8b8e8',
      align: 'center', lineSpacing: 3,
    }).setOrigin(0.5, 0);
    container.add(descT);
    curY += descT.height + 12;

    // 区切り線2
    const line2 = this.add.graphics();
    line2.lineStyle(1, 0x6633aa, 0.3);
    line2.lineBetween(panelX - panelW / 2 + 20, curY, panelX + panelW / 2 - 20, curY);
    container.add(line2);
    curY += 10;

    // 【伝承】
    container.add(this.add.text(panelX, curY, '【伝承】', { fontFamily: 'serif', fontSize: '11px', color: '#8866cc' }).setOrigin(0.5, 0));
    curY += 16;
    const loreT = this.add.text(panelX, curY, this.wrapJP(card.lore || '', CHARS_S), {
      fontFamily: 'serif', fontSize: '11px', color: '#9988aa',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);
    container.add(loreT);

    // 閉じるボタン（✕）
    const closeBtn = this.add.text(panelX + panelW / 2 - 18, top + 18, '✕', {
      fontFamily: 'serif', fontSize: '18px', color: '#cc88ff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#cc88ff'));
    closeBtn.on('pointerdown', () => this.closeDetail());
    container.add(closeBtn);

    // 入場アニメーション
    container.setAlpha(0).setScale(0.9);
    this.tweens.add({
      targets: container,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 180, ease: 'Back.easeOut',
    });
  }

  closeDetail() {
    if (!this.modal) return;
    SE.playSE('click');
    this.tweens.add({
      targets: this.modal,
      alpha: 0, scaleX: 0.88, scaleY: 0.88,
      duration: 140, ease: 'Sine.easeIn',
      onComplete: () => {
        if (this.modal) { this.modal.destroy(); this.modal = null; }
      }
    });
  }
}
