// 妖忘記 — オンライン対戦マッチング画面
class OnlineScene extends Phaser.Scene {
  constructor() { super('OnlineScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x050210, 1);
    bg.fillRect(0, 0, W, H);

    // タイトル
    this.add.text(W / 2, H * 0.22, '⚔ オンライン対戦 ⚔', {
      fontFamily: 'serif', fontSize: '26px', color: '#e8c87a',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.33, '部屋コードを共有して友達と対戦しよう', {
      fontFamily: 'serif', fontSize: '13px', color: '#b89adc',
    }).setOrigin(0.5);

    // ソケット初期化
    if (!window.YOKAI_SOCKET) {
      window.YOKAI_SOCKET = io();
    }

    // HTML モーダルを表示
    this._openModal();
  }

  _openModal() {
    const modal   = document.getElementById('online-modal');
    const input   = document.getElementById('room-code-input');
    const status  = document.getElementById('online-status');
    const createB = document.getElementById('room-create-btn');
    const joinB   = document.getElementById('room-join-btn');
    const backB   = document.getElementById('online-back-btn');

    modal.classList.remove('hidden');
    input.value       = '';
    status.textContent = '';

    const sock = window.YOKAI_SOCKET;

    const cleanup = () => {
      sock.off('joinedRoom',          onJoined);
      sock.off('gameStart',           onGameStart);
      sock.off('roomFull',            onFull);
      createB.onclick = null;
      joinB.onclick   = null;
      backB.onclick   = null;
    };

    const onJoined = ({ playerIndex, roomId }) => {
      this._playerIndex = playerIndex;
      this._roomId      = roomId;
      if (playerIndex === 0) {
        status.textContent = `部屋コード: ${roomId}　─　相手が入室するのを待っています…`;
      } else {
        status.textContent = '入室しました。対戦相手を待っています…';
      }
      createB.disabled = true;
      joinB.disabled   = true;
    };

    const onGameStart = ({ players }) => {
      const opponentName = players[this._playerIndex === 0 ? 1 : 0];
      cleanup();
      modal.classList.add('hidden');
      this.scene.start('OnlineBattleScene', {
        roomId:       this._roomId,
        playerIndex:  this._playerIndex,
        opponentName: opponentName,
      });
    };

    const onFull = () => {
      status.textContent = '部屋が満員です。別のコードを試してください。';
      createB.disabled = false;
      joinB.disabled   = false;
    };

    sock.on('joinedRoom', onJoined);
    sock.on('gameStart',  onGameStart);
    sock.on('roomFull',   onFull);

    createB.disabled = false;
    joinB.disabled   = false;

    createB.onclick = () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      input.value        = code;
      status.textContent = '接続中…';
      sock.emit('joinRoom', { roomId: code, playerName: GameState.player.name });
    };

    joinB.onclick = () => {
      const code = input.value.trim().toUpperCase();
      if (!code) { status.textContent = 'コードを入力してください'; return; }
      status.textContent = '接続中…';
      sock.emit('joinRoom', { roomId: code, playerName: GameState.player.name });
    };

    backB.onclick = () => {
      cleanup();
      modal.classList.add('hidden');
      this.scene.start('HomeScene');
    };
  }
}
