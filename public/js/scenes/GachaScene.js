// 妖忘記 — ガチャシーン
class GachaScene extends Phaser.Scene {
  constructor() { super('GachaScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    // ガチャ対象カード
    this._rarePool = ['nue','kyubi','dai_tengu','shuten_doji','tamamo'];
    this._legendPool = ['ryujin','susanoo'];

    this._drawBg();
    this._drawHeader();
    this._drawJureikonPanel();
    this._drawGachaBtn();
    this._resultObjs = [];
  }

  _drawBg() {
    const W = this.W, H = this.H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x050115);
    const g = this.add.graphics();
    g.fillStyle(0x1a0533, 0.45);
    g.fillEllipse(W / 2, H * 0.45, W * 1.3, H * 0.8);
    g.fillStyle(0x0a0222, 0.3);
    g.fillEllipse(W * 0.3, H * 0.6, 300, 200);
  }

  _drawHeader() {
    const W = this.W;
    this.add.rectangle(W / 2, 40, W, 80, 0x060210);
    this.add.graphics().lineStyle(1, 0x3a1060, 0.8).lineBetween(0, 80, W, 80);

    this.add.text(W / 2, 38, '呪魂ガチャ', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '28px',
      color: '#cc88ff',
      stroke: '#3a0066',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 戻るボタン
    const backBtn = this.add.text(28, 38, '◀', {
      fontFamily: 'serif', fontSize: '22px', color: '#b89adc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover',  () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout',   () => backBtn.setColor('#b89adc'));
    backBtn.on('pointerdown',  () => {
      SE.playSE('click');
      this.scene.start('HomeScene');
    });

    // DEVボタン（localhost のみ表示）
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const devBtn = this.add.text(W - 8, 8, '[DEV]', {
        fontFamily: 'monospace', fontSize: '11px', color: '#554466',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      devBtn.on('pointerdown', () => {
        GameState.player.jureikon += 20;
        GameState.save();
        if (this._jureikonText) this._jureikonText.setText(`🔮 ${GameState.player.jureikon}`);
      });
    }
  }

  _drawJureikonPanel() {
    const W = this.W;
    const panelY = 108;

    const g = this.add.graphics();
    g.fillStyle(0x1a0840, 0.7);
    g.fillRoundedRect(W / 2 - 130, panelY, 260, 60, 10);
    g.lineStyle(1, 0x8844cc, 0.5);
    g.strokeRoundedRect(W / 2 - 130, panelY, 260, 60, 10);

    this.add.text(W / 2, panelY + 16, '所持呪魂', {
      fontFamily: 'serif', fontSize: '13px', color: '#9966cc',
    }).setOrigin(0.5);

    this._jureikonText = this.add.text(W / 2, panelY + 40, `🔮 ${GameState.player.jureikon}`, {
      fontFamily: '"Yuji Syuku", serif', fontSize: '22px', color: '#cc88ff',
      stroke: '#1a0033', strokeThickness: 3,
    }).setOrigin(0.5);

    // コスト説明
    this.add.text(W / 2, panelY + 80, '1回引くのに 呪魂 ×4 必要', {
      fontFamily: 'serif', fontSize: '12px', color: '#7755aa',
    }).setOrigin(0.5);
  }

  _drawGachaBtn() {
    const W = this.W;
    const btnY = 218;
    const btnW = 220, btnH = 52;
    const btnX = W / 2 - btnW / 2;

    this._gachaBtnG = this.add.graphics();
    this._drawBtn(false);

    this._gachaBtnLabel = this.add.text(W / 2, btnY + btnH / 2, 'ガチャを引く（4呪魂）', {
      fontFamily: '"Yuji Syuku", serif', fontSize: '18px', color: '#f3ead2',
      stroke: '#1a0033', strokeThickness: 3,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(W / 2, btnY + btnH / 2, btnW, btnH, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => this._drawBtn(true));
    hit.on('pointerout',   () => this._drawBtn(false));
    hit.on('pointerdown',  () => this._doGacha());

    this._gachaHit = hit;
    this._btnY = btnY; this._btnW = btnW; this._btnH = btnH; this._btnX = btnX;
  }

  _drawBtn(hover) {
    const g = this._gachaBtnG;
    g.clear();
    const col = hover ? 0x7722cc : 0x5511aa;
    g.fillStyle(col, 1);
    g.fillRoundedRect(this._btnX, this._btnY, this._btnW, this._btnH, 10);
    g.lineStyle(2, 0xcc88ff, hover ? 0.9 : 0.5);
    g.strokeRoundedRect(this._btnX, this._btnY, this._btnW, this._btnH, 10);
  }

  _doGacha() {
    if (GameState.player.jureikon < 4) {
      this._showMessage('呪魂が足りません！\nストーリーをクリアして集めよう', '#ff8844');
      return;
    }

    // 呪魂消費
    GameState.player.jureikon -= 4;
    this._jureikonText.setText(`🔮 ${GameState.player.jureikon}`);

    // 結果決定（レジェンド25% / レア75%）
    const isLegend = Math.random() < 0.25;
    const pool = isLegend ? this._legendPool : this._rarePool;
    const pickedId = pool[Math.floor(Math.random() * pool.length)];
    const card = D.cards.find(c => c.id === pickedId);

    // unlockedCardsに追加
    GameState.player.unlockedCards.push(pickedId);
    GameState.save();

    // 演出
    this._showResult(card, isLegend);
  }

  _showResult(card, isLegend) {
    const W = this.W, H = this.H;

    // 前の結果をクリア
    this._resultObjs.forEach(o => o.destroy());
    this._resultObjs = [];

    const resultY = 310;

    // 光るフレーム
    const frameColor = isLegend ? 0xffaa22 : 0x4488ff;
    const frameG = this.add.graphics();
    frameG.lineStyle(3, frameColor, 0.9);
    frameG.strokeRoundedRect(W / 2 - 80, resultY, 160, 200, 12);
    frameG.fillStyle(frameColor, 0.08);
    frameG.fillRoundedRect(W / 2 - 80, resultY, 160, 200, 12);
    this._resultObjs.push(frameG);

    // カードスプライト
    const rarity = D.rarity[card.rarity];
    const sprKey = CARD_SPRITE[card.id];
    if (sprKey && this.textures.exists(sprKey)) {
      const sprite = this.add.image(W / 2, resultY + 70, sprKey);
      const sc = Math.min(80 / sprite.width, 80 / sprite.height);
      sprite.setScale(sc);
      this._resultObjs.push(sprite);
    }

    // カード名
    const nameT = this.add.text(W / 2, resultY + 122, card.name, {
      fontFamily: '"Yuji Syuku", serif', fontSize: '20px',
      color: rarity.color, stroke: '#050115', strokeThickness: 3,
    }).setOrigin(0.5);
    this._resultObjs.push(nameT);

    // レアリティ
    const rarityT = this.add.text(W / 2, resultY + 148, `【${rarity.label}】`, {
      fontFamily: 'serif', fontSize: '13px', color: rarity.color,
    }).setOrigin(0.5);
    this._resultObjs.push(rarityT);

    // ステータス
    const statT = this.add.text(W / 2, resultY + 168, `⚡${card.cost}  ⚔${card.atk}  ♥${card.hp}`, {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#c8c0e8',
    }).setOrigin(0.5);
    this._resultObjs.push(statT);

    // NEW or DUP 表示
    const allOwned = GameState.player.unlockedCards.filter(id => id === card.id);
    const isNew = allOwned.length === 1;
    const badge = this.add.text(W / 2, resultY + 192, isNew ? '✨ NEW !' : `所持 ${allOwned.length}枚目`, {
      fontFamily: 'serif', fontSize: '13px',
      color: isNew ? '#ffdd44' : '#888888',
    }).setOrigin(0.5);
    this._resultObjs.push(badge);

    // キラキラ演出（レジェンド）
    if (isLegend) {
      for (let i = 0; i < 10; i++) {
        const px = W / 2 + (Math.random() - 0.5) * 200;
        const py = resultY + Math.random() * 200;
        const star = this.add.text(px, py, '✦', {
          fontSize: `${12 + Math.random() * 14}px`, color: '#ffdd44',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 1 }, y: py - 30,
          duration: 600 + Math.random() * 400,
          delay: Math.random() * 500,
          yoyo: true, repeat: -1,
        });
        this._resultObjs.push(star);
      }
    }

    SE.playSE(isLegend ? 'victory' : 'draw');
  }

  _showMessage(msg, color = '#ffdd44') {
    const W = this.W;
    if (this._msgText) this._msgText.destroy();
    this._msgText = this.add.text(W / 2, 290, msg, {
      fontFamily: 'serif', fontSize: '15px', color,
      align: 'center', stroke: '#050115', strokeThickness: 3,
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    this.time.delayedCall(2500, () => {
      if (this._msgText) { this._msgText.destroy(); this._msgText = null; }
    });
  }
}
