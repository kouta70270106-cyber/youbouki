// 妖忘記 — オンラインバトルシーン
// BattleScene を継承。enemyTurn の代わりに Socket.io でターン同期する。
class OnlineBattleScene extends BattleScene {
  constructor() {
    super('OnlineBattleScene');
  }

  init(data) {
    this.roomId       = data.roomId;
    this.playerIndex  = data.playerIndex;   // 0=HOST(先攻) 1=GUEST(後攻)
    this.opponentName = data.opponentName || '???';
    // super.init() は呼ばない（chapterId/battleIndex は不要）
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    this.state = {
      turn: 'waiting',
      energy: { current: 0, max: 0 },
      player: {
        name:  GameState.player.name,
        souls: 8,
        hand:  [],
        deck:  this.buildDeck(this._getPlayerDeckIds()),
        field: [null, null, null, null, null],
      },
      enemy: {
        name:  this.opponentName,
        souls: 8,
        hand:  [],
        deck:  [],
        field: [null, null, null, null, null],
      },
    };

    for (let i = 0; i < 5; i++) this.drawCard('player');

    this.selectedCard         = null;
    this.attackSource         = null;
    this.busy                 = false;
    this.battleEnded          = false;
    this._pendingHandDiscards = 0;

    this._setupSocket();
    this.drawBg();

    if (this.playerIndex === 0) {
      // HOST: 先攻でターン開始
      this._startMyTurn(false);
    } else {
      // GUEST: 相手のターンを待つ
      this.message = '相手のターン…';
      this.render();
      SE.playBGM('battle');
    }
  }

  // ===== Socket セットアップ =====
  _setupSocket() {
    const sock = window.YOKAI_SOCKET;
    if (!sock) return;

    this._onOpponentAction = (action) => {
      if (action.type !== 'endTurn') return;
      if (this.battleEnded) return;

      // フル同期: 相手視点の myField/mySouls が自分の enemy、yourField/yourSouls が自分の player
      this.state.enemy.field  = action.myField;
      this.state.enemy.souls  = action.mySouls;
      this.state.player.field = action.yourField;
      this.state.player.souls = action.yourSouls;

      // 相手の手札枚数を同期（カード裏面表示用）
      const oppHandCount = action.myHandCount || 0;
      this.state.enemy.hand = Array(oppHandCount).fill({ dummy: true });

      // 相手の手札捨て効果（ローカルで適用）
      for (let i = 0; i < (action.handDiscards || 0); i++) {
        if (this.state.player.hand.length > 0) {
          const ri = Math.floor(Math.random() * this.state.player.hand.length);
          this.state.player.hand.splice(ri, 1);
        }
      }

      // attacked フラグをリセット（相手ターン終了 = 自分ターン開始）
      this.state.player.field.forEach(m => { if (m) m.attacked = false; });

      // 勝敗判定（相手の攻撃で決着した場合）
      if (this._checkWinSilent()) return;

      this._startMyTurn(true);
    };

    this._onOpponentDisconnected = () => {
      if (this.battleEnded) return;
      this.battleEnded = true;
      SE.stopBGM();
      this._showResult('win', '相手が切断しました');
    };

    sock.on('opponentAction', this._onOpponentAction);
    sock.on('opponentDisconnected', this._onOpponentDisconnected);
  }

  // ===== 自分のターン開始 =====
  _startMyTurn(shouldDraw) {
    this.state.energy.max     = Math.min(10, this.state.energy.max + 1);
    this.state.energy.current = this.state.energy.max;
    if (shouldDraw) this.drawCard('player');
    this.state.turn = 'player';

    this.applyStartOfTurn('player');

    if (this._checkWinSilent()) return;

    SE.playBGM('battle');
    this.message = 'あなたのターン！';
    this.render();
    this.time.delayedCall(800, () => {
      if (!this.battleEnded) { this.message = null; this.render(); }
    });
  }

  // ===== 勝敗判定 =====
  _checkWinSilent() {
    const s = this.state;
    if (s.enemy.souls <= 0) {
      this.battleEnded = true;
      this.endBattle('win');
      return true;
    }
    if (s.player.souls <= 0) {
      this.battleEnded = true;
      this.endBattle('lose');
      return true;
    }
    return false;
  }

  // ===== ターン終了（Socket送信） =====
  endTurn() {
    if (this.state.turn !== 'player') return;

    this.selectedCard = null;
    this.attackSource = null;
    this.state.player.field.forEach(m => { if (m) m.frozen = false; });

    const payload = {
      type:         'endTurn',
      myField:      this.state.player.field,
      mySouls:      this.state.player.souls,
      yourField:    this.state.enemy.field,
      yourSouls:    this.state.enemy.souls,
      myHandCount:  this.state.player.hand.length,
      handDiscards: this._pendingHandDiscards,
    };
    this._pendingHandDiscards = 0;

    window.YOKAI_SOCKET.emit('gameAction', payload);

    this.state.turn = 'waiting';
    this.message    = '相手のターン…';
    this.render();
  }

