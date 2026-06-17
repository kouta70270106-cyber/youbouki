class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const ALL_IDS = [
      'kappa','tengu','zashiki','tanuki','kitsune','karakasa',
      'noppera','rokurokubi','nurikabe','sunakake','chochin','amefuri',
      'ittan','wanyudo','yuki_onna','oni','nekomata','yamanba',
      'umibouzu','amanojaku','kasha','tsuchigumo','bakekujira',
      'nue','kyubi','dai_tengu','shuten_doji','tamamo','ryujin','susanoo'
    ];
    ALL_IDS.forEach(id => {
      this.load.image(`img_${id}`,   `images/cards/${id}.png`);
      this.load.image(`nobg_${id}`,  `images/cards/nobg/${id}.png`);
    });
  }

  create() {
    // 妖怪スプライトを全シーン共通で生成（フォールバック用）
    createYokaiSprites(this);

    // 外部画像が読み込めたカードは nobg_（背景除去済み）を優先
    Object.keys(CARD_SPRITE).forEach(id => {
      if (this.textures.exists(`nobg_${id}`)) {
        CARD_SPRITE[id] = `nobg_${id}`;
      } else if (this.textures.exists(`img_${id}`)) {
        CARD_SPRITE[id] = `img_${id}`;
      }
    });

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
