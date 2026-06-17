class HomeScene extends Phaser.Scene {
  constructor() { super('HomeScene'); }

  create() {
    SE.init();
    SE.playBGM('title');

    const W = this.scale.width;   // 480
    const H = this.scale.height;  // 720
    this.W = W; this.H = H;

    // レイアウト定数
    const PAD    = 14;
    const HDR_H  = 104;
    const FTR_H  = 58;
    const CON_Y  = HDR_H;
    const CON_H  = H - HDR_H - FTR_H;  // 558
    const L_W    = 84,  L_X = PAD;              // left  col: x=14,  w=84,  cx=56
    const R_W    = 84,  R_X = W - PAD - R_W;    // right col: x=382, w=84,  cx=424
    const C_X    = L_X + L_W + 11;              // center col: x=109
    const C_W    = R_X - C_X - 11;              // center col: w=262
    const PANEL_H = Math.floor((CON_H - 8) / 3);

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x080510);
    const bgG = this.add.graphics();
    bgG.fillStyle(0x2c1533, 0.30);
    bgG.fillEllipse(W / 2, H * 0.40, W * 1.2, H * 0.65);
    bgG.fillStyle(0x1a0d22, 0.22);
    bgG.fillEllipse(W / 2, H * 0.55, W * 0.85, H * 0.55);

    // 霧
    const fog = this.add.graphics();
    fog.fillStyle(0x6b3499, 0.07);
    fog.fillEllipse(W * 0.35, H * 0.45, 280, 120);
    this.tweens.add({
      targets: fog, x: 15, y: -8, scaleX: 1.08, scaleY: 0.93,
      duration: 19000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // ── ヘッダー ──
    this.add.rectangle(W / 2, HDR_H / 2, W, HDR_H, 0x060210);
    this.add.graphics().lineStyle(1, 0x2a1040, 0.8).lineBetween(0, HDR_H, W, HDR_H);

    // 小ロゴ「妖忘記」
    const smallLogo = this.add.text(W / 2, 22, '妖忘記', {
      fontFamily: '"Yuji Mai", serif',
      fontSize: '32px',
      color: '#ecd089',
      stroke: '#876626',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    smallLogo.on('pointerover', () => smallLogo.setColor('#ffd700'));
    smallLogo.on('pointerout',  () => smallLogo.setColor('#ecd089'));
    smallLogo.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });

    // ヘッダー仕切り線
    this.add.graphics().lineStyle(1, 0x2a1040, 0.4).lineBetween(PAD, 46, W - PAD, 46);

    // アバター円
    const playerName = GameState.player.name || '？';
    const avaX = PAD + 17, avaY = 74;
    const avaG = this.add.graphics();
    avaG.fillStyle(0x2c1533, 1);
    avaG.fillCircle(avaX, avaY, 17);
    avaG.lineStyle(1.5, 0xe7c065, 0.7);
    avaG.strokeCircle(avaX, avaY, 17);
    this.add.text(avaX, avaY, playerName[0], {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '16px',
      color: '#ecd089',
    }).setOrigin(0.5);

    // プレイヤー名
    const nameX = avaX + 22;
    this.add.text(nameX, 58, playerName, {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '13px',
      color: '#ece3d2',
    });

    // Lv. ピル
    const lv = GameState.player.level || 1;
    const lvStr = `Lv.${lv}`;
    const lvX = nameX + Math.min(playerName.length * 9, 72) + 6;
    const lvG = this.add.graphics();
    lvG.fillStyle(0xe7c065, 0.22);
    lvG.fillRoundedRect(lvX, 55, 44, 18, 9);
    lvG.lineStyle(1, 0xe7c065, 0.55);
    lvG.strokeRoundedRect(lvX, 55, 44, 18, 9);
    this.add.text(lvX + 22, 64, lvStr, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#e7c065',
    }).setOrigin(0.5);

    // EXP バー
    const expRatio = (GameState.player.expToNext > 0)
      ? Math.min((GameState.player.exp || 0) / GameState.player.expToNext, 1)
      : 0;
    const expBX = nameX, expBY = 82, expBW = 118, expBH = 5;
    this.add.graphics().fillStyle(0x2a1040, 1).fillRoundedRect(expBX, expBY, expBW, expBH, 2);
    if (expRatio > 0) {
      this.add.graphics().fillStyle(0xe7c065, 1).fillRoundedRect(expBX, expBY, expBW * expRatio, expBH, 2);
    }

    // ── 左カラム ──
    this._makeNavPanel(
      L_X, CON_Y, L_W, PANEL_H,
      '札', '#7fc9a6', 'デッキ\n構築',
      () => this.scene.start('DeckScene')
    );
    this._makeNavPanel(
      L_X, CON_Y + PANEL_H + 4, L_W, PANEL_H,
      '鑑', '#e0b266', '妖怪\n図鑑',
      () => this.scene.start('CollectionScene')
    );
    // 呪魂ガチャパネル
    const jureikon = GameState.player.jureikon || 0;
    this._makeNavPanel(
      L_X, CON_Y + (PANEL_H + 4) * 2, L_W, PANEL_H,
      '魂', '#cc88ff', `ガチャ\n🔮${jureikon}`,
      () => this.scene.start('GachaScene')
    );

    // ── 右カラム（ストーリー） ──
    this._makeNavPanel(
      R_X, CON_Y, R_W, CON_H,
      '譚', '#b98fe0', 'ス\nト\nー\nリ\nー',
      () => this.scene.start('StoryScene')
    );

    // ── 中央カラム（背景パネル） ──
    const cBg = this.add.graphics();
    cBg.fillStyle(0x060210, 0.65);
    cBg.fillRoundedRect(C_X, CON_Y, C_W, CON_H, 10);
    cBg.lineStyle(1, 0x2a1040, 0.45);
    cBg.strokeRoundedRect(C_X, CON_Y, C_W, CON_H, 10);

    // ── ショーケース初期化 ──
    this._showcaseCX = 240;
    this._showcaseCY = 308;

    this._ownedIds  = [...new Set(GameState.player.unlockedCards || [])];
    this._yokaiIdx  = Math.min(
      GameState.player.homeYokaiIdx || 0,
      Math.max(0, this._ownedIds.length - 1)
    );
    this._yokaiObjs = [];
    this._renderYokai();

    // ── フッター（オンライン対戦ボタン） ──
    this.add.rectangle(W / 2, H - FTR_H / 2, W, FTR_H, 0x060210);
    this.add.graphics().lineStyle(1, 0x2a1040, 0.8).lineBetween(0, H - FTR_H, W, H - FTR_H);

    const fBX = PAD, fBY = H - FTR_H + 8, fBW = W - PAD * 2, fBH = FTR_H - 16;
    const fBg = this.add.graphics();
    const drawFBtn = (hover = false) => {
      fBg.clear();
      fBg.fillStyle(hover ? 0xc83530 : 0xb23528, 1);
      fBg.fillRoundedRect(fBX, fBY, fBW, fBH / 2, { tl:12, tr:12, bl:0, br:0 });
      fBg.fillStyle(hover ? 0x8c2520 : 0x7e1f18, 1);
      fBg.fillRoundedRect(fBX, fBY + fBH / 2, fBW, fBH / 2, { tl:0, tr:0, bl:12, br:12 });
      fBg.lineStyle(1, 0xe7c065, 0.42);
      fBg.strokeRoundedRect(fBX + 3, fBY + 3, fBW - 6, fBH - 6, 10);
    };
    drawFBtn();

    this.add.text(W / 2, H - FTR_H / 2, 'オンライン対戦', {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '21px',
      color: '#f3ead2',
      letterSpacing: 8,
    }).setOrigin(0.5);

    const fHit = this.add.rectangle(W / 2, H - FTR_H / 2, fBW, fBH, 0, 0)
      .setInteractive({ useHandCursor: true });
    fHit.on('pointerover', () => drawFBtn(true));
    fHit.on('pointerout',  () => drawFBtn(false));
    fHit.on('pointerdown', () => { SE.playSE('click'); this.scene.start('OnlineScene'); });
  }

  // ── ナビパネル共通描画 ──
  _makeNavPanel(x, y, w, h, stamp, stampColor, label, onClick) {
    const accHex = parseInt(stampColor.replace('#', ''), 16);
    const cx = x + w / 2;

    const bg = this.add.graphics();
    const drawBg = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x0c0420 : 0x080318, 1);
      bg.fillRoundedRect(x, y, w, h, 8);
      bg.lineStyle(1, accHex, hover ? 0.72 : 0.32);
      bg.strokeRoundedRect(x, y, w, h, 8);
      bg.lineStyle(1, accHex, hover ? 0.10 : 0.04);
      bg.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 6);
    };
    drawBg();

    // 円印
    const stampCY = y + h * 0.35;
    const stampG = this.add.graphics();
    stampG.fillStyle(accHex, 0.12);
    stampG.fillCircle(cx, stampCY, 22);
    stampG.lineStyle(1.5, accHex, 0.62);
    stampG.strokeCircle(cx, stampCY, 22);
    this.add.text(cx, stampCY, stamp, {
      fontFamily: '"Yuji Syuku", serif',
      fontSize: '18px',
      color: stampColor,
    }).setOrigin(0.5);

    // ラベル
    this.add.text(cx, y + h * 0.67, label, {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '11px',
      color: stampColor,
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5);

    // ヒットエリア
    const hit = this.add.rectangle(cx, y + h / 2, w - 4, h - 4, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBg(true));
    hit.on('pointerout',  () => drawBg(false));
    hit.on('pointerdown', () => { SE.playSE('click'); onClick(); });
  }

  // ── 妖怪ショーケース描画 ──
  _renderYokai() {
    this._yokaiObjs.forEach(o => {
      this.tweens.killTweensOf(o);
      o.destroy();
    });
    this._yokaiObjs = [];
    const track = (obj) => { this._yokaiObjs.push(obj); return obj; };

    const cx    = this._showcaseCX;
    const cy    = this._showcaseCY;
    const owned = this._ownedIds;

    if (owned.length === 0) {
      track(this.add.text(cx, cy, 'ストーリーを進めて\n妖怪を入手しよう', {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '13px',
        color: '#443355',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5));
      return;
    }

    const id   = owned[this._yokaiIdx];
    const card = D.cards.find(c => c.id === id);
    const rar  = card ? D.rarity[card.rarity] : null;
    // ホーム画面は背景除去済み透過画像を優先使用
    const nobgKey = `nobg_${id}`;
    const sprKey  = this.textures.exists(nobgKey) ? nobgKey : CARD_SPRITE[id];

    const glowColors = {
      common:    0x5a7a6a,
      uncommon:  0x3f7d62,
      rare:      0x2d6a9f,
      legendary: 0x6d4d9c,
    };
    const badgeColors = {
      common:    '#b9b2bf',
      uncommon:  '#6fd6a8',
      rare:      '#6fa8d8',
      legendary: '#e7c065',
    };
    const glowHex  = card ? (glowColors[card.rarity]  || 0x8844aa) : 0x8844aa;
    const badgeCol = card ? (badgeColors[card.rarity] || '#888888') : '#888888';

    // 1. 属性グローハロー（ybk-halo 5s）
    const halo = track(this.add.graphics());
    halo.fillStyle(glowHex, 0.20);
    halo.fillCircle(0, 0, 92);
    halo.fillStyle(glowHex, 0.08);
    halo.fillCircle(0, 0, 108);
    halo.setPosition(cx, cy);
    this.tweens.add({
      targets: halo, alpha: 0.45, scaleX: 1.06, scaleY: 1.06,
      duration: 5000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // 2. 金破線リング（CW 46s）
    const dashRing = track(this.add.graphics());
    dashRing.fillStyle(0xe7c065, 0.40);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      dashRing.fillCircle(Math.cos(a) * 88, Math.sin(a) * 88, 2);
    }
    dashRing.setPosition(cx, cy);
    this.tweens.add({
      targets: dashRing, angle: 360, duration: 46000, ease: 'Linear', repeat: -1,
    });

    // 3. 細リング（CCW 70s）
    const thinRing = track(this.add.graphics());
    thinRing.lineStyle(1, 0xc9a14a, 0.18);
    thinRing.strokeCircle(0, 0, 93);
    thinRing.setPosition(cx, cy);
    this.tweens.add({
      targets: thinRing, angle: -360, duration: 70000, ease: 'Linear', repeat: -1,
    });

    // 5. 妖怪スプライト（背景除去済み透過画像）
    if (sprKey && this.textures.exists(sprKey)) {
      const spr = track(this.add.image(cx, cy - 4, sprKey).setOrigin(0.5));
      const maxPx = 82 * 2 * 0.92;
      const sc = Math.min(maxPx / spr.width, maxPx / spr.height);
      spr.setScale(sc);
      this.tweens.add({
        targets: spr, y: spr.y - 8, duration: 2200,
        ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });
    }

    if (card) {
      // 6. 妖怪名
      track(this.add.text(cx, 428, card.name, {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '22px',
        color: '#ece3d2',
        stroke: '#060210',
        strokeThickness: 4,
      }).setOrigin(0.5));

      // 7. レアリティバッジ
      const badgeHex = parseInt(badgeCol.replace('#', ''), 16);
      const bW = 70, bH = 22;
      const badgeBg = track(this.add.graphics());
      badgeBg.fillStyle(badgeHex, 0.14);
      badgeBg.fillRoundedRect(cx - bW / 2, 453 - bH / 2, bW, bH, 10);
      badgeBg.lineStyle(1, badgeHex, 0.72);
      badgeBg.strokeRoundedRect(cx - bW / 2, 453 - bH / 2, bW, bH, 10);
      track(this.add.text(cx, 453, rar ? rar.label : '', {
        fontFamily: '"Shippori Mincho B1", serif',
        fontSize: '11px',
        color: badgeCol,
      }).setOrigin(0.5));
    }

    // 8. ページャ
    if (owned.length > 1) {
      const arStyle = { fontFamily: 'serif', fontSize: '20px', color: '#7a5ba8' };

      const prevBtn = track(this.add.text(cx - 64, 490, '◀', arStyle)
        .setOrigin(0.5).setInteractive({ useHandCursor: true }));
      prevBtn.on('pointerover', () => prevBtn.setColor('#bb88ff'));
      prevBtn.on('pointerout',  () => prevBtn.setColor('#7a5ba8'));
      prevBtn.on('pointerdown', () => {
        SE.playSE('click');
        this._yokaiIdx = (this._yokaiIdx - 1 + owned.length) % owned.length;
        GameState.player.homeYokaiIdx = this._yokaiIdx;
        GameState.save();
        this._renderYokai();
      });

      const nextBtn = track(this.add.text(cx + 64, 490, '▶', arStyle)
        .setOrigin(0.5).setInteractive({ useHandCursor: true }));
      nextBtn.on('pointerover', () => nextBtn.setColor('#bb88ff'));
      nextBtn.on('pointerout',  () => nextBtn.setColor('#7a5ba8'));
      nextBtn.on('pointerdown', () => {
        SE.playSE('click');
        this._yokaiIdx = (this._yokaiIdx + 1) % owned.length;
        GameState.player.homeYokaiIdx = this._yokaiIdx;
        GameState.save();
        this._renderYokai();
      });

      track(this.add.text(cx, 490, `${this._yokaiIdx + 1} / ${owned.length}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#9a8fb0',
      }).setOrigin(0.5));
    } else if (owned.length === 1) {
      track(this.add.text(cx, 490, '✦', {
        fontFamily: 'serif', fontSize: '14px', color: '#7a5ba8',
      }).setOrigin(0.5));
    }
  }
}
