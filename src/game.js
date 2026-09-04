const worldGravity = 1800; // tweakable gravity, pixels/sec² (px/s² - basically, acceleration)

// main physics
const horizontalSpeed = 400;
const jumpVelocity = -600; // tweakable speed, pixels/sec (px/s)

/**
 * the highest a jump can physically go is
 * velocity² / (2 × gravity) = 600² / (2 × 1800) = 100 pixels
 */
const maxJumpHeight = jumpVelocity ** 2 / (2 * worldGravity);
const maxJumpDistance =
  horizontalSpeed * ((2 * Math.abs(jumpVelocity)) / worldGravity);
console.log(
  "max jump height:",
  maxJumpHeight,
  "max jump distance:",
  maxJumpDistance,
);

// juice physics
const coyoteTime = 100;
const bufferTime = 100; // tweakable time, ms

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: "game-container",
    // width: 640,
    // height: 360,
    // min: { width: 320, height: 360 },
    // max: { width: 1600, height: 360 },
    // autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: worldGravity }, debug: false },
  },
  pixelArt: true,
  scene: { create, update },
};

/** @type {Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body }} */
let player;
/** @type {Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody }} */
let ground;
/** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
let cursors;

let lastGroundedTime = 0;
let lastJumpPressedTime = -1000; // timestamps, ms

/** @this {Phaser.Scene} */
function create() {
  const LEVEL_WIDTH = 800;
  const LEVEL_HEIGHT = 4000;
  const platformStepY = maxJumpHeight * 0.8; // 80% of max reachable height
  const horizontalSwing = maxJumpDistance * 0.75; // 75% of max reachable distance
  const leftX = LEVEL_WIDTH / 2 - horizontalSwing / 2;
  const rightX = LEVEL_WIDTH / 2 + horizontalSwing / 2;
  const topMargin = 150; // stop generating platforms this far from the very top of the level

  this.physics.world.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
  this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);

  ground = this.add.rectangle(
    LEVEL_WIDTH / 2,
    LEVEL_HEIGHT - 20,
    LEVEL_WIDTH,
    40,
    0x00ff00,
  );
  // ground = this.add.rectangle(200, 340, 300, 40, 0x00ff00);
  this.physics.add.existing(ground, true); // true = static, ignores gravity, doesn't move

  const platformData = [];
  let toggleRight = false;
  for (let y = LEVEL_HEIGHT - 100; y > topMargin; y -= platformStepY) {
    const x = toggleRight ? rightX : leftX;
    platformData.push([x, y, 160]);
    toggleRight = !toggleRight;
  }
  const platforms = [ground];
  for (const [px, py, pw] of platformData) {
    const platform = this.add.rectangle(px, py, pw, 20, 0x00ff00);
    this.physics.add.existing(platform, true);
    platforms.push(platform);
  }

  player = this.add.rectangle(
    LEVEL_WIDTH / 2,
    LEVEL_HEIGHT - 60,
    32,
    32,
    0xffffff,
  );
  // player = this.add.rectangle(320, 100, 32, 32, 0xffffff);
  this.physics.add.existing(player); // dynamic, falls, can move
  player.body.setCollideWorldBounds(true); // makes screen boundaries a collider

  for (const platform of platforms) {
    this.physics.add.collider(player, platform);
  }
  // this.physics.add.collider(player, ground);

  if (!this.input.keyboard) {
    throw new Error("Keyboard input not available");
  }
  cursors = this.input.keyboard.createCursorKeys();

  this.cameras.main.startFollow(player);
}

/** @this {Phaser.Scene} */
/** @param {number} time */
function update(time) {
  if (cursors.left.isDown) {
    player.body.setVelocityX(-horizontalSpeed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(horizontalSpeed);
  } else {
    player.body.setVelocityX(0);
  }

  if (player.body.blocked.down) {
    lastGroundedTime = time;
  }

  if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
    lastJumpPressedTime = time;
  }

  const canCoyote = time - lastGroundedTime < coyoteTime;
  const wantsJumpBeforeLand = time - lastJumpPressedTime < bufferTime;

  if (canCoyote && wantsJumpBeforeLand) {
    player.body.setVelocityY(jumpVelocity);
    lastGroundedTime = -1000;
    lastJumpPressedTime = -1000;
  }
}

const game = new Phaser.Game(config);

// game.events.once('ready', () => { game.scale.on('resize', (gameSize) => { console.log('phaser resized to', gameSize.width, gameSize.height); }); });

// window.addEventListener('resize', () => {
//   // console.log('window resized to', window.innerWidth, window.innerHeight);
//   game.scale.resize(window.innerWidth, window.innerHeight);
// });
