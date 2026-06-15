// 妖忘記 — エンディングシーン
class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W; this.H = H;

    SE.playBGM('title');

    // ページ定義（背景色ペア、テキスト、サブテキスト）
    this._pages = [
      {
        bgTop: 0x050210, bgBot: 0x100820,
        main: 'ぬらりひょんが、倒れた。',
        sub: 'あの日以来、初めての静寂が\n世界を包んだ。',
        color: '#b89adc',
      },
      {
        bgTop: 0x0a0820, bgBot: 0x1a1030,
        main: '温かい光が、降りてきた。',
        sub: '大きな鱗の温もり。\n炎のような優しさ。',
        color: '#d4b8f0',
      },
      {
        bgTop: 0x150c20, bgBot: 0x2a1840,
        main: '「よくやった……」',
        sub: '「ありがとう……\n　私の子よ……」',
        color: '#e8d4ff',
        accent: true,
      },
      {
        bgTop: 0x200e10, bgBot: 0x3a1820,
        main: '全ての記憶が、戻ってきた。',
        sub: '母の名前。自分の名前。\nあの夜のこと。\nそして——これから向かう場所。',
        color: '#f0c8a0',
      },
      {
        bgTop: 0x2a1400, bgBot: 0x4a2800,
        main: null,
        sub: null,
        isName: true,
        color: '#ffd700',
      },
      {
        bgTop: 0x1a1800, bgBot: 0x302e00,
        main: '旅はまだ続く。',
        sub: 'でも今は——\nお母さんの声だけが、\n温かく耳に残っていた。',
        color: '#e8c87a',
      },
      {
        bgTop: 0x0a0800, bgBot: 0x181400,
        isFin: true,
      },
    ];

    this._pageIndex = 0;
    this._busy = false;

    // 背景グラフィクス
    this._bg = this.add.graphics();

    // 光のパーティクル群
    this._particles = [];
    this._spawnParticles();

    // テキストオブジェクト
    this._mainText = this.add.text(W / 2, H * 0.38, '', {
      fontFamily: 'serif', fontSize: '22px', color: '#ffffff',
      stroke: '#050210', strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this._subText = this.add.text(W / 2, H * 0.55, '', {
      fontFamily: 'serif', fontSize: '14px', color: '#ccbbee',
      stroke: '#050210', strokeThickness: 3,
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    // 名前専用テキスト（isNameページ用）
    this._nameText = this.add.text(W / 2, H * 0.4, '', {
      fontFamily: 'serif', fontSize: '28px', color: '#ffd700',
      stroke: '#2a1400', strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this._nameSubText = this.add.text(W / 2, H * 0.56, '', {
      fontFamily: 'serif', fontSize: '13px', color: '#e8c87a',
      stroke: '#1a0a00', strokeThickness: 3,
      align: 'center', lineSpacing: 7,
    }).setOrigin(0.5).setAlpha(0);

    // 「完」テキスト（isFin用）
    this._finText = this.add.text(W / 2, H * 0.42, '完', {
      fontFamily: 'serif', fontSize: '80px', color: '#e8c87a',
      stroke: '#4a2800', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    this._finSubText = this.add.text(W / 2, H * 0.62, '妖忘記', {
      fontFamily: 'serif', fontSize: '18px', color: '#c0a850',
      stroke: '#1a0a00', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // タップ/クリックで次ページ
    this._tapHint = this.add.text(W / 2, H - 36, 'タップして続ける', {
      fontFamily: 'serif', fontSize: '12px', color: '#665577',
    }).setOrigin(0.5).setAlpha(0);

    // タイトルへボタン（最終ページのみ表示）
    this._titleBtn = this.add.text(W / 2, H * 0.8, 'タイトルへ戻る', {
      fontFamily: 'serif', fontSize: '18px', color: '#e8c87a',
      backgroundColor: '#2a1400', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
    this._titleBtn.on('pointerover', () => this._titleBtn.setColor('#ffffff'));
    this._titleBtn.on('pointerout',  () => this._titleBtn.setColor('#e8c87a'));
    this._titleBtn.on('pointerdown', () => {
      SE.playSE('click');
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });

    // クリックで次ページ
    this.input.on('pointerdown', () => {
      if (this._busy) return;
      if (this._pageIndex < this._pages.length - 1) {
        SE.playSE('click');
        this._nextPage();
      }
    });

    // 初回ページを表示
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this._showPage(0);
  }

  _spawnParticles() {
    const W = this.W, H = this.H;
    for (let i = 0; i < 18; i++) {
      const p = this.add.graphics();
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.Between(1, 3);
      p.fillStyle(0xffd700, Phaser.Math.FloatBetween(0.1, 0.4));
      p.fillCircle(0, 0, r);
      p.setPosition(x, y);
      this._particles.push({ obj: p, vy: Phaser.Math.FloatBetween(-0.3, -0.8), x, y });
    }
  }

  update() {
    const H = this.H;
    this._particles.forEach(p => {
      p.y += p.vy;
      if (p.y < -10) p.y = H + 10;
      p.obj.setPosition(p.x, p.y);
    });
  }

  _showPage(index) {
    this._busy = true;
    const page = this._pages[index];

    // 全テキストをフェードアウトしてから背景・内容を切り替える
    const toFade = [this._mainText, this._subText, this._nameText, this._nameSubText, this._finText, this._finSubText, this._tapHint, this._titleBtn];
    this.tweens.killTweensOf(toFade);
    this.tweens.add({
      targets: toFade,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        // フェードアウト完了後に背景を切り替える
        const W = this.W, H = this.H;
        this._bg.clear();
        this._bg.fillGradientStyle(page.bgTop, page.bgTop, page.bgBot, page.bgBot, 1);
        this._bg.fillRect(0, 0, W, H);

        const pColor = index >= 3 ? 0xffd700 : 0xcc88ff;
        this._particles.forEach(p => {
          p.obj.clear();
          p.obj.fillStyle(pColor, Phaser.Math.FloatBetween(0.1, 0.35));
          p.obj.fillCircle(0, 0, Phaser.Math.Between(1, 3));
        });

        this._renderPage(page, index);
      },
    });
  }

  _renderPage(page, index) {
    const W = this.W;

    if (page.isFin) {
      // 最終ページ：「完」
      this._finText.setAlpha(0);
      this._finSubText.setAlpha(0);
      this._titleBtn.setAlpha(0);
      this.tweens.add({
        targets: this._finText,
        alpha: 1, duration: 1200, ease: 'Sine.easeIn',
      });
      this.tweens.add({
        targets: this._finSubText,
        alpha: 1, duration: 1000, delay: 800, ease: 'Sine.easeIn',
      });
      this.tweens.add({
        targets: this._titleBtn,
        alpha: 1, duration: 800, delay: 1800,
        onComplete: () => { this._busy = false; },
      });
      return;
    }

    if (page.isName) {
      // 名前ページ
      const name = GameState.player.name || '名もなき者';
      this._nameText.setText(`${name}——。`).setColor(page.color).setAlpha(0);
      this._nameSubText.setText(
        `それが、あなたの本当の名前だった。\n\n八岐大蛇の子として生まれ、\n人として育ち、\n自らの力で道を切り拓いた。`
      ).setAlpha(0);

      this.tweens.add({ targets: this._nameText,    alpha: 1, duration: 1000, ease: 'Sine.easeIn' });
      this.tweens.add({ targets: this._nameSubText, alpha: 1, duration: 800, delay: 600 });
      this.tweens.add({
        targets: this._tapHint, alpha: 1, duration: 600, delay: 1400,
        onComplete: () => { this._busy = false; },
      });
      return;
    }

    // 通常ページ
    const mainColor = page.color || '#d4c8f0';
    this._mainText.setText(page.main || '').setColor(mainColor).setStyle({
      fontSize: page.accent ? '24px' : '22px',
    });
    this._subText.setText(page.sub || '').setAlpha(0);

    this.tweens.add({ targets: this._mainText, alpha: 1, duration: 900, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: this._subText,  alpha: 1, duration: 700, delay: 700 });
    this.tweens.add({
      targets: this._tapHint, alpha: 1, duration: 600, delay: 1400,
      onComplete: () => { this._busy = false; },
    });
  }

  _nextPage() {
    this._pageIndex++;
    this._showPage(this._pageIndex);
  }
}
