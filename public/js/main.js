const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 720,
  backgroundColor: '#050210',
  parent: 'game-container',
  scene: [BootScene, TitleScene, HomeScene, StoryScene, BattleScene, OnlineBattleScene, OnlineScene, CollectionScene, DeckScene, GachaScene, EndingScene, ProfileScene, AvatarSelectScene, HomeYokaiSelectScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    resolution: window.devicePixelRatio || 1,
  },
};

window.game = new Phaser.Game(config);
