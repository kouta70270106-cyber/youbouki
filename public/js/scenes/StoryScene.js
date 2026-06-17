// 妖忘記 — ストーリー画面（章カード一覧 → ステージ選択の2段構成）
class StoryScene extends Phaser.Scene {
  constructor() { super('StoryScene'); }

  preload() {
    for (let i = 1; i <= 10; i++) {
      this.load.image(`ch_bg_${i}`, `images/chapters/ch${i}.png`);
    }
  }

  create() {
    SE.init();
    SE.playBGM('title');
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;
    this.MAP_W   = Math.floor(W * 0.60);
    this.PANEL_W = W - this.MAP_W;
    this._mode   = 'chapter'; // 'chapter' | 'stage'

    this.add.graphics()
      .fillGradientStyle(0x050210, 0x050210, 0x100a20, 0x100a20, 1)
      .fillRect(0, 0, W, H);

    this._buildHeader();
    this._buildChapterView();
    this._buildStageView();
    this._buildDev();
    this._showChapters();
  }

  // ============================================================
  // ヘッダー（共通）
  // ============================================================
  _buildHeader() {
    const W = this.W;
    this.add.rectangle(W / 2, 30, W, 60, 0x080318, 0.95).setDepth(10);
    this.add.graphics().setDepth(10)
      .lineStyle(1, 0x2a1040).lineBetween(0, 60, W, 60);

    this.headerTitle = this.add.text(W / 2, 30, '〜 ストーリー 〜', {
      fontFamily: 'serif', fontSize: '22px', color: '#e8c87a',
    }).setOrigin(0.5).setDepth(10);

    this.backBtn = this.add.text(12, 30, '← 戻る', {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
      backgroundColor: '#1a0a3a', padding: { x: 8, y: 5 },
    }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
    this.backBtn.on('pointerover', () => this.backBtn.setColor('#e8c87a'));
    this.backBtn.on('pointerout',  () => this.backBtn.setColor('#b89adc'));
    this.backBtn.on('pointerdown', () => {
      SE.playSE('click');
      this._mode === 'stage' ? this._showChapters() : this.scene.start('HomeScene');
    });
  }

  // ============================================================
  // 章カード一覧ビュー
  // ============================================================
  _buildChapterView() {
    this.chContainer = this.add.container(0, 62).setDepth(1);
    this._chScrollY  = 0;
    this._chDragLock = false;

    const CARD_W = this.W - 24;
    const CARD_H = 94;
    const GAP    = 8;

    // 章ごとのアクセントカラー
    const ACCENT = [
      0x1a3a4a, 0x4a1a1a, 0x2a1048, 0x1a3a1a, 0x1a1a3a,
      0x3a2a12, 0x2a1a2a, 0x122840, 0x3a1218, 0x181010,
    ];

    D.chapters.forEach((ch, i) => {
      const cy = i * (CARD_H + GAP) + CARD_H / 2;
      this._drawChCard(ch, i, 12, cy, CARD_W, CARD_H, ACCENT[i]);
    });

    const totalH = D.chapters.length * (CARD_H + GAP);
    this._chMaxScroll = Math.max(0, totalH - (this.H - 62));

    // スクロール入力
    let dragY = null, scrollStart = 0;
    this.input.on('pointerdown', p => {
      if (this._mode !== 'chapter' || p.y < 62) return;
      dragY = p.y; scrollStart = this._chScrollY; this._chDragLock = false;
    });
    this.input.on('pointermove', p => {
      if (this._mode !== 'chapter' || dragY === null || !p.isDown) return;
      if (Math.abs(p.y - dragY) > 6) this._chDragLock = true;
      this._chScrollY = Phaser.Math.Clamp(scrollStart - (p.y - dragY), 0, this._chMaxScroll);
      this.chContainer.y = 62 - this._chScrollY;
    });
    this.input.on('pointerup', () => {
      dragY = null;
      this.time.delayedCall(50, () => { this._chDragLock = false; });
    });
    this.input.on('wheel', (_p, _g, _dx, dy) => {
      if (this._mode !== 'chapter') return;
      this._chScrollY = Phaser.Math.Clamp(this._chScrollY + dy * 0.6, 0, this._chMaxScroll);
      this.chContainer.y = 62 - this._chScrollY;
    });
  }

  _drawChCard(ch, idx, bx, cy, cW, cH, accent) {
    const C  = this.chContainer;
    const g  = ()     => { const o = this.add.graphics();      C.add(o); return o; };
    const t  = (...a) => { const o = this.add.text(...a);      C.add(o); return o; };
    const r  = (...a) => { const o = this.add.rectangle(...a); C.add(o); return o; };
    const by = cy - cH / 2;

    const prog = GameState.player.stageProgress[ch.id] || 0;
    const prevDone = idx === 0
      || (GameState.player.stageProgress[D.chapters[idx - 1].id] || 0) >= 5
      || GameState.player.completedChapters.includes(D.chapters[idx - 1].id);
    const locked  = !prevDone;
    const cleared = prog >= 5;

    // カード背景
    const bg = g();
    if (locked) {
      bg.fillStyle(0x0c0c1a, 1);
      bg.fillRoundedRect(bx, by, cW, cH, 8);
      bg.lineStyle(1, 0x222233, 0.4);
      bg.strokeRoundedRect(bx, by, cW, cH, 8);
    } else {
      const imgKey = `ch_bg_${ch.id}`;
      if (this.textures.exists(imgKey)) {
        // 章背景画像をカードサイズに合わせて表示
        const img = this.add.image(bx + cW / 2, cy, imgKey)
          .setDisplaySize(cW, cH)
          .setAlpha(0.7);
        C.add(img);
        // 暗いオーバーレイで視認性を確保
        bg.fillStyle(0x060214, 0.38).fillRoundedRect(bx, by, cW, cH, 8);
      } else {
        // 画像なし: 従来のアクセントカラー
        bg.fillStyle(accent, 1).fillRoundedRect(bx, by, cW, cH, 8);
        bg.fillStyle(0x060214, 0.65).fillRoundedRect(bx + cW * 0.28, by, cW * 0.72, cH, 8);
      }
      bg.lineStyle(1, cleared ? 0x44cc88 : 0x5533aa, 0.6);
      bg.strokeRoundedRect(bx, by, cW, cH, 8);
      // 左アクセントバー
      bg.fillStyle(accent, 1);
      bg.fillRoundedRect(bx, by, 4, cH, { tl: 8, bl: 8, tr: 0, br: 0 });
    }

    if (locked) {
      t(bx + cW / 2, cy - 10, '🔒', {
        fontFamily: 'serif', fontSize: '20px', color: '#2a2a40',
      }).setOrigin(0.5);
      t(bx + cW / 2, cy + 16, '前の章をクリア', {
        fontFamily: 'serif', fontSize: '10px', color: '#333355',
      }).setOrigin(0.5);
      return;
    }

    // CHAPTER番号
    t(bx + 14, by + 11, `CHAPTER ${ch.id}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#9966cc',
    });

    // 章タイトル
    t(bx + 14, by + 26, ch.title.replace(/^第.章：/, ''), {
      fontFamily: 'serif', fontSize: '17px', color: '#e8c87a',
    });

    // 進捗バー
    const barW = cW - 90;
    const barX = bx + 14;
    const barY = by + cH - 20;
    const prog5 = Math.min(prog / 5, 1);
    const barG = g();
    barG.fillStyle(0x1a1a2a, 1).fillRoundedRect(barX, barY, barW, 5, 2);
    if (prog > 0) {
      barG.fillStyle(cleared ? 0x44cc88 : 0xb89620, 1)
          .fillRoundedRect(barX, barY, barW * prog5, 5, 2);
    }

    // 進捗テキスト
    t(bx + 14, by + cH - 34, `${Math.min(prog, 5)} / 5`, {
      fontFamily: 'monospace', fontSize: '10px',
      color: cleared ? '#44cc88' : '#664488',
    });

    // CLEAR バッジ
    if (cleared) {
      const bdg = g();
      bdg.fillStyle(0x1a4a2a, 1).fillRoundedRect(bx + cW - 66, by + 8, 54, 20, 4);
      t(bx + cW - 39, by + 18, 'CLEAR', {
        fontFamily: 'monospace', fontSize: '9px', color: '#44cc88',
      }).setOrigin(0.5);
    }

    // クリック判定
    const hit = r(bx + cW / 2, cy, cW, cH, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => bg.setAlpha(0.78));
    hit.on('pointerout',  () => bg.setAlpha(1.0));
    hit.on('pointerup', () => {
      if (this._chDragLock) return;
      SE.playSE('click');
      this._showStages(ch);
    });
  }

  // ============================================================
  // ステージ選択ビュー（左マップ＋右パネル）
  // ============================================================
  _buildStageView() {
    const { MAP_W, PANEL_W, W, H } = this;
    const px = MAP_W;

    // 右パネル背景
    this.stagePanelBg = this.add.graphics().setDepth(8).setVisible(false);
    this.stagePanelBg.fillStyle(0x06021a, 0.97).fillRect(px, 60, PANEL_W, H - 60);
    this.stagePanelBg.lineStyle(1, 0x3a1a5a, 0.7).lineBetween(px, 60, px, H);
    this.stagePanelBg.lineStyle(1, 0x5533aa, 0.4).lineBetween(px + 10, 68, W - 10, 68);

    const cx = px + PANEL_W / 2;

    this._pHint = this.add.text(cx, H / 2, '←\n話を\n選んでください', {
      fontFamily: 'serif', fontSize: '11px', color: '#443366',
      align: 'center', lineSpacing: 5,
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._pChNum = this.add.text(cx, 80, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#7744aa',
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._pTitle = this.add.text(cx, 104, '', {
      fontFamily: 'serif', fontSize: '14px', color: '#e8c87a', align: 'center',
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._pDivG = this.add.graphics().setDepth(9);

    this._pEnemyLbl = this.add.text(px + 10, 136, '敵', {
      fontFamily: 'monospace', fontSize: '8px', color: '#554477',
    }).setDepth(9).setVisible(false);

    this._pEnemy = this.add.text(px + 10, 152, '', {
      fontFamily: 'serif', fontSize: '12px', color: '#c8aae8',
      wordWrap: { width: PANEL_W - 14 },
    }).setDepth(9).setVisible(false);

    this._pRewardLbl = this.add.text(px + 10, 176, '初回報酬', {
      fontFamily: 'monospace', fontSize: '8px', color: '#554477',
    }).setDepth(9).setVisible(false);

    this._pReward = this.add.text(px + 10, 192, '', {
      fontFamily: 'serif', fontSize: '11px', color: '#88cc88',
    }).setDepth(9).setVisible(false);

    this._pBtn = this.add.text(cx, H - 48, '⚔ 挑戦する ⚔', {
      fontFamily: 'serif', fontSize: '13px', color: '#1a0800',
      backgroundColor: '#e8c87a', padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setDepth(9).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this._pBtn.on('pointerover', () => {
      this._pBtn.setColor('#000000'); this._pBtn.setBackgroundColor('#ffd700');
    });
    this._pBtn.on('pointerout', () => {
      this._pBtn.setColor('#1a0800'); this._pBtn.setBackgroundColor('#e8c87a');
    });
    this._pBtn.on('pointerdown', () => {
      if (!this._stageData) return;
      SE.playSE('click');
      const { ch, stageIdx } = this._stageData;
      this.scene.start('BattleScene', { chapterId: ch.id, battleIndex: stageIdx, story: true });
    });

    // ステージマップコンテナ（左側、マスク付き）
    this.stageMapCont = this.add.container(0, 62).setDepth(1).setVisible(false);
    const maskG = this.make.graphics({ add: false });
    maskG.fillStyle(0xffffff).fillRect(0, 62, MAP_W, H - 62);
    this.stageMapCont.setMask(maskG.createGeometryMask());

    this._stageData = null;
  }

  _updateStagePanel(ch, stageIdx, battle) {
    const CHN = ['一','二','三','四','五','六','七','八','九','十'];
    const { MAP_W, PANEL_W } = this;
    const px = MAP_W;

    this._stageData = { ch, stageIdx };
    this._pHint.setVisible(false);
    this._pChNum.setText(`CHAPTER ${ch.id}`).setVisible(true);
    this._pTitle.setText(`第${CHN[ch.id - 1]}章\n第${stageIdx + 1}話`).setVisible(true);

    this._pDivG.clear()
      .lineStyle(1, 0x3a1a5a, 0.5)
      .lineBetween(px + 8, 122, px + PANEL_W - 8, 122);

    this._pEnemyLbl.setVisible(true);
    this._pEnemy.setText(battle.enemy).setVisible(true);

    const prog    = GameState.player.stageProgress[ch.id] || 0;
    const isFirst = prog <= stageIdx;
    const isBoss  = stageIdx === 4;
    this._pRewardLbl.setVisible(true);
    this._pReward
      .setText(isFirst ? `呪魂 +2${isBoss ? '\nカード2枚' : ''}` : '受取済み')
      .setColor(isFirst ? '#88cc88' : '#555566')
      .setVisible(true);
    this._pBtn.setVisible(true);
  }

  _drawStageNodes(ch) {
    const { MAP_W, H } = this;
    const C = this.stageMapCont;
    const g = ()     => { const o = this.add.graphics();      C.add(o); return o; };
    const t = (...a) => { const o = this.add.text(...a);      C.add(o); return o; };
    const r = (...a) => { const o = this.add.rectangle(...a); C.add(o); return o; };

    // マップ背景画像（あれば）
    const imgKey = `ch_bg_${ch.id}`;
    if (this.textures.exists(imgKey)) {
      const mapH = H - 62;
      const img = this.add.image(MAP_W / 2, mapH / 2, imgKey)
        .setDisplaySize(MAP_W, mapH)
        .setAlpha(0.75);
      C.add(img);
      // 薄いオーバーレイでノードを見やすく
      const overlay = this.add.graphics();
      overlay.fillStyle(0x020010, 0.28).fillRect(0, 0, MAP_W, mapH);
      C.add(overlay);
    }

    const prog  = GameState.player.stageProgress[ch.id] || 0;
    const cx    = MAP_W / 2;
    const areaT = 10;
    const areaH = (H - 62) - areaT - 20;

    const NP = [
      { x: cx + MAP_W * 0.07,  y: areaT + areaH * 0.88 },
      { x: cx - MAP_W * 0.13,  y: areaT + areaH * 0.66 },
      { x: cx + MAP_W * 0.09,  y: areaT + areaH * 0.44 },
      { x: cx - MAP_W * 0.11,  y: areaT + areaH * 0.22 },
      { x: cx,                 y: areaT + areaH * 0.04 },
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
      const nodeR   = 18;
      const ng      = g();

      if (isBoss) {
        const R   = nodeR + 2;
        const pts = [
          { x: pos.x,     y: pos.y - R },
          { x: pos.x + R, y: pos.y     },
          { x: pos.x,     y: pos.y + R },
          { x: pos.x - R, y: pos.y     },
        ];
        ng.fillStyle(done ? 0x8b2020 : current ? 0x3a0808 : 0x181818, 1)
          .fillPoints(pts, true);
        ng.lineStyle(1.5, done ? 0xff6644 : current ? 0xdd2200 : 0x333333, 1)
          .strokePoints(pts, true);
        if (current) {
          ng.lineStyle(4, 0xdd2200, 0.15)
            .strokePoints(pts.map(p => ({
              x: pos.x + (p.x - pos.x) * 1.5, y: pos.y + (p.y - pos.y) * 1.5,
            })), true);
        }
      } else {
        ng.fillStyle(done ? 0xb89620 : current ? 0x2a0c50 : 0x181818, 1)
          .fillCircle(pos.x, pos.y, nodeR);
        ng.lineStyle(done ? 2 : current ? 2 : 1,
            done ? 0xffdd44 : current ? 0xcc88ff : 0x2e2e2e, 1)
          .strokeCircle(pos.x, pos.y, nodeR);
        if (current) {
          ng.lineStyle(4, 0xcc88ff, 0.2).strokeCircle(pos.x, pos.y, nodeR + 6);
        }
      }

      t(pos.x, pos.y, isBoss ? '👹' : done ? '✓' : `${s + 1}`, {
        fontFamily: 'serif',
        fontSize: isBoss ? '12px' : done ? '14px' : '12px',
        color: done ? '#1a0a00' : current ? '#e8c87a' : '#333333',
      }).setOrigin(0.5);

      if (isBoss) {
        t(pos.x, pos.y + nodeR + 8, 'BOSS', {
          fontFamily: 'monospace', fontSize: '7px',
          color: done ? '#ff6644' : current ? '#dd2200' : '#333333',
        }).setOrigin(0.5);
      }

      if (!isLock) {
        const hit = r(pos.x, pos.y, (nodeR + 8) * 2, (nodeR + 8) * 2, 0, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => ng.setAlpha(0.75));
        hit.on('pointerout',  () => ng.setAlpha(1.0));
        hit.on('pointerup', () => {
          SE.playSE('click');
          this._updateStagePanel(ch, s, battle);
        });
      }
    });
  }

  // ============================================================
  // ビュー切り替え
  // ============================================================
  _showChapters() {
    this._mode = 'chapter';
    this.chContainer.setVisible(true);
    this.stagePanelBg.setVisible(false);
    this.stageMapCont.setVisible(false);
    const panelItems = [this._pHint, this._pChNum, this._pTitle,
      this._pEnemyLbl, this._pEnemy, this._pRewardLbl, this._pReward, this._pBtn];
    panelItems.forEach(o => o.setVisible(false));
    this._pDivG.clear();
    this.headerTitle.setText('〜 ストーリー 〜');
    this.backBtn.setText('← 戻る');
  }

  _showStages(ch) {
    this._mode = 'stage';
    this.chContainer.setVisible(false);
    this.stagePanelBg.setVisible(true);
    this.stageMapCont.setVisible(true).removeAll(true);

    this.headerTitle.setText(ch.title.replace(/^第.章：/, ''));
    this.backBtn.setText('← 章一覧');

    // ノード描画
    this._drawStageNodes(ch);

    // 最初のクリア可能ステージを自動選択
    const prog = GameState.player.stageProgress[ch.id] || 0;
    const si   = Math.min(prog, 4);
    this._updateStagePanel(ch, si, ch.battles[si]);
  }

  // ============================================================
  // DEV
  // ============================================================
  _buildDev() {
    const W = this.W;
    const btn = this.add.text(W - 8, 8, '[DEV]', {
      fontFamily: 'monospace', fontSize: '11px', color: '#443355',
      backgroundColor: '#110022', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
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