  // ===== AIターンは使わない =====
  enemyTurn() {}

  // ===== 手札捨て効果を追跡 =====
  applyBattlecry(card, who) {
    if (who === 'player') {
      if (card.id === 'noppera' || card.id === 'nue') {
        this._pendingHandDiscards += 1;
      } else if (card.id === 'shuten_doji') {
        this._pendingHandDiscards += 2;
      }
    }
    super.applyBattlecry(card, who);
  }

  // ===== render オーバーライド（オンライン専用HUD追加） =====
  render() {
    super.render();
    this._renderOnlineHUD();
  }

  _renderOnlineHUD() {
    if (!this.uiLayer) return;
    const W = this.W, H = this.H;

    // 先攻/後攻バッジ（画面左中央）
    const badge = this.playerIndex === 0 ? '先攻' : '後攻';
    const badgeCol = this.playerIndex === 0 ? '#ffaa22' : '#88aaff';
    const badgeTxt = this.add.text(8, H / 2 - 22, badge, {
      fontSize: '11px', color: badgeCol, fontFamily: 'serif',
      backgroundColor: '#1a0a30', padding: { x: 4, y: 2 },
    }).setOrigin(0, 0.5);
    this.uiLayer.add(badgeTxt);

    // ターン状態インジケーター（左中央・バッジの下）
    const isMyTurn = this.state.turn === 'player';
    const turnTxt = this.add.text(8, H / 2 + 2, isMyTurn ? '▶ 自分' : '… 相手', {
      fontSize: '11px',
      color: isMyTurn ? '#44ff88' : '#aa88cc',
      fontFamily: 'serif',
      backgroundColor: '#0a0818',
      padding: { x: 4, y: 2 },
    }).setOrigin(0, 0.5);
    this.uiLayer.add(turnTxt);

    // 自分のデッキ残枚数（右中央）
    const deckTxt = this.add.text(W - 8, H / 2 - 10, `札 ${this.state.player.deck.length}`, {
      fontSize: '11px', color: '#8888bb', fontFamily: 'serif',
    }).setOrigin(1, 0.5);
    this.uiLayer.add(deckTxt);

    // 相手の手札（カード裏面を上部に表示）
    const enemyHandCount = this.state.enemy.hand.length;
    if (enemyHandCount > 0) {
      const cardW = 28, cardH = 38, gap = 3;
      const totalW = enemyHandCount * (cardW + gap) - gap;
      const startX = W / 2 - totalW / 2;
      const cardY = 90;

      for (let i = 0; i < enemyHandCount; i++) {
        const x = startX + i * (cardW + gap) + cardW / 2;
        const back = this.add.rectangle(x, cardY, cardW, cardH, 0x1a0a30, 1)
          .setStrokeStyle(1, 0x6644aa);
        const lbl = this.add.text(x, cardY, '妖', {
          fontSize: '11px', color: '#4422aa', fontFamily: 'serif',
        }).setOrigin(0.5);
        this.uiLayer.add([back, lbl]);
      }

      // 手札枚数ラベル
      const countLbl = this.add.text(W / 2, 115, `手札 ${enemyHandCount}枚`, {
        fontSize: '10px', color: '#776699', fontFamily: 'serif',
      }).setOrigin(0.5);
      this.uiLayer.add(countLbl);
    }
  }

  // ===== 戦闘終了（章クリア報酬なし） =====
  endBattle(result) {
    SE.stopBGM();
    SE.playSE(result === 'win' ? 'victory' : 'defeat');
    this._removeSocketListeners();
    this._showResult(result, result === 'win' ? '勝利！' : '敗北…');
  }

  _showResult(result, title) {
    const W = this.W, H = this.H;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);

    this.add.text(W / 2, H * 0.36, title, {
      fontFamily: 'serif', fontSize: '40px',
      color: result === 'win' ? '#e8c87a' : '#cc88ff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const sub = result === 'win'
      ? `${this.opponentName} に勝利！`
      : `${this.opponentName} に敗北…`;
    this.add.text(W / 2, H * 0.50, sub, {
      fontFamily: 'serif', fontSize: '18px', color: '#c8c0e0',
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H * 0.65, 'ホームへ戻る', {
      fontFamily: 'serif', fontSize: '18px', color: '#e8c87a',
      backgroundColor: '#2a1040', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#e8c87a'));
    btn.on('pointerdown', () => {
      SE.playSE('click');
      this.scene.start('HomeScene');
    });
  }

  _removeSocketListeners() {
    const sock = window.YOKAI_SOCKET;
    if (!sock) return;
    if (this._onOpponentAction)       sock.off('opponentAction', this._onOpponentAction);
    if (this._onOpponentDisconnected) sock.off('opponentDisconnected', this._onOpponentDisconnected);
  }
}
