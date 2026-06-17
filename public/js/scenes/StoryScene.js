// 妖忘記 — ストーリー画面（左マップ＋右固定パネル版）
class StoryScene extends Phaser.Scene {
  constructor() { super('StoryScene'); }

  create() {
    SE.init();
    SE.playBGM('title');
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;
    this.MAP_W   = Math.floor(W * 0.60); // ~288px（左マップ幅）
    this.PANEL_W = W - this.MAP_W;       // ~192px（右パネル幅）

    // 背景（ユーザーが後で差し替え予定）
    this.add.graphics()
      .fillGradientStyle(0x050210, 0x050210, 0x100a20, 0x100a20, 1)
      .fillRect(0, 0, W, H);

    this._drawHeader();
    this._setupRightPanel();
    this._setupScrollMap();
    this._setupDev();
    this._selectDefaultStage();
  }

  // ===== ヘッダー =====
  _drawHeader() {
    const W = this.W;
    this.add.rectangle(W / 2, 30, W, 60, 0x080318, 0.95).setDepth(10);
    this.add.graphics().setDepth(10)
      .lineStyle(1, 0x2a1040)
      .lineBetween(0, 60, W, 60);

    this.add.text(W / 2, 30, '〜 ストーリー 〜', {
      fontFamily: 'serif', fontSize: '22px', color: '#e8c87a',
    }).setOrigin(0.5).setDepth(10);

    const back = this.add.text(12, 30, '← 戻る', {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
      backgroundColor: '#1a0a3a', padding: { x: 8, y: 5 },
    }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#e8c87a'));
    back.on('pointerout',  () => back.setColor('#b89adc'));
    back.on('pointerdown', () => { SE.playSE('click'); this.scene.start('HomeScene'); });
  }

  // ===== 右固定パネル =====
  _setupRightPanel() {
    const { MAP_W, PANEL_W, W, H } = this;
    const px = MAP_W;
    const cx = px + PANEL_W / 2;

    // パネル背景
    const bg = this.add.graphics().setDepth(8);
    bg.fillStyle(0x06021a, 0.97);
    bg.fillRect(px, 60, PANEL_W, H - 60);
    bg.lineStyle(1, 0x3a1a5a, 0.7);
    bg.lineBetween(px, 60, px, H);

    // 上部ライン装飾
    bg.lineStyle(1, 0x5533aa, 0.4);
    bg.lineBetween(px + 10, 68, W - 10, 68);

    // 選択前のヒント
    this._panelHint = this.add.text(cx, H / 2, '←\n話を\n選んで\nください', {
      fontFamily: 'serif', fontSize: '11px', color: '#443366',
      align: 'center', lineSpacing: 5,
    }).setOrigin(0.5).setDepth(9);

    // CHAPTER番号
    this._pChNum = this.add.text(cx, 80, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#7744aa',
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    // ステージタイトル
    this._pTitle = this.add.text(cx, 104, '', {
      fontFamily: 'serif', fontSize: '14px', color: '#e8c87a',
      align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    // 区切り線（graphics で動的に描く）
    this._pDivG = this.add.graphics().setDepth(9);

    // 敵ラベル
    this._pEnemyLbl = this.add.text(px + 10, 136, '敵', {
      fontFamily: 'monospace', fontSize: '8px', color: '#554477',
    }).setDepth(9).setVisible(false);

    // 敵名
    this._pEnemy = this.add.text(px + 10, 152, '', {
      fontFamily: 'serif', fontSize: '12px', color: '#c8aae8',
      wordWrap: { width: PANEL_W - 14 },
    }).setDepth(9).setVisible(false);

    // 報酬ラベル
    this._pRewardLbl = this.add.text(px + 10, 176, '初回報酬', {
      fontFamily: 'monospace', fontSize: '8px', color: '#554477',
    }).setDepth(9).setVisible(false);

    // 報酬テキスト
    this._pReward = this.add.text(px + 10, 192, '', {
      fontFamily: 'serif', fontSize: '11px', color: '#88cc88',
    }).setDepth(9).setVisible(false);

    // 挑戦ボタン（パネル下部に固定）
    this._pBtn = this.add.text(cx, H - 48, '⚔ 挑戦する ⚔', {
      fontFamily: 'serif', fontSize: '13px', color: '#1a0800',
      backgroundColor: '#e8c87a', padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setDepth(9).setVisible(false)
      .setInteractive({ useHandCursor: true });

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

    this._panelData = null;
  }

  _updatePanel(ch, stageIdx, battle) {
    const CHN = ['一','二','三','四','五','六','七','八','九','十'];
    const { MAP_W, PANEL_W } = this;
    const px = MAP_W;
    const cx = px + PANEL_W / 2;

    this._panelData = { ch, stageIdx };
    this._panelHint.setVisible(false);

    this._pChNum.setText(`CHAPTER ${ch.id}`).setVisible(true);
    this._pTitle.setText(`第${CHN[ch.id - 1]}章\n第${stageIdx + 1}話`).setVisible(true);

    this._pDivG.clear();
    this._pDivG.lineStyle(1, 0x3a1a5a, 0.5);
    this._pDivG.lineBetween(px + 8, 122, px + PANEL_W - 8, 122);

    this._pEnemyLbl.setVisible(true);
    this._pEnemy.setText(battle.enemy).setVisible(true);

    const prog    = GameState.player.stageProgress[ch.id] || 0;
    const isFirst = prog <= stageIdx;
    const isBoss  = stageIdx === 4;

    this._pRewardLbl.setVisible(true);
    if (isFirst) {
      this._pReward.setText(`呪魂 +2${isBoss ? '\nカード2枚' : ''}`).setColor('#88cc88');
    } else {
      this._pReward.setText('受取済み').setColor('#555566');
    }
    this._pReward.setVisible(true);
    this._pBtn.setVisible(true);
  }

  // 最初のクリア可能なステージを自動選択
  _selectDefaultStage() {
    for (const ch of D.chapters) {
      const prog = GameState.player.stageProgress[ch.id] || 0;
      if (prog < 5) {
        const stageIdx = Math.min(prog, 4);
        this._updatePanel(ch, stageIdx, ch.battles[stageIdx]);
        return;
      }
    }
  }

  // ===== 横スクロールマップ =====
  _setupScrollMap() {
    const { MAP_W, H } = this;
    const CHAPTER_W = Math.floor(MAP_W * 0.83); // ~239px（1.25章分見える）
    const totalW    = D.chapters.length * CHAPTER_W + 20;

    this._scrollX    = 0;
    this._maxScrollX = Math.max(0, totalW - MAP_W);
    this._dragLock   = false;

    this.mapContainer = this.add.container(0, 62).setDepth(1);

    // マップをMAP_Wでクリップ（sceneに描画しないmake）
    const maskG = this.make.graphics({ add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(0, 62, MAP_W, H - 62);
    this.mapContainer.setMask(maskG.createGeometryMask());

    const mapH = H - 62;
    D.chapters.forEach((ch, i) => {
      const cx = 10 + i * CHAPTER_W + CHAPTER_W / 2;
      this._drawChapter(ch, i, cx, CHAPTER_W, mapH);
    });

    // スクロール制御（マップ領域のみ受付）
    let dragStartX = null, scrollStart = 0;

    this.input.on('pointerdown', p => {
      if (p.y < 62 || p.x > MAP_W) return;
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
      if (_p.x > MAP_W) return;
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

    const C = this.mapContainer;
    const g = ()     => { const o = this.add.graphics();      C.add(o); return o; };
    const t = (...a) => { const o = this.add.text(...a);      C.add(o); return o; };
    const r = (...a) => { const o = this.add.rectangle(...a); C.add(o); return o; };

    // 章区切り線
    if (idx > 0) {
      g().lineStyle(1, 0x2a1040, 0.3)
         .lineBetween(cx - chW / 2, 0, cx - chW / 2, mapH);
    }

    // 章タイトルエリア
    g().fillStyle(locked ? 0x0c0c1a : 0x1a0d38, 0.9)
       .fillRoundedRect(cx - chW / 2 + 5, 5, chW - 10, 42, 6);

    t(cx, 14, `CHAPTER ${ch.id}`, {
      fontFamily: 'monospace', fontSize: '8px',
      color: locked ? '#333355' : '#7744aa',
    }).setOrigin(0.5);

    t(cx, 30, ch.title.replace(/^第.章：/, ''), {
      fontFamily: 'serif', fontSize: '11px',
      color: locked ? '#333355' : '#e8c87a',
    }).setOrigin(0.5);

    if (locked) {
      t(cx, mapH / 2 - 10, '🔒', {
        fontFamily: 'serif', fontSize: '22px', color: '#2a2a3a',
      }).setOrigin(0.5);
      return;
    }

    // ===== ノード =====
    const nodeR = 13;
    const areaT = 54;
    const areaH = mapH - areaT - 28;

    const NP = [
      { x: cx + chW * 0.07,  y: areaT + areaH * 0.88 },
      { x: cx - chW * 0.13,  y: areaT + areaH * 0.66 },
      { x: cx + chW * 0.09,  y: areaT + areaH * 0.44 },
      { x: cx - chW * 0.11,  y: areaT + areaH * 0.22 },
      { x: cx,               y: areaT + areaH * 0.03 },
    ];

    // 接続線
    for (let s = 0; s < 4; s++) {
      const a = NP[s], b = NP[s + 1];
      g().lineStyle(2, s < prog - 1 ? 0xb89620 : 0x3a1a5a, s < prog - 1 ? 0.9 : 0.35)
         .lineBetween(a.x, a.y, b.x, b.y);
    }

    // ノード
    NP.forEach((pos, s) => {
      const done    = s < prog;
      const current = s === prog;
      const isLock  = s > prog;
      const isBoss  = s === 4;
      const battle  = ch.battles[s];
      const ng      = g();

      if (isBoss) {
        const R = nodeR + 2;
        const pts = [
          { x: pos.x,     y: pos.y - R },
          { x: pos.x + R, y: pos.y     },
          { x: pos.x,     y: pos.y + R },
          { x: pos.x - R, y: pos.y     },
        ];
        ng.fillStyle(done ? 0x8b2020 : current ? 0x3a0808 : 0x181818, 1);
        ng.fillPoints(pts, true);
        ng.lineStyle(1.5, done ? 0xff6644 : current ? 0xdd2200 : 0x333333, 1);
        ng.strokePoints(pts, true);
        if (current) {
          ng.lineStyle(4, 0xdd2200, 0.15);
          ng.strokePoints(pts.map(p => ({
            x: pos.x + (p.x - pos.x) * 1.5,
            y: pos.y + (p.y - pos.y) * 1.5,
          })), true);
        }
      } else {
        ng.fillStyle(done ? 0xb89620 : current ? 0x2a0c50 : 0x181818, 1);
        ng.fillCircle(pos.x, pos.y, nodeR);
        ng.lineStyle(done ? 2 : current ? 2 : 1,
          done ? 0xffdd44 : current ? 0xcc88ff : 0x2e2e2e, 1);
        ng.strokeCircle(pos.x, pos.y, nodeR);
        if (current) {
          ng.lineStyle(4, 0xcc88ff, 0.2);
          ng.strokeCircle(pos.x, pos.y, nodeR + 6);
        }
      }

      t(pos.x, pos.y, isBoss ? '👹' : done ? '✓' : `${s + 1}`, {
        fontFamily: 'serif',
        fontSize: isBoss ? '10px' : done ? '12px' : '10px',
        color: done ? '#1a0a00' : current ? '#e8c87a' : '#333333',
      }).setOrigin(0.5);

      if (isBoss) {
        t(pos.x, pos.y + nodeR + 7, 'BOSS', {
          fontFamily: 'monospace', fontSize: '6px',
          color: done ? '#ff6644' : current ? '#dd2200' : '#333333',
        }).setOrigin(0.5);
      }

      if (!isLock) {
        const hit = r(pos.x, pos.y, (nodeR + 6) * 2, (nodeR + 6) * 2, 0, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => ng.setAlpha(0.75));
        hit.on('pointerout',  () => ng.setAlpha(1.0));
        hit.on('pointerup', () => {
          if (this._dragLock) return;
          SE.playSE('click');
          this._updatePanel(ch, s, battle);
        });
      }
    });

    // 進捗バッジ
    if (prog >= 5) {
      g().fillStyle(0x1a3a1a, 0.9).fillRoundedRect(cx - 28, mapH - 22, 56, 16, 4);
      t(cx, mapH - 14, '✅ CLEAR', {
        fontFamily: 'monospace', fontSize: '7px', color: '#44cc88',
      }).setOrigin(0.5);
    } else {
      t(cx, mapH - 14, `${Math.min(prog, 5)} / 5`, {
        fontFamily: 'monospace', fontSize: '8px',
        color: prog > 0 ? '#664488' : '#333355',
      }).setOrigin(0.5);
    }
  }

  // ===== DEV ボタン =====
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
