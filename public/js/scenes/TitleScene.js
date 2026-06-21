class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    SE.init();
    SE.playBGM('title');
    const W = this.scale.width;
    const H = this.scale.height;

    // ── 背景ベース ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x080510);

    const bg = this.add.graphics();
    bg.fillStyle(0x2c1533, 0.42);
    bg.fillEllipse(W / 2, H * 0.38, W * 1.2, H * 0.72);
    bg.fillStyle(0x1a0d22, 0.30);
    bg.fillEllipse(W / 2, H * 0.55, W * 0.85, H * 0.52);

    // ── 霧もや ──
    const fog1 = this.add.graphics();
    fog1.fillStyle(0x6b3499, 0.09);
    fog1.fillEllipse(W * 0.28, H * 0.52, 340, 140);
    this.tweens.add({
      targets: fog1, x: 22, y: -12, scaleX: 1.1, scaleY: 0.92,
      duration: 19000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    const fog2 = this.add.graphics();
    fog2.fillStyle(0x5a2580, 0.07);
    fog2.fillEllipse(W * 0.72, H * 0.44, 300, 120);
    this.tweens.add({
      targets: fog2, x: -18, y: 14, scaleX: 0.88, scaleY: 1.1,
      duration: 23000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // ── 血月の暈 ──
    const halo = this.add.graphics();
    halo.fillStyle(0xe8c46c, 0.20);
    halo.fillCircle(W / 2, 228, 118);
    halo.fillStyle(0xc0392b, 0.07);
    halo.fillCircle(W / 2, 228, 150);
    this.tweens.add({
      targets: halo, alpha: 0.48, scaleX: 1.05, scaleY: 1.05,
      duration: 7000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // ── エンバー粒子（下から上へ浮上するちいさな光） ──
    this._embers = [];
    for (let i = 0; i < 14; i++) {
      const isGold = Math.random() > 0.42;
      const g = this.add.graphics();
      g.fillStyle(isGold ? 0xe8c46c : 0x8a5fb0, 0.55 + Math.random() * 0.3);
      g.fillCircle(0, 0, 1 + Math.random() * 1.5);
      g._ex   = 30 + Math.random() * (W - 60);
      g._ey   = H + 10 + Math.random() * 100;
      g._evy  = -(0.35 + Math.random() * 0.55);
      g._elife = Math.random() * 8000;
      g._emaxL = 7000 + Math.random() * 8000;
      g.setPosition(g._ex, g._ey);
      this._embers.push(g);
    }

    // ── ロゴ「妖忘記」──
    const logoY = H * 0.44;
    const logo = this.add.text(W / 2, logoY, '妖忘記', {
      fontFamily: '"Yuji Mai", serif',
      fontSize: '92px',
      color: '#ecd089',
      stroke: '#876626',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0);

    // 落款印「妖」
    const sealX = W / 2 + 112;
    const sealY = logoY - 50;
    const seal = this.add.graphics();
    seal.fillStyle(0xbb3326, 1);
    seal.fillRoundedRect(-24, -24, 48, 48, 7);
    seal.lineStyle(1.5, 0xf3ead2, 0.28);
    seal.strokeRoundedRect(-24, -24, 48, 48, 7);
    seal.setPosition(sealX, sealY).setAngle(-7).setAlpha(0);

    const sealTxt = this.add.text(sealX, sealY, '妖', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '26px',
      color: '#f3ead2',
    }).setOrigin(0.5).setAngle(-7).setAlpha(0);

    // ── サブタイトル ──
    const sub = this.add.text(W / 2, logoY + 64, '〜  ようぼうき  〜', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '18px',
      color: '#b6a4cf',
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    // ── 始めるボタン ──
    const btnY = H * 0.76;
    const btnW = 200, btnH = 56;

    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xe8c46c, 0.10);
    btnGlow.fillCircle(W / 2, btnY, 88);
    btnGlow.setAlpha(0);

    const btnBg = this.add.graphics();
    const drawBtn = (hover = false) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xfff4d8 : 0xf1e3bf, 1);
      btnBg.fillRoundedRect(W/2 - btnW/2, btnY - btnH/2, btnW, btnH/2, { tl:7, tr:7, bl:0, br:0 });
      btnBg.fillStyle(hover ? 0xf5dc9a : 0xe1cb8e, 1);
      btnBg.fillRoundedRect(W/2 - btnW/2, btnY, btnW, btnH/2, { tl:0, tr:0, bl:7, br:7 });
      btnBg.lineStyle(1.5, 0xc9a14a, 0.95);
      btnBg.strokeRoundedRect(W/2 - btnW/2, btnY - btnH/2, btnW, btnH, 7);
    };
    drawBtn();
    btnBg.setAlpha(0);

    const btnTxt = this.add.text(W / 2, btnY, '始める', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '25px',
      color: '#5a2014',
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    const btnHit = this.add.rectangle(W / 2, btnY, btnW, btnH, 0, 0)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerover', () => drawBtn(true));
    btnHit.on('pointerout',  () => drawBtn(false));
    btnHit.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const next = GameState.player.tutorialDone ? 'HomeScene' : 'TutorialScene';
        this.scene.start(next);
      });
    });

    // ── 新しく始めるボタン ──
    const newBtn = this.add.text(W / 2, H * 0.88, '新しく始める', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '14px',
      color: '#886688',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
    newBtn.on('pointerover', () => newBtn.setColor('#cc88cc'));
    newBtn.on('pointerout',  () => newBtn.setColor('#886688'));
    newBtn.on('pointerdown', () => {
      SE.playSE('click');
      this._showResetConfirm(W, H);
    });

    // ── バージョン ──
    this.add.text(W - 10, H - 10, 'v0.1.0', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#d8b15a',
    }).setOrigin(1, 1).setAlpha(0.42);

    // ── フェードイン ──
    this.time.delayedCall(200, () => {
      this.tweens.add({ targets: logo,             alpha: 1, duration: 1400, ease: 'Power2' });
      this.tweens.add({ targets: [seal, sealTxt],  alpha: 1, duration: 1000, ease: 'Power2', delay: 300 });
      this.tweens.add({ targets: sub,              alpha: 1, duration: 1000, ease: 'Power2', delay: 500 });
    });
    this.time.delayedCall(1100, () => {
      this.tweens.add({
        targets: [btnBg, btnTxt, btnGlow], alpha: 1, duration: 700, ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: btnGlow, alpha: 0.38, scaleX: 1.08, scaleY: 1.08,
            duration: 4500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
          });
        },
      });
      this.tweens.add({ targets: newBtn, alpha: 1, duration: 700, ease: 'Power2', delay: 200 });
    });
  }

  _showResetConfirm(W, H) {
    // 既に開いていたら無視
    if (this._confirmModal) return;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.70).setDepth(10).setInteractive();
    const panel   = this.add.graphics().setDepth(11);
    const pW = 280, pH = 180;
    panel.fillStyle(0x1a0a30, 1);
    panel.fillRoundedRect(W / 2 - pW / 2, H / 2 - pH / 2, pW, pH, 10);
    panel.lineStyle(1.5, 0x884488, 0.9);
    panel.strokeRoundedRect(W / 2 - pW / 2, H / 2 - pH / 2, pW, pH, 10);

    const msg = this.add.text(W / 2, H / 2 - 44, 'セーブデータを削除して\n最初から始めますか？', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '14px', color: '#c8b8e8', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(12);

    // 「はい」ボタン
    const yesBtn = this.add.text(W / 2 - 54, H / 2 + 40, 'はい', {
      fontFamily: '"Yuji Syuku", serif', fontSize: '16px', color: '#ff8888',
      backgroundColor: '#2a0a0a', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });
    yesBtn.on('pointerover', () => yesBtn.setColor('#ffbbbb'));
    yesBtn.on('pointerout',  () => yesBtn.setColor('#ff8888'));
    yesBtn.on('pointerdown', () => {
      SE.playSE('click');
      GameState.reset();
      this._closeConfirm();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('BootScene'));
    });

    // 「いいえ」ボタン
    const noBtn = this.add.text(W / 2 + 54, H / 2 + 40, 'いいえ', {
      fontFamily: '"Yuji Syuku", serif', fontSize: '16px', color: '#b89adc',
      backgroundColor: '#1a0a40', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });
    noBtn.on('pointerover', () => noBtn.setColor('#e8c87a'));
    noBtn.on('pointerout',  () => noBtn.setColor('#b89adc'));
    noBtn.on('pointerdown', () => { SE.playSE('click'); this._closeConfirm(); });

    this._confirmModal = [overlay, panel, msg, yesBtn, noBtn];
  }

  _closeConfirm() {
    if (!this._confirmModal) return;
    this._confirmModal.forEach(o => o.destroy());
    this._confirmModal = null;
  }

  update(_time, delta) {
    const W = this.scale.width;
    const H = this.scale.height;
    for (const e of this._embers) {
      e._elife += delta;
      if (e._ey < -20 || e._elife > e._emaxL) {
        e._ex    = 30 + Math.random() * (W - 60);
        e._ey    = H + 10;
        e._elife = 0;
        e._emaxL = 7000 + Math.random() * 8000;
        e._evy   = -(0.35 + Math.random() * 0.55);
      }
      e._ey += e._evy * (delta / 16);
      e.setPosition(e._ex, e._ey);
    }
  }
}
