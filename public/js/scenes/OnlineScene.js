// オンライン対戦シーン（暫定）
class OnlineScene extends Phaser.Scene {
  constructor() { super('OnlineScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x050210, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, H * 0.3, 'オンライン対戦', {
      fontFamily: 'serif', fontSize: '32px', color: '#e8c87a'
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.45, '近日公開予定…\n\nストーリーをクリアして\nカードを集めてから挑戦しよう！', {
      fontFamily: 'serif', fontSize: '18px', color: '#b89adc',
      align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    const back = this.add.text(W / 2, H * 0.72, '← 戻る', {
      fontFamily: 'serif', fontSize: '18px', color: '#8855cc',
      backgroundColor: '#1a0a40aa', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
  }
}
