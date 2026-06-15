// 妖忘記 — プレイヤー状態管理
const GameState = {
  player: {
    name: '',
    level: 1,
    unlockedCards: ['kappa','kitsune','kitsune','tanuki','tanuki','karakasa','zashiki','zashiki'],
    completedChapters: [],
    stageProgress: {},
    deck: [],
    homeYokaiIdx: 0,
  },

  // ストーリー進行
  story: {
    currentChapter: 1,
    currentBattle: 0,
  },

  save() {
    localStorage.setItem('youbouki_save', JSON.stringify({
      player: this.player,
      story: this.story,
    }));
  },

  load() {
    const raw = localStorage.getItem('youbouki_save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    this.player = data.player;
    this.story  = data.story;
    if (!this.player.deck)          this.player.deck          = [];
    if (!this.player.stageProgress) this.player.stageProgress = {};
    if (!this.player.level)         this.player.level         = 1;
    if (this.player.homeYokaiIdx === undefined) this.player.homeYokaiIdx = 0;
    return true;
  },

  reset() {
    localStorage.removeItem('youbouki_save');
  }
};
