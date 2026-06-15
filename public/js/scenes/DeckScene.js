class DeckScene extends Phaser.Scene {
  constructor() { super('DeckScene'); }

  create() {
    SE.init();
    SE.playBGM('title');

    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    // 現在保存済みのデッキをコピーして作業用に使う
    this._deck = [...(GameState.player.deck || [])];
    this._rowObjects = [];

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050210, 0x050210, 0x100820, 0x100820, 1);
    bg.fillRect(0, 0, W, H);

    // ===== ヘッダー（固定） =====
    this.add.rectangle(W / 2, 35, W, 70, 0x0a0520, 1).setScrollFactor(0);
    this.add.graphics().setScrollFactor(0).lineStyle(1, 0x331155).lineBetween(0, 70, W, 70);

    this.add.text(W / 2, 18, 'デッキ構築', {
      fontFamily: 'serif', fontSize: '22px', color: '#e8c87a',
      stroke: '#4a1a6a', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);

    this._countText = this.add.text(W / 2, 48, '', {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
    }).setOrigin(0.5).setScrollFactor(0);
    this._updateCountText();

    // ===== フッター（固定） =====
    this.add.rectangle(W / 2, H - 35, W, 70, 0x0a0520, 1).setScrollFactor(0);
    this.add.graphics().setScrollFactor(0).lineStyle(1, 0x331155).lineBetween(0, H - 70, W, H - 70);

    this._makeFooterBtn(W * 0.18, H - 35, 'クリア', '#cc4444', () => {
      this._deck = [];
      SE.playSE('click');
      this._renderList();
      this._updateCountText();
    });

    this._makeFooterBtn(W * 0.5, H - 35, '保存して戻る', '#44cc88', () => {
      GameState.player.deck = [...this._deck];
      GameState.save();
      SE.playSE('click');
      this.scene.start('HomeScene');
    });

    this._makeFooterBtn(W * 0.82, H - 35, '← 戻る', '#b89adc', () => {
      SE.playSE('click');
      this.scene.start('HomeScene');
    });

    // ===== カードリスト =====
    this._renderList();

    // スクロール
    const ownedIds = [...new Set(GameState.player.unlockedCards)];
    const contentH = 80 + ownedIds.length * 72 + 80;
    const maxScroll = Math.max(0, contentH - H + 70);
    this.input.on('wheel', (_, __, ___, deltaY) => {
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.5, 0, maxScroll
      );
    });
  }

  _makeFooterBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'serif', fontSize: '14px', color,
      backgroundColor: '#1a1030', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => btn.setAlpha(0.75));
    btn.on('pointerout',   () => btn.setAlpha(1));
    btn.on('pointerdown',  cb);
  }

  _updateCountText() {
    const n = this._deck.length;
    const color = n === 44 ? '#44ff88' : n > 44 ? '#ff4444' : '#b89adc';
    this._countText.setText(`デッキ: ${n} / 44 枚`).setColor(color);
  }

  _renderList() {
    this._rowObjects.forEach(o => o.destroy());
    this._rowObjects = [];

    const ownedIds = [...new Set(GameState.player.unlockedCards)];
    const startY = 80;
    const rowH   = 72;

    ownedIds.forEach((id, idx) => {
      const card = D.cards.find(c => c.id === id);
      if (!card) return;
      const y = startY + idx * rowH + rowH / 2;
      this._drawRow(id, card, y);
    });
  }

  _track(obj) { this._rowObjects.push(obj); return obj; }

  _drawRow(id, card, y) {
    const t = obj => this._track(obj);
    const W = this.W;
    const rarity     = D.rarity[card.rarity];
    const rarityCol  = Phaser.Display.Color.HexStringToColor(rarity.color).color;
    const count      = this._deck.filter(c => c === id).length;
    const inDeck     = count > 0;

    // 行背景
    t(this.add.rectangle(W / 2, y, W - 8, 68,
      inDeck ? 0x1e0c38 : 0x0d0820, 1).setStrokeStyle(1, rarityCol, inDeck ? 0.5 : 0.15));

    // レアリティ縦バー（左端）
    t(this.add.rectangle(5, y, 4, 64, rarityCol, inDeck ? 0.9 : 0.3));

    // スプライト
    const sprKey = CARD_SPRITE[id];
    if (sprKey && this.textures.exists(sprKey)) {
      const spr = t(this.add.image(42, y, sprKey).setOrigin(0.5));
      const sc  = Math.min(44 / spr.width, 48 / spr.height);
      spr.setScale(sc).setAlpha(inDeck ? 1 : 0.5);
    }

    // カード名
    t(this.add.text(88, y - 15, card.name, {
      fontFamily: 'serif', fontSize: '14px',
      color: inDeck ? '#e8c87a' : '#887766',
    }).setOrigin(0, 0.5));

    // ステータス
    t(this.add.text(88, y + 3, `⚡${card.cost}  ⚔${card.atk}  ♥${card.hp}`, {
      fontFamily: 'serif', fontSize: '11px', color: '#a090c0',
    }).setOrigin(0, 0.5));

    // レアリティラベル
    t(this.add.text(88, y + 19, rarity.label, {
      fontFamily: 'serif', fontSize: '9px',
      color: inDeck ? rarity.color : '#554444',
    }).setOrigin(0, 0.5));

    // ===== − ボタン =====
    const canRemove = count > 0;
    const minusBg = t(this.add.circle(330, y, 18, canRemove ? 0x3a0a3a : 0x111111));
    t(this.add.text(330, y, '−', {
      fontFamily: 'monospace', fontSize: '20px',
      color: canRemove ? '#cc88ff' : '#333333',
    }).setOrigin(0.5));
    if (canRemove) {
      minusBg.setInteractive({ useHandCursor: true });
      minusBg.on('pointerover', () => minusBg.setFillStyle(0x5a1a5a));
      minusBg.on('pointerout',  () => minusBg.setFillStyle(0x3a0a3a));
      minusBg.on('pointerdown', () => {
        const i = this._deck.indexOf(id);
        if (i !== -1) this._deck.splice(i, 1);
        SE.playSE('click');
        this._renderList();
        this._updateCountText();
      });
    }

    // ===== 枚数表示 =====
    t(this.add.text(370, y, `${count}`, {
      fontFamily: 'serif', fontSize: '22px',
      color: count > 0 ? '#ffffff' : '#333333',
    }).setOrigin(0.5));

    // ===== + ボタン =====
    const canAdd = count < 3 && this._deck.length < 44;
    const plusBg = t(this.add.circle(410, y, 18, canAdd ? 0x0a3a1a : 0x111111));
    t(this.add.text(410, y, '+', {
      fontFamily: 'monospace', fontSize: '20px',
      color: canAdd ? '#44ff88' : '#333333',
    }).setOrigin(0.5));
    if (canAdd) {
      plusBg.setInteractive({ useHandCursor: true });
      plusBg.on('pointerover', () => plusBg.setFillStyle(0x1a5a2a));
      plusBg.on('pointerout',  () => plusBg.setFillStyle(0x0a3a1a));
      plusBg.on('pointerdown', () => {
        this._deck.push(id);
        SE.playSE('click');
        this._renderList();
        this._updateCountText();
      });
    }

    // ===== 上限3枚バッジ =====
    if (count >= 3) {
      t(this.add.text(450, y, 'MAX', {
        fontFamily: 'serif', fontSize: '9px', color: '#ffaa22',
        backgroundColor: '#332200', padding: { x: 3, y: 2 },
      }).setOrigin(0.5));
    }
  }
}
