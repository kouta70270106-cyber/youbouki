// 妖忘記 — バトルシーン
// ターン制カードバトル。手番は PLAYER → ENEMY の交互。
class BattleScene extends Phaser.Scene {
  constructor(key = 'BattleScene') { super(key); }

  init(data) {
    this.chapterId   = data.chapterId   || 1;
    this.battleIndex = data.battleIndex || 0;
    this.isStory     = data.story       || true;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    // バトルデータ取得
    const chapter = D.chapters.find(c => c.id === this.chapterId);
    this.battleData = chapter.battles[this.battleIndex];

    // ゲーム状態初期化
    this.state = {
      turn: 'player',
      energy: { current: 0, max: 1 },

      player: {
        name:  GameState.player.name,
        souls: 8,
        hand:  [],
        deck:  this.buildDeck(this._getPlayerDeckIds()),
        field: [null, null, null, null, null],
      },
      enemy: {
        name:  this.battleData.enemy,
        souls: this.battleData.souls,
        hand:  [],
        deck:  this.buildDeck(this.battleData.deckIds),
        field: [null, null, null, null, null],
      },
    };

    // 初期手札
    for (let i = 0; i < 5; i++) this.drawCard('player');
    for (let i = 0; i < 5; i++) this.drawCard('enemy');

    this.selectedCard  = null;
    this.attackSource  = null;
    this.busy          = false;

    if (this.battleData.preText && this.isStory) {
      this._showPreDialogue(this.battleData.preText);
    } else {
      this._startBattle();
    }
  }

  _startBattle() {
    this.drawBg();
    this.render();
    SE.playBGM('battle');
  }

  _showPreDialogue(text) {
    const W = this.W, H = this.H;
    SE.playBGM('title');

    const chapter = D.chapters.find(c => c.id === this.chapterId);

    // 追跡リスト（ボタン押下時に全削除）
    this._dlgObjs = [];
    const reg = obj => { this._dlgObjs.push(obj); return obj; };

    // ── 背景 ──
    const bg = reg(this.add.graphics());
    bg.fillStyle(0x080315, 1);
    bg.fillRect(0, 0, W, H);

    // ── ヘッダー ──
    reg(this.add.text(W / 2, 28,
      `${chapter.title}　ステージ ${this.battleIndex + 1}`, {
        fontFamily: 'serif', fontSize: '13px', color: '#9966cc',
      }).setOrigin(0.5));

    const hDiv = reg(this.add.graphics());
    hDiv.lineStyle(1, 0x3a1a5a, 1);
    hDiv.lineBetween(16, 50, W - 16, 50);

    // ── ストーリーテキスト（単一オブジェクト・固定座標）──
    reg(this.add.text(20, 58, this._formatForDisplay(text), {
      fontFamily: 'serif',
      fontSize: '13px',
      color: '#c8c0e0',
      lineSpacing: 7,
    }));

    // ── フッター区切り（固定 y=600）──
    const fDiv = reg(this.add.graphics());
    fDiv.fillStyle(0x080315, 1);
    fDiv.fillRect(0, 600, W, H - 600);
    fDiv.lineStyle(1, 0x3a1a5a, 0.9);
    fDiv.lineBetween(16, 600, W - 16, 600);

    // ── vs 表示（固定 y=634）──
    reg(this.add.text(W / 2, 634, `vs.  ${this.battleData.enemy}`, {
      fontFamily: 'serif', fontSize: '15px', color: '#cc5555',
      stroke: '#1a0000', strokeThickness: 3,
    }).setOrigin(0.5));

    // ── バトル開始ボタン（固定 y=672）──
    const btn = reg(this.add.text(W / 2, 672, 'バトル開始 →', {
      fontFamily: 'serif', fontSize: '18px', color: '#e8c87a',
      backgroundColor: '#2a1040', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }));

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#e8c87a'));
    btn.on('pointerdown', () => {
      SE.playSE('click');
      this._dlgObjs.forEach(o => { if (o && o.destroy) o.destroy(); });
      this._dlgObjs = [];
      this._startBattle();
    });
  }

  // 「話者：「台詞」」を「▷ 話者\n台詞」形式に変換して1文字列にまとめる
  // ※日本語はスペースなしのためPhaserのwordWrapが機能しない。手動折り返し。
  _formatForDisplay(text) {
    const MAX = 22; // 1行の最大文字数（13px serif、440px幅で余裕をもって収まる）
    const BREAK_CHARS = '。、！？」』）…―\n';

    const wrapLine = s => {
      if (s.length <= MAX) return s;
      const parts = [];
      let rest = s;
      while (rest.length > MAX) {
        // MAX付近の句読点を探して自然な位置で折り返す
        let breakAt = MAX;
        for (let i = MAX; i >= MAX - 6; i--) {
          if (BREAK_CHARS.includes(rest[i] || '')) {
            breakAt = i + 1;
            break;
          }
        }
        parts.push(rest.slice(0, breakAt));
        rest = rest.slice(breakAt).trimStart();
      }
      if (rest) parts.push(rest);
      return parts.join('\n');
    };

    return text.split('\n').map(line => {
      if (!line.trim()) return '';
      const m = line.match(/^(.{1,10})：[「『（](.+)/);
      if (m) {
        const dialogue = line.replace(/^.+?：/, '');
        return `▷ ${m[1]}\n${wrapLine(dialogue)}`;
      }
      return wrapLine(line);
    }).join('\n');
  }

  // カスタムデッキ or 所持カード全部をデッキIDリストとして返す
  _getPlayerDeckIds() {
    const custom = GameState.player.deck;
    if (custom && custom.length >= 10) return custom;
    return GameState.player.unlockedCards;
  }

