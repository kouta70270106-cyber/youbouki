// 妖忘記 — チュートリアルシーン（初回プレイ専用）
class TutorialScene extends Phaser.Scene {
  constructor() { super('TutorialScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    SE.playBGM('battle');

    const kappaCard = { ...D.cards.find(c => c.id === 'kappa'), uid: 1 };
    this.state = {
      energy: { current: 1, max: 1 },
      player: {
        name:  GameState.player.name,
        souls: 8,
        hand:  [kappaCard],
        field: [null, null, null, null, null],
      },
      enemy: { name: '迷子の影', souls: 2 },
    };

    this._step         = -1;
    this._selectedCard = null;
    this._attackSource = null;
    this._guideObjs    = [];
    this._arrowTween   = null;
    this._uiLayer      = null;

    this._drawBg();
    this._goStep(0);
  }

  // ── 背景 ─────────────────────────────────────────────────────────
  _drawBg() {
    const W = this.W, H = this.H;
    const g = this.add.graphics();
    g.fillGradientStyle(0x020818, 0x020818, 0x120820, 0x120820, 1);
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xffffff, 0.4 + Math.random() * 0.6);
      g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.55), Math.random() < 0.15 ? 1.5 : 0.8);
    }
    g.fillStyle(0xffe8a0, 0.95); g.fillCircle(W * 0.82, H * 0.12, 28);
    g.fillStyle(0xfff0c0, 0.6);  g.fillCircle(W * 0.80, H * 0.11, 22);
    g.fillStyle(0xffee88, 0.06); g.fillCircle(W * 0.82, H * 0.12, 60);
    g.fillStyle(0x0a0520, 1);
    g.fillTriangle(0, H*0.48, W*0.28, H*0.22, W*0.55, H*0.48);
    g.fillTriangle(W*0.3, H*0.48, W*0.62, H*0.18, W*1.0, H*0.48);
    const tx = W * 0.5, ty = H * 0.30;
    g.fillStyle(0x880022, 0.85);
    g.fillRect(tx-36, ty, 7, H*0.18); g.fillRect(tx+29, ty, 7, H*0.18);
    g.fillRect(tx-46, ty, 92, 8);     g.fillRect(tx-50, ty-8, 100, 7);
    g.fillRect(tx-38, ty+20, 76, 6);
    g.fillStyle(0x080415, 1); g.fillRect(0, H*0.48, W, H*0.52);
    g.lineStyle(1, 0x6633aa, 0.35); g.strokeRect(16, H*0.48, W-32, 1);
  }

  // ── 描画 ─────────────────────────────────────────────────────────
  _render() {
    if (this._uiLayer) this._uiLayer.destroy();
    this._uiLayer = this.add.container(0, 0);
    const L = o => { this._uiLayer.add(o); return o; };
    const W = this.W, H = this.H, s = this.state;

    // 魂表示
    L(this.add.text(W/2, 24, `${s.enemy.name}　魂: ${'🔮'.repeat(s.enemy.souls)}`, {
      fontSize: '15px', color: '#cc88ff', fontFamily: 'serif' }).setOrigin(0.5));
    L(this.add.text(W/2, H-108, `${s.player.name}　魂: ${'🔮'.repeat(s.player.souls)}`, {
      fontSize: '15px', color: '#e8c87a', fontFamily: 'serif' }).setOrigin(0.5));

    // エネルギー
    L(this.add.text(W-20, H/2-24, `⚡ ${s.energy.current} / ${s.energy.max}`, {
      fontSize: '14px', color: '#ffdd44', fontFamily: 'serif' }).setOrigin(1, 0.5));

    // フィールド（プレイヤー）
    const cardW = 64, cardH = 80, gap = 10, total = 5;
    const startX = W/2 - ((total-1)*(cardW+gap))/2;
    const fieldY  = H * 0.72;

    for (let i = 0; i < total; i++) {
      const x = startX + i*(cardW+gap);
      const mob = s.player.field[i];

      if (mob) {
        const col      = mob.attacked ? 0x1a1a1a : 0x2a1040;
        const border   = mob.attacked ? 0x444444 : (this._step === 3 ? 0xffdd44 : 0x8855cc);
        const bw       = this._step === 3 ? 2 : 1;
        const card = L(this.add.rectangle(x, fieldY, cardW, cardH, col).setStrokeStyle(bw, border));
        const sprKey = CARD_SPRITE[mob.card.id];
        if (sprKey && this.textures.exists(sprKey)) {
          const spr = L(this.add.image(x, fieldY-4, sprKey).setOrigin(0.5));
          spr.setScale(Math.min((cardW-8)/spr.width, (cardH-32)/spr.height));
          if (mob.attacked) spr.setAlpha(0.4);
        }
        L(this.add.text(x, fieldY-30, mob.card.name, { fontSize: '10px', color: '#e8c87a', fontFamily: 'serif' }).setOrigin(0.5));
        L(this.add.text(x-20, fieldY+30, `⚔${mob.card.atk}`, { fontSize: '12px', color: '#ff8844' }).setOrigin(0.5));
        L(this.add.text(x+20, fieldY+30, `♥${mob.hp}`, { fontSize: '12px', color: '#44ff88' }).setOrigin(0.5));

        if (this._step === 3 && !mob.attacked) {
          card.setInteractive({ useHandCursor: true });
          card.on('pointerdown', () => { this._attackSource = i; this._goStep(4); });
        }

      } else {
        const empty = L(this.add.rectangle(x, fieldY, cardW, cardH, 0x111111, 0.3).setStrokeStyle(1, 0x333333));
        if (this._step === 2 && this._selectedCard !== null && i === 2) {
          empty.setFillStyle(0x223322, 0.6).setStrokeStyle(1, 0x44cc44);
          empty.setInteractive({ useHandCursor: true });
          empty.on('pointerdown', () => {
            const cd = s.player.hand.splice(0, 1)[0];
            s.player.field[i] = { card: cd, hp: cd.hp, attacked: false };
            s.energy.current -= cd.cost;
            this._selectedCard = null;
            SE.playSE('summon');
            this._goStep(3);
          });
        }
      }
    }

    // 敵直接攻撃ゾーン（Step 4）
    if (this._step === 4) {
      const zone = L(this.add.rectangle(W/2, H*0.22, 340, cardH+10, 0xff0000, 0.15)
        .setStrokeStyle(2, 0xff4444).setInteractive({ useHandCursor: true }));
      zone.on('pointerdown', () => {
        const mob = s.player.field[this._attackSource];
        if (!mob) return;
        SE.playSE('attack');
        s.enemy.souls = Math.max(0, s.enemy.souls - mob.card.atk);
        mob.attacked = true;
        this._attackSource = null;
        this._goStep(5);
      });
    }

    // 手札
    const hand = s.player.hand;
    if (hand.length > 0) {
      const hCardW = 60, hCardH = 84;
      const hStartX = W/2 - ((hand.length-1)*(hCardW+gap))/2;
      hand.forEach((card, i) => {
        const x   = hStartX + i*(hCardW+gap);
        const y   = H - 54;
        const sel = this._selectedCard === i;
        const rect = L(this.add.rectangle(x, y, hCardW, hCardH, sel ? 0x5533aa : 0x2a1040)
          .setStrokeStyle(sel ? 2 : 1, sel ? 0xffff00 : 0x8855cc));
        const sprKey = CARD_SPRITE[card.id];
        if (sprKey && this.textures.exists(sprKey)) {
          const spr = L(this.add.image(x, y-4, sprKey).setOrigin(0.5));
          spr.setScale(Math.min((hCardW-8)/spr.width, (hCardH-36)/spr.height));
        }
        L(this.add.text(x, y-34, card.name, { fontSize: '9px', color: '#e8c87a', fontFamily: 'serif' }).setOrigin(0.5));
        L(this.add.text(x-24, y-38, `⚡${card.cost}`, { fontSize: '11px', color: '#ffdd44' }).setOrigin(0, 0.5));
        L(this.add.text(x-20, y+34, `⚔${card.atk}`, { fontSize: '12px', color: '#ff8844' }).setOrigin(0.5));
        L(this.add.text(x+20, y+34, `♥${card.hp}`, { fontSize: '12px', color: '#44ff88' }).setOrigin(0.5));
        if (this._step === 1) {
          rect.setInteractive({ useHandCursor: true });
          rect.on('pointerdown', () => { this._selectedCard = i; SE.playSE('click'); this._goStep(2); });
        }
      });
    }
  }

  // ── ガイドオーバーレイ ────────────────────────────────────────────
  _clearGuide() {
    if (this._arrowTween) { this._arrowTween.stop(); this._arrowTween = null; }
    this._guideObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._guideObjs = [];
  }

  _showGuide(text, arrowX, arrowY, arrowDir = '▼', bubbleY = 280) {
    this._clearGuide();
    const W = this.W;
    const G = o => { this._guideObjs.push(o); return o; };

    const bg = G(this.add.graphics().setDepth(20));
    bg.fillStyle(0x1a0a30, 0.96);
    bg.fillRoundedRect(16, bubbleY, W-32, 76, 10);
    bg.lineStyle(1.5, 0x9955cc, 0.9);
    bg.strokeRoundedRect(16, bubbleY, W-32, 76, 10);

    G(this.add.text(W/2, bubbleY + 38, text, {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '13px', color: '#d4c8e8', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(21));

    if (arrowX !== null) {
      const ay  = arrowDir === '▼' ? arrowY - 30 : arrowY + 30;
      const ay2 = arrowDir === '▼' ? ay + 12 : ay - 12;
      const arrow = G(this.add.text(arrowX, ay, arrowDir, {
        fontSize: '22px', color: '#ffdd44',
      }).setOrigin(0.5).setDepth(21));
      this._arrowTween = this.tweens.add({
        targets: arrow, y: ay2,
        duration: 450, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });
    }
  }

  // ── ステップ制御 ──────────────────────────────────────────────────
  _goStep(step) {
    this._step = step;
    this._render();

    const W = this.W, H = this.H;
    const handX  = W / 2;
    const handY  = H - 54;
    const cardW  = 64, gap = 10;
    const startX = W/2 - ((5-1)*(cardW+gap))/2;
    const slotX  = startX + 2*(cardW+gap); // center slot
    const fieldY = H * 0.72;
    const enemyY = H * 0.22;

    switch (step) {
      case 0:
        this._showGuide('妖忘記へようこそ！\n魂を先に0にした方が勝ちです。タップして進もう', null, null);
        this.time.delayedCall(400, () => {
          const h = () => { this.input.off('pointerdown', h); this._goStep(1); };
          this.input.on('pointerdown', h);
        });
        break;

      case 1:
        this._showGuide('⚡エネルギーが1あります。\n手札のカードをタップして選ぼう！', handX, handY, '▼', 390);
        break;

      case 2:
        this._showGuide('カードを選択！\n光るスロットをタップして召喚しよう', slotX, fieldY, '▼', 280);
        break;

      case 3:
        this._showGuide('召喚成功！\nフィールドの妖怪をタップして攻撃者を選ぼう', slotX, fieldY, '▼', 280);
        break;

      case 4:
        this._showGuide('赤いエリアをタップして直接攻撃！\n敵の魂を0にしよう！', W/2, enemyY, '▲', 430);
        break;

      case 5:
        this._clearGuide();
        if (this.state.enemy.souls <= 0) {
          this.time.delayedCall(500, () => this._showVictory());
        }
        break;
    }
  }

  // ── 勝利演出 ─────────────────────────────────────────────────────
  _showVictory() {
    const W = this.W, H = this.H;
    SE.stopBGM();
    SE.playSE('victory');

    GameState.player.tutorialDone = true;
    GameState.save();

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(30);

    this.add.text(W/2, H*0.28, '🎉', { fontSize: '52px' }).setOrigin(0.5).setDepth(31);

    this.add.text(W/2, H*0.42, 'チュートリアル完了！', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '24px', color: '#ffdd44',
      stroke: '#6a2a00', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(31);

    this.add.text(W/2, H*0.53, 'ゲームの基本をマスターした！\nストーリーで妖怪バトルに挑もう', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '14px', color: '#c8b8e8', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(31);

    const btn = this.add.text(W/2, H*0.68, 'ホームへ進む ▶', {
      fontFamily: '"Shippori Mincho B1", serif',
      fontSize: '20px', color: '#e8c87a',
      backgroundColor: '#2a1040cc', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#e8c87a'));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'));
    });
  }
}
