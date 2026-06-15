class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // 妖怪スプライトを全シーン共通で生成
    createYokaiSprites(this);

    const loaded = GameState.load();

    if (loaded && GameState.player.name) {
      this.scene.start('TitleScene');
      return;
    }

    // 名前入力モーダルを表示
    this.showNameInput();
  }

  showNameInput() {
    const modal = document.getElementById('name-modal');
    modal.classList.remove('hidden');

    document.getElementById('name-submit').onclick = () => {
      const name = document.getElementById('name-input').value.trim();
      if (!name) return;

      SE.init(); // 最初のユーザー操作でAudioContext起動
      GameState.player.name = name;
      GameState.save();
      modal.classList.add('hidden');
      this.scene.start('TitleScene');
    };
  }
}
