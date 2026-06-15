const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 720,
  backgroundColor: '#050210',
  parent: 'game-container',
  scene: [BootScene, TitleScene, HomeScene, StoryScene, BattleScene, OnlineScene, CollectionScene, DeckScene, EndingScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

window.game = new Phaser.Game(config);
