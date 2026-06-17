// 妖忘記 — ストーリー画面（横スクロールマップ版）
class StoryScene extends Phaser.Scene {
  constructor() { super('StoryScene'); }

  create() {
    SE.init();
    SE.playBGM('title');
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;
    this._panelH = 148;

    // 背景
    this.add.graphics()
      .fillGradientStyle(0x050210, 0x050210, 0x100a20, 0x100a20, 1)
      .fillRect(0, 0, W, H);

    this._drawHeader();
    this._setupScrollMap();
    this._setupInfoPanel();
    this._setupDev();
  }

  // ===== ヘッダー（固定） =====
  _drawHeader() {
    const W = this.W;
    this.add.rectangle(W / 2, 30, W, 60, 0x080318, 1).setDepth(10);
    this.add.graphics().setDepth(10)
      .lineStyle(1, 0x2a1040)
      .lineBetween(0, 60, W, 60);

    this.add.text(W / 2, 30, '〜 ストーリー 〜', {
      fontFamily: 'serif', fontSize: '24px', color: '#e8c87a',
    }).setOrigin(0.5).setDepth(10);

    const back = this.add.text(12, 30, '← 戻る', {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
      backgroundColor: '#1a0a3a', padding: { x: 8, y: 5 },
    }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#e8c87a'));
    back.on('pointerout',  () => back.setColor('#b89adc'));
    back.on('pointerdown', () => { SE.playSE('click'); this.scene.start('HomeScene'); });
  }

  // ===== 横スクロールマップ =====
  _setupScrollMap() {
    const W = this.W, H = this.H;
    const CHAPTER_W = Math.floor(W * 0.79); // 1画面に約1.26章分
    const totalW = D.chapters.length * CHAPTER_W + 40;

    this._scrollX    = 0;
    this._maxScrollX = Math.max(0, totalW - W);
    this._dragLock   = false;

    this.mapContainer = this.add.container(0, 62).setDepth(1);

    const mapH = H - 62;
    D.chapters.forEach((ch, i) => {
      const cx = 20 + i * CHAPTER_W + CHAPTER_W / 2;
      this._drawChapter(ch, i, cx, CHAPTER_W, mapH);
    });

    // === スクロール入力 ===
    let dragStartX = null, scrollStart = 0;

    this.input.on('pointerdown', p => {
      if (p.y < 62) return;
      dragStartX  = p.x;
      scrollStart = this._scrollX;
      this._dragLock = false;
    });
    this.input.on('pointermove', p => {
      if (dragStartX === null || !p.isDown) return;
      const dx = p.x - dragStartX;
      if (Math.abs(dx) > 6) this._dragLock = true;
      this._scrollX = Phaser.Math.Clamp(scrollStart - dx, 0, this._maxScrollX);
      this.mapContainer.x = -this._scrollX;
    });
    this.input.on('pointerup', () => {
      dragStartX = null;
      this.time.delayedCall(50, () => { this._dragLock = false; });
    });
    this.input.on('wheel', (_p, _g, deltaX, deltaY) => {
      this._scrollX = Phaser.Math.Clamp(
        this._scrollX + (deltaX || deltaY) * 0.8, 0, this._maxScrollX);
      this.mapContainer.x = -this._scrollX;
    });
  }

  // ===== 1章分の描画 =====
  _drawChapter(ch, idx, cx, chW, mapH) {
    const prog = GameState.player.stageProgress[ch.id] || 0;
    const prevDone = idx === 0
      || (GameState.player.stageProgress[D.chapters[idx - 1].id] || 0) >= 5
      || GameState.player.completedChapters.includes(D.chapters[idx - 1].id);
    const locked = !prevDone;

    const C  = this.mapContainer;
    const g  = ()     => { const o = this.add.graphics();              C.add(o); return o; };
    const t  = (...a) => { const o = this.add.text(...a);              C.add(o); return o; };
    const r  = (...a) => { const o = this.add.rectangle(...a);         C.add(o); return o; };

    // 章区切り線
    if (idx > 0) {
      g().lineStyle(1, 0x2a1040, 0.4)
         .lineBetween(cx - chW / 2, 0, cx - chW / 2, mapH);
    }

    // タイトルエリア背景
    g().fillStyle(locked ? 0x0c0c1a : 0x1a0d38, 0.92)
       .fillRoundedRect(cx - chW / 2 + 8, 6, chW - 16, 52, 8);

    t(cx, 18, `CHAPTER ${ch.id}`, {
      fontFamily: 'monospace', fontSize: '9px',
      color: locked ? '#333355' : '#7744aa',
    }).setOrigin(0.5);

    const shortTitle = ch.title.replace(/^第.章：/, '');
    t(cx, 38, shortTitle, {
      fontFamily: 'serif', fontSize: '13px',
      color: locked ? '#333355' : '#e8c87a',
    }).setOrigin(0.5);

    // ロック表示
    if (locked) {
      t(cx, mapH / 2 - 20, '🔒', {
        fontFamily: 'serif', fontSize: '28px', color: '#2a2a40',
      }).setOrigin(0.5);
      t(cx, mapH / 2 + 18, '前の章をクリア', {
        fontFamily: 'serif', fontSize: '10px', color: '#333355',
      }).setOrigin(0.5);
      return;
    }

    // ===== ステージノード =====
    const nodeR  = 20;
    const areaT  = 68;
    const areaH  = mapH - areaT - this._panelH - 30; // パネル分を余白確保

    // 5ノードをジグザグ配置（下=話1、上=BOSS）
    const NP = [
      { x: cx + chW * 0.06,  y: areaT + areaH * 0.88 },
      { x: cx - chW * 0.12,  y: areaT + areaH * 0.66 },
      { x: cx + chW * 0.09,  y: areaT + areaH * 0.44 },
      { x: cx - chW * 0.11,  y: areaT + areaH * 0.22 },
      { x: cx,               y: areaT + areaH * 0.02 },
    ];

    // 接続線
    for (let s = 0; s < 4; s++) {
      const a = NP[s], b = NP[s + 1];
      const done = s < prog - 1;
      g().lineStyle(3, done ? 0xb89620 : 0x3a1a5a, done ? 0.8 : 0.35)
         .lineBetween(a.x, a.y, b.x, b.y);
    }

    // ノード描画
    NP.forEach((pos, s) => {
      const done    = s < prog;
      const current = s === prog;
      const isLock  = s > prog;
      const isBoss  = s === 4;
      const battle  = ch.battles[s];

      const ng = g();

      if (isBoss) {
        // ボス：菱形
        const R = nodeR + 3;
        const pts = [
          { x: pos.x,     y: pos.y - R },
          { x: pos.x + R, y: pos.y     },
          { x: pos.x,     y: pos.y + R },
          { x: pos.x - R, y: pos.y     },
        ];
        ng.fillStyle(done ? 0x8b2020 : current ? 0x3a0808 : 0x181818, 1);
        ng.fillPoints(pts, true);
        ng.lineStyle(2, done ? 0xff6644 : current ? 0xdd2200 : 0x333333, 1);
        ng.strokePoints(pts, true);
        if (current) {
          const rp = pts.map(p => ({
            x: pos.x + (p.x - pos.x) * 1.4,
            y: pos.y + (p.y - pos.y) * 1.4,
          }));
          ng.lineStyle(5, 0xdd2200, 0.15);
          ng.strokePoints(rp, true);
        }
      } else {
        const fc = done ? 0xb89620 : current ? 0x2a0c50 : 0x181818;
        const bc = done ? 0xffdd44 : current ? 0xcc88ff : 0x2e2e2e;
        ng.fillStyle(fc, 1);
        ng.fillCircle(pos.x, pos.y, nodeR);
        ng.lineStyle(done ? 2 : current ? 2 : 1, bc, 1);
        ng.strokeCircle(pos.x, pos.y, nodeR);
        if (current) {
          ng.lineStyle(5, 0xcc88ff, 0.18);
          ng.strokeCircle(pos.x, pos.y, nodeR + 7);
        }
      }

      // ノードラベル
      t(pos.x, pos.y, isBoss ? '👹' : done ? '✓' : `${s + 1}`, {
        fontFamily: 'serif',
        fontSize: (isBoss || !done) ? '14px' : '18px',
        color: done ? '#1a0a00' : current ? '#e8c87a' : '#333333',
      }).setOrigin(0.5);

      if (isBoss) {
        t(pos.x, pos.y + nodeR + 11, 'BOSS', {
          fontFamily: 'monospace', fontSize: '8px',
          color: done ? '#ff6644' : current ? '#dd2200' : '#333333',
        }).setOrigin(0.5);
      }

      // ヒット領域（ロックされていないものだけ）
      if (!isLock) {
        const hit = r(pos.x, pos.y, (nodeR + 8) * 2, (nodeR + 8) * 2, 0, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => ng.setAlpha(0.75));
        hit.on('pointerout',  () => ng.setAlpha(1.0));
        hit.on('pointerup', () => {
          if (this._dragLock) return;
          SE.playSE('click');
          this._showPanel(ch, s, battle);
        });
      }
    });

    // 進捗 / クリアバッジ（下部）
    if (prog >= 5) {
      const badgeG = g();
      badgeG.fillStyle(0x1a3a1a, 0.9);
      badgeG.fillRoundedRect(cx - 40, mapH - 36, 80, 22, 6);
      t(cx, mapH - 25, '✅ クリア済み', {
        fontFamily: 'serif', fontSize: '10px', color: '#44cc88',
      }).setOrigin(0.5);
    } else {
      t(cx, mapH - 25, `${Math.min(prog, 5)} / 5`, {
        fontFamily: 'monospace', fontSize: '10px',
        color: prog > 0 ? '#664488' : '#333355',
      }).setOrigin(0.5);
    }
  }

  // ===== 情報パネル =====
  _setupInfoPanel() {
    const W = this.W, H = this.H;
    const PH = this._panelH;

    this.infoPanel = this.add.container(0, H).setDepth(20);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x080320, 0.97);
    bg.fillRect(0, 0, W, PH);
    bg.lineStyle(2, 0x5533aa, 0.7);
    bg.lineBetween(0, 0, W, 0);
    // 上部装飾ライン
    bg.lineStyle(1, 0x9955ff, 0.3);
    bg.lineBetween(20, 4, W - 20, 4);
    this.infoPanel.add(bg);

    // ステージ名
    this._pTitle = this.add.text(W / 2, 16, '', {
      fontFamily: 'serif', fontSize: '16px', color: '#e8c87a',
    }).setOrigin(0.5);
    this.infoPanel.add(this._pTitle);

    // 敵名
    this._pEnemy = this.add.text(W / 2, 38, '', {
      fontFamily: 'serif', fontSize: '13px', color: '#c8aae8',
    }).setOrigin(0.5);
    this.infoPanel.add(this._pEnemy);

    // 初回報酬
    this._pReward = this.add.text(W / 2, 58, '', {
      fontFamily: 'serif', fontSize: '11px', color: '#88cc88',
    }).setOrigin(0.5);
    this.infoPanel.add(this._pReward);

    // 区切り線
    const div = this.add.graphics();
    div.lineStyle(1, 0x3a1a5a, 0.6);
    div.lineBetween(24, 72, W - 24, 72);
    this.infoPanel.add(div);

    // 挑戦ボタン
    this._pBtn = this.add.text(W / 2, 108, '⚔  挑  戦  す  る  ⚔', {
      fontFamily: 'serif', fontSize: '15px', color: '#1a0800',
      backgroundColor: '#e8c87a', padding: { x: 28, y: 11 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._pBtn.on('pointerover', () => {
      this._pBtn.setColor('#000000');
      this._pBtn.setBackgroundColor('#ffd700');
    });
    this._pBtn.on('pointerout', () => {
      this._pBtn.setColor('#1a0800');
      this._pBtn.setBackgroundColor('#e8c87a');
    });
    this._pBtn.on('pointerdown', () => {
      if (!this._panelData) return;
      SE.playSE('click');
      const { ch, stageIdx } = this._panelData;
      this.scene.start('BattleScene', {
        chapterId: ch.id, battleIndex: stageIdx, story: true,
      });
    });
    this.infoPanel.add(this._pBtn);

    // 閉じるボタン
    const closeBtn = this.add.text(W - 14, 10, '✕', {
      fontFamily: 'serif', fontSize: '20px', color: '#554477',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#cc88ff'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#554477'));
    closeBtn.on('pointerdown', () => this._hidePanel());
    this.infoPanel.add(closeBtn);

    this._panelVisible = false;
    this._panelData    = null;
  }

  _showPanel(ch, stageIdx, battle) {
    const CHN = ['一','二','三','四','五','六','七','八','九','十'];
    this._panelData = { ch, stageIdx };

    this._pTitle.setText(`第${CHN[ch.id - 1]}章　第${stageIdx + 1}話`);
    this._pEnemy.setText(`⚔  ${battle.enemy}`);

    const prog    = GameState.player.stageProgress[ch.id] || 0;
    const isFirst = prog <= stageIdx;
    const isBoss  = stageIdx === 4;
    if (isFirst) {
      const extra = isBoss ? ' ＋ カード2枚' : '';
      this._pReward.setText(`初回報酬: 呪魂 +2${extra}`);
      this._pReward.setColor('#88cc88');
    } else {
      this._pReward.setText('初回報酬: 受取済み');
      this._pReward.setColor('#555566');
    }

    if (!this._panelVisible) {
      this._panelVisible = true;
      this.tweens.add({
        targets:  this.infoPanel,
        y:        this.H - this._panelH,
        duration: 220,
        ease:     'Back.Out',
      });
    }
  }

  _hidePanel() {
    if (!this._panelVisible) return;
    this._panelVisible = false;
    this._panelData    = null;
    this.tweens.add({
      targets:  this.infoPanel,
      y:        this.H,
      duration: 180,
      ease:     'Power2.In',
    });
  }

  // ===== DEV ボタン（localhost限定） =====
  _setupDev() {
    const W = this.W;
    const devBtn = this.add.text(W - 8, 8, '[DEV]', {
      fontFamily: 'monospace', fontSize: '11px', color: '#443355',
      backgroundColor: '#110022', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });
    devBtn.on('pointerdown', () => {
      const all = ['kappa','tengu','zashiki','tanuki','kitsune','karakasa','noppera',
        'rokurokubi','nurikabe','sunakake','chochin','amefuri','ittan','wanyudo',
        'yuki_onna','oni','nekomata','yamanba','umibouzu','amanojaku','kasha',
        'tsuchigumo','bakekujira','nue','kyubi','dai_tengu','shuten_doji','tamamo',
        'ryujin','susanoo'];
      GameState.player.unlockedCards     = all;
      GameState.player.completedChapters = [1,2,3,4,5,6,7,8,9];
      GameState.player.stageProgress     = {1:5,2:5,3:5,4:5,5:5,6:5,7:5,8:5,9:5,10:4};
      GameState.save();
      this.scene.restart();
    });
  }
}
