class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.goats = [];
    this.deterrents = [];
    this.hazards = [];
    this.goatCount = 10;
  }

  preload() {
    const rect = (key, color, size) => {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, size, size);
      g.generateTexture(key, size, size);
      g.destroy();
    };

    const circle = (key, color, size) => {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.generateTexture(key, size, size);
      g.destroy();
    };

    rect('goat', 0xffffff, 20);
    circle('rooster', 0xff0000, 12);
    rect('predator', 0x8b4513, 18);
    circle('drone', 0x00ff00, 14);
    circle('bubble', 0x87cefa, 12);
    rect('wolf', 0x666666, 22);
  }

  create() {
    this.goatGroup = this.physics.add.group();
    for (let i = 0; i < this.goatCount; i++) {
      const goat = this.goatGroup.create(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 500),
        'goat'
      );
      goat.setCollideWorldBounds(true);
      goat.isFainted = false;
      this.randomMove(goat);
    }

    this.input.on('pointerdown', pointer => {
      this.placeDeterrent(pointer.worldX, pointer.worldY);
    });

    // spawn hazards periodically
    this.time.addEvent({ delay: 10000, callback: () => this.spawnWolf(), loop: true });
    this.time.addEvent({ delay: 15000, callback: () => this.thunder(), loop: true });
    this.infoText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' }).setDepth(1);
  }

  update() {
    this.goatGroup.children.iterate(goat => {
      if (!goat) return;
      if (!goat.isFainted) {
        if (Phaser.Math.Between(0, 1000) > 995) {
          this.randomMove(goat);
        }
      }
    });

    this.infoText.setText(`Goats: ${this.goatGroup.countActive()}`);
  }

  randomMove(goat) {
    const speed = 30;
    goat.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );
  }

  placeDeterrent(x, y) {
    const types = ['rooster', 'predator', 'drone', 'bubble'];
    const type = Phaser.Utils.Array.GetRandom(types);
    const sprite = this.physics.add.image(x, y, type);
    sprite.type = type;
    sprite.setInteractive();
    if (type === 'bubble') {
      sprite.scale = 2;
    }

    this.deterrents.push(sprite);
    this.time.addEvent({ delay: 5000, callback: () => sprite.destroy() });

    this.physics.add.overlap(this.goatGroup, sprite, (goat, spr) => {
      this.applyDeterrent(goat, spr.type);
    });
  }

  applyDeterrent(goat, type) {
    if (type === 'rooster') {
      this.randomMove(goat);
      if (Math.random() < 0.3) this.faint(goat);
    } else if (type === 'predator') {
      if (!goat.isFainted) this.faint(goat);
      this.time.delayedCall(1000, () => this.randomMove(goat));
    } else if (type === 'drone') {
      this.physics.moveToObject(goat, { x: 400, y: 300 }, 60);
    } else if (type === 'bubble') {
      this.faint(goat);
    }
  }

  faint(goat) {
    if (goat.isFainted) return;
    goat.isFainted = true;
    goat.setTint(0x999999);
    goat.setVelocity(0, 0);
    this.time.delayedCall(2000, () => this.recover(goat));
  }

  recover(goat) {
    goat.clearTint();
    goat.isFainted = false;
    this.randomMove(goat);
  }

  spawnWolf() {
    const wolf = this.physics.add.sprite(800, Phaser.Math.Between(50, 550), 'wolf');
    this.hazards.push(wolf);
    const target = Phaser.Utils.Array.GetRandom(this.goatGroup.getChildren());
    if (target) {
      this.physics.moveToObject(wolf, target, 80);
    }
    this.physics.add.overlap(wolf, this.goatGroup, (wolf, goat) => {
      goat.destroy();
      wolf.destroy();
    });
    this.time.delayedCall(8000, () => wolf.destroy());
  }

  thunder() {
    this.goatGroup.children.iterate(goat => {
      this.faint(goat);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#228b22',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: MainScene
};

new Phaser.Game(config);