  // ===== デッキ構築 =====
  buildDeck(ids) {
    const deck = ids.map(id => ({ ...D.cards.find(c => c.id === id), uid: Math.random() }));
    Phaser.Utils.Array.Shuffle(deck);
    return deck;
  }

  drawCard(who) {
    const s = this.state[who];
    if (s.deck.length === 0) return;
    if (s.hand.length >= 10) return;
    s.hand.push(s.deck.pop());
    if (who === 'player') SE.playSE('draw');
  }

  // ===== 描画 =====
  drawBg() {
    const W = this.W, H = this.H;
    const g = this.add.graphics();

    // 夜空グラデーション（上：深い藍 → 下：暗い紫）
    g.fillGradientStyle(0x020818, 0x020818, 0x120820, 0x120820, 1);
    g.fillRect(0, 0, W, H);

    // 星
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.55);
      const sr = Math.random() < 0.15 ? 1.5 : 0.8;
      const sa = 0.4 + Math.random() * 0.6;
      g.fillStyle(0xffffff, sa);
      g.fillCircle(sx, sy, sr);
    }

    // 月（右上）
    g.fillStyle(0xffe8a0, 0.95);
    g.fillCircle(W * 0.82, H * 0.12, 28);
    // 月の陰影（重ねて立体感）
    g.fillStyle(0xffdd66, 0.3);
    g.fillCircle(W * 0.82, H * 0.12, 28);
    g.fillStyle(0xfff0c0, 0.6);
    g.fillCircle(W * 0.80, H * 0.11, 22);
    // 月光（ぼんやりした光輪）
    g.fillStyle(0xffee88, 0.06);
    g.fillCircle(W * 0.82, H * 0.12, 60);
    g.fillStyle(0xffee88, 0.04);
    g.fillCircle(W * 0.82, H * 0.12, 90);

    // 遠景：山のシルエット
    g.fillStyle(0x0a0520, 1);
    g.fillTriangle(0, H * 0.48, W * 0.28, H * 0.22, W * 0.55, H * 0.48);
    g.fillTriangle(W * 0.3, H * 0.48, W * 0.62, H * 0.18, W * 1.0, H * 0.48);
    g.fillStyle(0x0c0625, 1);
    g.fillTriangle(0, H * 0.48, W * 0.18, H * 0.30, W * 0.38, H * 0.48);

    // 鳥居（中央やや左）
    const tx = W * 0.5, ty = H * 0.30;
    g.fillStyle(0x880022, 0.85);
    // 柱（左右）
    g.fillRect(tx - 36, ty, 7, H * 0.18);
    g.fillRect(tx + 29, ty, 7, H * 0.18);
    // 笠木（上の横木）
    g.fillRect(tx - 46, ty, 92, 8);
    g.fillRect(tx - 50, ty - 8, 100, 7);
    // 島木（下の横木）
    g.fillRect(tx - 38, ty + 20, 76, 6);

    // 地面（下部）
    g.fillStyle(0x080415, 1);
    g.fillRect(0, H * 0.48, W, H * 0.52);

    // 地面に草・苔のテクスチャ
    g.fillStyle(0x0e1a10, 1);
    g.fillRect(0, H * 0.48, W, 8);
    g.fillStyle(0x122015, 0.6);
    for (let i = 0; i < 20; i++) {
      g.fillRect(Phaser.Math.Between(0, W), H * 0.48, Phaser.Math.Between(2, 8), Phaser.Math.Between(3, 8));
    }

    // 竹のシルエット（左端）
    g.fillStyle(0x0d200f, 0.9);
    [W*0.04, W*0.07, W*0.10, W*0.02].forEach((bx, i) => {
      g.fillRect(bx, H * 0.25 + i * 8, 4, H * 0.25);
      // 竹の節
      g.fillStyle(0x163020, 0.8);
      g.fillRect(bx - 1, H * 0.30 + i * 8, 6, 2);
      g.fillRect(bx - 1, H * 0.38 + i * 8, 6, 2);
      g.fillStyle(0x0d200f, 0.9);
    });

    // 竹のシルエット（右端）
    [W*0.90, W*0.93, W*0.96, W*0.88].forEach((bx, i) => {
      g.fillRect(bx, H * 0.28 + i * 6, 4, H * 0.22);
      g.fillStyle(0x163020, 0.8);
      g.fillRect(bx - 1, H * 0.33 + i * 6, 6, 2);
      g.fillRect(bx - 1, H * 0.40 + i * 6, 6, 2);
      g.fillStyle(0x0d200f, 0.9);
    });

    // 霧（地面付近）
    g.fillStyle(0x8866aa, 0.06);
    g.fillEllipse(W * 0.5, H * 0.50, W * 1.2, 60);
    g.fillStyle(0x9977bb, 0.04);
    g.fillEllipse(W * 0.3, H * 0.52, W * 0.8, 40);
    g.fillStyle(0x8866aa, 0.04);
    g.fillEllipse(W * 0.75, H * 0.51, W * 0.6, 36);

    // フィールド区切り線（中央）
    g.lineStyle(1, 0x6633aa, 0.35);
    g.strokeRect(16, H * 0.48, W - 32, 1);
  }

  render() {
    if (this.uiLayer) this.uiLayer.destroy();
    this.uiLayer = this.add.container(0, 0);

    const W = this.W, H = this.H;
    const s = this.state;

    // ===== 魂表示 =====
    this.drawSouls(W / 2, 24,     s.enemy.name,  s.enemy.souls,  'enemy');
    this.drawSouls(W / 2, H - 24, s.player.name, s.player.souls, 'player');

    // ===== エネルギー =====
    const eTxt = this.add.text(W - 20, H / 2 - 24,
      `⚡ ${s.energy.current} / ${s.energy.max}`,
      { fontSize: '14px', color: '#ffdd44', fontFamily: 'serif' }
    ).setOrigin(1, 0.5);
    this.uiLayer.add(eTxt);

    // ===== フィールド =====
    this.drawField('enemy',  W / 2, H * 0.22);
    this.drawField('player', W / 2, H * 0.72);

    // ===== 手札 =====
    this.drawHand();

    // ===== ターンボタン =====
    if (s.turn === 'player') {
      const endBtn = this.add.rectangle(W / 2, H / 2, 110, 34, 0x1a0a40, 1)
        .setStrokeStyle(1, 0x8855cc)
        .setInteractive({ useHandCursor: true });
      endBtn.on('pointerover', () => endBtn.setFillStyle(0x2d1060));
      endBtn.on('pointerout',  () => endBtn.setFillStyle(0x1a0a40));
      endBtn.on('pointerdown', () => this.endTurn());
      const endTxt = this.add.text(W / 2, H / 2, 'ターン終了', {
        fontSize: '14px', color: '#e8c87a', fontFamily: 'serif'
      }).setOrigin(0.5);
      this.uiLayer.add([endBtn, endTxt]);
    }

    // ===== メッセージ =====
    if (this.message) {
      const msg = this.add.text(W / 2, H / 2 - 60, this.message, {
        fontSize: '15px', color: '#ffffff', fontFamily: 'serif',
        backgroundColor: '#000000aa', padding: { x: 10, y: 6 }
      }).setOrigin(0.5);
      this.uiLayer.add(msg);
    }
  }

  drawSouls(x, y, name, souls, who) {
    const label = this.add.text(x, y, `${name}　魂: ${'🔮'.repeat(souls)}`, {
      fontSize: '15px', color: who === 'player' ? '#e8c87a' : '#cc88ff',
      fontFamily: 'serif'
    }).setOrigin(0.5);
    this.uiLayer.add(label);
  }

  drawField(who, cx, cy) {
    const field = this.state[who].field;
    const total = 5;
    const cardW = 64, cardH = 80, gap = 10;
    const startX = cx - ((total - 1) * (cardW + gap)) / 2;

    for (let i = 0; i < total; i++) {
      const x = startX + i * (cardW + gap);
      const mob = field[i];

      if (mob) {
        const exhausted = who === 'player' && mob.attacked;
        const col = mob.frozen ? 0x2244aa : exhausted ? 0x1a1a1a : (who === 'player' ? 0x2a1040 : 0x1a2a10);
        const borderCol = mob.frozen ? 0x88ccff : exhausted ? 0x444444 : (who === 'player' ? 0x8855cc : 0x55aa44);
        const card = this.add.rectangle(x, cy, cardW, cardH, col, 1)
          .setStrokeStyle(1, borderCol);

        // 1. カード背景を先に追加（一番下のレイヤー）
        this.uiLayer.add(card);

        // 2. 妖怪スプライトを背景の上に追加
        const sprKey = CARD_SPRITE[mob.card.id];
        if (sprKey && this.textures.exists(sprKey)) {
          const spr = this.add.image(x, cy - 4, sprKey).setOrigin(0.5);
          const scale = Math.min((cardW - 8) / spr.width, (cardH - 32) / spr.height);
          spr.setScale(scale);
          if (exhausted) spr.setAlpha(0.4);
          this.uiLayer.add(spr);
        }

        // 3. テキストをスプライトの上に追加
        const nameT = this.add.text(x, cy - 30, mob.card.name, {
          fontSize: '10px', color: '#e8c87a', fontFamily: 'serif'
        }).setOrigin(0.5);

        const atkT = this.add.text(x - 20, cy + 30, `⚔${mob.card.atk}`, {
          fontSize: '12px', color: '#ff8844'
        }).setOrigin(0.5);

        const hpT = this.add.text(x + 20, cy + 30, `♥${mob.hp}`, {
          fontSize: '12px', color: '#44ff88'
        }).setOrigin(0.5);

        this.uiLayer.add([nameT, atkT, hpT]);

        if (mob.frozen) {
          const frozenT = this.add.text(x, cy, '凍', {
            fontSize: '18px', color: '#88ccff'
          }).setOrigin(0.5);
          this.uiLayer.add(frozenT);
        }

        if (mob.taunt) {
          const tT = this.add.text(x + 24, cy - 28, '🛡', { fontSize: '12px' }).setOrigin(0.5);
          this.uiLayer.add(tT);
        }
        if (mob.pierce) {
          const pT = this.add.text(x + 24, cy - 28, '↯', { fontSize: '12px', color: '#ffff44' }).setOrigin(0.5);
          this.uiLayer.add(pT);
        }

        // プレイヤーフィールドのみ攻撃選択可能（攻撃済み・凍結は除外）
        if (who === 'player' && this.state.turn === 'player' && !mob.frozen && !mob.attacked) {
          card.setInteractive({ useHandCursor: true });
          card.on('pointerdown', () => this.selectAttacker(i));
          if (this.attackSource === i) card.setStrokeStyle(2, 0xffff00);
        }

        // 敵フィールド：攻撃ターゲット選択
        if (who === 'enemy' && this.attackSource !== null) {
          card.setInteractive({ useHandCursor: true });
          card.on('pointerdown', () => this.attackTarget('field', i));
          card.setStrokeStyle(2, 0xff4444);
        }

      } else {
        // 空きスロット
        const empty = this.add.rectangle(x, cy, cardW, cardH, 0x111111, 0.3)
          .setStrokeStyle(1, 0x333333);
        this.uiLayer.add(empty);

        // 手札選択中なら召喚先として選択可能（プレイヤーのみ）
        if (who === 'player' && this.selectedCard !== null && this.state.turn === 'player') {
          empty.setFillStyle(0x223322, 0.6);
          empty.setStrokeStyle(1, 0x44cc44);
          empty.setInteractive({ useHandCursor: true });
          empty.on('pointerdown', () => this.summonToSlot(i));
        }
      }
    }

    // 敵フィールドが空で攻撃源あり → 直接攻撃（pierce持ちは挑発があっても可）
    if (who === 'enemy' && this.attackSource !== null) {
      const attackerMob = this.state.player.field[this.attackSource];
      const hasTaunt = field.some(m => m && m.taunt);
      const canDirect = field.filter(Boolean).length === 0 || (attackerMob && attackerMob.pierce);
      if (canDirect && (!hasTaunt || (attackerMob && attackerMob.pierce))) {
        const directZone = this.add.rectangle(cx, cy, 340, cardH + 10, 0xff000022, 0.3)
          .setStrokeStyle(2, 0xff4444)
          .setInteractive({ useHandCursor: true });
        directZone.on('pointerdown', () => this.attackTarget('direct', -1));
        this.uiLayer.add(directZone);
      }
    }
  }

  drawHand() {
    const hand = this.state.player.hand;
    const W = this.W, H = this.H;
    const cardW = 60, cardH = 84, gap = 8;
    const total = hand.length;
    const startX = W / 2 - ((total - 1) * (cardW + gap)) / 2;

    hand.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const y = H - 54;
      const canPlay = this.state.energy.current >= card.cost && this.state.turn === 'player';
      const isSelected = this.selectedCard === i;

      const col = isSelected ? 0x5533aa : (canPlay ? 0x2a1040 : 0x111111);
      const rect = this.add.rectangle(x, y, cardW, cardH, col, 1)
        .setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xffff00 : (canPlay ? 0x8855cc : 0x333333));

      // 1. カード背景を先に追加
      this.uiLayer.add(rect);

      // 2. 妖怪スプライトを背景の上に追加
      const sprKey = CARD_SPRITE[card.id];
      if (sprKey && this.textures.exists(sprKey)) {
        const spr = this.add.image(x, y - 4, sprKey).setOrigin(0.5);
        const scale = Math.min((cardW - 8) / spr.width, (cardH - 36) / spr.height);
        spr.setScale(scale);
        if (!canPlay) spr.setAlpha(0.4);
        this.uiLayer.add(spr);
      }

      // 3. テキストをスプライトの上に追加
      const nameT = this.add.text(x, y - 34, card.name, {
        fontSize: '9px', color: canPlay ? '#e8c87a' : '#666666', fontFamily: 'serif'
      }).setOrigin(0.5);

      const costT = this.add.text(x - 24, y - 38, `⚡${card.cost}`, {
        fontSize: '11px', color: '#ffdd44'
      }).setOrigin(0, 0.5);

      const atkT = this.add.text(x - 20, y + 34, `⚔${card.atk}`, {
        fontSize: '12px', color: '#ff8844'
      }).setOrigin(0.5);

      const hpT = this.add.text(x + 20, y + 34, `♥${card.hp}`, {
        fontSize: '12px', color: '#44ff88'
      }).setOrigin(0.5);

      this.uiLayer.add([nameT, costT, atkT, hpT]);

      if (canPlay) {
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerdown', () => {
          this.selectedCard = (this.selectedCard === i) ? null : i;
          this.attackSource = null;
          this.render();
        });
      }
    });
  }

  // ===== ポジション計算 =====

  getFieldPos(who, slotIndex) {
    const cardW = 64, gap = 10, total = 5;
    const cx = this.W / 2;
    const cy = who === 'player' ? this.H * 0.72 : this.H * 0.22;
    const startX = cx - ((total - 1) * (cardW + gap)) / 2;
    return { x: startX + slotIndex * (cardW + gap), y: cy };
  }

  getHandPos(handIndex) {
    const hand = this.state.player.hand;
    const cardW = 60, gap = 8;
    const startX = this.W / 2 - ((hand.length - 1) * (cardW + gap)) / 2;
    return { x: startX + handIndex * (cardW + gap), y: this.H - 54 };
  }

  // ===== アニメーション =====

  // 召喚：手札からフィールドへ飛び込む
  playSummonAnim(fromX, fromY, toX, toY, sprKey, callback) {
    // 常に見えるカード枠（depth=10で最前面）
    const bg = this.add.rectangle(fromX, fromY, 60, 84, 0x5533aa, 1)
      .setStrokeStyle(2, 0xffff00).setDepth(10);

    let spr = null;
    if (sprKey && this.textures.exists(sprKey)) {
      spr = this.add.image(fromX, fromY, sprKey)
        .setOrigin(0.5).setScale(1.1).setDepth(11);
    }

    const targets = spr ? [bg, spr] : [bg];
    this.tweens.add({
      targets,
      x: toX, y: toY,
      scaleX: 1.4, scaleY: 1.4,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets,
          scaleX: 0, scaleY: 0,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            bg.destroy();
            if (spr) spr.destroy();
            callback();
          }
        });
      }
    });
  }

  // 攻撃：光の弾が突進して跳ね返る
  playAttackAnim(fromX, fromY, toX, toY, sprKey, onHit, onComplete) {
    // 常に見える光の弾（スプライトの有無に関わらず表示）
    const orb = this.add.circle(fromX, fromY, 18, 0xffcc44, 1).setDepth(10);
    const glow = this.add.circle(fromX, fromY, 28, 0xffee88, 0.3).setDepth(10);

    let spr = null;
    if (sprKey && this.textures.exists(sprKey)) {
      spr = this.add.image(fromX, fromY, sprKey)
        .setOrigin(0.5).setScale(1.2).setDepth(11);
    }

    const midX = fromX + (toX - fromX) * 0.65;
    const midY = fromY + (toY - fromY) * 0.65;
    const allTargets = spr ? [orb, glow, spr] : [orb, glow];

    this.tweens.add({
      targets: allTargets,
      x: midX, y: midY,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        onHit();
        this.tweens.add({
          targets: allTargets,
          x: fromX, y: fromY,
          duration: 180,
          ease: 'Sine.easeOut',
          onComplete: () => {
            orb.destroy(); glow.destroy();
            if (spr) spr.destroy();
            onComplete();
          }
        });
      }
    });
  }

  // ダメージ：赤フラッシュ＋数字が上に流れる
  playDamageFlash(x, y, dmg) {
    const flash = this.add.rectangle(x, y, 64, 80, 0xff2200, 0.65).setDepth(10);
    const dmgT = this.add.text(x, y - 10, `-${dmg}`, {
      fontSize: '22px', color: '#ff4444', fontFamily: 'serif',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: [flash, dmgT],
      alpha: 0,
      y: y - 45,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => { flash.destroy(); dmgT.destroy(); }
    });
  }

  // 撃破：パーティクル爆発
  playDeathAnim(x, y) {
    const colors = [0xffaa22, 0xff4444, 0xffffff, 0xffdd44];
    for (let i = 0; i < 8; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 9), col).setDepth(10);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scaleX: 0, scaleY: 0,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  // ===== ゲームロジック =====

  selectAttacker(fieldIndex) {
    if (this.selectedCard !== null || this.busy) return;
    this.attackSource = (this.attackSource === fieldIndex) ? null : fieldIndex;
    this.render();
  }

  summonToSlot(slotIndex) {
    if (this.selectedCard === null || this.busy) return;
    const s = this.state;
    const card = s.player.hand[this.selectedCard];

    if (s.energy.current < card.cost) return;
    if (s.player.field[slotIndex]) return;

    this.busy = true;
    const from = this.getHandPos(this.selectedCard);
    const to   = this.getFieldPos('player', slotIndex);
    const sprKey = CARD_SPRITE[card.id];

    // 手札から取り除いてエネルギー消費 → 先にUI更新
    s.energy.current -= card.cost;
    const cardData = s.player.hand.splice(this.selectedCard, 1)[0];
    this.selectedCard = null;
    this.render();

    // 召喚アニメーション → 完了後にフィールドへ配置
    SE.playSE('summon');
    this.playSummonAnim(from.x, from.y, to.x, to.y, sprKey, () => {
      const hasTaunt = ['karakasa','nurikabe','umibouzu','tsuchigumo'].includes(cardData.id);
      const hasPierce = ['noppera','ittan'].includes(cardData.id);
      s.player.field[slotIndex] = { card: cardData, hp: cardData.hp, frozen: false, attacked: false, taunt: hasTaunt, pierce: hasPierce, resurrected: false };
      this.applyBattlecry(cardData, 'player');
      this.message = `${cardData.name} を召喚！`;
      this.render();
      this.busy = false;
      this.time.delayedCall(600, () => { this.message = null; this.render(); });
    });
  }

  attackTarget(targetType, targetIndex) {
    if (this.attackSource === null || this.busy) return;
    const s = this.state;
    const attacker = s.player.field[this.attackSource];
    if (!attacker) return;

    this.busy = true;
    const srcIdx = this.attackSource;
    const from   = this.getFieldPos('player', srcIdx);
    const sprKey = CARD_SPRITE[attacker.card.id];
    this.attackSource = null;

    // 挑発チェック
    const hasTauntCard = s.enemy.field.some(m => m && m.taunt);
    if (!attacker.pierce && hasTauntCard) {
      if (targetType === 'direct') {
        this.busy = false;
        this.message = '🛡 挑発カードを先に倒してください！';
        this.render();
        this.time.delayedCall(1200, () => { this.message = null; this.render(); });
        return;
      }
      const defender = s.enemy.field[targetIndex];
      if (defender && !defender.taunt) {
        this.busy = false;
        this.message = '🛡 挑発カードを先に倒してください！';
        this.render();
        this.time.delayedCall(1200, () => { this.message = null; this.render(); });
        return;
      }
    }

    if (targetType === 'direct') {
      const to = { x: this.W / 2, y: this.H * 0.20 };

      this.playAttackAnim(from.x, from.y, to.x, to.y, sprKey,
        () => {
          // 命中時
          SE.playSE('attack');
          const dmg = attacker.card.atk;
          s.enemy.souls = Math.max(0, s.enemy.souls - dmg);
          this.playDamageFlash(this.W / 2, this.H * 0.15, dmg);
          SE.playSE('damage');
          this.message = `${attacker.card.name} が直接攻撃！ -${dmg}魂`;
          // 攻撃済みフラグ
          if (s.player.field[srcIdx]) s.player.field[srcIdx].attacked = true;
          // 攻撃時効果
          this.applyOnAttack(attacker.card, 'player', 'direct', false);
        },
        () => {
          this.render();
          this.checkWin();
          this.busy = false;
          if (!this.battleEnded) {
            this.time.delayedCall(600, () => { this.message = null; this.render(); });
          }
        }
      );

    } else {
      const defender = s.enemy.field[targetIndex];
      if (!defender) { this.busy = false; return; }
      const to = this.getFieldPos('enemy', targetIndex);

      this.playAttackAnim(from.x, from.y, to.x, to.y, sprKey,
        () => {
          // 命中時：ダメージ計算
          SE.playSE('attack');
          const atkDmg = attacker.card.atk;
          const defDmg = defender.card.atk;
          defender.hp -= atkDmg;
          attacker.hp -= defDmg;
          this.message = `${attacker.card.name} vs ${defender.card.name}`;

          SE.playSE('damage');
          this.playDamageFlash(to.x, to.y, atkDmg);
          if (defDmg > 0) this.playDamageFlash(from.x, from.y, defDmg);

          // 攻撃済みフラグ
          if (s.player.field[srcIdx]) s.player.field[srcIdx].attacked = true;

          let killedEnemy = false;
          if (defender.hp <= 0) {
            SE.playSE('death');
            this.playDeathAnim(to.x, to.y);
            this.killMob('enemy', targetIndex);
            this.message += ` → ${defender.card.name} 撃破！`;
            killedEnemy = true;
          }
          if (attacker.hp <= 0) {
            SE.playSE('death');
            this.playDeathAnim(from.x, from.y);
            this.killMob('player', srcIdx);
          }
          // 攻撃時効果
          if (s.player.field[srcIdx]) {
            this.applyOnAttack(attacker.card, 'player', 'field', killedEnemy, targetIndex);
          }
        },
        () => {
          this.render();
          this.checkWin();
          this.busy = false;
          if (!this.battleEnded) {
            this.time.delayedCall(600, () => { this.message = null; this.render(); });
          }
        }
      );
    }
  }

  applyBattlecry(card, who) {
    const s = this.state;
    const opp = who === 'player' ? 'enemy' : 'player';

    switch (card.id) {
      case 'kappa':
      case 'tsuchigumo':
        this.drawCard(who);
        break;
      case 'zashiki':
        s[who].souls = Math.min(8, s[who].souls + 2);
        break;
      case 'amefuri':
        s[who].field.forEach(mob => {
          if (mob) mob.hp = Math.min(mob.card.hp, mob.hp + 1);
        });
        break;
      case 'tanuki': {
        const t = s[opp].field.find(Boolean);
        if (t) t.card = { ...t.card, atk: Math.max(0, t.card.atk - 2) };
        break;
      }
      case 'sunakake':
        s[opp].field.forEach(mob => {
          if (mob) mob.card = { ...mob.card, atk: Math.max(0, mob.card.atk - 1) };
        });
        break;
      case 'kitsune':
      case 'ittan':
        s[opp].souls = Math.max(0, s[opp].souls - 1);
        break;
      case 'oni':
      case 'wanyudo':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 1; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'yuki_onna': {
        const f = s[opp].field.find(Boolean);
        if (f) f.frozen = true;
        break;
      }
      case 'noppera':
      case 'nue':
        if (s[opp].hand.length > 0) {
          const ri = Math.floor(Math.random() * s[opp].hand.length);
          s[opp].hand.splice(ri, 1);
        }
        break;
      case 'yamanba':
        s[opp].souls = Math.max(0, s[opp].souls - 2);
        break;
      case 'amanojaku':
        s[opp].field.forEach(mob => {
          if (mob) mob.card = { ...mob.card, atk: Math.max(0, mob.card.atk - 1) };
        });
        break;
      case 'kasha': {
        const t = s[opp].field.find(Boolean);
        if (t) { t.hp -= 3; if (t.hp <= 0) this.killMob(opp, s[opp].field.indexOf(t)); }
        break;
      }
      case 'bakekujira':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 2; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'dai_tengu':
        this.drawCard(who);
        this.drawCard(who);
        s[who].field.forEach(mob => {
          if (mob && (mob.card.id === 'tengu' || mob.card.id === 'dai_tengu')) {
            mob.card = { ...mob.card, atk: mob.card.atk + 2 };
          }
        });
        break;
      case 'shuten_doji':
        for (let d = 0; d < 2; d++) {
          if (s[opp].hand.length > 0) {
            const ri = Math.floor(Math.random() * s[opp].hand.length);
            s[opp].hand.splice(ri, 1);
          }
        }
        break;
      case 'tamamo': {
        let strongest = null;
        s[opp].field.forEach(mob => {
          if (mob && (!strongest || mob.card.atk > strongest.card.atk)) strongest = mob;
        });
        if (strongest) strongest.card = { ...strongest.card, atk: 0 };
        break;
      }
      case 'ryujin':
        s[opp].field.forEach((mob, i) => {
          if (mob) this.killMob(opp, i);
        });
        break;
      case 'susanoo':
        ['player', 'enemy'].forEach(side => {
          s[side].field.forEach((mob, i) => {
            if (mob) {
              mob.hp -= 4;
              if (mob.hp <= 0) this.killMob(side, i);
            }
          });
        });
        // 生存自軍HP全回復
        s[who].field.forEach(mob => {
          if (mob) mob.hp = mob.card.hp;
        });
        break;
    }
  }

  applyDeathrattle(card, who) {
    const s = this.state;
    const opp = who === 'player' ? 'enemy' : 'player';
    switch (card.id) {
      case 'nekomata':
      case 'chochin':
        this.drawCard(who);
        break;
      case 'tamamo':
        s[opp].souls = Math.max(0, s[opp].souls - 3);
        break;
      case 'karakasa':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 1; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'oni':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 2; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'amanojaku':
        s[opp].field.forEach(mob => {
          if (mob) mob.card = { ...mob.card, atk: Math.max(0, mob.card.atk - 2) };
        });
        break;
      case 'bakekujira':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 3; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'ryujin':
        s[opp].souls = Math.max(0, s[opp].souls - 4);
        break;
    }
  }

  killMob(who, index) {
    const s = this.state;
    const mob = s[who].field[index];
    if (!mob || mob.hp > 0) return;
    if (mob.card.id === 'nekomata' && !mob.resurrected) {
      mob.hp = 1;
      mob.resurrected = true;
      return;
    }
    this.applyDeathrattle(mob.card, who);
    s[who].field[index] = null;
  }

  applyOnAttack(card, who, targetType, killedEnemy, targetIndex = -1) {
    const s = this.state;
    const opp = who === 'player' ? 'enemy' : 'player';
    switch (card.id) {
      case 'tengu':
        s[opp].field.forEach((mob, i) => {
          if (mob) { mob.hp -= 1; if (mob.hp <= 0) this.killMob(opp, i); }
        });
        break;
      case 'kitsune':
      case 'wanyudo':
        s[opp].souls = Math.max(0, s[opp].souls - 1);
        break;
      case 'yuki_onna':
        if (targetType === 'field') {
          const target = targetIndex >= 0 ? s[opp].field[targetIndex] : s[opp].field.find(Boolean);
          if (target) target.frozen = true;
        }
        break;
      case 'yamanba':
        if (killedEnemy) {
          const mob = s[who].field.find(m => m && m.card.id === 'yamanba');
          if (mob) mob.card = { ...mob.card, atk: mob.card.atk + 1 };
        }
        break;
      case 'kyubi':
        s[opp].souls = Math.max(0, s[opp].souls - 1);
        break;
    }
  }

  applyStartOfTurn(who) {
    const s = this.state;
    const opp = who === 'player' ? 'enemy' : 'player';
    s[who].field.forEach(mob => {
      if (!mob) return;
      switch (mob.card.id) {
        case 'kappa':
          s[who].souls = Math.min(8, s[who].souls + 1);
          break;
        case 'rokurokubi':
          s[opp].souls = Math.max(0, s[opp].souls - 1);
          break;
        case 'chochin': {
          const allies = s[who].field.filter(m => m);
          if (allies.length > 0) {
            const ri = Math.floor(Math.random() * allies.length);
            allies[ri].hp = Math.min(allies[ri].card.hp, allies[ri].hp + 1);
          }
          break;
        }
        case 'umibouzu':
          s[opp].field.forEach((m, i) => {
            if (m) { m.hp -= 1; if (m.hp <= 0) this.killMob(opp, i); }
          });
          break;
        case 'nue': {
          const roll = Math.floor(Math.random() * 3);
          if (roll === 0) this.drawCard(who);
          else if (roll === 1) s[who].souls = Math.min(8, s[who].souls + 1);
          else s[opp].souls = Math.max(0, s[opp].souls - 1);
          break;
        }
        case 'kyubi':
          s[opp].souls = Math.max(0, s[opp].souls - 1);
          break;
        case 'shuten_doji':
          mob.card = { ...mob.card, atk: mob.card.atk + 1 };
          break;
      }
    });
  }

  // ===== ターン管理 =====

  endTurn() {
    this.selectedCard  = null;
    this.attackSource  = null;
    this.state.turn = 'enemy';

    // 凍結を1ターン解除
    this.state.player.field.forEach(m => { if (m) m.frozen = false; });

    this.message = '敵のターン…';
    this.render();
    this.time.delayedCall(1000, () => this.enemyTurn());
  }

  enemyTurn() {
    const s = this.state;

    // エネルギー補充（敵はプレイヤーと同じく上限まで全回復）
    s.energy.max     = Math.min(10, s.energy.max + 1);
    s.energy.current = s.energy.max;

    // 敵ターン開始時効果
    this.applyStartOfTurn('enemy');
    this.drawCard('enemy');

    // ===== フェーズ1：召喚 =====
    const handSnapshot = [...s.enemy.hand];
    for (const card of handSnapshot) {
      if (s.energy.current < card.cost) continue;
      const slot = s.enemy.field.indexOf(null);
      if (slot === -1) break;
      const idx = s.enemy.hand.indexOf(card);
      if (idx === -1) continue;
      s.energy.current -= card.cost;
      s.enemy.hand.splice(idx, 1);
      const hasTaunt  = ['karakasa','nurikabe','umibouzu','tsuchigumo'].includes(card.id);
      const hasPierce = ['noppera','ittan'].includes(card.id);
      s.enemy.field[slot] = { card, hp: card.hp, frozen: false, attacked: false, taunt: hasTaunt, pierce: hasPierce, resurrected: false };
      this.applyBattlecry(card, 'enemy');
    }

    // 召喚結果を描画してから攻撃フェーズへ
    this.message = '敵が妖怪を召喚！';
    this.render();

    // ===== フェーズ2：攻撃（500ms後） =====
    this.time.delayedCall(800, () => {

      s.enemy.field.forEach((mob, mIdx) => {
        if (!mob || mob.frozen) return;

        const tauntMobs    = s.player.field.filter(m => m && m.taunt);
        const candidateMobs = (!mob.pierce && tauntMobs.length > 0) ? tauntMobs : s.player.field.filter(Boolean);

        if (candidateMobs.length > 0) {
          const ri     = Math.floor(Math.random() * candidateMobs.length);
          const defIdx = s.player.field.indexOf(candidateMobs[ri]);
          const def    = s.player.field[defIdx];

          mob.hp -= def.card.atk;
          def.hp -= mob.card.atk;

          this.applyOnAttack(mob.card, 'enemy', 'field', def.hp <= 0, defIdx);

          if (def.hp <= 0) this.killMob('player', defIdx);
          if (mob.hp <= 0) this.killMob('enemy', mIdx);
        } else {
          s.player.souls = Math.max(0, s.player.souls - mob.card.atk);
          this.applyOnAttack(mob.card, 'enemy', 'direct', false);
        }
      });

      // 凍結解除・プレイヤーターン準備
      s.enemy.field.forEach(m => { if (m) m.frozen = false; });
      s.player.field.forEach(m => { if (m) m.attacked = false; });
      s.energy.max     = Math.min(10, s.energy.max + 1);
      s.energy.current = s.energy.max;
      this.drawCard('player');
      s.turn = 'player';

      this.applyStartOfTurn('player');

      this.message = 'あなたのターン！';
      this.render();
      this.checkWin();

      if (!this.battleEnded) {
        this.time.delayedCall(800, () => { this.message = null; this.render(); });
      }
    });
  }

  checkWin() {
    const s = this.state;
    if (s.enemy.souls <= 0) {
      this.battleEnded = true;
      this.endBattle('win');
    } else if (s.player.souls <= 0) {
      this.battleEnded = true;
      this.endBattle('lose');
    }
  }

  endBattle(result) {
    SE.stopBGM();
    SE.playSE(result === 'win' ? 'victory' : 'defeat');

    const W = this.W, H = this.H;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    if (result === 'win') {
      const chapter     = D.chapters.find(c => c.id === this.chapterId);
      const isLastBattle = this.battleIndex >= chapter.battles.length - 1;

      // stageProgress 更新
      const prog = GameState.player.stageProgress;
      if ((prog[this.chapterId] || 0) < this.battleIndex + 1) {
        prog[this.chapterId] = this.battleIndex + 1;
      }

      // 初回バトルクリア → 呪魂+2
      const battleId = this.battleData.id;
      const isFirstBattleClear = battleId && !GameState.player.clearedBattles.includes(battleId);
      if (isFirstBattleClear) {
        GameState.player.clearedBattles.push(battleId);
        GameState.player.jureikon += 2;
      }

      // 初回チャプタークリア → カード報酬付与
      const firstClear = isLastBattle && !GameState.player.completedChapters.includes(this.chapterId);
      if (firstClear) {
        GameState.player.completedChapters.push(this.chapterId);
        (chapter.reward || []).forEach(id => GameState.player.unlockedCards.push(id));
      }
      GameState.save();

      // 勝利テキストを上寄りに配置してスペースを確保
      let nextY = Math.floor(H * 0.14);
      this.add.text(W / 2, nextY, '勝利！', {
        fontSize: '48px', color: '#ffdd44', fontFamily: 'serif',
        stroke: '#aa5500', strokeThickness: 6
      }).setOrigin(0.5);
      nextY += 68;

      if (firstClear && this.battleData.postText) {
        const pt = this.add.text(W / 2, nextY, this.battleData.postText, {
          fontSize: '13px', color: '#b89adc', fontFamily: 'serif',
          align: 'center', lineSpacing: 6, stroke: '#080310', strokeThickness: 3,
          wordWrap: { width: W - 48 },
        }).setOrigin(0.5);
        nextY += pt.height + 18;
      } else if (this.chapterId === 3 && isLastBattle && firstClear) {
        const pt = this.add.text(W / 2, nextY, '……あの名前を、知っている気がする。\nまるで、自分の名前のように。', {
          fontSize: '13px', color: '#b89adc', fontFamily: 'serif',
          align: 'center', lineSpacing: 6, stroke: '#080310', strokeThickness: 3,
        }).setOrigin(0.5);
        nextY += pt.height + 18;
      }
      if (isFirstBattleClear) {
        this.add.text(W / 2, nextY, `🔮 呪魂 +2（所持: ${GameState.player.jureikon}）`, {
          fontSize: '14px', color: '#cc88ff', fontFamily: 'serif',
          stroke: '#080310', strokeThickness: 3,
        }).setOrigin(0.5);
        nextY += 34;
      }
      if (firstClear && (chapter.reward || []).length > 0) {
        const uniqueReward = [...new Set(chapter.reward)];
        this.add.text(W / 2, nextY, `✦ 新たな妖怪カード ${uniqueReward.length} 種を入手！`, {
          fontSize: '14px', color: '#44cc88', fontFamily: 'serif',
          stroke: '#080310', strokeThickness: 3,
        }).setOrigin(0.5);
        nextY += 34;
      }

      nextY += 8;
      if (!isLastBattle) {
        const nextBtn = this.add.text(W / 2, nextY, '次のステージへ', {
          fontSize: '20px', color: '#e8c87a', fontFamily: 'serif',
          backgroundColor: '#2a1040aa', padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        nextBtn.on('pointerdown', () => {
          this.scene.start('BattleScene', {
            chapterId: this.chapterId,
            battleIndex: this.battleIndex + 1,
            story: true
          });
        });
        nextY += 54;
      }

      // 第10章最終バトルクリア → エンディングへ
      const isTrueEnding = isLastBattle && this.chapterId === 10;
      const storyBtnLabel = isTrueEnding ? 'エンディングへ ▶' : isLastBattle ? 'ストーリーへ戻る' : 'ストーリーへ';
      const storyBtn = this.add.text(W / 2, nextY, storyBtnLabel, {
        fontSize: isLastBattle ? '20px' : '15px', fontFamily: 'serif',
        color: isTrueEnding ? '#ffd700' : isLastBattle ? '#e8c87a' : '#b89adc',
        backgroundColor: isTrueEnding ? '#3a2000aa' : '#2a1040aa',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      storyBtn.on('pointerdown', () => {
        if (isTrueEnding) {
          this.cameras.main.fadeOut(1200, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EndingScene');
          });
        } else {
          this.scene.start('StoryScene');
        }
      });
      nextY += 54;

      // ホームへボタンをコンテンツの下に配置
      const backBtn = this.add.text(W / 2, nextY, 'ホームへ', {
        fontSize: '14px', color: '#665577', fontFamily: 'serif'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      backBtn.on('pointerdown', () => this.scene.start('HomeScene'));

    } else {
      this.add.text(W / 2, H / 2 - 60, '敗北…', {
        fontSize: '48px', color: '#ff4444', fontFamily: 'serif'
      }).setOrigin(0.5);

      const retryBtn = this.add.text(W / 2, H / 2 + 40, 'もう一度', {
        fontSize: '22px', color: '#e8c87a', fontFamily: 'serif',
        backgroundColor: '#2a1040aa', padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      retryBtn.on('pointerdown', () => {
        this.scene.start('BattleScene', {
          chapterId: this.chapterId,
          battleIndex: this.battleIndex,
          story: true
        });
      });

      const backBtn = this.add.text(W / 2, H / 2 + 130, 'ホームへ', {
        fontSize: '14px', color: '#665577', fontFamily: 'serif'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      backBtn.on('pointerdown', () => this.scene.start('HomeScene'));
    }
  }
}
