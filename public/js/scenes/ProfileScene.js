class ProfileScene extends Phaser.Scene {
  constructor() { super('ProfileScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x080510);
    const bgG = this.add.graphics();
    bgG.fillStyle(0x2c1533, 0.28);
    bgG.fillEllipse(W / 2, H * 0.35, W * 1.2, H * 0.55);

    // ── ヘッダー ──
    this.add.rectangle(W / 2, 40, W, 80, 0x060210);
    this.add.graphics().lineStyle(1, 0x2a1040, 0.8).lineBetween(0, 80, W, 80);

    this.add.text(W / 2, 38, 'プロフィール', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '24px',
      color: '#ecd089',
      stroke: '#876626',
      strokeThickness: 3,
    }).setOrigin(0.5);

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
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'));
    });

    // ── アバター ──
    const name      = GameState.player.name || '？';
    const profileId = GameState.player.profileYokaiId;
    const sprKey    = profileId ? CARD_SPRITE[profileId] : null;
    const avaX = W / 2, avaY = 210;

    // 外リング（通常）
    const avaRingG = this.add.graphics();
    const drawRing = (hover) => {
      avaRingG.clear();
      avaRingG.fillStyle(0x2c1533, 1);
      avaRingG.fillCircle(avaX, avaY, 52);
      avaRingG.lineStyle(2, hover ? 0xffd700 : 0xe7c065, hover ? 1 : 0.75);
      avaRingG.strokeCircle(avaX, avaY, 52);
      avaRingG.lineStyle(1, 0xe7c065, hover ? 0.40 : 0.22);
      avaRingG.strokeCircle(avaX, avaY, 58);
    };
    drawRing(false);

    // スプライト or イニシャル
    if (sprKey && this.textures.exists(sprKey)) {
      const spr   = this.add.image(avaX, avaY, sprKey).setOrigin(0.5);
      const maxPx = 50 * 2 * 0.82;
      const sw = spr.width  || 1;
      const sh = spr.height || 1;
      spr.setScale(Math.min(maxPx / sw, maxPx / sh));
    } else {
      this.add.text(avaX, avaY, name[0], {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '42px',
        color: '#ecd089',
      }).setOrigin(0.5);
    }

    // 変更ヒント（丸の右下）
    const hintG = this.add.graphics();
    hintG.fillStyle(0x2c1533, 1);
    hintG.fillCircle(avaX + 36, avaY + 36, 14);
    hintG.lineStyle(1.5, 0xe7c065, 0.7);
    hintG.strokeCircle(avaX + 36, avaY + 36, 14);
    this.add.text(avaX + 36, avaY + 36, '✎', {
      fontFamily: 'serif',
      fontSize: '13px',
      color: '#e7c065',
    }).setOrigin(0.5);

    // ヒットエリア（丸全体）
    const avaHit = this.add.circle(avaX, avaY, 58, 0, 0)
      .setInteractive({ useHandCursor: true });
    avaHit.on('pointerover', () => drawRing(true));
    avaHit.on('pointerout',  () => drawRing(false));
    avaHit.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('AvatarSelectScene'));
    });

    // ── プレイヤー名 ──
    this.add.text(W / 2, 280, name, {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '22px',
      color: '#ece3d2',
    }).setOrigin(0.5);

    // Lv. ピル
    const lv = GameState.player.level || 1;
    const lvG = this.add.graphics();
    lvG.fillStyle(0xe7c065, 0.18);
    lvG.fillRoundedRect(W / 2 - 30, 302, 60, 22, 11);
    lvG.lineStyle(1, 0xe7c065, 0.55);
    lvG.strokeRoundedRect(W / 2 - 30, 302, 60, 22, 11);
    this.add.text(W / 2, 313, `Lv. ${lv}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#e7c065',
    }).setOrigin(0.5);

    // EXP バー
    const exp       = GameState.player.exp || 0;
    const expToNext = GameState.player.expToNext || 1;
    const expRatio  = Math.min(exp / expToNext, 1);
    const barX = W / 2 - 96, barY = 333, barW = 192, barH = 6;
    this.add.graphics().fillStyle(0x1a0d22, 1).fillRoundedRect(barX, barY, barW, barH, 3);
    if (expRatio > 0) {
      this.add.graphics().fillStyle(0xe7c065, 1).fillRoundedRect(barX, barY, barW * expRatio, barH, 3);
    }
    this.add.text(W / 2, 347, `EXP ${exp} / ${expToNext}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#9a8fb0',
    }).setOrigin(0.5);

    // ── 仕切り線 ──
    this.add.graphics().lineStyle(1, 0x2a1040, 0.55).lineBetween(24, 366, W - 24, 366);

    // ── ステータス項目 ──
    const ownedKinds   = new Set(GameState.player.unlockedCards || []).size;
    const clearedChaps = (GameState.player.completedChapters || []).length;
    const jureikon     = GameState.player.jureikon || 0;

    const items = [
      { label: '所持カード',     value: `${ownedKinds} / 41 種`, color: '#7fc9a6' },
      { label: 'クリア済み章数', value: `${clearedChaps} / 20 章`, color: '#b98fe0' },
      { label: '呪魂',          value: `${jureikon}`,            color: '#cc88ff' },
    ];

    const rowH  = 58;
    const rowY0 = 378;
    const PAD   = 24;

    items.forEach((item, i) => {
      const y      = rowY0 + i * rowH;
      const accHex = parseInt(item.color.replace('#', ''), 16);

      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x060210, 0.7);
      rowBg.fillRoundedRect(PAD, y, W - PAD * 2, rowH - 6, 8);
      rowBg.lineStyle(1, accHex, 0.22);
      rowBg.strokeRoundedRect(PAD, y, W - PAD * 2, rowH - 6, 8);

      this.add.text(PAD + 18, y + (rowH - 6) / 2, item.label, {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '14px',
        color: '#b6a4cf',
      }).setOrigin(0, 0.5);

      this.add.text(W - PAD - 18, y + (rowH - 6) / 2, item.value, {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        color: item.color,
      }).setOrigin(1, 0.5);
    });

    // ── ホーム妖怪設定ボタン ──
    const btnY   = rowY0 + items.length * rowH + 6;
    const accHex = 0xe7c065;

    const btnBg = this.add.graphics();
    const drawBtn = (hover = false) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0x1a0d30 : 0x0e0820, 0.9);
      btnBg.fillRoundedRect(PAD, btnY, W - PAD * 2, 52, 8);
      btnBg.lineStyle(1, accHex, hover ? 0.7 : 0.35);
      btnBg.strokeRoundedRect(PAD, btnY, W - PAD * 2, 52, 8);
    };
    drawBtn();

    this.add.text(PAD + 18, btnY + 26, 'ホーム妖怪設定', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '14px',
      color: '#e7c065',
    }).setOrigin(0, 0.5);

    // 現在の選択数を表示
    const homeIds  = GameState.player.homeYokaiIds || [];
    const countTxt = homeIds.length > 0 ? `${homeIds.length} / 5 体` : '未設定';
    this.add.text(W - PAD - 18, btnY + 26, countTxt + ' ▶', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: homeIds.length > 0 ? '#7fc9a6' : '#554466',
    }).setOrigin(1, 0.5);

    const btnHit = this.add.rectangle(W / 2, btnY + 26, W - PAD * 2, 52, 0, 0)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerover', () => drawBtn(true));
    btnHit.on('pointerout',  () => drawBtn(false));
    btnHit.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeYokaiSelectScene'));
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
